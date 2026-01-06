import type { DraftPaperOutput } from "./schemas";

export type ResearchPaper = {
  'Document Title': string;
  'Publication Year': string;
  'IEEE Terms': string;
  'Document Identifier': string; // Keep for unique key
  'Authors'?: string; // Keep for display
};

export type CategorizedPaper = ResearchPaper & {
  category: string;
  confidence: number;
};

export type FailedPaper = ResearchPaper & {
  failureReason: string;
};

// Add a title to the drafted paper object
export type DraftedPaper = DraftPaperOutput & {
  title: string;
}

export type Analysis = {
  id: string;
  name: string; // Typically the filename
  date: string; // ISO date string
  categorizedPapers: CategorizedPaper[];
  failedPapers: FailedPaper[];
  generatedTitles?: string[]; // To store titles from scratch sessions
  draftedPaper?: DraftedPaper;
  contextData?: string;
};
