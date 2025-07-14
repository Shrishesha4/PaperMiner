'use client';

import React, { useState, useMemo } from 'react';
import type { CategorizedPaper } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PapersTableProps {
  data: CategorizedPaper[];
  selectedPapers: CategorizedPaper[];
  onSelectionChange: (selected: CategorizedPaper[]) => void;
}

const ROWS_PER_PAGE = 10;

export function PapersTable({ data, selectedPapers, onSelectionChange }: PapersTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(data.length / ROWS_PER_PAGE);

  const paginatedData = useMemo(() => data.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  ), [data, currentPage]);

  const selectedPaperIds = useMemo(() => new Set(selectedPapers.map(p => p['Document Identifier'])), [selectedPapers]);

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      onSelectionChange(data);
    } else {
      onSelectionChange([]);
    }
  };

  const handleRowSelect = (paper: CategorizedPaper) => {
    const isSelected = selectedPaperIds.has(paper['Document Identifier']);
    if (isSelected) {
      onSelectionChange(selectedPapers.filter(p => p['Document Identifier'] !== paper['Document Identifier']));
    } else {
      onSelectionChange([...selectedPapers, paper]);
    }
  };

  const isPageSelected = paginatedData.length > 0 && paginatedData.every(p => selectedPaperIds.has(p['Document Identifier']));
  const isPageIndeterminate = !isPageSelected && paginatedData.some(p => selectedPaperIds.has(p['Document Identifier']));
  
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  if (data.length === 0) {
    return <div className="text-center text-muted-foreground py-10">No papers match the current filters.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={isPageSelected || isPageIndeterminate}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all rows on this page"
                />
              </TableHead>
              <TableHead className="w-[40%]">Document Title</TableHead>
              <TableHead>Authors</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Category</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((paper) => (
              <TableRow 
                key={paper['Document Identifier']}
                data-state={selectedPaperIds.has(paper['Document Identifier']) ? 'selected' : ''}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedPaperIds.has(paper['Document Identifier'])}
                    onCheckedChange={() => handleRowSelect(paper)}
                    aria-label={`Select row for ${paper['Document Title']}`}
                  />
                </TableCell>
                <TableCell className="font-medium">{paper['Document Title']}</TableCell>
                <TableCell className="text-muted-foreground">{paper['Authors']?.split(';')[0]} et al.</TableCell>
                <TableCell>{paper['Publication Year']}</TableCell>
                <TableCell>{paper.category}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {selectedPapers.length} of {data.length} row(s) selected.
        </div>
        <div className="flex items-center justify-end space-x-2">
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button variant="outline" size="sm" onClick={goToPreviousPage} disabled={currentPage === 1}>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous</span>
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextPage} disabled={currentPage === totalPages}>
            <span className="sr-only">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
