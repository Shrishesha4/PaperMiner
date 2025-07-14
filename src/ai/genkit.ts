import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// This is now a default export for flows that might not need an API key
// or for other potential uses. The main categorization flow will now
// initialize Genkit dynamically with the user's key.
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});
