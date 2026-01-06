
'use server';
/**
 * @fileOverview A flow to refine a specific piece of selected text using a user prompt.
 *
 * - refineText - A function that handles the text refinement process.
 * - RefineTextInput - The input type for the refineText function.
 * - RefineTextOutput - The return type for the refineText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RefineTextInputSchema = z.object({
  selectedText: z.string().describe('The portion of text the user has selected to refine.'),
  userPrompt: z.string().describe('The user\'s instruction for how to refine the text.'),
  apiKey: z.string().describe('The user-provided Gemini API key.'),
});
export type RefineTextInput = z.infer<typeof RefineTextInputSchema>;

const RefineTextOutputSchema = z.object({
  refinedText: z.string().describe('The newly refined text for the selection.'),
});
export type RefineTextOutput = z.infer<typeof RefineTextOutputSchema>;

export async function refineText(input: RefineTextInput): Promise<RefineTextOutput> {
  return refineTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'refineTextPrompt',
  input: { schema: RefineTextInputSchema.omit({ apiKey: true }) },
  output: { schema: RefineTextOutputSchema },
  model: 'googleai/gemini-flash-latest',
  prompt: `You are an expert academic editor. Your task is to revise a piece of text based on the user's instructions.

You will be given the selected text and a prompt from the user.
Rewrite the current text to incorporate the user's feedback. Only return the new, refined text, without any preamble or explanation.

**User's Instruction:**
"{{{userPrompt}}}"

**Selected Text to Refine:**
---
{{{selectedText}}}
---
`,
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

const refineTextFlow = ai.defineFlow(
  {
    name: 'refineTextFlow',
    inputSchema: RefineTextInputSchema,
    outputSchema: RefineTextOutputSchema,
  },
  async ({ selectedText, userPrompt, apiKey }) => {
    const { output } = await prompt(
      { selectedText, userPrompt },
      { config: { apiKey } }
    );
    return output!;
  }
);
