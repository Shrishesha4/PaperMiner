export type ResearchPaper = {
  'Document Title': string;
  'Authors': string;
  'Author Affiliations': string;
  'Publication Title': string;
  'Date Added To Xplore': string;
  'Publication Year': string;
  'Volume': string;
  'Issue': string;
  'Start Page': string;
  'End Page': string;
  'Abstract': string;
  'ISSN': string;
  'ISBNs': string;
  'DOI': string;
  'Funding Information': string;
  'PDF Link': string;
  'Author Keywords': string;
  'IEEE Terms': string;
  'Mesh_Terms': string;
  'Article Citation Count': string;
  'Patent Citation Count': string;
  'Reference Count': string;
  'License': string;
  'Online Date': string;
  'Issue Date': string;
  'Meeting Date': string;
  'Publisher': string;
  'Document Identifier': string;
};

export type CategorizedPaper = ResearchPaper & {
  category: string;
  confidence: number;
};
