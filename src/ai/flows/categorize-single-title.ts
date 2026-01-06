
'use server';

/**
 * @fileOverview This file defines a Genkit flow to categorize a single research paper title.
 * This flow is designed to be a robust fallback for titles that fail batch processing.
 *
 * - categorizeSingleTitle - A function that categorizes a single title.
 * - CategorizeSingleTitleInput - The input type for the categorizeSingleTitle function.
 * - CategorizeSingleTitleOutput - The return type for the categorizeSingleTitle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CategorizeSingleTitleInputSchema = z.object({
  title: z.string().describe('The research paper title to categorize.'),
  apiKey: z.string().describe('The user-provided Gemini API key.'),
});
export type CategorizeSingleTitleInput = z.infer<typeof CategorizeSingleTitleInputSchema>;

const CategorizeSingleTitleOutputSchema = z.object({
  category: z.string().describe('The most appropriate category for the research paper title.'),
  confidence: z.number().describe('The confidence level of the categorization (0-1).').default(0.95), // Assume high confidence for successful individual retries
});
export type CategorizeSingleTitleOutput = z.infer<typeof CategorizeSingleTitleOutputSchema>;

export async function categorizeSingleTitle(input: CategorizeSingleTitleInput): Promise<CategorizeSingleTitleOutput> {
  return categorizeSingleTitleFlow(input);
}

const categorizeSingleTitlePrompt = ai.definePrompt({
  name: 'categorizeSingleTitlePrompt',
  input: { schema: CategorizeSingleTitleInputSchema.omit({ apiKey: true }) },
  output: { schema: CategorizeSingleTitleOutputSchema },
  model: 'googleai/gemini-flash-latest',
  prompt: `You are an expert at categorizing research paper titles. Determine the most specific and appropriate category for the following title.

Respond with only the category name and a confidence score.

Title: "{{{title}}}"
`,
  config: {
    temperature: 0.2, // Low temperature for more deterministic, focused categorization
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    ],
  },
});


const categorizeSingleTitleFlow = ai.defineFlow(
  {
    name: 'categorizeSingleTitleFlow',
    inputSchema: CategorizeSingleTitleInputSchema,
    outputSchema: CategorizeSingleTitleOutputSchema,
  },
  async ({ title, apiKey }) => {
    const { output } = await categorizeSingleTitlePrompt(
        { title },
        {
            config: { apiKey },
        }
    );
    
    return output!;
  }
);
