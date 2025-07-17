
'use client';

import React, { useMemo } from 'react';
import type { CategorizedPaper } from '@/types';
import { ResponsiveContainer, Treemap } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface CategoryChartProps {
  data: CategorizedPaper[];
  onCategorySelect: (category: string) => void;
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

// Custom content renderer for Treemap cells
const CustomTreemapContent = (props: any) => {
    const { root, depth, x, y, width, height, index, name, size } = props;

    // Don't render labels for the root or very small cells
    if (width < 35 || height < 35) {
        return null;
    }

    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                    fill: COLORS[index % COLORS.length],
                    stroke: 'hsl(var(--background))',
                    strokeWidth: 2,
                    strokeOpacity: 1,
                }}
            />
            <text
                x={x + width / 2}
                y={y + height / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-primary-foreground font-medium text-xs sm:text-sm"
                style={{ pointerEvents: 'none' }}
            >
                {name}
            </text>
            <text
                x={x + width / 2}
                y={y + height / 2 + 16}
                textAnchor="middle"
                className="fill-primary-foreground/70 text-xs"
                style={{ pointerEvents: 'none' }}
            >
                ({size})
            </text>
        </g>
    );
};

export function CategoryChart({ data, onCategorySelect }: CategoryChartProps) {
  const chartData = useMemo(() => {
    const categoryCounts = data.reduce((acc, paper) => {
      const category = paper.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return Object.entries(categoryCounts)
      .map(([name, count]) => ({ name, size: count })) // Treemap uses 'size' instead of 'count'
      .sort((a, b) => b.size - a.size);
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
      <ChartContainer
        config={{
          papers: { label: 'Papers' },
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={chartData}
            dataKey="size"
            nameKey="name"
            aspectRatio={16 / 9}
            stroke="hsl(var(--card))"
            fill="hsl(var(--primary))"
            isAnimationActive={true}
            animationDuration={500}
            content={<CustomTreemapContent />}
            onClick={(item: any) => onCategorySelect(item.name)}
          >
            <ChartTooltip
                cursor={{ fill: 'hsla(var(--primary), 0.1)' }}
                content={
                    <ChartTooltipContent
                        labelKey="name"
                        formatter={(value, name) => `${value} papers`}
                    />
                }
            />
          </Treemap>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
