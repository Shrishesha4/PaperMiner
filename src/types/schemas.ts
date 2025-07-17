
import { z } from 'zod';

// Schema for an existing paper used in novelty check
export const ExistingPaperSchema = z.object({
  title: z.string().describe('The title of the existing research paper.'),
  keywords: z.array(z.string()).optional().describe('A list of keywords associated with the paper (from Author Keywords, IEEE Terms, etc.).')
});
export type ExistingPaper = z.infer<typeof ExistingPaperSchema>;

// Schemas for checking title novelty
export const CheckTitleNoveltyInputSchema = z.object({
  generatedTitle: z.string().describe('The newly generated title to check for novelty.'),
  existingPapers: z.array(ExistingPaperSchema).describe('A list of existing research papers with their titles and keywords to compare against.'),
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

// Schemas for batch title generation
export const GenerateBatchTitlesInputSchema = z.object({
    topics: z.array(z.string()).describe('A list of topics or categories to base the new titles on.'),
    count: z.number().min(1).describe('The number of titles to generate.'),
    customInstructions: z.string().optional().describe('Optional user-provided instructions to guide title generation.'),
    apiKey: z.string().describe('The user-provided Gemini API key.'),
});
export type GenerateBatchTitlesInput = z.infer<typeof GenerateBatchTitlesInputSchema>;

export const GenerateBatchTitlesOutputSchema = z.object({
    titles: z.array(z.string()).describe('A list of newly generated research paper titles.'),
});
export type GenerateBatchTitlesOutput = z.infer<typeof GenerateBatchTitlesOutputSchema>;

// Schemas for drafting a paper
const PaperSectionSchema = z.object({
  title: z.string().describe('The title of the section (e.g., "Abstract").'),
  content: z.string().describe('The generated content for this section.'),
});
export type PaperSection = z.infer<typeof PaperSectionSchema>;


export const DraftPaperOutputSchema = z.object({
  sections: z.array(PaperSectionSchema).describe('The drafted sections of the research paper.'),
});
export type DraftPaperOutput = z.infer<typeof DraftPaperOutputSchema>;
