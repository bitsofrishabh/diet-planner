import { useState, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { ClientInfoForm } from '@/components/forms/ClientInfoForm';
import { PdfUploader } from '@/components/forms/PdfUploader';
import { DietTable } from '@/components/diet/DietTable';
import { PdfExporter } from '@/components/export/PdfExporter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Upload, FileText, Download, User, Calendar, Utensils } from 'lucide-react';

const DietPlannerPage = () => {
  const [clientInfo, setClientInfo] = useState({
    name: '',
    age: '',
    healthIssue: '',
    allergicItems: '',
    dietType: 'veg',
    startDate: null,
    endDate: null,
    duration: 7
  });
  
  const [dietData, setDietData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const [brandName, setBrandName] = useState('NutriCare');

  const handleClientInfoChange = useCallback((field, value) => {
    setClientInfo(prev => ({ ...prev, [field]: value }));
  }, []);

  const handlePdfParsed = useCallback((parsedData) => {
    setDietData(parsedData);
    setActiveTab('edit');
    toast.success('Diet plan parsed successfully!', {
      description: `${parsedData.days.length} days of diet plan loaded.`
    });
  }, []);

  const handleDietUpdate = useCallback((dayIndex, mealType, value) => {
    setDietData(prev => {
      if (!prev) return prev;
      const newDays = [...prev.days];
      newDays[dayIndex] = {
        ...newDays[dayIndex],
        [mealType]: value
      };
      return { ...prev, days: newDays };
    });
  }, []);

  const handleExport = useCallback(() => {
    if (!dietData) {
      toast.error('No diet data to export');
      return;
    }
    setActiveTab('export');
  }, [dietData]);

  return (
    <div className="min-h-screen bg-background">
      <Header brandName={brandName} onBrandChange={setBrandName} />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <section className="mb-10 animate-fade-in">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 via-accent/5 to-background p-8 md:p-12">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
                Diet Plan <span className="gradient-text">Generator</span>
              </h1>
              <p className="text-muted-foreground text-base md:text-lg max-w-2xl leading-relaxed">
                Upload your diet PDF, let AI parse and structure it beautifully, 
                then export a professionally branded diet plan for your clients.
              </p>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sidebar - Client Info */}
          <aside className="lg:col-span-1">
            <Card className="sticky top-24 shadow-card hover-lift">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-display">
                  <User className="w-5 h-5 text-primary" />
                  Client Information
                </CardTitle>
                <CardDescription>
                  Enter your client details for the diet plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ClientInfoForm 
                  clientInfo={clientInfo} 
                  onChange={handleClientInfoChange} 
                />
              </CardContent>
            </Card>
          </aside>

          {/* Main Area - Tabs */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6 h-12 p-1 bg-muted/50">
                <TabsTrigger 
                  value="upload" 
                  className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm"
                >
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">Upload PDF</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="edit" 
                  className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm"
                  disabled={!dietData}
                >
                  <Utensils className="w-4 h-4" />
                  <span className="hidden sm:inline">Edit Diet</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="export" 
                  className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm"
                  disabled={!dietData}
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="animate-fade-in">
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-display">
                      <FileText className="w-5 h-5 text-primary" />
                      Upload Diet PDF
                    </CardTitle>
                    <CardDescription>
                      Upload a PDF containing your diet plan. Our AI will parse and structure the content automatically.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PdfUploader 
                      onParsed={handlePdfParsed}
                      isProcessing={isProcessing}
                      setIsProcessing={setIsProcessing}
                      clientInfo={clientInfo}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="edit" className="animate-fade-in">
                <Card className="shadow-card">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 font-display">
                        <Calendar className="w-5 h-5 text-primary" />
                        Diet Plan Editor
                      </CardTitle>
                      <CardDescription>
                        Review and edit the parsed diet plan. Click on any cell to modify.
                      </CardDescription>
                    </div>
                    <Button 
                      variant="premium" 
                      onClick={handleExport}
                      className="hidden sm:flex"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export PDF
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {dietData ? (
                      <DietTable 
                        dietData={dietData} 
                        onUpdate={handleDietUpdate}
                        clientInfo={clientInfo}
                      />
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No diet data available. Please upload a PDF first.</p>
                      </div>
                    )}
                    <Button 
                      variant="premium" 
                      onClick={handleExport}
                      className="w-full mt-4 sm:hidden"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export PDF
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="export" className="animate-fade-in">
                <PdfExporter 
                  dietData={dietData}
                  clientInfo={clientInfo}
                  brandName={brandName}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {brandName}. Professional Diet Planning Solutions.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Powered by AI</span>
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DietPlannerPage;
