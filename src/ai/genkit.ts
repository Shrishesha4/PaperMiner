import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// This is now a default export for flows. The API key will be provided
// dynamically at the time of the call within the flow itself.
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash', // Default model reference
});
