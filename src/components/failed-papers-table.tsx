'use client';

import React, { useState } from 'react';
import type { ResearchPaper } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface FailedPapersTableProps {
  data: ResearchPaper[];
}

const ROWS_PER_PAGE = 5;

export function FailedPapersTable({ data }: FailedPapersTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(data.length / ROWS_PER_PAGE);

  const paginatedData = data.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  if (data.length === 0) {
    return <div className="text-center text-muted-foreground py-10">No papers to display.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50%]">Document Title</TableHead>
              <TableHead>Authors</TableHead>
              <TableHead>Year</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((paper, index) => (
              <TableRow key={`${paper['Document Identifier']}-${index}`}>
                <TableCell className="font-medium">{paper['Document Title'] || <span className="text-muted-foreground italic">No Title</span>}</TableCell>
                <TableCell className="text-muted-foreground">{paper['Authors']?.split(';')[0]} et al.</TableCell>
                <TableCell>{paper['Publication Year']}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
  );
}
