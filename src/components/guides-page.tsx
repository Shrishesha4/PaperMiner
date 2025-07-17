
'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  BookText,
  BrainCircuit,
  FileCheck2,
  KeyRound,
  Lightbulb,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react';
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function GuidesPage() {
    const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
            <Button variant="outline" size="sm" className="mb-4" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4"/>
              Back
            </Button>
            <h1 className="text-4xl font-bold tracking-tight">PaperMiner Guide</h1>
            <p className="text-lg text-muted-foreground">
                Understand how our AI works, the standards we follow, and how your data is handled.
            </p>
        </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BrainCircuit className="text-primary" />
            AI-Powered Features
          </CardTitle>
          <CardDescription>
            PaperMiner uses Google's Gemini AI to provide powerful analysis and generation capabilities. Here's a breakdown of how each feature works.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-lg">
                <div className="flex items-center gap-2">
                    <UploadCloud className="w-5 h-5"/> How does CSV analysis work?
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-base leading-relaxed pl-2">
                When you upload a CSV file from IEEE Xplore, the application parses the titles of the research papers. These titles are then sent in batches to the AI model. The AI has been prompted to act as an expert academic researcher and assigns a relevant category and a confidence score to each title based on its content and terminology. This process allows for rapid categorization of hundreds of papers, revealing underlying themes in your dataset.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-lg">
                 <div className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5"/> How does Title Generation work?
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-base leading-relaxed pl-2">
                The Title Studio uses your selected topics and custom instructions to generate new, creative research titles. The AI is instructed to follow established academic conventions:
                <ul className="list-disc pl-6 my-2 space-y-1">
                    <li><strong>IEEE Style:</strong> Titles are concise, descriptive, and accurately reflect potential paper content.</li>
                    <li><strong>PICO Framework:</strong> Where applicable, titles are conceptually structured around Population/Problem, Intervention, Comparison, and Outcome.</li>
                </ul>
                This ensures the generated titles are not just creative but also grounded in academic best practices, making them suitable for formal research proposals.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-lg">
                 <div className="flex items-center gap-2">
                    <FileCheck2 className="w-5 h-5"/> How does the Novelty Check work?
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-base leading-relaxed pl-2">
                The novelty check is a powerful feature for ensuring your research ideas are unique. When you check a generated title, it is sent to the AI along with the titles and keywords from your entire uploaded dataset. The AI is tasked with performing a semantic comparison, looking for conceptual and keyword overlap. It then provides:
                 <ul className="list-disc pl-6 my-2 space-y-1">
                    <li>An overall <strong>Novelty Score</strong> from 0.0 (highly similar) to 1.0 (highly unique).</li>
                    <li>A list of the <strong>most similar papers</strong> from your dataset and the reasoning for the similarity.</li>
                    <li>Actionable <strong>suggestions for improvement</strong> if the novelty score is low.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
             <AccordionItem value="item-4">
              <AccordionTrigger className="text-lg">
                 <div className="flex items-center gap-2">
                    <BookText className="w-5 h-5"/> How does Paper Drafting work?
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-base leading-relaxed pl-2">
                When you choose to draft a paper from a title, the AI acts as an expert academic writer. It takes the title and generates a plausible, well-structured initial draft covering standard academic sections like Abstract, Introduction, Literature Review, Methods, Results, Discussion, and Conclusion. This provides a strong foundation that you can then refine, edit, and build upon with your own research and data.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <KeyRound className="text-primary" />
                How to Get Your Google AI API Key
            </CardTitle>
            <CardDescription>
                An API key is required to use the AI features. Follow these steps to get your free key.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <ol className="list-decimal space-y-3 pl-6 text-base leading-relaxed">
                <li>
                Go to the Google AI Studio website:{' '}
                <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-medium"
                >
                    aistudio.google.com/app/apikey
                </a>.
                </li>
                <li>
                Log in with your Google account if you haven't already.
                </li>
                <li>
                Click on the "<strong>Create API key</strong>" button. You might need to create a new project if you don't have one.
                </li>
                <li>
                An API key will be generated. It's a long string of letters and numbers. Click the copy icon next to the key to copy it to your clipboard.
                </li>
                <li>
                Come back to PaperMiner, click the settings icon in the top right, go to "Manage API Keys," and paste your key into the input field.
                </li>
            </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="text-primary" />
            User Privacy & Data
          </CardTitle>
          <CardDescription>
            Your privacy is paramount. We've designed PaperMiner to ensure your data stays your own.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <KeyRound className="h-4 w-4" />
            <AlertTitle>API Key Security</AlertTitle>
            <AlertDescription>
              Your Google AI Gemini API keys are stored **exclusively in your browser's local storage**. They are never sent to or stored on our servers. They are only used to make direct calls from your browser to the Google AI services.
            </AlertDescription>
          </Alert>
          <Alert>
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>Local Data Storage</AlertTitle>
            <AlertDescription>
              All of your data—including uploaded file analyses, generated titles, and saved drafts—is stored **only in your browser**. This means your work is completely private. Be aware that clearing your browser's data for this site will permanently delete all your work.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
