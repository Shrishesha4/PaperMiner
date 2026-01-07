'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { paraphraseFlow } from './anti-ai-paraphraser';

const DraftIEEEPaperInputSchema = z.object({
  title: z.string().describe('The title of the research paper.'),
  contextData: z.string().optional().describe('Optional context or data (e.g., from a CSV) to inform the paper content.'),
  apiKey: z.string().describe('The user-provided Gemini API key.'),
});
export type DraftIEEEPaperInput = z.infer<typeof DraftIEEEPaperInputSchema>;

const PaperSectionSchema = z.object({
  title: z.string().describe('The title of the section (e.g., "Abstract").'),
  content: z.string().describe('The generated content for this section.'),
});

const DraftIEEEPaperOutputSchema = z.object({
  sections: z.array(PaperSectionSchema).describe('The drafted sections of the research paper in IEEE format.'),
});
export type DraftIEEEPaperOutput = z.infer<typeof DraftIEEEPaperOutputSchema>;

export async function draftIEEEPaper(input: DraftIEEEPaperInput): Promise<DraftIEEEPaperOutput> {
  return draftIEEEPaperFlow(input);
}

const sectionGeneratorPrompt = ai.definePrompt({
  name: 'ieeeSectionGenerator',
  input: {
    schema: z.object({
      paperTitle: z.string(),
      sectionTitle: z.string(),
      wordCount: z.string(),
      description: z.string(),
      contextData: z.string().optional(),
    }),
  },
  output: { schema: z.object({ content: z.string() }) },
  model: 'googleai/gemini-flash-latest',
  prompt: `You are an expert academic researcher writing a section for an IEEE journal paper titled "{{paperTitle}}".
Write the content for the section: "**{{sectionTitle}}**".

**Goal:** This paper MUST be long (minimum 10 pages total). This section should be detailed, exhaustive, and approximately **{{wordCount}} words**.

**Directives:**
1.  **Format:** Use strict IEEE academic style (passive voice where appropriate, formal tone, third person).
2.  **Context:** Use the provided data/context below to ground your writing. Do NOT hallucinate specific results if they aren't in the data; instead, describe the methodology or expected theoretical outcomes if data is missing.
3.  **Detail:** Expand on every point. Use examples, theoretical background, and detailed explanations.
4.  **No Headers:** Do not include the section title itself in the output, just the body text.
5.  **Visuals:** Proactively identify opportunities for visual aids. Insert placeholders in the text where a diagram, graph, flow-chart or image would be valuable. 
    -   Format them strictly as: 
        \
\n> **[FIGURE PLACEHOLDER]:** <Detailed description of what the diagram/image should depict to illustrate the preceding text.>
\n\
        OR
        \
\n> **[TABLE PLACEHOLDER]:** <Detailed description of the columns and data the table should contain.>
\n\

{{#if contextData}}
**Grounding Data/Context:**
"{{{contextData}}}"
{{/if}}

**Specific Section Instructions:**
{{{description}}}

Write the detailed content now.`,
  config: {
    temperature: 0.7,
  },
});

const sectionsToGenerate = [
  {
    title: 'Abstract',
    wordCount: '250',
    description: 'Provide a comprehensive summary of the research, including the problem, methodology, key results, and conclusion. Do not use symbols or math. Start immediately with "Abstract—".',
  },
  {
    title: 'Keywords',
    wordCount: '50',
    description: 'List 5-8 relevant keywords. Start immediately with "Keywords—".',
  },
  {
    title: 'I. INTRODUCTION',
    wordCount: '800',
    description: 'Introduce the domain, the specific problem statement, the motivation for this research, and the contributions of this paper. Discuss the significance of the study. Suggest a figure illustrating the high-level concept.',
  },
  {
    title: 'II. RELATED WORK',
    wordCount: '1000',
    description: 'Provide a thorough literature review. Discuss at least 5-10 theoretical approaches or related studies in this field. Compare them to the proposed approach. Suggest a comparison table.',
  },
  {
    title: 'III. METHODOLOGY',
    wordCount: '1200',
    description: 'Detail the proposed system or methodology. Explain the algorithms, mathematical models, system architecture, and design choices in extreme depth. Use formatting for equations if necessary. Include placeholders for System Architecture Diagrams and Flowcharts.',
  },
  {
    title: 'IV. EXPERIMENTAL SETUP',
    wordCount: '800',
    description: 'Describe the simulation environment, datasets used (refer to Context Data if available), hardware/software specifications, and evaluation metrics. Include a placeholder for a diagram of the experimental testbed.',
  },
  {
    title: 'V. RESULTS AND DISCUSSION',
    wordCount: '1200',
    description: 'Present the results. Analyze them critically. Discuss trends, anomalies, and comparisons with existing methods. If data is provided, use it extensively. If not, describe plausible theoretical results. Include placeholders for Graphs (bar charts, line graphs) and Tables showing results.',
  },
  {
    title: 'VI. CONCLUSION',
    wordCount: '400',
    description: 'Summarize the main findings. Discuss limitations and future scope.',
  },
  {
    title: 'REFERENCES',
    wordCount: '300',
    description: 'Generate a list of 15-20 plausible, high-quality citations in IEEE format (numbered [1], [2], etc.).',
  },
];

const draftIEEEPaperFlow = ai.defineFlow(
  {
    name: 'draftIEEEPaperFlow',
    inputSchema: DraftIEEEPaperInputSchema,
    outputSchema: DraftIEEEPaperOutputSchema,
  },
  async ({ title, contextData, apiKey }) => {
    // Generate sections in parallel to save time, but usually serial is better for coherence.
    // However, given the strong "No Hallucination" req, treating them as independent modules grounded in the same context is often safer than allowing drift.
    // We will run them in parallel batches to be efficient.
    
    const generatedSections = await Promise.all(
      sectionsToGenerate.map(async (sectionDef) => {
        try {
            const { output } = await sectionGeneratorPrompt(
                {
                    paperTitle: title,
                    sectionTitle: sectionDef.title,
                    wordCount: sectionDef.wordCount,
                    description: sectionDef.description,
                    contextData: contextData || '',
                },
                { config: { apiKey } }
            );
            
            // Paraphrase immediately to ensure "Anti-AI" style
            if (output && output.content) {
                // Skip paraphrasing for References to preserve citation format and avoid AI-rewrite errors
                if (sectionDef.title === 'REFERENCES') {
                    return { title: sectionDef.title, content: output.content };
                }

                const { paraphrasedText } = await paraphraseFlow({ text: output.content, apiKey });
                return { title: sectionDef.title, content: paraphrasedText };
            }
            return { title: sectionDef.title, content: "Generation failed for this section." };

        } catch (error) {
            console.error(`Failed to generate section ${sectionDef.title}:`, error);
            return { title: sectionDef.title, content: "An error occurred while generating this section." };
        }
      })
    );

    return { sections: generatedSections };
  }
);
