'use server';
/**
 * @fileOverview A flow to generate a draft of a research paper from a title.
 *
 * - draftPaper - A function that handles the paper drafting process.
 * - DraftPaperInput - The input type for the draftPaper function.
 * - DraftPaperOutput - The return type for the draftPaper function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DraftPaperInputSchema = z.object({
  title: z.string().describe('The title of the research paper.'),
  apiKey: z.string().describe('The user-provided Gemini API key.'),
});
export type DraftPaperInput = z.infer<typeof DraftPaperInputSchema>;

const PaperSectionSchema = z.object({
  title: z.string().describe('The title of the section (e.g., "Abstract").'),
  content: z.string().describe('The generated content for this section.'),
});
export type PaperSection = z.infer<typeof PaperSectionSchema>;


const DraftPaperOutputSchema = z.object({
  sections: z.array(PaperSectionSchema).describe('The drafted sections of the research paper.'),
});
export type DraftPaperOutput = z.infer<typeof DraftPaperOutputSchema>;

export async function draftPaper(input: DraftPaperInput): Promise<DraftPaperOutput> {
  return draftPaperFlow(input);
}

const prompt = ai.definePrompt({
  name: 'draftPaperPrompt',
  input: { schema: DraftPaperInputSchema.omit({ apiKey: true }) },
  output: { schema: DraftPaperOutputSchema },
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are an expert academic writer and researcher. Your task is to generate a well-structured initial draft for a research paper based on the provided title.

Create content for the following standard academic sections:
- Abstract
- Introduction
- Literature Review
- Materials and Methods
- Results (describe plausible or expected results)
- Discussion
- Conclusion

For each section, provide a concise but comprehensive draft that outlines the key points and structure. The content should be plausible and relevant to the paper's title.

**Paper Title:**
"{{{title}}}"

Generate the content for each section and return it in the specified JSON format.`,
  config: {
    temperature: 0.6,
     safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    ],
  },
});

const draftPaperFlow = ai.defineFlow(
  {
    name: 'draftPaperFlow',
    inputSchema: DraftPaperInputSchema,
    outputSchema: DraftPaperOutputSchema,
  },
  async ({ title, apiKey }) => {
    const { output } = await prompt(
        { title }, 
        { auth: apiKey }
    );
    return output!;
  }
);
