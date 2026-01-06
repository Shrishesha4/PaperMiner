'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ParaphraseInputSchema = z.object({
  text: z.string().describe('The text to paraphrase.'),
  apiKey: z.string().describe('The user-provided Gemini API key.'),
});

const ParaphraseOutputSchema = z.object({
  paraphrasedText: z.string().describe('The paraphrased text.'),
});

const paraphrasePrompt = ai.definePrompt({
  name: 'paraphrasePrompt',
  input: { schema: ParaphraseInputSchema.omit({ apiKey: true }) },
  output: { schema: ParaphraseOutputSchema },
  model: 'googleai/gemini-3-pro-preview',
  prompt: `You are an expert academic editor and writer. Your task is to rewrite the provided text to make it indistinguishable from human academic writing.

  **Core Objectives:**
  1.  **Increase Burstiness:** AI text often has a monotonous sentence structure. You must vary sentence length. Mix short, direct sentences with longer, complex clauses to create a natural, human rhythm.
  2.  **Increase Perplexity:** Use a diverse and sophisticated vocabulary. Avoid predictable word pairings. Choose precise adjectives and verbs that a native expert would use.
  3.  **Eliminate "AI Tells":** Remove overused AI transition phrases such as "It is important to note," "Furthermore," "Moreover," "In conclusion," "In the realm of," or "crucial aspect." Use organic, conversational transitions instead.
  4.  **Avoid Generic Buzzwords:** Minimize the use of repetitive words like "delve," "leverage," "underscore," "pivotal," "landscape," "showcase," or "navigate" unless they are the most precise terms available.
  5.  **Maintain Academic Rigor:** While making the text sound human, do not lower the intellectual standard. Ensure the tone remains formal, objective, and suitable for publication.

  **Constraints:**
  -   Do **NOT** change the underlying technical meaning, facts, or data.
  -   Preserve all Markdown formatting (headers, bolding, lists).
  -   Ensure the grammar is flawless but natural.

  **Input Text:**
  "{{{text}}}"

  Rewrite this text now:`,
});

export const paraphraseFlow = ai.defineFlow(
  {
    name: 'paraphraseFlow',
    inputSchema: ParaphraseInputSchema,
    outputSchema: ParaphraseOutputSchema,
  },
  async ({ text, apiKey }) => {
    const { output } = await paraphrasePrompt(
      { text },
      { config: { apiKey } }
    );
    return output!;
  }
);
