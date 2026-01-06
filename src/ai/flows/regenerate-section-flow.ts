'use server';
/**
 * @fileOverview A flow to regenerate a specific section of a research paper.
 *
 * - regenerateSection - A function that handles regenerating a single paper section.
 * - RegenerateSectionInput - The input type for the regenerateSection function.
 * - RegenerateSectionOutput - The return type for the regenerateSection function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { paraphraseFlow } from './anti-ai-paraphraser';

const RegenerateSectionInputSchema = z.object({
  paperTitle: z.string().describe('The main title of the research paper.'),
  sectionTitle: z.string().describe('The title of the section to regenerate (e.g., "Abstract").'),
  apiKey: z.string().describe('The user-provided Gemini API key.'),
});
export type RegenerateSectionInput = z.infer<typeof RegenerateSectionInputSchema>;

const RegenerateSectionOutputSchema = z.object({
  newContent: z.string().describe('The newly generated content for the specified section.'),
});
export type RegenerateSectionOutput = z.infer<typeof RegenerateSectionOutputSchema>;

export async function regenerateSection(input: RegenerateSectionInput): Promise<RegenerateSectionOutput> {
  return regenerateSectionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'regenerateSectionPrompt',
  input: { schema: RegenerateSectionInputSchema.omit({ apiKey: true }) },
  output: { schema: RegenerateSectionOutputSchema },
  model: 'googleai/gemini-flash-latest',
  prompt: `You are an expert academic writer. Your task is to regenerate the content for a specific section of a research paper based on the paper's title.

Provide a concise but comprehensive draft that outlines the key points and structure for only the requested section. The content should be plausible and highly relevant to the paper's title.

**Paper Title:**
"{{{paperTitle}}}"

**Section to Regenerate:**
"{{{sectionTitle}}}"

Generate only the new content for this section and return it in the 'newContent' field. Do not include the section title in your response.`,
  config: {
    temperature: 0.7, // Slightly higher temp for more variation on regeneration
     safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    ],
  },
});

const regenerateSectionFlow = ai.defineFlow(
  {
    name: 'regenerateSectionFlow',
    inputSchema: RegenerateSectionInputSchema,
    outputSchema: RegenerateSectionOutputSchema,
  },
  async ({ paperTitle, sectionTitle, apiKey }) => {
    const { output } = await prompt(
        { paperTitle, sectionTitle }, 
        { config: { apiKey } }
    );
    
    if (!output) {
        throw new Error('Failed to regenerate section.');
    }

    const { paraphrasedText } = await paraphraseFlow({ text: output.newContent, apiKey });

    return { newContent: paraphrasedText };
  }
);
