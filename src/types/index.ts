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
