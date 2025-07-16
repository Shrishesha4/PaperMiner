
'use server';
/**
 * @fileOverview This file is no longer used and is replaced by refine-text-flow.ts.
 * It is kept to prevent build errors from components that might still reference it,
 * but its functionality has been migrated.
 */

import {z} from 'genkit';

// Define types to prevent breaking imports in other files, but the flow is gone.
export type RefineSectionInput = {
  sectionTitle: string;
  currentText: string;
  userPrompt: string;
  apiKey: string;
};

export type RefineSectionOutput = {
  refinedText: string;
};

// The actual flow logic has been removed and migrated to refine-text-flow.ts.
// This function is a placeholder to avoid breaking the application.
export async function refineSection(input: RefineSectionInput): Promise<RefineSectionOutput> {
  console.warn("refineSection is deprecated. Use refineText instead.");
  return { refinedText: input.currentText };
}
