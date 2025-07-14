'use server';

/**
 * @fileOverview A flow to generate a new research paper title based on a list of user-provided topics.
 *
 * - generateNewTitle - A function that handles the generation of a new title.
 * - GenerateNewTitleInput - The input type for the generateNewTitle function.
 * - GenerateNewTitleOutput - The return type for the generateNewTitle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateNewTitleInputSchema = z.object({
  topics: z.array(z.string()).describe('A list of topics or categories to base the new title on.'),
  apiKey: z.string().describe('The user-provided Gemini API key.'),
});
export type GenerateNewTitleInput = z.infer<typeof GenerateNewTitleInputSchema>;

const GenerateNewTitleOutputSchema = z.object({
  newTitle: z.string().describe('A new, creative, and relevant research paper title.'),
});
export type GenerateNewTitleOutput = z.infer<typeof GenerateNewTitleOutputSchema>;

export async function generateNewTitle(input: GenerateNewTitleInput): Promise<GenerateNewTitleOutput> {
  return generateNewTitleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateNewTitlePrompt',
  input: { schema: z.object({ topics: z.array(z.string()) }) },
  output: { schema: GenerateNewTitleOutputSchema },
  model: 'googleai/gemini-1.5-flash',
  prompt: `You are an expert academic writer specializing in creating compelling research paper titles.
  
  Based on the following list of topics, generate one new, creative, and insightful title that synthesizes these themes. The new title should be concise and sound like a genuine research paper title.

  Topics:
  {{#each topics}}
  - {{{this}}}
  {{/each}}
  
  Respond with only the new title.`,
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    ],
  },
});

const generateNewTitleFlow = ai.defineFlow(
  {
    name: 'generateNewTitleFlow',
    inputSchema: GenerateNewTitleInputSchema,
    outputSchema: GenerateNewTitleOutputSchema,
  },
  async ({ topics, apiKey }) => {
    const { output } = await prompt(
      { topics },
      { auth: apiKey }
    );
    return output!;
  }
);
