import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { format, addDays } from 'date-fns';
import { CalendarIcon, ChevronDown, User, Leaf, Drumstick } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ClientInfoCard = ({ clientInfo, onChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleStartDateChange = (date) => {
    onChange('startDate', date);
    if (date && clientInfo.duration) {
      onChange('endDate', addDays(date, clientInfo.duration - 1));
    }
  };

  const handleDurationChange = (duration) => {
    const durationNum = parseInt(duration);
    onChange('duration', durationNum);
    if (clientInfo.startDate) {
      onChange('endDate', addDays(clientInfo.startDate, durationNum - 1));
    }
  };

  return (
    <Card className="shadow-sm">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardContent className="p-4">
          {/* Main Row - Always Visible */}
          <div className="flex flex-wrap items-end gap-3">
            {/* Name */}
            <div className="flex-1 min-w-[150px] space-y-1">
              <Label htmlFor="name" className="text-xs text-muted-foreground">Client Name</Label>
              <Input
                id="name"
                placeholder="Enter name"
                value={clientInfo.name}
                onChange={(e) => onChange('name', e.target.value)}
                className="h-9"
              />
            </div>

            {/* Age */}
            <div className="w-20 space-y-1">
              <Label htmlFor="age" className="text-xs text-muted-foreground">Age</Label>
              <Input
                id="age"
                type="number"
                placeholder="Age"
                value={clientInfo.age}
                onChange={(e) => onChange('age', e.target.value)}
                className="h-9"
                min="1"
                max="120"
              />
            </div>

            {/* Diet Type */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Diet</Label>
              <div className="flex h-9 rounded-lg border border-input overflow-hidden">
                <button
                  type="button"
                  onClick={() => onChange('dietType', 'veg')}
                  className={cn(
                    "flex items-center gap-1.5 px-3 text-xs font-medium transition-colors",
                    clientInfo.dietType === 'veg'
                      ? "bg-veg text-veg-foreground"
                      : "bg-card hover:bg-muted"
                  )}
                >
                  <Leaf className="w-3 h-3" />
                  Veg
                </button>
                <button
                  type="button"
                  onClick={() => onChange('dietType', 'nonveg')}
                  className={cn(
                    "flex items-center gap-1.5 px-3 text-xs font-medium transition-colors",
                    clientInfo.dietType === 'nonveg'
                      ? "bg-nonveg text-nonveg-foreground"
                      : "bg-card hover:bg-muted"
                  )}
                >
                  <Drumstick className="w-3 h-3" />
                  Non-Veg
                </button>
              </div>
            </div>

            {/* Duration */}
            <div className="w-24 space-y-1">
              <Label className="text-xs text-muted-foreground">Days</Label>
              <Select
                value={String(clientInfo.duration)}
                onValueChange={handleDurationChange}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 Days</SelectItem>
                  <SelectItem value="10">10 Days</SelectItem>
                  <SelectItem value="14">14 Days</SelectItem>
                  <SelectItem value="21">21 Days</SelectItem>
                  <SelectItem value="30">30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Start</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-9 w-[130px] justify-start text-left font-normal",
                      !clientInfo.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {clientInfo.startDate ? (
                      format(clientInfo.startDate, "MMM d, yyyy")
                    ) : (
                      <span className="text-xs">Pick date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={clientInfo.startDate}
                    onSelect={handleStartDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date Display */}
            {clientInfo.endDate && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">End</Label>
                <div className="h-9 px-3 flex items-center text-sm bg-muted/50 rounded-lg border">
                  {format(clientInfo.endDate, "MMM d, yyyy")}
                </div>
              </div>
            )}

            {/* Expand Toggle */}
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9">
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform",
                  isExpanded && "rotate-180"
                )} />
                <span className="ml-1 text-xs">More</span>
              </Button>
            </CollapsibleTrigger>
          </div>

          {/* Expanded Section */}
          <CollapsibleContent className="pt-4">
            <div className="flex flex-wrap gap-3 pt-3 border-t border-border">
              {/* Health Issue */}
              <div className="flex-1 min-w-[200px] space-y-1">
                <Label htmlFor="healthIssue" className="text-xs text-muted-foreground">Health Condition</Label>
                <Input
                  id="healthIssue"
                  placeholder="E.g., Diabetes, PCOS, Weight Management"
                  value={clientInfo.healthIssue}
                  onChange={(e) => onChange('healthIssue', e.target.value)}
                  className="h-9"
                />
              </div>

              {/* Allergies */}
              <div className="flex-1 min-w-[200px] space-y-1">
                <Label htmlFor="allergies" className="text-xs text-muted-foreground">Allergic Items</Label>
                <Input
                  id="allergies"
                  placeholder="E.g., Nuts, Dairy, Gluten"
                  value={clientInfo.allergicItems}
                  onChange={(e) => onChange('allergicItems', e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
};
