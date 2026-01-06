import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { format, addDays } from 'date-fns';
import { CalendarIcon, Leaf, Drumstick } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ClientInfoForm = ({ clientInfo, onChange }) => {
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
    <div className="space-y-5">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">
          Client Name
        </Label>
        <Input
          id="name"
          placeholder="Enter client name"
          value={clientInfo.name}
          onChange={(e) => onChange('name', e.target.value)}
          className="h-10"
        />
      </div>

      {/* Age */}
      <div className="space-y-2">
        <Label htmlFor="age" className="text-sm font-medium">
          Age
        </Label>
        <Input
          id="age"
          type="number"
          placeholder="Enter age"
          value={clientInfo.age}
          onChange={(e) => onChange('age', e.target.value)}
          className="h-10"
          min="1"
          max="120"
        />
      </div>

      {/* Health Issue */}
      <div className="space-y-2">
        <Label htmlFor="healthIssue" className="text-sm font-medium">
          Health Condition
        </Label>
        <Textarea
          id="healthIssue"
          placeholder="E.g., Diabetes, PCOS, Weight Management"
          value={clientInfo.healthIssue}
          onChange={(e) => onChange('healthIssue', e.target.value)}
          className="min-h-[80px] resize-none"
        />
      </div>

      {/* Allergies */}
      <div className="space-y-2">
        <Label htmlFor="allergies" className="text-sm font-medium">
          Allergic Items
        </Label>
        <Input
          id="allergies"
          placeholder="E.g., Nuts, Dairy, Gluten"
          value={clientInfo.allergicItems}
          onChange={(e) => onChange('allergicItems', e.target.value)}
          className="h-10"
        />
      </div>

      {/* Diet Type */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Diet Type</Label>
        <RadioGroup
          value={clientInfo.dietType}
          onValueChange={(value) => onChange('dietType', value)}
          className="flex gap-4"
        >
          <div className="flex-1">
            <RadioGroupItem
              value="veg"
              id="veg"
              className="peer sr-only"
            />
            <Label
              htmlFor="veg"
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all",
                "hover:border-veg/50 hover:bg-veg-light/50",
                clientInfo.dietType === 'veg'
                  ? "border-veg bg-veg-light text-veg"
                  : "border-border bg-card"
              )}
            >
              <Leaf className="w-4 h-4" />
              <span className="text-sm font-medium">Veg</span>
            </Label>
          </div>
          <div className="flex-1">
            <RadioGroupItem
              value="nonveg"
              id="nonveg"
              className="peer sr-only"
            />
            <Label
              htmlFor="nonveg"
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all",
                "hover:border-nonveg/50 hover:bg-nonveg-light/50",
                clientInfo.dietType === 'nonveg'
                  ? "border-nonveg bg-nonveg-light text-nonveg"
                  : "border-border bg-card"
              )}
            >
              <Drumstick className="w-4 h-4" />
              <span className="text-sm font-medium">Non-Veg</span>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Duration */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Diet Duration</Label>
        <Select
          value={String(clientInfo.duration)}
          onValueChange={handleDurationChange}
        >
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Select duration" />
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
      <div className="space-y-2">
        <Label className="text-sm font-medium">Start Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full h-10 justify-start text-left font-normal",
                !clientInfo.startDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {clientInfo.startDate ? (
                format(clientInfo.startDate, "PPP")
              ) : (
                <span>Pick start date</span>
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
        <div className="p-3 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">End Date</span>
            <span className="text-sm font-medium text-foreground">
              {format(clientInfo.endDate, "PPP")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
