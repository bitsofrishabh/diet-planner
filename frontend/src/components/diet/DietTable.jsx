import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Coffee, Sun, Utensils, Cookie, Moon, Dumbbell, Apple, Salad, Edit2 } from 'lucide-react';

const iconMap = {
  Coffee, Sun, Utensils, Cookie, Moon, Dumbbell, Apple, Salad
};

export const DietTable = ({ dietData, onUpdate, clientInfo, mealColumns }) => {
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');

  if (!dietData || !dietData.days) return null;

  const handleCellClick = (dayIndex, mealType, currentValue) => {
    setEditingCell({ dayIndex, mealType });
    setEditValue(currentValue || '');
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

  const getIcon = (iconName) => {
    return iconMap[iconName] || Utensils;
  };

  return (
    <div className="space-y-3">
      <ScrollArea className="w-full rounded-lg border border-border">
        <div className="min-w-[600px]">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[80px] font-semibold text-center">
                  Day
                </TableHead>
                {mealColumns.map((col) => {
                  const Icon = getIcon(col.icon);
                  return (
                    <TableHead key={col.id} className="min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                          <Icon className="w-3 h-3 text-primary" />
                        </div>
                        <span className="font-semibold text-foreground text-xs">
                          {col.label}
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
                  <TableCell className="font-medium text-center">
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
                  {mealColumns.map((col) => {
                    const isEditing = editingCell?.dayIndex === dayIndex && editingCell?.mealType === col.id;
                    const value = day[col.id] || '';

                    return (
                      <TableCell key={col.id} className="p-1.5">
                        {isEditing ? (
                          <Textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleCellBlur}
                            onKeyDown={handleKeyDown}
                            className="min-h-[60px] text-xs resize-none"
                            autoFocus
                          />
                        ) : (
                          <div
                            onClick={() => handleCellClick(dayIndex, col.id, value)}
                            className={cn(
                              "meal-cell min-h-[50px] p-2 cursor-pointer relative group/cell rounded-md",
                              "transition-all hover:shadow-sm text-xs"
                            )}
                          >
                            <p className="text-foreground leading-relaxed pr-5">
                              {value || <span className="text-muted-foreground italic">Click to add</span>}
                            </p>
                            <Edit2 className="absolute top-1.5 right-1.5 w-3 h-3 text-muted-foreground opacity-0 group-hover/cell:opacity-100 transition-opacity" />
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
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span>{dietData.days.length} Days</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-accent" />
          <span>{mealColumns.length} Meals/Day</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Edit2 className="w-3 h-3" />
          <span>Click any cell to edit</span>
        </div>
      </div>
    </div>
  );
};
