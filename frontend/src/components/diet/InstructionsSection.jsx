import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ClipboardList } from 'lucide-react';

export const InstructionsSection = ({ instructions, onChange }) => {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <ClipboardList className="w-4 h-4 text-primary" />
          Instructions & Notes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Add any special instructions, dietary guidelines, or notes for the client...\n\nE.g.:\n• Drink at least 8 glasses of water daily\n• Avoid eating after 8 PM\n• Take meals at regular intervals\n• Chew food properly before swallowing"
          value={instructions}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[120px] resize-none"
        />
        <p className="text-xs text-muted-foreground mt-2">
          These instructions will be included at the end of the exported PDF.
        </p>
      </CardContent>
    </Card>
  );
};
