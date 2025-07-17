
'use server';

/**
 * @fileOverview A flow to check the novelty of a generated research paper title against a list of existing titles.
 *
 * - checkTitleNovelty - A function that handles the novelty check.
 * - CheckTitleNoveltyInput - The input type for the checkTitleNovelty function.
 * - CheckTitleNoveltyOutput - The return type for the checkTitleNovelty function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { CheckTitleNoveltyInput, CheckTitleNoveltyOutput } from '@/types/schemas';
import { CheckTitleNoveltyInputSchema, CheckTitleNoveltyOutputSchema } from '@/types/schemas';


export async function checkTitleNovelty(input: CheckTitleNoveltyInput): Promise<CheckTitleNoveltyOutput> {
  return checkTitleNoveltyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'checkTitleNoveltyPrompt',
  input: { schema: CheckTitleNoveltyInputSchema.omit({apiKey: true}) },
  output: { schema: CheckTitleNoveltyOutputSchema },
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are an expert research analyst specializing in identifying topic overlap and novelty in academic literature.
  
Your task is to evaluate the novelty of a "Generated Title" by comparing it against a list of "Existing Papers". You have access to the title and keywords for each existing paper.

**Generated Title:**
"{{{generatedTitle}}}"

**Instructions:**
1.  **Analyze Semantics & Keywords:** Carefully analyze the core concepts, methods, keywords, and outcomes described in the generated title.
2.  **Compare with Existing Papers:** For each existing paper, determine its semantic similarity to the generated title. Use both the title and its associated keywords for a deeper comparison. A title might be different, but the underlying keywords could reveal a strong thematic overlap.
3.  **Identify Top Similarities:** Identify the top 3-5 most similar papers. For each, provide the title, a similarity score (0.0 to 1.0), and a brief reasoning for the similarity, mentioning any keyword overlaps.
4.  **Calculate Overall Novelty Score:** Based on your analysis, provide an overall novelty score from 0.0 (highly derivative) to 1.0 (highly novel). A score below 0.5 indicates significant overlap. A score above 0.8 suggests a high degree of novelty.
5.  **Provide Summary Reasoning:** Write a brief summary explaining your overall novelty score, highlighting the unique aspects of the generated title or its overlap with existing work based on titles and keywords.
6.  **Suggest Improvements:** If the novelty score is below 0.8, provide 2-3 specific, actionable suggestions for improving the title. These suggestions should aim to increase the title's specificity, highlight a unique contribution, or use more distinct terminology to differentiate it from existing work. These suggestions should be returned in the 'suggestionsForImprovement' field.

**Existing Papers for Comparison (Title and Keywords):**
{{#each existingPapers}}
- Title: "{{{this.title}}}"
  {{#if this.keywords}}
  Keywords: {{#each this.keywords}}{{{this}}}{{/each}}
  {{/if}}
{{/each}}
`,
  config: {
    temperature: 0.3, // Lower temperature for more deterministic and focused analysis
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    ],
  },
});

const checkTitleNoveltyFlow = ai.defineFlow(
  {
    name: 'checkTitleNoveltyFlow',
    inputSchema: CheckTitleNoveltyInputSchema,
    outputSchema: CheckTitleNoveltyOutputSchema,
  },
  async ({ generatedTitle, existingPapers, apiKey }) => {
    const { output } = await prompt(
      { generatedTitle, existingPapers },
      { auth: apiKey }
    );
    return output!;
  }
);
