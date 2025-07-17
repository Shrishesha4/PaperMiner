'use server';

/**
 * @fileOverview This file defines a Genkit flow to consolidate a list of specific research categories into broader domains.
 *
 * - consolidateCategories - A function that groups categories into a hierarchical structure.
 * - ConsolidateCategoriesInput - The input type for the consolidateCategories function.
 * - ConsolidateCategoriesOutput - The return type for the consolidateCategories function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CategoryHierarchySchema = z.object({
  name: z.string().describe('The name of the domain or category.'),
  children: z.array(z.lazy(() => CategoryHierarchySchema)).optional().describe('An array of sub-categories or domains.'),
});

const ConsolidateCategoriesInputSchema = z.object({
  categories: z.array(z.string()).describe('A flat list of research paper categories.'),
  apiKey: z.string().describe('The user-provided Gemini API key.'),
});
export type ConsolidateCategoriesInput = z.infer<typeof ConsolidateCategoriesInputSchema>;


const ConsolidateCategoriesOutputSchema = z.object({
    hierarchy: z.array(CategoryHierarchySchema).describe('A hierarchical structure of the categories, grouped into domains.')
});
export type ConsolidateCategoriesOutput = z.infer<typeof ConsolidateCategoriesOutputSchema>;


export async function consolidateCategories(input: ConsolidateCategoriesInput): Promise<ConsolidateCategoriesOutput> {
  return consolidateCategoriesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'consolidateCategoriesPrompt',
  input: { schema: ConsolidateCategoriesInputSchema.omit({ apiKey: true }) },
  output: { schema: ConsolidateCategoriesOutputSchema },
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are an expert taxonomist for academic research. Your task is to organize a flat list of specific research categories into a clear hierarchical structure of broader domains and their sub-categories.

**Instructions:**
1.  Analyze the provided list of categories.
2.  Identify overarching domains (e.g., "Computer Science", "Medical Research", "Material Science").
3.  Group the specific categories under their most appropriate parent domain.
4.  You can create nested hierarchies if it makes sense (e.g., Domain: "Engineering" -> Sub-Domain: "Electrical Engineering" -> Category: "Signal Processing").
5.  If a category is broad enough, it can be a top-level domain itself.
6.  Ensure every single category from the input list is placed somewhere in the final hierarchy.
7.  Return the result as a nested JSON structure.

**Input Categories:**
{{#each categories}}
- {{{this}}}
{{/each}}
`,
  config: {
    temperature: 0.2,
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    ],
  },
});

const consolidateCategoriesFlow = ai.defineFlow(
  {
    name: 'consolidateCategoriesFlow',
    inputSchema: ConsolidateCategoriesInputSchema,
    outputSchema: ConsolidateCategoriesOutputSchema,
  },
  async ({ categories, apiKey }) => {
    const { output } = await prompt(
      { categories },
      { auth: apiKey }
    );
    return output!;
  }
);
