'use server';

/**
 * @fileOverview A flow to generate a summary of the topics covered in the dataset, based on the title categorization.
 *
 * - generateTitleSummary - A function that handles the generation of the title summary.
 * - GenerateTitleSummaryInput - The input type for the generateTitleSummary function.
 * - GenerateTitleSummaryOutput - The return type for the generateTitleSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTitleSummaryInputSchema = z.array(
  z.object({
    title: z.string().describe('The title of the research paper.'),
    category: z.string().describe('The category of the research paper.'),
  })
).describe('An array of research paper titles and their categories.');
export type GenerateTitleSummaryInput = z.infer<typeof GenerateTitleSummaryInputSchema>;

const GenerateTitleSummaryOutputSchema = z.object({
  summary: z.string().describe('A summary of the topics covered in the dataset.'),
});
export type GenerateTitleSummaryOutput = z.infer<typeof GenerateTitleSummaryOutputSchema>;

export async function generateTitleSummary(input: GenerateTitleSummaryInput): Promise<GenerateTitleSummaryOutput> {
  return generateTitleSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTitleSummaryPrompt',
  input: {schema: GenerateTitleSummaryInputSchema},
  output: {schema: GenerateTitleSummaryOutputSchema},
  prompt: `You are an expert in summarizing research paper topics.

  Given the following research paper titles and their categories, generate a summary of the topics covered in the dataset.

  Titles and Categories:
  {{#each this}}
  - Title: {{{title}}}, Category: {{{category}}}
  {{/each}}
  `,
});

const generateTitleSummaryFlow = ai.defineFlow(
  {
    name: 'generateTitleSummaryFlow',
    inputSchema: GenerateTitleSummaryInputSchema,
    outputSchema: GenerateTitleSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
