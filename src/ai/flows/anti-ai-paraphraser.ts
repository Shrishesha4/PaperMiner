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
  model: 'googleai/gemini-flash-latest',
  prompt: `You are an expert editor and writer. Your task is to rewrite the provided text to make it indistinguishable from human writing and to bypass AI detection tools.

Guidelines for rewriting:
1.  **Vary Sentence Structure:** Mix short, punchy sentences with longer, complex ones. Avoid repetitive subject-verb-object patterns.
2.  **Use Natural Idioms and Phrasing:** Employ vocabulary and turns of phrase that are common in high-quality human academic writing but less frequent in AI outputs.
3.  **Avoid AI "Tells":** Do not use overused transition words like "Furthermore," "Moreover," "In conclusion," or "It is important to note" unless absolutely necessary and natural.
4.  **Add Nuance and Imperfection:** AI often writes "perfectly" average text. Introduce slight stylistic quirks or specific, less generic examples where appropriate (without changing the meaning).
5.  **Maintain Academic Tone:** While making it "human," ensure it remains formal and suitable for a research paper.
6.  **Perplexity and Burstiness:** Increase the perplexity (unpredictability of words) and burstiness (variation in sentence structure) of the text.

**Input Text:**
"{{{text}}}"

Rewrite this text now.`,
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
