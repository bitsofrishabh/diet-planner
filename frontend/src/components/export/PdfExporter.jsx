import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Download, Eye, FileText, Leaf, Drumstick, Sunrise, Moon, AlertTriangle, Heart, Calendar } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const PdfExporter = ({ dietData, clientInfo, brandName, brandLogo, drinks, instructions, mealColumns }) => {
  const [isExporting, setIsExporting] = useState(false);

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
      const margin = 10;
      const contentWidth = pageWidth - (margin * 2);
      let yPos = margin;

      // Colors
      const primaryColor = [34, 87, 60];
      const textColor = [40, 50, 45];
      const mutedColor = [100, 110, 105];
      const bgLight = [248, 252, 248];

      // Add header with logo
      const addHeader = async () => {
        pdf.setFillColor(...bgLight);
        pdf.rect(0, 0, pageWidth, 28, 'F');
        
        if (brandLogo) {
          try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = brandLogo;
            });
            
            const logoHeight = 16;
            let logoWidth = (img.width / img.height) * logoHeight;
            if (logoWidth > 50) logoWidth = 50;
            
            pdf.addImage(img, 'PNG', margin, 6, logoWidth, logoHeight);
          } catch (e) {
            pdf.setFontSize(14);
            pdf.setTextColor(...primaryColor);
            pdf.setFont('helvetica', 'bold');
            pdf.text(brandName, margin, 16);
          }
        } else {
          pdf.setFontSize(14);
          pdf.setTextColor(...primaryColor);
          pdf.setFont('helvetica', 'bold');
          pdf.text(brandName, margin, 16);
        }
        
        pdf.setDrawColor(...primaryColor);
        pdf.setLineWidth(0.4);
        pdf.line(margin, 25, margin + 30, 25);
        
        yPos = 32;
      };

      // Add footer
      const addFooter = (pageNum, totalPages) => {
        pdf.setFontSize(6);
        pdf.setTextColor(...mutedColor);
        pdf.text(`© ${brandName}`, margin, pageHeight - 5);
        pdf.text(`Page ${pageNum}/${totalPages}`, pageWidth - margin - 12, pageHeight - 5);
      };

      // === Build PDF ===
      await addHeader();

      // Consolidated Client Info Box - All details in one box
      const infoFontSize = 7;
      const lineHeight = 4;
      const padding = 4;
      const maxTextWidth = contentWidth - padding * 2;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(infoFontSize);

      const lines = [];
      const line1Parts = [
        `Client: ${clientInfo.name || '-'}`,
        `Age: ${clientInfo.age ? `${clientInfo.age} yrs` : '-'}`,
        `Diet: ${clientInfo.dietType === 'veg' ? 'Vegetarian' : 'Non-Veg'}`,
        `Days: ${dietData.days.length}`
      ];
      lines.push(...pdf.splitTextToSize(line1Parts.join(' | '), maxTextWidth));

      const line2Parts = [];
      if (clientInfo.startDate && clientInfo.endDate) {
        line2Parts.push(
          `Dates: ${format(clientInfo.startDate, 'MMM d, yyyy')} - ${format(clientInfo.endDate, 'MMM d, yyyy')}`
        );
      }
      if (clientInfo.healthIssue) {
        line2Parts.push(`Health: ${clientInfo.healthIssue}`);
      }
      if (clientInfo.allergicItems) {
        line2Parts.push(`Allergies: ${clientInfo.allergicItems}`);
      }
      if (line2Parts.length > 0) {
        lines.push(...pdf.splitTextToSize(line2Parts.join(' | '), maxTextWidth));
      }

      const line3Parts = [];
      if (drinks?.morning) {
        line3Parts.push(`AM: ${drinks.morning}`);
      }
      if (drinks?.night) {
        line3Parts.push(`PM: ${drinks.night}`);
      }
      if (line3Parts.length > 0) {
        lines.push(...pdf.splitTextToSize(line3Parts.join(' | '), maxTextWidth));
      }

      const boxHeight = lines.length * lineHeight + padding * 2;
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(margin, yPos, contentWidth, boxHeight, 2, 2, 'F');
      pdf.setDrawColor(220, 230, 225);
      pdf.roundedRect(margin, yPos, contentWidth, boxHeight, 2, 2, 'S');

      pdf.setTextColor(...textColor);
      let textY = yPos + padding + lineHeight - 1;
      lines.forEach(line => {
        pdf.text(line, margin + padding, textY);
        textY += lineHeight;
      });

      yPos += boxHeight + 5;

      // Diet Table Title
      pdf.setFontSize(10);
      pdf.setTextColor(...textColor);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Daily Meal Plan', margin, yPos);
      yPos += 5;

      // Table
      const columnLabels = mealColumns.map(c => c.label);
      const tableBody = dietData.days.map((day, idx) => {
        const dayLabel = clientInfo.startDate 
          ? `Day ${day.day}\n${format(new Date(clientInfo.startDate.getTime() + idx * 86400000), 'MMM d')}`
          : `Day ${day.day}`;
        return [dayLabel, ...mealColumns.map(col => day[col.id] || '-')];
      });

      const dayColWidth = 14;
      const mealColWidth = (contentWidth - dayColWidth) / mealColumns.length;

      autoTable(pdf, {
        startY: yPos,
        head: [['Day', ...columnLabels]],
        body: tableBody,
        theme: 'grid',
        styles: {
          fontSize: 6.5,
          cellPadding: 2,
          lineColor: [220, 230, 225],
          lineWidth: 0.15,
          textColor: textColor,
          overflow: 'linebreak'
        },
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 6.5,
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: dayColWidth, halign: 'center', fontStyle: 'bold' },
          ...Object.fromEntries(mealColumns.map((_, i) => [i + 1, { cellWidth: mealColWidth }]))
        },
        alternateRowStyles: { fillColor: [252, 255, 252] },
        margin: { left: margin, right: margin },
        didDrawPage: (data) => {
          if (data.pageNumber > 1) {
            pdf.setFontSize(8);
            pdf.setTextColor(...primaryColor);
            pdf.setFont('helvetica', 'bold');
            pdf.text(brandName, margin, 8);
            pdf.setFontSize(6);
            pdf.setTextColor(...mutedColor);
            pdf.text(`${clientInfo.name || 'Client'} - Diet Plan`, margin, 12);
          }
        }
      });

      yPos = pdf.lastAutoTable.finalY + 6;

      // Instructions
      if (instructions && instructions.trim()) {
        if (yPos + 25 > pageHeight - 15) {
          pdf.addPage();
          yPos = 15;
        }

        pdf.setFillColor(248, 250, 252);
        pdf.roundedRect(margin, yPos, contentWidth, 5, 1, 1, 'F');
        
        pdf.setFontSize(8);
        pdf.setTextColor(...primaryColor);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Instructions', margin + 3, yPos + 3.5);
        yPos += 7;
        
        pdf.setFontSize(6.5);
        pdf.setTextColor(...textColor);
        pdf.setFont('helvetica', 'normal');
        
        const lines = instructions.split('\n');
        lines.forEach(line => {
          if (yPos > pageHeight - 12) {
            pdf.addPage();
            yPos = 15;
          }
          const wrapped = pdf.splitTextToSize(line, contentWidth - 6);
          wrapped.forEach(wl => {
            pdf.text(wl, margin + 3, yPos);
            yPos += 3.5;
          });
        });
      }

      // Footers
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        addFooter(i, totalPages);
      }

      const fileName = `${brandName.replace(/\\s+/g, '_')}_${clientInfo.name ? clientInfo.name.replace(/\\s+/g, '_') : 'Diet'}.pdf`;
      pdf.save(fileName);
      
      toast.success('PDF exported successfully!', { description: fileName });
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
        <CardContent className="py-8 text-center">
          <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No diet data available for export</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 font-display text-lg">
            <Download className="w-5 h-5 text-primary" />
            Export Diet Plan
          </CardTitle>
          <CardDescription>
            Download branded PDF with all client information consolidated
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="premium"
            size="lg"
            onClick={generatePdf}
            disabled={isExporting}
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
        </CardContent>
      </Card>

      {/* Preview */}
      <Card className="shadow-card overflow-hidden">
        <CardHeader className="py-2 px-4 bg-muted/30">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Eye className="w-4 h-4 text-primary" />
            Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <div className="p-4 bg-card text-xs">
              {/* Header Preview */}
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-primary/20">
                {brandLogo && <img src={brandLogo} alt={brandName} className="h-8 w-auto" />}
                {!brandLogo && <span className="font-display font-bold text-primary">{brandName}</span>}
              </div>

              {/* Consolidated Client Info Preview */}
              <div className="p-3 rounded-lg border border-border bg-muted/20 mb-3">
                <div className="grid grid-cols-4 gap-2 mb-2">
                  <div>
                    <span className="text-muted-foreground">Client:</span>
                    <span className="ml-1 font-medium">{clientInfo.name || '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Age:</span>
                    <span className="ml-1 font-medium">{clientInfo.age || '-'}</span>
                  </div>
                  <div>
                    <Badge className={cn(
                      "text-xs h-5",
                      clientInfo.dietType === 'veg' 
                        ? "bg-veg-light text-veg" 
                        : "bg-nonveg-light text-nonveg"
                    )}>
                      {clientInfo.dietType === 'veg' ? <Leaf className="w-2.5 h-2.5 mr-0.5" /> : <Drumstick className="w-2.5 h-2.5 mr-0.5" />}
                      {clientInfo.dietType === 'veg' ? 'Veg' : 'Non-Veg'}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Days:</span>
                    <span className="ml-1 font-medium">{dietData.days.length}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {clientInfo.healthIssue && (
                    <div className="flex items-center gap-1">
                      <Heart className="w-3 h-3 text-primary" />
                      <span className="text-muted-foreground">Health:</span>
                      <span className="truncate">{clientInfo.healthIssue}</span>
                    </div>
                  )}
                  {clientInfo.allergicItems && (
                    <div className="flex items-center gap-1 text-destructive">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Allergies:</span>
                      <span className="truncate">{clientInfo.allergicItems}</span>
                    </div>
                  )}
                  {drinks?.morning && (
                    <div className="flex items-center gap-1">
                      <Sunrise className="w-3 h-3 text-amber-500" />
                      <span className="text-muted-foreground">AM:</span>
                      <span className="truncate">{drinks.morning}</span>
                    </div>
                  )}
                  {drinks?.night && (
                    <div className="flex items-center gap-1">
                      <Moon className="w-3 h-3 text-indigo-500" />
                      <span className="text-muted-foreground">PM:</span>
                      <span className="truncate">{drinks.night}</span>
                    </div>
                  )}
                  {clientInfo.startDate && (
                    <div className="flex items-center gap-1 col-span-2">
                      <Calendar className="w-3 h-3 text-primary" />
                      <span className="text-muted-foreground">Dates:</span>
                      <span>{format(clientInfo.startDate, 'MMM d')} - {clientInfo.endDate && format(clientInfo.endDate, 'MMM d, yyyy')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Table Preview */}
              <div className="rounded border border-border overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-primary text-primary-foreground text-[10px]">
                      <th className="px-1.5 py-1 text-left">Day</th>
                      {mealColumns.slice(0, 3).map(col => (
                        <th key={col.id} className="px-1.5 py-1 text-left">{col.label}</th>
                      ))}
                      {mealColumns.length > 3 && <th className="px-1.5 py-1">...</th>}
                    </tr>
                  </thead>
                  <tbody className="text-[10px]">
                    {dietData.days.slice(0, 3).map((day, idx) => (
                      <tr key={idx} className={idx % 2 ? 'bg-muted/30' : ''}>
                        <td className="px-1.5 py-1 font-medium">Day {day.day}</td>
                        {mealColumns.slice(0, 3).map(col => (
                          <td key={col.id} className="px-1.5 py-1 truncate max-w-[80px]">{day[col.id] || '-'}</td>
                        ))}
                        {mealColumns.length > 3 && <td className="px-1.5 py-1">...</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {dietData.days.length > 3 && (
                  <div className="px-2 py-1 text-center text-[10px] text-muted-foreground bg-muted/20 border-t">
                    + {dietData.days.length - 3} more days
                  </div>
                )}
              </div>

              {/* Instructions Preview */}
              {instructions && (
                <div className="mt-3 p-2 rounded bg-muted/30 text-[10px]">
                  <span className="font-medium">Instructions:</span>
                  <p className="text-muted-foreground mt-1 line-clamp-2">{instructions}</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
