
'use client';

import React, { useMemo } from 'react';
import type { CategorizedPaper } from '@/types';
import { Pie, PieChart, ResponsiveContainer } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';

interface CategoryChartProps {
  data: CategorizedPaper[];
  onCategorySelect: (category: string) => void;
}

const MAX_VISIBLE_CATEGORIES = 9; // Show top 9 + "Other"

export function CategoryChart({ data, onCategorySelect }: CategoryChartProps) {
  const { chartData, chartConfig } = useMemo(() => {
    const categoryCounts = data.reduce(
      (acc, paper) => {
        const category = paper.category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      },
      {} as { [key: string]: number }
    );

    const sortedCategories = Object.entries(categoryCounts)
      .map(([name, count]) => ({ name, papers: count }))
      .sort((a, b) => b.papers - a.papers);
    
    let finalChartData = sortedCategories;
    if (sortedCategories.length > MAX_VISIBLE_CATEGORIES + 1) {
        const topCategories = sortedCategories.slice(0, MAX_VISIBLE_CATEGORIES);
        const otherCount = sortedCategories
            .slice(MAX_VISIBLE_CATEGORIES)
            .reduce((acc, curr) => acc + curr.papers, 0);
        
        finalChartData = [
            ...topCategories,
            { name: 'Other', papers: otherCount },
        ];
    }
    
    const config: ChartConfig = {};
    finalChartData.forEach((item, index) => {
      config[item.name] = {
        label: item.name,
        color: `hsl(var(--chart-${(index % 5) + 1}))`,
      };
    });

    return { chartData: finalChartData, chartConfig: config };
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="flex h-96 w-full items-center justify-center text-muted-foreground">
        <p>No data to display for the current filters.</p>
      </div>
    );
  }

  return (
    <div className="h-96 w-full">
      <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="papers"
              nameKey="name"
              innerRadius={60}
              strokeWidth={5}
              onClick={(item: any) => onCategorySelect(item.name)}
            >
            </Pie>
            <ChartLegend
              content={<ChartLegendContent nameKey="name" />}
              className="-translate-y-[2rem] flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
