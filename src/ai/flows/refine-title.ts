'use server';

/**
 * @fileOverview A flow to refine a research paper title based on a specific suggestion.
 *
 * - refineTitle - A function that handles refining a title.
 * - RefineTitleInput - The input type for the refineTitle function.
 * - RefineTitleOutput - The return type for the refineTitle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { RefineTitleInput, RefineTitleOutput } from '@/types/schemas';
import { RefineTitleInputSchema, RefineTitleOutputSchema } from '@/types/schemas';


export async function refineTitle(input: RefineTitleInput): Promise<RefineTitleOutput> {
  return refineTitleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'refineTitlePrompt',
  input: { schema: RefineTitleInputSchema.omit({apiKey: true}) },
  output: { schema: RefineTitleOutputSchema },
  model: 'googleai/gemini-1.5-flash',
  prompt: `You are an expert academic editor. Your task is to revise a research paper title based on a specific instruction.

**Original Title:**
"{{{originalTitle}}}"

**Instruction for Improvement:**
"{{{suggestion}}}"

Rewrite the original title, strictly following the instruction. Respond with only the new, refined title in the 'refinedTitle' field.`,
  config: {
    temperature: 0.5,
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    ],
  },
});

const refineTitleFlow = ai.defineFlow(
  {
    name: 'refineTitleFlow',
    inputSchema: RefineTitleInputSchema,
    outputSchema: RefineTitleOutputSchema,
  },
  async ({ originalTitle, suggestion, apiKey }) => {
    const { output } = await prompt(
      { originalTitle, suggestion },
      { auth: apiKey }
    );
    return output!;
  }
);
