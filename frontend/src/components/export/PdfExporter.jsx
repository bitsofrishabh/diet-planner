import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Download, Eye, FileText, Leaf, Drumstick, Calendar, AlertCircle, Heart } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const PdfExporter = ({ dietData, clientInfo, brandName }) => {
  const [isExporting, setIsExporting] = useState(false);
  const previewRef = useRef(null);

  const generatePdf = async () => {
    if (!dietData) {
      toast.error('No diet data to export');
      return;
    }

    setIsExporting(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);
      let yPos = margin;

      // Colors
      const primaryColor = [75, 135, 110]; // Sage green
      const accentColor = [55, 145, 135]; // Teal
      const textColor = [40, 50, 45];
      const mutedColor = [120, 130, 125];
      const bgColor = [248, 252, 250];

      // Helper to add new page if needed
      const checkPageBreak = (requiredHeight) => {
        if (yPos + requiredHeight > pageHeight - margin) {
          pdf.addPage();
          yPos = margin;
          addHeader();
          return true;
        }
        return false;
      };

      // Add header to each page
      const addHeader = () => {
        // Header background
        pdf.setFillColor(...bgColor);
        pdf.rect(0, 0, pageWidth, 35, 'F');
        
        // Brand name
        pdf.setFontSize(22);
        pdf.setTextColor(...primaryColor);
        pdf.setFont('helvetica', 'bold');
        pdf.text(brandName, margin, 18);
        
        // Tagline
        pdf.setFontSize(9);
        pdf.setTextColor(...mutedColor);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Personalized Nutrition Plan', margin, 26);

        // Decorative line
        pdf.setDrawColor(...primaryColor);
        pdf.setLineWidth(0.8);
        pdf.line(margin, 32, margin + 40, 32);
        
        yPos = 42;
      };

      // Add footer
      const addFooter = (pageNum, totalPages) => {
        pdf.setFontSize(8);
        pdf.setTextColor(...mutedColor);
        pdf.text(`© ${brandName} - Professional Diet Planning`, margin, pageHeight - 8);
        pdf.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin - 20, pageHeight - 8);
      };

      // === PAGE 1: Cover & Client Info ===
      addHeader();

      // Client Information Card
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(margin, yPos, contentWidth, 55, 3, 3, 'F');
      pdf.setDrawColor(230, 235, 232);
      pdf.roundedRect(margin, yPos, contentWidth, 55, 3, 3, 'S');

      // Client title
      pdf.setFontSize(12);
      pdf.setTextColor(...primaryColor);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Client Information', margin + 8, yPos + 12);

      // Client details grid
      const details = [
        ['Name', clientInfo.name || 'Not specified'],
        ['Age', clientInfo.age ? `${clientInfo.age} years` : 'Not specified'],
        ['Diet Type', clientInfo.dietType === 'veg' ? 'Vegetarian' : 'Non-Vegetarian'],
        ['Duration', `${clientInfo.duration || 7} Days`]
      ];

      pdf.setFontSize(9);
      let detailX = margin + 8;
      let detailY = yPos + 22;

      details.forEach((detail, i) => {
        if (i === 2) {
          detailX = margin + contentWidth / 2;
          detailY = yPos + 22;
        }
        pdf.setTextColor(...mutedColor);
        pdf.setFont('helvetica', 'normal');
        pdf.text(detail[0], detailX, detailY);
        pdf.setTextColor(...textColor);
        pdf.setFont('helvetica', 'bold');
        pdf.text(detail[1], detailX, detailY + 5);
        detailY += 15;
      });

      yPos += 62;

      // Health & Allergies section
      if (clientInfo.healthIssue || clientInfo.allergicItems) {
        pdf.setFillColor(255, 248, 245);
        pdf.roundedRect(margin, yPos, contentWidth, 28, 3, 3, 'F');

        pdf.setFontSize(9);
        let infoY = yPos + 10;

        if (clientInfo.healthIssue) {
          pdf.setTextColor(...mutedColor);
          pdf.setFont('helvetica', 'normal');
          pdf.text('Health Condition:', margin + 8, infoY);
          pdf.setTextColor(...textColor);
          pdf.text(clientInfo.healthIssue, margin + 40, infoY);
          infoY += 8;
        }

        if (clientInfo.allergicItems) {
          pdf.setTextColor(180, 80, 70);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Allergies:', margin + 8, infoY);
          pdf.setTextColor(180, 80, 70);
          pdf.setFont('helvetica', 'normal');
          pdf.text(clientInfo.allergicItems, margin + 30, infoY);
        }

        yPos += 35;
      }

      // Date range
      if (clientInfo.startDate && clientInfo.endDate) {
        pdf.setFillColor(...bgColor);
        pdf.roundedRect(margin, yPos, contentWidth, 18, 3, 3, 'F');
        
        pdf.setFontSize(10);
        pdf.setTextColor(...primaryColor);
        pdf.setFont('helvetica', 'bold');
        const dateText = `${format(clientInfo.startDate, 'MMMM d, yyyy')} — ${format(clientInfo.endDate, 'MMMM d, yyyy')}`;
        const dateWidth = pdf.getTextWidth(dateText);
        pdf.text(dateText, (pageWidth - dateWidth) / 2, yPos + 11);
        
        yPos += 25;
      }

      // === DIET TABLE ===
      yPos += 5;
      
      // Table header
      pdf.setFontSize(14);
      pdf.setTextColor(...textColor);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Daily Meal Plan', margin, yPos);
      yPos += 10;

      // Prepare table data
      const mealLabels = ['Breakfast', 'Mid Morning', 'Lunch', 'Evening', 'Dinner'];
      const tableBody = dietData.days.map((day, idx) => {
        const dayLabel = clientInfo.startDate 
          ? `Day ${day.day}\n${format(new Date(clientInfo.startDate.getTime() + idx * 24 * 60 * 60 * 1000), 'MMM d')}`
          : `Day ${day.day}`;
        
        return [
          dayLabel,
          day.breakfast || '-',
          day.midMorning || '-',
          day.lunch || '-',
          day.evening || '-',
          day.dinner || '-'
        ];
      });

      // Generate table with autoTable
      pdf.autoTable({
        startY: yPos,
        head: [['Day', ...mealLabels]],
        body: tableBody,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 4,
          lineColor: [230, 235, 232],
          lineWidth: 0.3,
          textColor: textColor,
          overflow: 'linebreak',
          cellWidth: 'wrap'
        },
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: 32 },
          2: { cellWidth: 32 },
          3: { cellWidth: 32 },
          4: { cellWidth: 32 },
          5: { cellWidth: 32 }
        },
        alternateRowStyles: {
          fillColor: [252, 254, 253]
        },
        margin: { left: margin, right: margin },
        didDrawPage: (data) => {
          // Add header on new pages
          if (data.pageNumber > 1) {
            yPos = margin;
            addHeader();
          }
        }
      });

      // Add footers to all pages
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        addFooter(i, totalPages);
      }

      // Save PDF
      const fileName = `${brandName.replace(/\s+/g, '_')}_Diet_Plan_${clientInfo.name ? clientInfo.name.replace(/\s+/g, '_') : 'Client'}.pdf`;
      pdf.save(fileName);
      
      toast.success('PDF exported successfully!', {
        description: fileName
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  if (!dietData) {
    return (
      <Card className="shadow-card">
        <CardContent className="py-12 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No diet data available for export</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Export Actions */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Download className="w-5 h-5 text-primary" />
            Export Diet Plan
          </CardTitle>
          <CardDescription>
            Review the preview below and export your branded diet plan as PDF
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="premium"
              size="lg"
              onClick={generatePdf}
              disabled={isExporting}
              className="flex-1 sm:flex-none"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card className="shadow-card overflow-hidden">
        <CardHeader className="bg-muted/30">
          <CardTitle className="flex items-center gap-2 text-base">
            <Eye className="w-4 h-4 text-primary" />
            PDF Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <div ref={previewRef} className="p-8 bg-card">
              {/* Preview Header */}
              <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl p-6 mb-6">
                <h1 className="text-2xl font-display font-bold text-foreground mb-1">
                  {brandName}
                </h1>
                <p className="text-sm text-muted-foreground">Personalized Nutrition Plan</p>
                <Separator className="my-4 bg-primary/20" />
                
                {/* Client Info Preview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Client Name</p>
                    <p className="text-sm font-medium text-foreground">
                      {clientInfo.name || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Age</p>
                    <p className="text-sm font-medium text-foreground">
                      {clientInfo.age ? `${clientInfo.age} years` : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Diet Type</p>
                    <Badge className={cn(
                      "mt-0.5",
                      clientInfo.dietType === 'veg' 
                        ? "bg-veg-light text-veg border-0" 
                        : "bg-nonveg-light text-nonveg border-0"
                    )}>
                      {clientInfo.dietType === 'veg' ? (
                        <><Leaf className="w-3 h-3 mr-1" /> Vegetarian</>
                      ) : (
                        <><Drumstick className="w-3 h-3 mr-1" /> Non-Veg</>
                      )}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Duration</p>
                    <p className="text-sm font-medium text-foreground">
                      {clientInfo.duration || 7} Days
                    </p>
                  </div>
                </div>

                {/* Health Info */}
                {(clientInfo.healthIssue || clientInfo.allergicItems) && (
                  <div className="mt-4 p-3 rounded-lg bg-card/80 space-y-2">
                    {clientInfo.healthIssue && (
                      <div className="flex items-start gap-2">
                        <Heart className="w-4 h-4 text-primary mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">Health Condition</p>
                          <p className="text-sm text-foreground">{clientInfo.healthIssue}</p>
                        </div>
                      </div>
                    )}
                    {clientInfo.allergicItems && (
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">Allergies</p>
                          <p className="text-sm text-destructive font-medium">{clientInfo.allergicItems}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Date Range */}
                {clientInfo.startDate && clientInfo.endDate && (
                  <div className="mt-4 flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-medium text-foreground">
                      {format(clientInfo.startDate, 'MMM d, yyyy')} — {format(clientInfo.endDate, 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
              </div>

              {/* Diet Table Preview */}
              <div className="space-y-4">
                <h3 className="font-display font-semibold text-lg text-foreground">
                  Daily Meal Plan
                </h3>
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-primary text-primary-foreground">
                        <th className="px-3 py-2 text-left font-medium">Day</th>
                        <th className="px-3 py-2 text-left font-medium">Breakfast</th>
                        <th className="px-3 py-2 text-left font-medium">Mid Morning</th>
                        <th className="px-3 py-2 text-left font-medium">Lunch</th>
                        <th className="px-3 py-2 text-left font-medium">Evening</th>
                        <th className="px-3 py-2 text-left font-medium">Dinner</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dietData.days.slice(0, 5).map((day, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-card' : 'bg-muted/30'}>
                          <td className="px-3 py-2 font-medium text-foreground">
                            Day {day.day}
                          </td>
                          <td className="px-3 py-2 text-foreground text-xs">{day.breakfast || '-'}</td>
                          <td className="px-3 py-2 text-foreground text-xs">{day.midMorning || '-'}</td>
                          <td className="px-3 py-2 text-foreground text-xs">{day.lunch || '-'}</td>
                          <td className="px-3 py-2 text-foreground text-xs">{day.evening || '-'}</td>
                          <td className="px-3 py-2 text-foreground text-xs">{day.dinner || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {dietData.days.length > 5 && (
                    <div className="px-3 py-2 text-center text-xs text-muted-foreground bg-muted/20 border-t border-border">
                      + {dietData.days.length - 5} more days in PDF export
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Preview */}
              <div className="mt-8 pt-4 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
                <span>© {brandName} - Professional Diet Planning</span>
                <span>Page 1 of 1</span>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
