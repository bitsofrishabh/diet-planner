import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, GripVertical, Coffee, Sun, Utensils, Cookie, Moon, Dumbbell, Apple, Salad } from 'lucide-react';
import { cn } from '@/lib/utils';

const ICON_OPTIONS = [
  { value: 'Coffee', label: 'Coffee', icon: Coffee },
  { value: 'Sun', label: 'Sun', icon: Sun },
  { value: 'Utensils', label: 'Utensils', icon: Utensils },
  { value: 'Cookie', label: 'Cookie', icon: Cookie },
  { value: 'Moon', label: 'Moon', icon: Moon },
  { value: 'Dumbbell', label: 'Dumbbell', icon: Dumbbell },
  { value: 'Apple', label: 'Apple', icon: Apple },
  { value: 'Salad', label: 'Salad', icon: Salad },
];

const getIconComponent = (iconName) => {
  const iconOption = ICON_OPTIONS.find(opt => opt.value === iconName);
  return iconOption?.icon || Utensils;
};

export const MealColumnsManager = ({ columns, onToggle, onAdd, onRemove, onReorder, onClose }) => {
  const [newColumn, setNewColumn] = useState({ label: '', icon: 'Utensils' });
  const [isAdding, setIsAdding] = useState(false);

  const handleAddColumn = () => {
    if (!newColumn.label.trim()) return;
    
    const id = newColumn.label.toLowerCase().replace(/\s+/g, '');
    onAdd({
      id,
      label: newColumn.label.trim(),
      icon: newColumn.icon
    });
    setNewColumn({ label: '', icon: 'Utensils' });
    setIsAdding(false);
  };

  const defaultColumns = ['breakfast', 'midMorning', 'lunch', 'evening', 'dinner'];

  return (
    <Card className="shadow-card border-primary/20">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium">Manage Meal Columns</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Columns */}
        <div className="space-y-2">
          {columns.map((column, index) => {
            const IconComponent = getIconComponent(column.icon);
            const isDefault = defaultColumns.includes(column.id);
            
            return (
              <div 
                key={column.id}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg border bg-card",
                  !column.enabled && "opacity-50"
                )}
              >
                <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <IconComponent className="w-4 h-4 text-primary" />
                </div>
                <span className="flex-1 font-medium text-sm">{column.label}</span>
                <Switch
                  checked={column.enabled}
                  onCheckedChange={() => onToggle(column.id)}
                />
                {!isDefault && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => onRemove(column.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Add New Column */}
        {isAdding ? (
          <div className="p-3 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label className="text-xs">Column Name</Label>
                <Input
                  placeholder="E.g., Pre-Workout"
                  value={newColumn.label}
                  onChange={(e) => setNewColumn({ ...newColumn, label: e.target.value })}
                  className="h-9 mt-1"
                />
              </div>
              <div className="w-32">
                <Label className="text-xs">Icon</Label>
                <Select
                  value={newColumn.icon}
                  onValueChange={(value) => setNewColumn({ ...newColumn, icon: value })}
                >
                  <SelectTrigger className="h-9 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      return (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {opt.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddColumn} disabled={!newColumn.label.trim()}>
                Add Column
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button 
            variant="outline" 
            className="w-full border-dashed"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Custom Column
          </Button>
        )}

        {/* Quick Add Suggestions */}
        <div className="pt-2 border-t">
          <Label className="text-xs text-muted-foreground">Quick Add:</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {[
              { label: 'Pre-Workout', icon: 'Dumbbell' },
              { label: 'Post-Workout', icon: 'Dumbbell' },
              { label: 'Snack', icon: 'Apple' },
              { label: 'Brunch', icon: 'Salad' },
            ].map((suggestion) => {
              const exists = columns.some(c => c.label.toLowerCase() === suggestion.label.toLowerCase());
              if (exists) return null;
              return (
                <Badge 
                  key={suggestion.label}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10"
                  onClick={() => onAdd({ 
                    id: suggestion.label.toLowerCase().replace(/[^a-z]/g, ''), 
                    label: suggestion.label, 
                    icon: suggestion.icon 
                  })}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {suggestion.label}
                </Badge>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
