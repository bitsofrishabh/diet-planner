import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sunrise, Moon } from 'lucide-react';

export const DrinksSection = ({ drinks, onChange }) => {
  return (
    <Card className="shadow-sm bg-gradient-to-r from-amber-50/50 to-indigo-50/50 dark:from-amber-950/20 dark:to-indigo-950/20">
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-4">
          {/* Morning Drink */}
          <div className="flex-1 min-w-[250px]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Sunrise className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <Label className="font-medium text-foreground">Morning Drink</Label>
            </div>
            <Input
              placeholder="E.g., Warm lemon water with honey, Green tea..."
              value={drinks.morning}
              onChange={(e) => onChange({ ...drinks, morning: e.target.value })}
              className="bg-card"
            />
          </div>

          {/* Night Drink */}
          <div className="flex-1 min-w-[250px]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <Label className="font-medium text-foreground">Night Drink</Label>
            </div>
            <Input
              placeholder="E.g., Warm turmeric milk, Chamomile tea..."
              value={drinks.night}
              onChange={(e) => onChange({ ...drinks, night: e.target.value })}
              className="bg-card"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
