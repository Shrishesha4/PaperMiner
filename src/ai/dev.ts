import { config } from 'dotenv';
config();

import '@/ai/flows/generate-title-summary.ts';
import '@/ai/flows/categorize-research-titles.ts';
import '@/ai/flows/generate-new-title.ts';
import '@/ai/flows/check-title-novelty.ts';
import '@/ai/flows/refine-title.ts';
