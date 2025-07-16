import { z } from 'zod';

// Schema for generating a new title
export const GenerateNewTitleInputSchema = z.object({
  topics: z.array(z.string()).describe('A list of topics or categories to base the new title on.'),
  apiKey: z.string().describe('The user-provided Gemini API key.'),
});
export type GenerateNewTitleInput = z.infer<typeof GenerateNewTitleInputSchema>;

export const GenerateNewTitleOutputSchema = z.object({
  newTitle: z.string().describe('A new, creative, and relevant research paper title.'),
});
export type GenerateNewTitleOutput = z.infer<typeof GenerateNewTitleOutputSchema>;


// Schemas for checking title novelty
export const CheckTitleNoveltyInputSchema = z.object({
  generatedTitle: z.string().describe('The newly generated title to check for novelty.'),
  existingTitles: z.array(z.string()).describe('A list of existing research paper titles to compare against.'),
  apiKey: z.string().describe('The user-provided Gemini API key.'),
});
export type CheckTitleNoveltyInput = z.infer<typeof CheckTitleNoveltyInputSchema>;

const SimilarTitleSchema = z.object({
    title: z.string().describe('The existing title that is similar to the generated one.'),
    similarityScore: z.number().min(0).max(1).describe('A score from 0 (not similar) to 1 (very similar) indicating the semantic similarity.'),
    reasoning: z.string().describe('A brief explanation of why the title is considered similar.')
});

export const CheckTitleNoveltyOutputSchema = z.object({
  noveltyScore: z.number().min(0).max(1).describe('A score from 0 (not novel) to 1 (highly novel) representing the uniqueness of the generated title.'),
  similarTitles: z.array(SimilarTitleSchema).describe('A list of the top 3-5 most similar titles from the existing dataset.'),
  overallReasoning: z.string().describe('A summary of the novelty assessment.'),
  suggestionsForImprovement: z.array(z.string()).optional().describe('A list of suggestions to improve the title if novelty is low.'),
});
export type CheckTitleNoveltyOutput = z.infer<typeof CheckTitleNoveltyOutputSchema>;

// Schemas for refining a title
export const RefineTitleInputSchema = z.object({
    originalTitle: z.string().describe('The title to be refined.'),
    suggestion: z.string().describe('The suggestion to apply to the title.'),
    apiKey: z.string().describe('The user-provided Gemini API key.'),
});
export type RefineTitleInput = z.infer<typeof RefineTitleInputSchema>;

export const RefineTitleOutputSchema = z.object({
    refinedTitle: z.string().describe('The refined title.'),
});
export type RefineTitleOutput = z.infer<typeof RefineTitleOutputSchema>;
