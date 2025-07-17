
'use client';

import React, { useMemo, useState } from 'react';
import type { CategorizedPaper } from '@/types';
import { Pie, PieChart, ResponsiveContainer, Cell, Label, Legend } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';

interface CategoryChartProps {
  data: CategorizedPaper[];
  onCategorySelect: (category: string | null) => void;
}

const MAX_VISIBLE_CATEGORIES = 9; // Show top 9 + "Other"
const COLORS = [
  "#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#00C49F", 
  "#0088FE", "#FFBB28", "#FF847C", "#E27D60", "#A4DE6C"
];

export function CategoryChart({ data, onCategorySelect }: CategoryChartProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { chartData, chartConfig, totalPapers } = useMemo(() => {
    const categoryCounts = data.reduce(
      (acc, paper) => {
        const category = paper.category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      },
      {} as { [key: string]: number }
    );

    const sortedCategories = Object.entries(categoryCounts)
      .map(([name, count]) => ({ name, papers: count, fill: '' }))
      .sort((a, b) => b.papers - a.papers);
    
    let finalChartData = sortedCategories;
    if (sortedCategories.length > MAX_VISIBLE_CATEGORIES + 1) {
        const topCategories = sortedCategories.slice(0, MAX_VISIBLE_CATEGORIES);
        const otherCount = sortedCategories
            .slice(MAX_VISIBLE_CATEGORIES)
            .reduce((acc, curr) => acc + curr.papers, 0);
        
        finalChartData = [
            ...topCategories,
            { name: 'Other', papers: otherCount, fill: '' },
        ];
    }
    
    const config: ChartConfig = {};
    finalChartData.forEach((item, index) => {
      const color = COLORS[index % COLORS.length];
      config[item.name] = {
        label: item.name,
        color: color,
      };
      item.fill = color;
    });

    const total = finalChartData.reduce((acc, curr) => acc + curr.papers, 0);

    return { chartData: finalChartData, chartConfig: config, totalPapers: total };
  }, [data]);

  const handlePieClick = (item: any) => {
    const clickedCategory = item.name;
    const newSelectedCategory = selectedCategory === clickedCategory ? null : clickedCategory;
    setSelectedCategory(newSelectedCategory);
    onCategorySelect(newSelectedCategory);
  };

  const handleLegendClick = (payload: any) => {
    const clickedCategory = payload.value;
    const newSelectedCategory = selectedCategory === clickedCategory ? null : clickedCategory;
    setSelectedCategory(newSelectedCategory);
    onCategorySelect(newSelectedCategory);
  };

  const selectedDataPoint = selectedCategory ? chartData.find(d => d.name === selectedCategory) : null;

  if (chartData.length === 0) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center text-muted-foreground">
        <p>No data to display for the current filters.</p>
      </div>
    );
  }

  return (
    <div className="h-[400px] w-full">
      <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <ChartTooltip
              cursor={true}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="papers"
              nameKey="name"
              innerRadius="60%"
              outerRadius="80%"
              strokeWidth={2}
              onClick={handlePieClick}
              paddingAngle={2}
            >
                {chartData.map((entry) => (
                    <Cell 
                        key={`cell-${entry.name}`} 
                        fill={entry.fill} 
                        opacity={selectedCategory ? (entry.name === selectedCategory ? 1 : 0.3) : 1}
                    />
                ))}
                <Label
                    content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                            return (
                                <>
                                <text x={viewBox.cx} y={viewBox.cy - 10} textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-3xl font-bold" onClick={() => handlePieClick({name: null})}>
                                    {(selectedDataPoint ? selectedDataPoint.papers : totalPapers).toLocaleString()}
                                </text>
                                <text x={viewBox.cx} y={viewBox.cy + 15} textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-sm" onClick={() => handlePieClick({name: null})}>
                                    {selectedDataPoint ? selectedDataPoint.name : 'Total Papers'}
                                </text>
                                </>
                            );
                        }
                    }}
                 />
            </Pie>
            <Legend
              onClick={handleLegendClick}
              verticalAlign="bottom"
              wrapperStyle={{paddingTop: 20}}
              formatter={(value, entry) => (
                <span style={{ color: selectedCategory === value ? 'var(--foreground)' : 'var(--muted-foreground)', opacity: selectedCategory ? (selectedCategory === value ? 1 : 0.5) : 1 }}>
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
