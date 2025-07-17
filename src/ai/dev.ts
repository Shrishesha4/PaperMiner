import { config } from 'dotenv';
config();

import '@/ai/flows/categorize-research-titles.ts';
import '@/ai/flows/check-title-novelty.ts';
import '@/ai/flows/generate-batch-titles.ts';
import '@/ai/flows/draft-paper-flow.ts';
import '@/ai/flows/refine-section-flow.ts';
import '@/ai/flows/regenerate-section-flow.ts';
import '@/ai/flows/categorize-single-title.ts';
