
'use client';

import React, { useMemo } from 'react';
import type { CategorizedPaper } from '@/types';
import { Bar, BarChart, Brush, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
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

  const initialEndIndex = useMemo(() => {
    if (chartData.length <= 10) return chartData.length - 1; // Show all if 10 or fewer
    return Math.max(Math.floor(chartData.length * 0.2), 5); // Show top 20% or at least 5
  }, [chartData.length]);


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
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 40 }} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                    height={80} // Increased height to prevent clipping
                    className="hidden sm:block"
                />
                 <XAxis
                    dataKey="name"
                    xAxisId="mobile"
                    tickLine={false}
                    axisLine={false}
                    tick={false}
                    className="sm:hidden"
                />
                <YAxis />
                <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted))' }} 
                    content={<ChartTooltipContent labelKey="name" />} 
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={4} onClick={(bar) => onCategorySelect(bar.name)} style={{cursor: 'pointer'}} />
                <Brush 
                    dataKey="name" 
                    height={30} 
                    stroke="hsl(var(--primary))" 
                    startIndex={0}
                    endIndex={initialEndIndex}
                    tickFormatter={(index) => chartData[index]?.name ?? ''}
                />
                </BarChart>
            </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
