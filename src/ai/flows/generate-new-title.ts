'use server';

/**
 * @fileOverview A flow to generate a new research paper title based on a selection of existing papers.
 *
 * - generateNewTitle - A function that handles the generation of a new title.
 * - GenerateNewTitleInput - The input type for the generateNewTitle function.
 * - GenerateNewTitleOutput - The return type for the generateNewTitle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PaperInfoSchema = z.object({
  title: z.string().describe('The title of the research paper.'),
  category: z.string().describe('The assigned category of the research paper.'),
});

const GenerateNewTitleInputSchema = z.object({
  papers: z.array(PaperInfoSchema).describe('An array of selected research papers with their titles and categories.'),
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
  input: { schema: z.object({ papers: z.array(PaperInfoSchema) }) },
  output: { schema: GenerateNewTitleOutputSchema },
  model: 'googleai/gemini-1.5-flash',
  prompt: `You are an expert academic writer specializing in creating compelling research paper titles.
  
  Based on the following list of research paper titles and their categories, generate one new, creative, and insightful title that synthesizes the key themes and potential intersections of these topics. The new title should be concise and sound like a genuine research paper title.

  Selected Papers:
  {{#each papers}}
  - Title: "{{{title}}}" (Category: {{{category}}})
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
  async ({ papers, apiKey }) => {
    const { output } = await prompt(
      { papers },
      { auth: apiKey }
    );
    return output!;
  }
);
