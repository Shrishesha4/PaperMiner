
'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { Pie, PieChart, ResponsiveContainer, Cell, Label, Legend } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { ScrollArea } from './ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

export interface CategoryData {
  name: string;
  value: number;
}

interface CategoryChartProps {
  chartData: CategoryData[];
  allCategoriesData: CategoryData[];
  totalPapers: number;
  onCategorySelect: (category: string | null) => void;
  isGeneratingPdf: boolean;
}

const COLORS = [
  "#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#00C49F",
  "#0088FE", "#FFBB28", "#FF847C", "#E27D60", "#A4DE6C"
];

const TOP_CATEGORIES_COUNT = 20;

export function CategoryChart({ chartData, allCategoriesData, totalPapers, onCategorySelect, isGeneratingPdf }: CategoryChartProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { visualChartData, chartConfig } = useMemo(() => {
    const config: ChartConfig = {};
    const dataForConfig = allCategoriesData.length > chartData.length ? [...chartData.filter(c => c.name !== 'Other'), ...allCategoriesData.slice(TOP_CATEGORIES_COUNT - 1)] : chartData;

    dataForConfig.forEach((item, index) => {
      const color = COLORS[index % COLORS.length];
      config[item.name] = { label: item.name, color: color };
    });
    // Ensure 'Other' has a color if it exists
    if (chartData.some(c => c.name === 'Other') && !config['Other']) {
        config['Other'] = { label: 'Other', color: COLORS[chartData.length % COLORS.length]};
    }

    return { visualChartData: chartData, chartConfig: config };
  }, [chartData, allCategoriesData]);

  const handlePieClick = useCallback((item: any) => {
    const clickedCategory = item.name;
    const newSelectedCategory = selectedCategory === clickedCategory ? null : clickedCategory;
    setSelectedCategory(newSelectedCategory);
    onCategorySelect(newSelectedCategory);
  }, [selectedCategory, onCategorySelect]);

  const handleLegendClick = useCallback((itemName: string) => {
    const newSelectedCategory = selectedCategory === itemName ? null : itemName;
    setSelectedCategory(newSelectedCategory);
    onCategorySelect(newSelectedCategory);
  }, [selectedCategory, onCategorySelect]);
  
  const selectedDataPoint = selectedCategory ? allCategoriesData.find(d => d.name === selectedCategory) : null;
  
  if (visualChartData.length === 0) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center text-muted-foreground">
        <p>No data to display.</p>
      </div>
    );
  }
  
  const LegendContent = () => {
    const topCategories = visualChartData.filter(c => c.name !== 'Other');
    const otherData = allCategoriesData.slice(topCategories.length);
    const hasOther = otherData.length > 0;

    const renderItem = (item: CategoryData, isSubItem = false) => (
      <li
        key={`item-${item.name}`}
        onClick={() => handleLegendClick(item.name)}
        className={`flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-sm cursor-pointer rounded-md p-2
            ${selectedCategory === item.name ? 'bg-muted/80 font-medium' : 'text-muted-foreground hover:bg-muted/50'}
            ${isSubItem ? 'pl-8' : ''}
        `}
        style={{
            opacity: selectedCategory ? (selectedCategory === item.name ? 1 : 0.5) : 1,
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: chartConfig[item.name]?.color }} />
          <span className="break-words">{item.name}</span>
        </div>
        <span className="font-mono text-xs shrink-0">({item.value})</span>
      </li>
    );

    return (
      <ScrollArea className="h-[350px] w-full max-w-[250px]">
         <Accordion type="single" collapsible className="w-full">
            <ul className="flex flex-col gap-1 p-2">
                {topCategories.map(item => renderItem(item))}
                {hasOther && (
                    <AccordionItem value="other-categories" className="border-b-0">
                         <li
                            key="item-other"
                            className={`flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-sm rounded-md p-0
                                ${selectedCategory === 'Other' ? 'bg-muted/80 font-medium' : 'text-muted-foreground hover:bg-muted/50'}
                            `}
                             style={{
                                opacity: selectedCategory ? (selectedCategory === 'Other' ? 1 : 0.5) : 1,
                            }}
                        >
                            <AccordionTrigger 
                                className="flex-1 p-2"
                                onClick={() => handleLegendClick('Other')}
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: chartConfig['Other']?.color }} />
                                <span className="break-words">Other</span>
                                </div>
                                <span className="font-mono text-xs shrink-0 pr-2">({otherData.reduce((acc, i) => acc + i.value, 0)})</span>
                            </AccordionTrigger>
                        </li>
                        <AccordionContent>
                            <ul className="flex flex-col gap-1 pt-1">
                                {otherData.map(item => renderItem(item, true))}
                            </ul>
                        </AccordionContent>
                    </AccordionItem>
                )}
            </ul>
        </Accordion>
      </ScrollArea>
    );
  };


  return (
      <ChartContainer config={chartConfig} className="min-h-[200px] w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <ChartTooltip cursor={true} content={<ChartTooltipContent nameKey="name" />} />
            <Pie
              data={visualChartData}
              dataKey="value"
              nameKey="name"
              innerRadius="60%"
              outerRadius="80%"
              strokeWidth={2}
              onClick={(e) => handlePieClick(e)}
              paddingAngle={2}
            >
                {visualChartData.map((entry) => (
                    <Cell 
                        key={`cell-${entry.name}`} 
                        fill={chartConfig[entry.name]?.color} 
                        opacity={selectedCategory ? (entry.name === selectedCategory ? 1 : 0.3) : 1}
                    />
                ))}
                <Label
                    content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                            const displayValue = selectedDataPoint ? selectedDataPoint.value : totalPapers;
                            const displayName = selectedDataPoint ? selectedDataPoint.name : 'Total Papers';
                            return (
                                <>
                                <text x={viewBox.cx} y={viewBox.cy - 12} textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-3xl font-bold" onClick={() => { setSelectedCategory(null); onCategorySelect(null); }}>
                                    {displayValue?.toLocaleString()}
                                </text>
                                <text x={viewBox.cx} y={viewBox.cy + 20} textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-sm" onClick={() => { setSelectedCategory(null); onCategorySelect(null); }}>
                                    {displayName}
                                </text>
                                </>
                            );
                        }
                    }}
                 />
            </Pie>
             <Legend
              content={LegendContent}
              layout="vertical"
              verticalAlign="middle"
              align="right"
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
  );
}
