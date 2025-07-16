'use server';
/**
 * @fileOverview A flow to refine a specific section of a research paper using a user prompt.
 *
 * - refineSection - A function that handles the section refinement process.
 * - RefineSectionInput - The input type for the refineSection function.
 * - RefineSectionOutput - The return type for the refineSection function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const RefineSectionInputSchema = z.object({
  sectionTitle: z.string().describe('The title of the section being refined (e.g., "Abstract").'),
  currentText: z.string().describe('The current text content of the section.'),
  userPrompt: z.string().describe('The user\'s instruction for how to refine the text.'),
  apiKey: z.string().describe('The user-provided Gemini API key.'),
});
export type RefineSectionInput = z.infer<typeof RefineSectionInputSchema>;

export const RefineSectionOutputSchema = z.object({
  refinedText: z.string().describe('The newly refined text for the section.'),
});
export type RefineSectionOutput = z.infer<typeof RefineSectionOutputSchema>;

export async function refineSection(input: RefineSectionInput): Promise<RefineSectionOutput> {
  return refineSectionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'refineSectionPrompt',
  input: { schema: RefineSectionInputSchema.omit({ apiKey: true }) },
  output: { schema: RefineSectionOutputSchema },
  model: 'googleai/gemini-1.5-flash',
  prompt: `You are an expert academic editor. Your task is to revise a section of a research paper based on the user's instructions.

You will be given the section title, the current text, and a prompt from the user.
Rewrite the current text to incorporate the user's feedback. Only return the new text for the section.

**Section to Refine:** {{{sectionTitle}}}

**User's Instruction:**
"{{{userPrompt}}}"

**Current Text:**
---
{{{currentText}}}
---

Now, provide the refined text based on the instruction.
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

const refineSectionFlow = ai.defineFlow(
  {
    name: 'refineSectionFlow',
    inputSchema: RefineSectionInputSchema,
    outputSchema: RefineSectionOutputSchema,
  },
  async ({ sectionTitle, currentText, userPrompt, apiKey }) => {
    const { output } = await prompt(
      { sectionTitle, currentText, userPrompt },
      { auth: apiKey }
    );
    return output!;
  }
);
