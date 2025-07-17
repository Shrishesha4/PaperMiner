'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
import type { CategorizedPaper, FailedPaper } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CategoryChart } from './category-chart';
import { KeywordDisplay } from './keyword-display';
import { PapersTable } from './papers-table';
import { Download, FileDown, Loader2, Plus, Wand2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { FailedPapersTable } from './failed-papers-table';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useHistory } from '@/hooks/use-history';

interface DashboardViewProps {
  analysisId: string;
  analysisName: string;
  data: CategorizedPaper[];
  failedData: FailedPaper[];
  onReset: (analysisId: string) => void;
}

// Add this type definition for the autoTable plugin
declare module 'jspdf' {
    interface jsPDF {
      autoTable: (options: any) => jsPDF;
    }
}

export function DashboardView({ analysisId, analysisName, data, failedData, onReset }: DashboardViewProps) {
  const { toast } = useToast();
  const { selectAnalysis } = useHistory();
  const [filters, setFilters] = useState({
    year: 'all',
    category: 'all',
  });
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  // We need refs for the individual components we want to capture
  const categoryChartRef = useRef<HTMLDivElement>(null);
  const keywordsRef = useRef<HTMLDivElement>(null);


  const years = useMemo(() => {
    const yearSet = new Set(data.map(p => p['Publication Year']).filter(Boolean));
    return ['all', ...Array.from(yearSet).sort((a, b) => Number(b) - Number(a))];
  }, [data]);

  const categories = useMemo(() => {
    const categorySet = new Set(data.map(p => p.category).filter(Boolean));
    return ['all', ...Array.from(categorySet).sort()];
  }, [data]);

  const allTitles = useMemo(() => data.map(p => p['Document Title']), [data]);

  const filteredData = useMemo(() => {
    return data.filter(paper => {
      const yearMatch = filters.year === 'all' || paper['Publication Year'] === filters.year;
      const categoryMatch = filters.category === 'all' || paper.category === filters.category;
      return yearMatch && categoryMatch;
    });
  }, [data, filters]);

  const handleFilterChange = (filterName: 'year' | 'category') => (value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value, }));
  };

  const handleCategorySelect = (category: string) => {
    setFilters(prev => ({ ...prev, category }));
  }

  const handleDownloadCSV = () => {
    if (data.length === 0) return;

    const headers = ['Document Title', 'Publication Year', 'category', 'confidence'];
    const csvRows = [headers.join(',')]; // Header row

    for (const paper of data) {
        const values = headers.map(header => {
            let value: string | number = '';
            if (header === 'Document Title') value = paper['Document Title'];
            else if (header === 'Publication Year') value = paper['Publication Year'];
            else if (header === 'category') value = paper.category;
            else if (header === 'confidence') value = paper.confidence;
            
            if (typeof value === 'string') {
                const hasComma = value.includes(',');
                const hasQuote = value.includes('"');
                if (hasComma || hasQuote) {
                    value = `"${value.replace(/"/g, '""')}"`;
                }
            }
            return value;
        });
        csvRows.push(values.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${analysisName}-categorized.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleDownloadPDF = useCallback(async () => {
    const categoryChartElement = categoryChartRef.current;
    if (!categoryChartElement || !filteredData.length) return;

    setIsGeneratingPdf(true);

    try {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageMargin = 15;
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const contentWidth = pageWidth - pageMargin * 2;
        let yPos = pageMargin;

        // --- TITLE PAGE ---
        pdf.setFontSize(22);
        pdf.text('PaperMiner Analysis Report', pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;
        pdf.setFontSize(16);
        pdf.text(analysisName, pageWidth / 2, yPos, { align: 'center' });
        yPos += 15;

        pdf.setFontSize(12);
        pdf.text(`Report generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' });
        yPos += 15;
        
        pdf.setFontSize(14);
        pdf.text('Summary', pageMargin, yPos);
        yPos += 8;
        
        pdf.setFontSize(11);
        pdf.text(`- Total papers analyzed: ${data.length}`, pageMargin, yPos);
        yPos += 7;
        pdf.text(`- Papers in current view: ${filteredData.length}`, pageMargin, yPos);
        yPos += 7;
        pdf.text(`- Unique categories found: ${categories.length - 1}`, pageMargin, yPos);
        yPos += 15;
        

        // --- CHART PAGE ---
        pdf.addPage();
        yPos = pageMargin;

        pdf.setFontSize(16);
        pdf.text('Category Distribution', pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;
        
        const canvas = await html2canvas(categoryChartElement, { scale: 2, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        if (yPos + imgHeight > pageHeight - pageMargin) {
            pdf.addPage();
            yPos = pageMargin;
        }

        pdf.addImage(imgData, 'PNG', pageMargin, yPos, imgWidth, imgHeight);

        // --- TABLE PAGE ---
        pdf.addPage();

        const tableHeaders = [['Title', 'Year', 'Category', 'Confidence']];
        const tableBody = filteredData.map(p => [
            p['Document Title'],
            p['Publication Year'],
            p.category,
            p.confidence.toFixed(2)
        ]);
        
        // Use jspdf-autotable for robust table creation
        pdf.autoTable({
            head: tableHeaders,
            body: tableBody,
            startY: pageMargin,
            margin: { left: pageMargin, right: pageMargin },
            styles: {
                fontSize: 8,
                cellPadding: 2,
            },
            headStyles: {
                fillColor: [59, 89, 152], // primary color
                textColor: 255,
                fontStyle: 'bold',
            },
            columnStyles: {
                0: { cellWidth: 'auto' }, // Title
                1: { cellWidth: 20 },   // Year
                2: { cellWidth: 30 },   // Category
                3: { cellWidth: 20 },   // Confidence
            },
            didDrawPage: (data: any) => {
                // You can add headers/footers to each page here if needed
            }
        });

        pdf.save(`${analysisName}-report.pdf`);
    } catch (error) {
        console.error("Error generating PDF:", error);
        toast({
          variant: "destructive",
          title: "PDF Generation Error",
          description: "Could not generate the PDF report."
        })
    } finally {
        setIsGeneratingPdf(false);
    }
  }, [filteredData, data.length, categories.length, toast, analysisName]);


  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{analysisName}</h2>
            <p className="text-muted-foreground">
              {data.length} papers analyzed. Found {categories.length - 1} unique categories.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => selectAnalysis(null)}>
                <Plus className="mr-2 h-4 w-4" /> New Analysis
            </Button>
            <Button asChild variant="outline">
                <Link href={`/title-studio?analysisId=${analysisId}`}>
                    <Wand2 className="mr-2 h-4 w-4" /> Title Studio
                </Link>
            </Button>
            <Button onClick={handleDownloadPDF} disabled={isGeneratingPdf || data.length === 0} variant="outline">
                {isGeneratingPdf ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <FileDown className="mr-2 h-4 w-4" />
                )}
                PDF
            </Button>
            <Button onClick={handleDownloadCSV} disabled={data.length === 0} variant="outline">
                <Download className="mr-2 h-4 w-4" /> CSV
            </Button>
          </div>
        </div>
        
        <div className="space-y-6">
            <Card>
            <CardHeader>
                <CardTitle>Filters</CardTitle>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4 mt-4 sm:mt-0 w-full sm:w-auto">
                    <Select value={filters.year} onValueChange={handleFilterChange('year')}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Filter by Year" />
                        </SelectTrigger>
                        <SelectContent>
                        {years.map(year => <SelectItem key={year} value={year}>{year === 'all' ? 'All Years' : year}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={filters.category} onValueChange={handleFilterChange('category')}>
                        <SelectTrigger className="w-full sm:w-[220px]">
                        <SelectValue placeholder="Filter by Category" />
                        </SelectTrigger>
                        <SelectContent>
                        {categories.map(cat => <SelectItem key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
                </CardContent>
            </CardHeader>
            </Card>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                  <CardHeader>
                  <CardTitle>Category Distribution</CardTitle>
                  </CardHeader>
                  <CardContent ref={categoryChartRef}>
                    <CategoryChart data={filteredData} onCategorySelect={handleCategorySelect} />
                  </CardContent>
              </Card>
              <Card>
                  <CardHeader>
                  <CardTitle>Top Keywords</CardTitle>
                  </CardHeader>
                  <CardContent ref={keywordsRef}>
                    <KeywordDisplay data={filteredData} />
                  </CardContent>
              </Card>
            </div>

            <Card>
            <CardHeader>
                <CardTitle>Research Papers</CardTitle>
                <CardDescription>
                Displaying {filteredData.length} of {data.length} categorized papers.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <PapersTable data={filteredData} />
            </CardContent>
            </Card>
        </div>

        {failedData.length > 0 && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="failed-papers">
              <Card>
                <AccordionTrigger className="p-6">
                  <div className="flex flex-col items-start">
                    <CardTitle>Failed Categorization</CardTitle>
                    <CardDescription className="mt-1">
                      {failedData.length} paper(s) could not be categorized.
                    </CardDescription>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent>
                    <FailedPapersTable data={failedData} />
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          </Accordion>
        )}
      </div>
    </div>
  );
}
