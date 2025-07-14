// src/ai/flows/categorize-research-titles.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow to categorize research paper titles in batches.
 *
 * - categorizeResearchTitles - A function that categorizes a batch of research paper titles.
 * - CategorizeResearchTitlesInput - The input type for the categorizeResearchTitles function.
 * - CategorizeResearchTitlesOutput - The return type for the categorizeResearchTitles function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CategorizeResearchTitlesInputSchema = z.array(z.string().describe('A research paper title to categorize.'));
export type CategorizeResearchTitlesInput = z.infer<typeof CategorizeResearchTitlesInputSchema>;

const CategorizedTitleSchema = z.object({
  title: z.string().describe('The original research paper title.'),
  category: z.string().describe('The category the research paper title belongs to.'),
  confidence: z.number().describe('The confidence level of the categorization (0-1).'),
});

const CategorizeResearchTitlesOutputSchema = z.array(CategorizedTitleSchema);
export type CategorizeResearchTitlesOutput = z.infer<typeof CategorizeResearchTitlesOutputSchema>;

export async function categorizeResearchTitles(input: CategorizeResearchTitlesInput): Promise<CategorizeResearchTitlesOutput> {
  return categorizeResearchTitlesFlow(input);
}

const categorizeResearchTitlesPrompt = ai.definePrompt({
  name: 'categorizeResearchTitlesPrompt',
  input: {schema: CategorizeResearchTitlesInputSchema},
  output: {schema: CategorizeResearchTitlesOutputSchema},
  prompt: `You are an expert in categorizing research paper titles. Given a list of titles, you will determine the most appropriate category for each paper. You will respond with a JSON array where each object contains the original title, its category, and a confidence level (0-1) for your categorization.

Titles:
{{#each this}}
- {{{this}}}
{{/each}}
`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_NONE',
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
