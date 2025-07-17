
'use client';

import { useTheme } from '@/hooks/use-theme';
import { Button } from './ui/button';
import { Check, Paintbrush } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Label } from './ui/label';
import { Slider } from './ui/slider';

const THEMES = [
  { name: 'default', color: 'hsl(262.1 83.3% 57.8%)' },
  { name: 'zinc', color: 'hsl(240 5.9% 10%)' },
  { name: 'rose', color: 'hsl(346.8 77.2% 49.8%)' },
  { name: 'blue', color: 'hsl(221.2 83.2% 53.3%)' },
  { name: 'green', color: 'hsl(142.1 76.2% 36.3%)' },
  { name: 'orange', color: 'hsl(24.6 95% 53.1%)' },
];

export function ThemeCustomizer() {
  const { theme, setTheme, hue, setHue } = useTheme();

  return (
    <div className="flex items-center space-x-2">
      <div className="grid grid-cols-6 gap-2">
        {THEMES.map((t) => (
          <Button
            key={t.name}
            variant="outline"
            size="sm"
            onClick={() => setTheme(t.name)}
            className={cn(
              'justify-start',
              theme === t.name && 'border-2 border-primary'
            )}
            style={{ backgroundColor: t.color, color: '#fff' }}
          >
            {theme === t.name && <Check className="mr-2 h-4 w-4" />}
            {t.name.charAt(0).toUpperCase() + t.name.slice(1)}
          </Button>
        ))}
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Paintbrush className="mr-2 h-4 w-4" />
            Custom
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Customize</h4>
              <p className="text-sm text-muted-foreground">
                Pick a custom hue for the primary color.
              </p>
            </div>
            <div className="grid gap-2">
              <Label>Primary Hue</Label>
              <Slider
                value={[hue]}
                onValueChange={(newVal) => setHue(newVal[0])}
                max={360}
                step={1}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
