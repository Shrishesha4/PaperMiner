'use client';

import React, { useState, useCallback } from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type ResearchPaper } from '@/types';
import { Button } from '@/components/ui/button';

// A simple CSV parser that handles quoted fields.
function parseCSV(text: string): { data: ResearchPaper[], errors: number } {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return { data: [], errors: 0 };

  // Robustly parse header, removing BOM and quotes
  const headerLine = lines[0].trim().startsWith('\uFEFF') ? lines[0].trim().substring(1) : lines[0].trim();
  const headers = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  const requiredHeaders = ["Document Title", "Authors", "Publication Year"];
  const hasHeaders = requiredHeaders.every(h => headers.includes(h));

  if (!hasHeaders) {
    throw new Error('Invalid CSV format. Missing one of required columns: "Document Title", "Authors", "Publication Year".');
  }

  const data: ResearchPaper[] = [];
  let errorCount = 0;

  lines.slice(1).forEach(line => {
    if (!line.trim()) return; // Skip empty lines

    const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    
    // Skip rows that don't have the same number of columns as the header
    if (values.length !== headers.length) {
        errorCount++;
        return;
    }
    
    const entry: { [key: string]: string } = {};
    headers.forEach((header, i) => {
        if(values[i]) {
            entry[header] = values[i].trim().replace(/^"|"$/g, '');
        } else {
            entry[header] = '';
        }
    });

    // Skip if essential data is missing
    if (!entry['Document Title']) {
        errorCount++;
        return;
    }

    data.push(entry as unknown as ResearchPaper);
  });

  return { data, errors: errorCount };
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
          onProcess(parsedData);
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
    <div className="flex-1 flex flex-col items-center justify-center p-4 text-center bg-background">
      <div className="max-w-2xl w-full">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Mine Insights from Your Research</h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Upload a CSV from IEEE Xplore to automatically categorize titles, visualize trends, and uncover key themes in your data.
        </p>
        <form className="mt-10" onDragEnter={handleDrag} onSubmit={(e) => e.preventDefault()}>
            <label
                htmlFor="dropzone-file"
                className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted transition-colors ${dragActive ? 'border-primary' : 'border-border'}`}
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
      </div>
    </div>
  );
}
