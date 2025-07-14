// src/ai/flows/categorize-research-titles.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow to categorize research paper titles.
 *
 * - categorizeResearchTitles - A function that categorizes research paper titles.
 * - CategorizeResearchTitlesInput - The input type for the categorizeResearchTitles function.
 * - CategorizeResearchTitlesOutput - The return type for the categorizeResearchTitles function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CategorizeResearchTitlesInputSchema = z.object({
  title: z.string().describe('The title of the research paper to categorize.'),
});
export type CategorizeResearchTitlesInput = z.infer<typeof CategorizeResearchTitlesInputSchema>;

const CategorizeResearchTitlesOutputSchema = z.object({
  category: z.string().describe('The category the research paper title belongs to.'),
  confidence: z.number().describe('The confidence level of the categorization (0-1).'),
});
export type CategorizeResearchTitlesOutput = z.infer<typeof CategorizeResearchTitlesOutputSchema>;

export async function categorizeResearchTitles(input: CategorizeResearchTitlesInput): Promise<CategorizeResearchTitlesOutput> {
  return categorizeResearchTitlesFlow(input);
}

const categorizeResearchTitlesPrompt = ai.definePrompt({
  name: 'categorizeResearchTitlesPrompt',
  input: {schema: CategorizeResearchTitlesInputSchema},
  output: {schema: CategorizeResearchTitlesOutputSchema},
  prompt: `You are an expert in categorizing research paper titles. Given a title, you will determine the most appropriate category for the paper. You will respond with the category and a confidence level (0-1) for your categorization.

Title: {{{title}}}
`,config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const categorizeResearchTitlesFlow = ai.defineFlow(
  {
    name: 'categorizeResearchTitlesFlow',
    inputSchema: CategorizeResearchTitlesInputSchema,
    outputSchema: CategorizeResearchTitlesOutputSchema,
  },
  async input => {
    const {output} = await categorizeResearchTitlesPrompt(input);
    return output!;
  }
);
