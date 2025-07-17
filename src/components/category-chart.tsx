
'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { Pie, PieChart, ResponsiveContainer, Cell, Label, Legend, Sector } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';

export interface CategoryHierarchy {
  name: string;
  value?: number;
  children?: CategoryHierarchy[];
}

interface CategoryChartProps {
  data: CategoryHierarchy[];
  onCategorySelect: (category: string | null) => void;
}

const COLORS = [
  "#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#00C49F",
  "#0088FE", "#FFBB28", "#FF847C", "#E27D60", "#A4DE6C"
];

const findNodeByPath = (nodes: CategoryHierarchy[], path: string[]): CategoryHierarchy[] => {
    if (path.length === 0) {
        return nodes;
    }
    const [current, ...rest] = path;
    const node = nodes.find(n => n.name === current);
    if (node && node.children) {
        return findNodeByPath(node.children, rest);
    }
    return node ? [node] : [];
};

export function CategoryChart({ data, onCategorySelect }: CategoryChartProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [drilldownPath, setDrilldownPath] = useState<string[]>([]);

  const currentLevelData = useMemo(() => findNodeByPath(data, drilldownPath), [data, drilldownPath]);

  const { chartData, chartConfig } = useMemo(() => {
    const sortedData = [...currentLevelData].sort((a, b) => (b.value || 0) - (a.value || 0));
    const config: ChartConfig = {};
    sortedData.forEach((item, index) => {
      const color = COLORS[index % COLORS.length];
      config[item.name] = { label: item.name, color: color };
    });
    return { chartData: sortedData, chartConfig: config };
  }, [currentLevelData]);

  const handlePieClick = useCallback((item: any) => {
    if (item.children && item.children.length > 0) {
      setDrilldownPath(prev => [...prev, item.name]);
      setSelectedCategory(null);
      onCategorySelect(null);
    } else {
        const clickedCategory = item.name;
        const newSelectedCategory = selectedCategory === clickedCategory ? null : clickedCategory;
        setSelectedCategory(newSelectedCategory);
        onCategorySelect(newSelectedCategory);
    }
  }, [selectedCategory, onCategorySelect]);

  const handleLegendClick = useCallback((payload: any) => {
    const clickedItem = chartData.find(d => d.name === payload.value);
    if (clickedItem) {
        handlePieClick(clickedItem);
    }
  }, [chartData, handlePieClick]);
  
  const handleGoBack = () => {
    setDrilldownPath(prev => prev.slice(0, -1));
    setSelectedCategory(null);
    onCategorySelect(null);
  };

  const selectedDataPoint = selectedCategory ? chartData.find(d => d.name === selectedCategory) : null;
  const totalPapers = useMemo(() => chartData.reduce((acc, curr) => acc + (curr.value || 0), 0), [chartData]);
  
  if (chartData.length === 0) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center text-muted-foreground">
        <p>No data to display.</p>
      </div>
    );
  }

  return (
    <div className="relative h-[400px] w-full">
      {drilldownPath.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleGoBack} className="absolute left-2 top-0 z-10">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to {drilldownPath.length > 1 ? drilldownPath[drilldownPath.length-2] : "Top Level"}
          </Button>
      )}
      <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
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
              onClick={handlePieClick}
              paddingAngle={2}
            >
                {chartData.map((entry, index) => (
                    <Cell 
                        key={`cell-${entry.name}`} 
                        fill={chartConfig[entry.name]?.color} 
                        opacity={selectedCategory ? (entry.name === selectedCategory ? 1 : 0.3) : 1}
                        style={{ cursor: (entry.children && entry.children.length > 0) ? 'pointer' : 'default' }}
                    />
                ))}
                <Label
                    content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                            return (
                                <>
                                <text x={viewBox.cx} y={viewBox.cy - 10} textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-3xl font-bold" onClick={() => { setSelectedCategory(null); onCategorySelect(null); }}>
                                    {(selectedDataPoint ? selectedDataPoint.value : totalPapers)?.toLocaleString()}
                                </text>
                                <text x={viewBox.cx} y={viewBox.cy + 15} textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-sm" onClick={() => { setSelectedCategory(null); onCategorySelect(null); }}>
                                    {selectedDataPoint ? selectedDataPoint.name : drilldownPath.length > 0 ? drilldownPath[drilldownPath.length - 1] : 'Total Papers'}
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
              formatter={(value, entry) => {
                const item = chartData.find(d => d.name === value);
                const isDrillable = item && item.children && item.children.length > 0;
                return (
                  <span 
                    className={`
                        ${isDrillable ? 'cursor-pointer hover:text-primary' : 'cursor-default'}
                        ${selectedCategory === value ? 'text-foreground font-medium' : 'text-muted-foreground'}
                    `}
                    style={{ opacity: selectedCategory ? (selectedCategory === value ? 1 : 0.5) : 1 }}
                  >
                    {value}
                  </span>
                )
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
