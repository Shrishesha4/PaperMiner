'use server';

/**
 * @fileOverview A flow to generate a batch of new research paper titles based on a list of user-provided topics.
 *
 * - generateBatchTitles - A function that handles the generation of new titles.
 * - GenerateBatchTitlesInput - The input type for the generateBatchTitles function.
 * - GenerateBatchTitlesOutput - The return type for the generateBatchTitles function.
 */

import {ai} from '@/ai/genkit';
import { GenerateBatchTitlesInputSchema, GenerateBatchTitlesOutputSchema } from '@/types/schemas';
import type { GenerateBatchTitlesInput, GenerateBatchTitlesOutput } from '@/types/schemas';

export async function generateBatchTitles(input: GenerateBatchTitlesInput): Promise<GenerateBatchTitlesOutput> {
  return generateBatchTitlesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBatchTitlesPrompt',
  input: { schema: GenerateBatchTitlesInputSchema.omit({ apiKey: true }) },
  output: { schema: GenerateBatchTitlesOutputSchema },
  model: 'googleai/gemini-1.5-flash',
  prompt: `You are an expert academic writer specializing in creating compelling research paper titles that adhere to IEEE conventions.
  
Based on the following list of topics, generate {{{count}}} new, creative, and insightful titles that synthesize these themes.

Each title must follow these strict conventions:
1.  **IEEE Style**: Concise, descriptive, and accurately reflects potential paper content.
2.  **PICO Framework**: Conceptually structured around Population/Problem, Intervention, Comparison, and Outcome where applicable.
3.  **Variety**: Ensure the generated titles are distinct from each other.

Topics to synthesize:
{{#each topics}}
- {{{this}}}
{{/each}}
  
Respond with only the list of new titles in the 'titles' field.`,
  config: {
    temperature: 0.9, // Higher temperature for more creative/varied outputs
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    ],
  },
});

const generateBatchTitlesFlow = ai.defineFlow(
  {
    name: 'generateBatchTitlesFlow',
    inputSchema: GenerateBatchTitlesInputSchema,
    outputSchema: GenerateBatchTitlesOutputSchema,
  },
  async ({ topics, count, apiKey }) => {
    const { output } = await prompt(
      { topics, count },
      { auth: apiKey }
    );
    return output!;
  }
);
