
'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { Pie, PieChart, ResponsiveContainer, Cell, Label, Legend, Sector } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { ScrollArea } from './ui/scroll-area';

export interface CategoryData {
  name: string;
  value: number;
}

interface CategoryChartProps {
  data: CategoryData[];
  onCategorySelect: (category: string | null) => void;
}

const COLORS = [
  "#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#00C49F",
  "#0088FE", "#FFBB28", "#FF847C", "#E27D60", "#A4DE6C"
];

export function CategoryChart({ data, onCategorySelect }: CategoryChartProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { chartData, chartConfig } = useMemo(() => {
    const sortedData = [...data].sort((a, b) => b.value - a.value);
    const config: ChartConfig = {};
    sortedData.forEach((item, index) => {
      const color = COLORS[index % COLORS.length];
      config[item.name] = { label: item.name, color: color };
    });
    return { chartData: sortedData, chartConfig: config };
  }, [data]);

  const handlePieClick = useCallback((item: any) => {
    const clickedCategory = item.name;
    const newSelectedCategory = selectedCategory === clickedCategory ? null : clickedCategory;
    setSelectedCategory(newSelectedCategory);
    onCategorySelect(newSelectedCategory);
  }, [selectedCategory, onCategorySelect]);

  const handleLegendClick = useCallback((payload: any) => {
    const clickedItem = chartData.find(d => d.name === payload.value);
    if (clickedItem) {
        handlePieClick(clickedItem);
    }
  }, [chartData, handlePieClick]);
  
  const selectedDataPoint = selectedCategory ? chartData.find(d => d.name === selectedCategory) : null;
  const totalPapers = useMemo(() => chartData.reduce((acc, curr) => acc + curr.value, 0), [chartData]);
  
  if (chartData.length === 0) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center text-muted-foreground">
        <p>No data to display.</p>
      </div>
    );
  }

  return (
      <ChartContainer config={chartConfig} className="min-h-[200px] w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <ChartTooltip cursor={true} content={<ChartTooltipContent nameKey="name" />} />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius="60%"
              outerRadius="80%"
              strokeWidth={2}
              onClick={(e) => handlePieClick(e)}
              paddingAngle={2}
            >
                {chartData.map((entry) => (
                    <Cell 
                        key={`cell-${entry.name}`} 
                        fill={chartConfig[entry.name]?.color} 
                        opacity={selectedCategory ? (entry.name === selectedCategory ? 1 : 0.3) : 1}
                    />
                ))}
                <Label
                    content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                            return (
                                <>
                                <text x={viewBox.cx} y={viewBox.cy - 12} textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-3xl font-bold" onClick={() => { setSelectedCategory(null); onCategorySelect(null); }}>
                                    {(selectedDataPoint ? selectedDataPoint.value : totalPapers)?.toLocaleString()}
                                </text>
                                <text x={viewBox.cx} y={viewBox.cy + 20} textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-sm" onClick={() => { setSelectedCategory(null); onCategorySelect(null); }}>
                                    {selectedDataPoint ? selectedDataPoint.name : 'Total Papers'}
                                </text>
                                </>
                            );
                        }
                    }}
                 />
            </Pie>
             <Legend
              content={({ payload }) => (
                <ScrollArea className="h-[350px] w-full max-w-[200px]">
                    <ul className="flex flex-col gap-1 p-2">
                    {payload?.map((entry, index) => (
                        <li
                        key={`item-${index}`}
                        onClick={() => handleLegendClick(entry)}
                        className={`flex items-center gap-2 text-sm cursor-pointer rounded-md p-2
                            ${selectedCategory === entry.value ? 'bg-muted/80 font-medium' : 'text-muted-foreground hover:bg-muted/50'}
                        `}
                        style={{
                            opacity: selectedCategory ? (selectedCategory === entry.value ? 1 : 0.5) : 1,
                        }}
                        >
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="truncate flex-1">{entry.value}</span>
                        <span className="font-mono text-xs">({(entry.payload as any)?.value})</span>
                        </li>
                    ))}
                    </ul>
                </ScrollArea>
              )}
              layout="vertical"
              verticalAlign="middle"
              align="right"
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
  );
}
