'use client';

import React, { useState, useMemo } from 'react';
import type { CategorizedPaper } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PapersTableProps {
  data: CategorizedPaper[];
}

const ROWS_PER_PAGE = 10;

export function PapersTable({ data }: PapersTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(data.length / ROWS_PER_PAGE);

  const paginatedData = useMemo(() => data.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  ), [data, currentPage]);
  
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
              <TableHead className="w-[45%]">Document Title</TableHead>
              <TableHead>Authors</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Category</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((paper, index) => (
              <TableRow key={`${paper['Document Identifier']}-${index}`}>
                <TableCell className="font-medium">{paper['Document Title']}</TableCell>
                <TableCell className="text-muted-foreground">{paper['Authors']?.split(';')[0]} et al.</TableCell>
                <TableCell>{paper['Publication Year']}</TableCell>
                <TableCell>{paper.category}</TableCell>
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
