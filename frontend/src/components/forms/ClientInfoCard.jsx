import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addDays } from 'date-fns';
import { CalendarIcon, Leaf, Drumstick } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ClientInfoCard = ({ clientInfo, onChange }) => {
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
      <CardContent className="p-3 space-y-2">
        {/* Main Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-[minmax(140px,220px)_auto_auto_auto_auto_auto] gap-2 items-end">
            {/* Name */}
            <div className="col-span-2 sm:col-span-2 md:col-span-2 lg:col-span-1 space-y-1">
              <Label htmlFor="name" className="text-xs text-muted-foreground">Client Name</Label>
              <Input
                id="name"
                placeholder="Enter name"
                value={clientInfo.name}
                onChange={(e) => onChange('name', e.target.value)}
                className="h-8 text-sm"
              />
            </div>

            {/* Age */}
            <div className="space-y-1">
              <Label htmlFor="age" className="text-xs text-muted-foreground">Age</Label>
              <Input
                id="age"
                type="number"
                placeholder="Age"
                value={clientInfo.age}
                onChange={(e) => onChange('age', e.target.value)}
                className="h-8 text-sm w-16"
                min="1"
                max="120"
              />
            </div>

            {/* Diet Type */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Diet</Label>
              <div className="flex h-8 rounded-md border border-input overflow-hidden">
                <button
                  type="button"
                  onClick={() => onChange('dietType', 'veg')}
                  className={cn(
                    "flex items-center gap-1 px-2 text-xs font-medium transition-colors",
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
                    "flex items-center gap-1 px-2 text-xs font-medium transition-colors",
                    clientInfo.dietType === 'nonveg'
                      ? "bg-nonveg text-nonveg-foreground"
                      : "bg-card hover:bg-muted"
                  )}
                >
                  <Drumstick className="w-3 h-3" />
                  Non
                </button>
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Days</Label>
              <Select
                value={String(clientInfo.duration)}
                onValueChange={handleDurationChange}
              >
                <SelectTrigger className="h-8 w-20 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="14">14</SelectItem>
                  <SelectItem value="21">21</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="space-y-1 min-w-[150px]">
              <Label className="text-xs text-muted-foreground block">Start</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-8 w-[140px] justify-start text-left font-normal text-xs px-2",
                      !clientInfo.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {clientInfo.startDate ? (
                      format(clientInfo.startDate, "MMM d, yyyy")
                    ) : (
                      "Pick"
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

            {/* End Date */}
            {clientInfo.endDate && (
              <div className="space-y-1 min-w-[150px]">
                <Label className="text-xs text-muted-foreground block">End</Label>
                <div className="h-8 w-[140px] px-2 flex items-center text-xs bg-muted/50 rounded-lg border">
                  {format(clientInfo.endDate, "MMM d, yyyy")}
                </div>
              </div>
            )}
          </div>

        {/* Health & Allergies */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-border">
          <div className="space-y-1">
            <Label htmlFor="healthIssue" className="text-xs text-muted-foreground">Health Condition</Label>
            <Input
              id="healthIssue"
              placeholder="E.g., Diabetes, PCOS, Weight Management"
              value={clientInfo.healthIssue}
              onChange={(e) => onChange('healthIssue', e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="allergies" className="text-xs text-muted-foreground">Allergic Items</Label>
            <Input
              id="allergies"
              placeholder="E.g., Nuts, Dairy, Gluten"
              value={clientInfo.allergicItems}
              onChange={(e) => onChange('allergicItems', e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
