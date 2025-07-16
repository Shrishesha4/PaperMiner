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

export type Analysis = {
  id: string;
  name: string; // Typically the filename
  date: string; // ISO date string
  categorizedPapers: CategorizedPaper[];
  failedPapers: FailedPaper[];
  generatedTitles?: string[]; // To store titles from scratch sessions
};
