'use client';

import React, { useState, useCallback } from 'react';
import { UploadCloud, Loader2, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type ResearchPaper } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card } from '@/components/ui/card';

// A simple CSV parser that handles quoted fields.
function parseCSV(text: string): { data: ResearchPaper[], errors: number } {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return { data: [], errors: 0 };

  // Robustly parse header, removing BOM and quotes
  const headerLine = lines[0].trim().startsWith('\uFEFF') ? lines[0].trim().substring(1) : lines[0].trim();
  const headers = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  const requiredHeaders = ["Document Title", "Publication Year", "IEEE Terms", "Document Identifier", "Authors"];
  const hasHeaders = requiredHeaders.every(h => headers.includes(h));

  if (!hasHeaders) {
    throw new Error('Invalid CSV format. Missing one of required columns: "Document Title", "Publication Year", "IEEE Terms", "Document Identifier", "Authors".');
  }

  const data: ResearchPaper[] = [];
  let errorCount = 0;

  const requiredIndices: {[key: string]: number} = {};
  requiredHeaders.forEach(h => {
    requiredIndices[h] = headers.indexOf(h);
  });

  lines.slice(1).forEach(line => {
    if (!line.trim()) return; // Skip empty lines

    const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    
    // Check if essential data is present
    const title = values[requiredIndices['Document Title']]?.trim().replace(/^"|"$/g, '');
    if (!title) {
        errorCount++;
        return;
    }
    
    const entry: Partial<ResearchPaper> = {};
    entry['Document Title'] = title;
    entry['Publication Year'] = values[requiredIndices['Publication Year']]?.trim().replace(/^"|"$/g, '') || '';
    entry['IEEE Terms'] = values[requiredIndices['IEEE Terms']]?.trim().replace(/^"|"$/g, '') || '';
    entry['Document Identifier'] = values[requiredIndices['Document Identifier']]?.trim().replace(/^"|"$/g, '') || `${title}-${Date.now()}`;
    entry['Authors'] = values[requiredIndices['Authors']]?.trim().replace(/^"|"$/g, '') || '';

    data.push(entry as ResearchPaper);
  });

  return { data, errors: errorCount };
}

interface UploaderViewProps {
    onProcess: (data: ResearchPaper[], fileName: string) => void;
}


export function UploaderView({ onProcess }: UploaderViewProps) {
  const { toast } = useToast();
  const [isParsing, setIsParsing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (file && file.type === 'text/csv') {
      setIsParsing(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const { data: parsedData, errors: parsingErrors } = parseCSV(text);
          
          if (parsingErrors > 0) {
            toast({
              title: "Parsing Issues",
              description: `Skipped ${parsingErrors} malformed row(s) in the CSV file.`
            });
          }

          if (parsedData.length === 0) {
            toast({
                variant: "destructive",
                title: "Empty or Invalid CSV",
                description: "The CSV file is empty or contains no valid data rows."
            });
            return;
          }
          onProcess(parsedData, file.name);
        } catch (error: any) {
          toast({
            variant: "destructive",
            title: "CSV Parsing Error",
            description: error.message || "Could not parse the CSV file."
          });
        } finally {
          setIsParsing(false);
        }
      };
      reader.onerror = () => {
        toast({
            variant: "destructive",
            title: "File Read Error",
            description: "Could not read the selected file."
        })
        setIsParsing(false);
      }
      reader.readAsText(file);
    } else {
        toast({
            variant: "destructive",
            title: "Invalid File Type",
            description: "Please upload a valid .csv file."
        })
    }
  }, [onProcess, toast]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="max-w-2xl w-full">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Mine Insights for Your Research</h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Upload a CSV from IEEE Xplore to automatically categorize titles, visualize trends, and uncover key themes for your research.
        </p>
        <Card className="mt-10">
          <form className="p-4" onDragEnter={handleDrag} onSubmit={(e) => e.preventDefault()}>
              <label
                  htmlFor="dropzone-file"
                  className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-card/50 hover:bg-muted/50 transition-colors ${dragActive ? 'border-primary' : 'border-border'}`}
              >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadCloud className={`w-10 h-10 mb-3 ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">CSV files from ieee.org</p>
                  </div>
                  <input id="dropzone-file" type="file" className="hidden" accept=".csv" onChange={handleChange} disabled={isParsing} />
                   {isParsing && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                  )}
              </label>
              {dragActive && <div className="absolute inset-0 w-full h-full" onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}></div>}
          </form>
        </Card>
         <div className="mt-8">
          <p className="text-muted-foreground">Or, start from scratch:</p>
          <Button asChild variant="link" className="text-base">
            <Link href="/title-studio">
                Go to Title Studio <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
