import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Download, Eye, FileText, Leaf, Drumstick, Calendar, AlertCircle, Heart, Sunrise, Moon } from 'lucide-react';
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
      const margin = 12;
      const contentWidth = pageWidth - (margin * 2);
      let yPos = margin;

      // Colors
      const primaryColor = [34, 87, 60]; // Dark green
      const accentColor = [120, 180, 100]; // Light green
      const textColor = [40, 50, 45];
      const mutedColor = [100, 110, 105];
      const bgColor = [248, 252, 248];

      // Add header with logo
      const addHeader = async () => {
        // Header background
        pdf.setFillColor(...bgColor);
        pdf.rect(0, 0, pageWidth, 32, 'F');
        
        // Try to add logo
        let logoWidth = 0;
        if (brandLogo) {
          try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = brandLogo;
            });
            
            const logoHeight = 18;
            logoWidth = (img.width / img.height) * logoHeight;
            const maxLogoWidth = 60;
            if (logoWidth > maxLogoWidth) {
              logoWidth = maxLogoWidth;
            }
            
            pdf.addImage(img, 'PNG', margin, 7, logoWidth, logoHeight);
          } catch (e) {
            console.warn('Could not load logo:', e);
            // Fallback: text brand name
            pdf.setFontSize(16);
            pdf.setTextColor(...primaryColor);
            pdf.setFont('helvetica', 'bold');
            pdf.text(brandName, margin, 18);
            logoWidth = pdf.getTextWidth(brandName);
          }
        } else {
          pdf.setFontSize(16);
          pdf.setTextColor(...primaryColor);
          pdf.setFont('helvetica', 'bold');
          pdf.text(brandName, margin, 18);
        }
        
        // Decorative line
        pdf.setDrawColor(...primaryColor);
        pdf.setLineWidth(0.5);
        pdf.line(margin, 28, margin + 35, 28);
        
        yPos = 38;
      };

      // Add footer
      const addFooter = (pageNum, totalPages) => {
        pdf.setFontSize(7);
        pdf.setTextColor(...mutedColor);
        pdf.text(`© ${brandName} - Professional Diet Planning`, margin, pageHeight - 6);
        pdf.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin - 18, pageHeight - 6);
      };

      // === PAGE 1: Header & Client Info ===
      await addHeader();

      // Client Info Card
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(margin, yPos, contentWidth, 32, 2, 2, 'F');
      pdf.setDrawColor(220, 230, 225);
      pdf.roundedRect(margin, yPos, contentWidth, 32, 2, 2, 'S');

      // Client details - 2 rows
      const details = [
        { label: 'Client', value: clientInfo.name || 'Not specified' },
        { label: 'Age', value: clientInfo.age ? `${clientInfo.age} yrs` : '-' },
        { label: 'Diet', value: clientInfo.dietType === 'veg' ? 'Vegetarian' : 'Non-Veg' },
        { label: 'Duration', value: `${dietData.days.length} Days` }
      ];

      pdf.setFontSize(8);
      let dx = margin + 6;
      let dy = yPos + 10;
      
      details.forEach((detail, i) => {
        if (i === 2) {
          dx = margin + contentWidth / 2 + 6;
          dy = yPos + 10;
        }
        pdf.setTextColor(...mutedColor);
        pdf.setFont('helvetica', 'normal');
        pdf.text(detail.label + ':', dx, dy);
        pdf.setTextColor(...textColor);
        pdf.setFont('helvetica', 'bold');
        pdf.text(detail.value, dx + 22, dy);
        dy += 10;
      });

      yPos += 38;

      // Health & Allergies (if any)
      if (clientInfo.healthIssue || clientInfo.allergicItems) {
        pdf.setFillColor(255, 250, 245);
        pdf.roundedRect(margin, yPos, contentWidth, 16, 2, 2, 'F');
        
        pdf.setFontSize(7);
        let infoX = margin + 6;
        
        if (clientInfo.healthIssue) {
          pdf.setTextColor(...mutedColor);
          pdf.text('Health:', infoX, yPos + 7);
          pdf.setTextColor(...textColor);
          pdf.text(clientInfo.healthIssue, infoX + 15, yPos + 7);
          infoX = margin + contentWidth / 2;
        }
        
        if (clientInfo.allergicItems) {
          pdf.setTextColor(180, 70, 60);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Allergies:', infoX, yPos + 7);
          pdf.setFont('helvetica', 'normal');
          pdf.text(clientInfo.allergicItems, infoX + 20, yPos + 7);
        }
        
        yPos += 22;
      }

      // Date range
      if (clientInfo.startDate && clientInfo.endDate) {
        pdf.setFontSize(8);
        pdf.setTextColor(...primaryColor);
        pdf.setFont('helvetica', 'bold');
        const dateText = `${format(clientInfo.startDate, 'MMM d, yyyy')} — ${format(clientInfo.endDate, 'MMM d, yyyy')}`;
        const dateWidth = pdf.getTextWidth(dateText);
        pdf.text(dateText, (pageWidth - dateWidth) / 2, yPos + 4);
        yPos += 12;
      }

      // Drinks Section
      if (drinks && (drinks.morning || drinks.night)) {
        pdf.setFillColor(255, 252, 245);
        pdf.roundedRect(margin, yPos, contentWidth, 18, 2, 2, 'F');
        
        pdf.setFontSize(7);
        let drinkX = margin + 6;
        
        if (drinks.morning) {
          pdf.setTextColor(200, 140, 60);
          pdf.setFont('helvetica', 'bold');
          pdf.text('☀ Morning:', drinkX, yPos + 8);
          pdf.setTextColor(...textColor);
          pdf.setFont('helvetica', 'normal');
          pdf.text(drinks.morning, drinkX + 22, yPos + 8);
        }
        
        if (drinks.night) {
          drinkX = margin + contentWidth / 2;
          pdf.setTextColor(100, 100, 160);
          pdf.setFont('helvetica', 'bold');
          pdf.text('☾ Night:', drinkX, yPos + 8);
          pdf.setTextColor(...textColor);
          pdf.setFont('helvetica', 'normal');
          pdf.text(drinks.night, drinkX + 18, yPos + 8);
        }
        
        yPos += 24;
      }

      // Diet Table Title
      pdf.setFontSize(11);
      pdf.setTextColor(...textColor);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Daily Meal Plan', margin, yPos + 4);
      yPos += 10;

      // Prepare table data
      const columnLabels = mealColumns.map(c => c.label);
      const tableBody = dietData.days.map((day, idx) => {
        const dayLabel = clientInfo.startDate 
          ? `Day ${day.day}\n${format(new Date(clientInfo.startDate.getTime() + idx * 24 * 60 * 60 * 1000), 'MMM d')}`
          : `Day ${day.day}`;
        
        return [
          dayLabel,
          ...mealColumns.map(col => day[col.id] || '-')
        ];
      });

      // Calculate column widths based on number of columns
      const dayColWidth = 16;
      const mealColWidth = (contentWidth - dayColWidth) / mealColumns.length;

      // Generate table
      autoTable(pdf, {
        startY: yPos,
        head: [['Day', ...columnLabels]],
        body: tableBody,
        theme: 'grid',
        styles: {
          fontSize: 7,
          cellPadding: 2.5,
          lineColor: [220, 230, 225],
          lineWidth: 0.2,
          textColor: textColor,
          overflow: 'linebreak',
          cellWidth: 'wrap'
        },
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7,
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: dayColWidth, halign: 'center', fontStyle: 'bold' },
          ...Object.fromEntries(
            mealColumns.map((_, i) => [i + 1, { cellWidth: mealColWidth }])
          )
        },
        alternateRowStyles: {
          fillColor: [252, 255, 252]
        },
        margin: { left: margin, right: margin },
        didDrawPage: (data) => {
          if (data.pageNumber > 1) {
            // Add mini header on subsequent pages
            pdf.setFontSize(10);
            pdf.setTextColor(...primaryColor);
            pdf.setFont('helvetica', 'bold');
            pdf.text(brandName, margin, 10);
            pdf.setFontSize(7);
            pdf.setTextColor(...mutedColor);
            pdf.text(`Diet Plan - ${clientInfo.name || 'Client'}`, margin, 15);
          }
        }
      });

      // Get final Y position after table
      yPos = pdf.lastAutoTable.finalY + 8;

      // Instructions Section
      if (instructions && instructions.trim()) {
        // Check if we need a new page
        const instructionsHeight = 40;
        if (yPos + instructionsHeight > pageHeight - 20) {
          pdf.addPage();
          yPos = margin + 10;
          
          // Mini header
          pdf.setFontSize(10);
          pdf.setTextColor(...primaryColor);
          pdf.setFont('helvetica', 'bold');
          pdf.text(brandName, margin, 10);
        }

        pdf.setFillColor(248, 250, 252);
        pdf.roundedRect(margin, yPos, contentWidth, 5, 2, 2, 'F');
        
        pdf.setFontSize(9);
        pdf.setTextColor(...primaryColor);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Instructions & Guidelines', margin + 4, yPos + 3.5);
        
        yPos += 8;
        
        pdf.setFontSize(7);
        pdf.setTextColor(...textColor);
        pdf.setFont('helvetica', 'normal');
        
        const instructionLines = instructions.split('\n');
        instructionLines.forEach(line => {
          if (yPos > pageHeight - 15) {
            pdf.addPage();
            yPos = margin + 10;
          }
          
          const wrappedLines = pdf.splitTextToSize(line, contentWidth - 8);
          wrappedLines.forEach(wLine => {
            pdf.text(wLine, margin + 4, yPos);
            yPos += 4;
          });
        });
      }

      // Add footers to all pages
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        addFooter(i, totalPages);
      }

      // Save PDF
      const fileName = `${brandName.replace(/\\s+/g, '_')}_Diet_${clientInfo.name ? clientInfo.name.replace(/\\s+/g, '_') : 'Plan'}.pdf`;
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
        <CardContent className="py-10 text-center">
          <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No diet data available for export</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Export Button */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 font-display text-lg">
            <Download className="w-5 h-5 text-primary" />
            Export Diet Plan
          </CardTitle>
          <CardDescription>
            Download your branded diet plan as a professional PDF
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="premium"
            size="lg"
            onClick={generatePdf}
            disabled={isExporting}
            className="w-full sm:w-auto"
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
        <CardHeader className="pb-2 bg-muted/30">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Eye className="w-4 h-4 text-primary" />
            PDF Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[450px]">
            <div className="p-6 bg-card">
              {/* Preview Header */}
              <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  {brandLogo && (
                    <img src={brandLogo} alt={brandName} className="h-10 w-auto object-contain" />
                  )}
                  {!brandLogo && (
                    <h1 className="text-xl font-display font-bold text-foreground">{brandName}</h1>
                  )}
                </div>
                
                {/* Client Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
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
                      "text-xs",
                      clientInfo.dietType === 'veg' 
                        ? "bg-veg-light text-veg border-0" 
                        : "bg-nonveg-light text-nonveg border-0"
                    )}>
                      {clientInfo.dietType === 'veg' ? <Leaf className="w-3 h-3 mr-1" /> : <Drumstick className="w-3 h-3 mr-1" />}
                      {clientInfo.dietType === 'veg' ? 'Veg' : 'Non-Veg'}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Days:</span>
                    <span className="ml-1 font-medium">{dietData.days.length}</span>
                  </div>
                </div>

                {/* Drinks Preview */}
                {(drinks?.morning || drinks?.night) && (
                  <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap gap-4 text-xs">
                    {drinks.morning && (
                      <div className="flex items-center gap-1.5">
                        <Sunrise className="w-3 h-3 text-amber-500" />
                        <span className="text-muted-foreground">Morning:</span>
                        <span className="font-medium">{drinks.morning}</span>
                      </div>
                    )}
                    {drinks.night && (
                      <div className="flex items-center gap-1.5">
                        <Moon className="w-3 h-3 text-indigo-500" />
                        <span className="text-muted-foreground">Night:</span>
                        <span className="font-medium">{drinks.night}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Diet Table Preview */}
              <div className="rounded-lg border border-border overflow-hidden mb-4">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-primary text-primary-foreground">
                      <th className="px-2 py-1.5 text-left font-medium">Day</th>
                      {mealColumns.slice(0, 4).map(col => (
                        <th key={col.id} className="px-2 py-1.5 text-left font-medium">{col.label}</th>
                      ))}
                      {mealColumns.length > 4 && (
                        <th className="px-2 py-1.5 text-left font-medium">...</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {dietData.days.slice(0, 3).map((day, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-card' : 'bg-muted/30'}>
                        <td className="px-2 py-1.5 font-medium">Day {day.day}</td>
                        {mealColumns.slice(0, 4).map(col => (
                          <td key={col.id} className="px-2 py-1.5 text-foreground truncate max-w-[100px]">
                            {day[col.id] || '-'}
                          </td>
                        ))}
                        {mealColumns.length > 4 && <td className="px-2 py-1.5">...</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {dietData.days.length > 3 && (
                  <div className="px-2 py-1.5 text-center text-xs text-muted-foreground bg-muted/20 border-t">
                    + {dietData.days.length - 3} more days
                  </div>
                )}
              </div>

              {/* Instructions Preview */}
              {instructions && (
                <div className="rounded-lg bg-muted/30 p-3">
                  <h4 className="text-xs font-medium text-foreground mb-2">Instructions</h4>
                  <p className="text-xs text-muted-foreground whitespace-pre-line line-clamp-3">
                    {instructions}
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="mt-4 pt-3 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
                <span>© {brandName}</span>
                <span>Page 1</span>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
