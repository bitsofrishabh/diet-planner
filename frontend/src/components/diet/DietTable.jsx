import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Coffee, Sun, Utensils, Cookie, Moon, Edit2 } from 'lucide-react';

const mealIcons = {
  breakfast: Coffee,
  midMorning: Sun,
  lunch: Utensils,
  evening: Cookie,
  dinner: Moon
};

const mealLabels = {
  breakfast: 'Breakfast',
  midMorning: 'Mid Morning',
  lunch: 'Lunch',
  evening: 'Evening Snack',
  dinner: 'Dinner'
};

export const DietTable = ({ dietData, onUpdate, clientInfo }) => {
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');

  if (!dietData || !dietData.days) return null;

  const mealTypes = ['breakfast', 'midMorning', 'lunch', 'evening', 'dinner'];

  const handleCellClick = (dayIndex, mealType, currentValue) => {
    setEditingCell({ dayIndex, mealType });
    setEditValue(currentValue);
  };

  const handleCellBlur = () => {
    if (editingCell) {
      onUpdate(editingCell.dayIndex, editingCell.mealType, editValue);
      setEditingCell(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCellBlur();
    }
    if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const getDayDate = (dayIndex) => {
    if (clientInfo.startDate) {
      return format(addDays(clientInfo.startDate, dayIndex), 'MMM d');
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-4">
        {mealTypes.map((type) => {
          const Icon = mealIcons[type];
          return (
            <Badge key={type} variant="outline" className="flex items-center gap-1.5 py-1">
              <Icon className="w-3 h-3" />
              {mealLabels[type]}
            </Badge>
          );
        })}
      </div>

      {/* Table */}
      <ScrollArea className="w-full rounded-xl border border-border">
        <div className="min-w-[800px]">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[100px] font-semibold">
                  Day
                </TableHead>
                {mealTypes.map((type) => {
                  const Icon = mealIcons[type];
                  return (
                    <TableHead key={type} className="min-w-[180px]">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <span className="font-semibold text-foreground">
                          {mealLabels[type]}
                        </span>
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {dietData.days.map((day, dayIndex) => (
                <TableRow 
                  key={dayIndex}
                  className={cn(
                    "group",
                    dayIndex % 2 === 0 ? "bg-card" : "bg-muted/20"
                  )}
                >
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">
                        Day {day.day}
                      </span>
                      {getDayDate(dayIndex) && (
                        <span className="text-xs text-muted-foreground">
                          {getDayDate(dayIndex)}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  {mealTypes.map((mealType) => {
                    const isEditing = editingCell?.dayIndex === dayIndex && editingCell?.mealType === mealType;
                    const value = day[mealType] || '';

                    return (
                      <TableCell key={mealType} className="p-2">
                        {isEditing ? (
                          <Textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleCellBlur}
                            onKeyDown={handleKeyDown}
                            className="min-h-[80px] text-sm resize-none"
                            autoFocus
                          />
                        ) : (
                          <div
                            onClick={() => handleCellClick(dayIndex, mealType, value)}
                            className={cn(
                              "meal-cell min-h-[70px] cursor-pointer relative group/cell",
                              "transition-all hover:shadow-sm"
                            )}
                          >
                            <p className="text-sm text-foreground leading-relaxed pr-6">
                              {value || <span className="text-muted-foreground italic">Click to add meal</span>}
                            </p>
                            <Edit2 className="absolute top-2 right-2 w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Stats */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span>{dietData.days.length} Days</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent" />
          <span>{dietData.days.length * 5} Meals</span>
        </div>
        <div className="flex items-center gap-2">
          <Edit2 className="w-3 h-3" />
          <span>Click any cell to edit</span>
        </div>
      </div>
    </div>
  );
};
