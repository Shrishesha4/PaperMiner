import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// This is now a default export for flows. The API key will be provided
// dynamically at the time of the call within the flow itself.
// We configure googleAI with a placeholder API key to prevent initialization errors.
// The actual API key is passed via the `auth` parameter in each flow call.
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || 'placeholder',
    })
  ],
  model: 'googleai/gemini-flash-latest', // Default model reference
});
