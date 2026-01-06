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
    description: 'List 5-8 relevant keywords. Start immediately with "Keywords—" Do not give a separate heading. do not use bullet points; separate keywords with commas. and append this at the end of the abstract. leaving two line breaks after the abstract.',
  },
  {
    title: 'I. INTRODUCTION',
    wordCount: '800',
    description: 'Introduce the domain, the specific problem statement, the motivation for this research, and the contributions of this paper. Discuss the significance of the study.',
  },
  {
    title: 'II. RELATED WORK',
    wordCount: '1000',
    description: 'Provide a thorough literature review. Discuss at least 5-10 theoretical approaches or related studies in this field. Compare them to the proposed approach. do not use the DOI links directly; instead, add references at the end. and cite them appropriately in IEEE format within the text.',
  },
  {
    title: 'III. METHODOLOGY',
    wordCount: '1200',
    description: 'Detail the proposed system or methodology. Explain the algorithms, mathematical models, system architecture, and design choices in extreme depth. Use formatting for equations if necessary.',
  },
  {
    title: 'IV. EXPERIMENTAL SETUP',
    wordCount: '800',
    description: 'Describe the simulation environment, datasets used (refer to Context Data if available), hardware/software specifications, and evaluation metrics.',
  },
  {
    title: 'V. RESULTS AND DISCUSSION',
    wordCount: '1200',
    description: 'Present the results. Analyze them critically. Discuss trends, anomalies, and comparisons with existing methods. If data is provided, use it extensively. If not, describe plausible theoretical results.',
  },
  {
    title: 'VI. CONCLUSION',
    wordCount: '400',
    description: 'Summarize the main findings. Discuss limitations and future scope.',
  },
  {
    title: 'REFERENCES',
    wordCount: '300',
    description: 'Generate a list of 15-20 plausible, high-quality citations in IEEE format (numbered [1], [2], etc.). as numbered bullets. Ensure they are relevant to the content discussed.',
  },
];

const draftIEEEPaperFlow = ai.defineFlow(
  {
    name: 'draftIEEEPaperFlow',
    inputSchema: DraftIEEEPaperInputSchema,
    outputSchema: DraftIEEEPaperOutputSchema,
  },
  async ({ title, contextData, apiKey }) => {
    
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
            
            if (output && output.content) {
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