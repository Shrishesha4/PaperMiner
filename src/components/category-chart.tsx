'use client';

import React, { useMemo } from 'react';
import type { CategorizedPaper } from '@/types';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

interface CategoryChartProps {
  data: CategorizedPaper[];
  onCategorySelect: (category: string) => void;
}

export function CategoryChart({ data, onCategorySelect }: CategoryChartProps) {
  const chartData = useMemo(() => {
    const categoryCounts = data.reduce((acc, paper) => {
      const category = paper.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return Object.entries(categoryCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  if (chartData.length === 0) {
    return (
        <div className="flex items-center justify-center h-96 w-full text-muted-foreground">
            <p>No data to display for the current filters.</p>
        </div>
    );
  }

  return (
    <div className="h-96 w-full">
        <ChartContainer config={{
            count: { label: 'Papers', color: 'hsl(var(--primary))' }
        }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 100 }} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                    height={1}
                />
                <YAxis />
                <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={4} onClick={(bar) => onCategorySelect(bar.name)} style={{cursor: 'pointer'}} />
                </BarChart>
            </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
