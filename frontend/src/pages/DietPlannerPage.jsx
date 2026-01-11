import { useState, useCallback, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { ClientInfoCard } from '@/components/forms/ClientInfoCard';
import { PdfUploader } from '@/components/forms/PdfUploader';
import { DietTable } from '@/components/diet/DietTable';
import { DrinksSection } from '@/components/diet/DrinksSection';
import { InstructionsSection } from '@/components/diet/InstructionsSection';
import { MealColumnsManager } from '@/components/diet/MealColumnsManager';
import { PdfExporter } from '@/components/export/PdfExporter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Upload, FileText, Download, Calendar, Utensils, Settings2 } from 'lucide-react';

// Default logo URL (local asset for CORS-safe usage)
const DEFAULT_LOGO = '/assets/Logo.png';

// Default meal columns
const DEFAULT_MEAL_COLUMNS = [
  { id: 'breakfast', label: 'Breakfast', icon: 'Coffee', enabled: true },
  { id: 'midMorning', label: 'Mid Morning', icon: 'Sun', enabled: true },
  { id: 'lunch', label: 'Lunch', icon: 'Utensils', enabled: true },
  { id: 'evening', label: 'Evening Snack', icon: 'Cookie', enabled: true },
  { id: 'dinner', label: 'Dinner', icon: 'Moon', enabled: true }
];

const DietPlannerPage = () => {
  // Load saved settings from localStorage
  const [brandName, setBrandName] = useState(() => {
    return localStorage.getItem('brandName') || 'The Balance Diet';
  });
  const [brandLogo, setBrandLogo] = useState(() => {
    const saved = localStorage.getItem('brandLogo');
    // If saved logo is remote (likely to hit CORS), reset to local asset
    if (saved && saved.startsWith('http')) {
      localStorage.removeItem('brandLogo');
      return DEFAULT_LOGO;
    }
    return saved || DEFAULT_LOGO;
  });
  const [mealColumns, setMealColumns] = useState(() => {
    const saved = localStorage.getItem('mealColumns');
    return saved ? JSON.parse(saved) : DEFAULT_MEAL_COLUMNS;
  });

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
  const [drinks, setDrinks] = useState({ morning: '', night: '' });
  const [instructions, setInstructions] = useState('');
  const [importantNote, setImportantNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const [showColumnManager, setShowColumnManager] = useState(false);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('brandName', brandName);
  }, [brandName]);

  useEffect(() => {
    localStorage.setItem('brandLogo', brandLogo);
  }, [brandLogo]);

  useEffect(() => {
    localStorage.setItem('mealColumns', JSON.stringify(mealColumns));
  }, [mealColumns]);

  const handleClientInfoChange = useCallback((field, value) => {
    setClientInfo(prev => ({ ...prev, [field]: value }));
  }, []);

  const handlePdfParsed = useCallback((parsedData) => {
    setDietData(parsedData);
    if (parsedData.drinks) {
      setDrinks(parsedData.drinks);
    }
    if (parsedData.instructions) {
      setInstructions(parsedData.instructions);
    }
    // Update duration based on parsed days
    if (parsedData.days && parsedData.days.length > 0) {
      setClientInfo(prev => ({ ...prev, duration: parsedData.days.length }));
    }
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

  const handleLogoUpload = useCallback((logoUrl) => {
    setBrandLogo(logoUrl);
    toast.success('Logo updated successfully!');
  }, []);

  const handleColumnToggle = useCallback((columnId) => {
    setMealColumns(prev => prev.map(col => 
      col.id === columnId ? { ...col, enabled: !col.enabled } : col
    ));
  }, []);

  const handleAddColumn = useCallback((newColumn) => {
    setMealColumns(prev => [...prev, { ...newColumn, enabled: true }]);
    toast.success(`Added "${newColumn.label}" column`);
  }, []);

  const handleRemoveColumn = useCallback((columnId) => {
    setMealColumns(prev => prev.filter(col => col.id !== columnId));
  }, []);

  const handleReorderColumns = useCallback((newOrder) => {
    setMealColumns(newOrder);
  }, []);

  const enabledColumns = mealColumns.filter(col => col.enabled);

  return (
    <div className="min-h-screen bg-background">
      <Header 
        brandName={brandName} 
        brandLogo={brandLogo}
        onBrandChange={setBrandName} 
        onLogoUpload={handleLogoUpload}
      />
      
      <main className="mx-auto w-full max-w-[1400px] px-4 py-6">
        {/* Hero Section - Compact */}
        <section className="mb-6 animate-fade-in">
          <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 via-accent/5 to-background p-6">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
                Diet Plan <span className="gradient-text">Generator</span>
              </h1>
              <p className="text-muted-foreground text-sm md:text-base max-w-2xl">
                Upload your diet PDF, let AI parse it, then export a professionally branded plan.
              </p>
            </div>
          </div>
        </section>

        {/* Main Content - Full Width Layout */}
        <div className="space-y-6">
          {/* Client Info - Compact Horizontal Card */}
          <ClientInfoCard 
            clientInfo={clientInfo} 
            onChange={handleClientInfoChange} 
          />

          {/* Tabs Section */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList className="grid w-auto grid-cols-3 h-10 p-1 bg-muted/50">
                <TabsTrigger 
                  value="upload" 
                  className="flex items-center gap-2 px-4 data-[state=active]:bg-card data-[state=active]:shadow-sm"
                >
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">Upload</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="edit" 
                  className="flex items-center gap-2 px-4 data-[state=active]:bg-card data-[state=active]:shadow-sm"
                  disabled={!dietData}
                >
                  <Utensils className="w-4 h-4" />
                  <span className="hidden sm:inline">Edit</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="export" 
                  className="flex items-center gap-2 px-4 data-[state=active]:bg-card data-[state=active]:shadow-sm"
                  disabled={!dietData}
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                </TabsTrigger>
              </TabsList>

              {activeTab === 'edit' && dietData && (
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowColumnManager(!showColumnManager)}
                  >
                    <Settings2 className="w-4 h-4 mr-2" />
                    Columns
                  </Button>
                  <Button 
                    variant="premium" 
                    size="sm"
                    onClick={handleExport}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              )}
            </div>

            <TabsContent value="upload" className="animate-fade-in">
              <Card className="shadow-card">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 font-display text-lg">
                    <FileText className="w-5 h-5 text-primary" />
                    Upload Diet PDF
                  </CardTitle>
                  <CardDescription>
                    Upload a PDF containing your diet plan. AI will analyze and extract the content.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PdfUploader 
                    onParsed={handlePdfParsed}
                    isProcessing={isProcessing}
                    setIsProcessing={setIsProcessing}
                    clientInfo={clientInfo}
                    mealColumns={enabledColumns}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="edit" className="animate-fade-in space-y-4">
              {/* Column Manager */}
              {showColumnManager && (
                <MealColumnsManager
                  columns={mealColumns}
                  onToggle={handleColumnToggle}
                  onAdd={handleAddColumn}
                  onRemove={handleRemoveColumn}
                  onReorder={handleReorderColumns}
                  onClose={() => setShowColumnManager(false)}
                />
              )}

              {/* Drinks Section */}
              <DrinksSection 
                drinks={drinks}
                onChange={setDrinks}
              />

              {/* Important Note */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">Important Note (optional)</CardTitle>
                  <CardDescription>Add any critical reminder to show ahead of instructions.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="E.g., Avoid caffeine after 5 PM. Take prescribed medication before breakfast."
                    value={importantNote}
                    onChange={(e) => setImportantNote(e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                </CardContent>
              </Card>

              {/* Diet Table */}
              <Card className="shadow-card">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 font-display text-lg">
                      <Calendar className="w-5 h-5 text-primary" />
                      Diet Plan
                    </CardTitle>
                    <CardDescription>
                      Click any cell to edit. {dietData?.days?.length || 0} days loaded.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  {dietData ? (
                    <DietTable 
                      dietData={dietData} 
                      onUpdate={handleDietUpdate}
                      clientInfo={clientInfo}
                      mealColumns={enabledColumns}
                    />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
                      <p>No diet data. Upload a PDF first.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Instructions Section */}
              <InstructionsSection
                instructions={instructions}
                onChange={setInstructions}
              />
            </TabsContent>

            <TabsContent value="export" className="animate-fade-in">
              <PdfExporter 
                dietData={dietData}
                clientInfo={clientInfo}
                brandName={brandName}
                brandLogo={brandLogo}
                drinks={drinks}
                instructions={instructions}
                mealColumns={enabledColumns}
                importantNote={importantNote}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-12">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {brandName}. Professional Diet Planning.
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
