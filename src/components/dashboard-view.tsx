'use client';

import React, { useState, useMemo } from 'react';
import type { CategorizedPaper, FailedPaper } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CategoryChart } from './category-chart';
import { KeywordDisplay } from './keyword-display';
import { PapersTable } from './papers-table';
import { ArrowLeft } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { FailedPapersTable } from './failed-papers-table';

interface DashboardViewProps {
  data: CategorizedPaper[];
  failedData: FailedPaper[];
  onReset: () => void;
}

export function DashboardView({ data, failedData, onReset }: DashboardViewProps) {
  const [filters, setFilters] = useState({
    year: 'all',
    category: 'all',
  });

  const years = useMemo(() => {
    const yearSet = new Set(data.map(p => p['Publication Year']).filter(Boolean));
    return ['all', ...Array.from(yearSet).sort((a, b) => Number(b) - Number(a))];
  }, [data]);

  const categories = useMemo(() => {
    const categorySet = new Set(data.map(p => p.category).filter(Boolean));
    return ['all', ...Array.from(categorySet).sort()];
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter(paper => {
      const yearMatch = filters.year === 'all' || paper['Publication Year'] === filters.year;
      const categoryMatch = filters.category === 'all' || paper.category === filters.category;
      return yearMatch && categoryMatch;
    });
  }, [data, filters]);

  const handleFilterChange = (filterName: 'year' | 'category') => (value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const handleCategorySelect = (category: string) => {
    setFilters(prev => ({ ...prev, category }));
  }

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-background">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground">
              {data.length} papers analyzed. Found {categories.length - 1} unique categories.
            </p>
          </div>
          <Button onClick={onReset} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Start Over
          </Button>
        </div>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <CardTitle>Filters</CardTitle>
            <div className="flex gap-4 mt-4 sm:mt-0">
              <Select value={filters.year} onValueChange={handleFilterChange('year')}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => <SelectItem key={year} value={year}>{year === 'all' ? 'All Years' : year}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filters.category} onValueChange={handleFilterChange('category')}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Filter by Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => <SelectItem key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Category Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryChart data={filteredData} onCategorySelect={handleCategorySelect} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Top Keywords</CardTitle>
            </CardHeader>
            <CardContent>
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

        {failedData.length > 0 && (
          <Accordion type="single" collapsible className="w-full" defaultValue="failed-papers">
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
