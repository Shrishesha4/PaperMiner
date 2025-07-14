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
  model: 'googleai/gemini-2.5-flash-lite-preview-06-17',
  prompt: `You are an expert academic writer specializing in creating compelling research paper titles that adhere to IEEE conventions.
  
  Based on the following list of topics, generate one new, creative, and insightful title that synthesizes these themes.
  
  The title must follow these strict conventions:
  1.  **IEEE Style**: It should be concise, descriptive, and accurately reflect the paper's content. Avoid overly sensational language.
  2.  **PICO Framework**: Structure the title conceptually around PICO elements where applicable:
      -   **P (Population/Problem)**: What is the specific problem or group being studied?
      -   **I (Intervention)**: What is the new method, technology, or approach being proposed?
      -   **C (Comparison)**: What is the main alternative or baseline it's being compared against? (Optional if not applicable)
      -   **O (Outcome)**: What is the primary result or benefit of the intervention?

  Topics to synthesize:
  {{#each topics}}
  - {{{this}}}
  {{/each}}
  
  Respond with only the new title.`,
  config: {
    temperature: 0.8, // Increase temperature for more creative/varied outputs
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
