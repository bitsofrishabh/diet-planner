import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Upload, FileText, X, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parsePdfContent } from '@/lib/pdfParser';

export const PdfUploader = ({ onParsed, isProcessing, setIsProcessing, clientInfo }) => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // idle, uploading, parsing, complete, error

  const processFile = useCallback(async (file) => {
    setUploadedFile(file);
    setStatus('uploading');
    setProgress(0);

    // Animate progress
    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      currentProgress += 5;
      if (currentProgress <= 30) {
        setProgress(currentProgress);
      }
    }, 100);

    // Short delay then start parsing
    await new Promise(resolve => setTimeout(resolve, 600));
    clearInterval(progressInterval);
    setProgress(35);
    setStatus('parsing');
    setIsProcessing(true);

    try {
      const parsedData = await parsePdfContent(file, clientInfo.duration || 7, (p) => {
        setProgress(35 + Math.round(p * 55));
      });

      setProgress(100);
      setStatus('complete');
      setIsProcessing(false);
      
      const message = parsedData.usedAI 
        ? 'Diet plan parsed with AI!' 
        : 'Diet plan loaded successfully!';
      
      toast.success(message, {
        description: `${parsedData.days.length} days of meals ready to edit.`
      });
      
      onParsed(parsedData);
    } catch (error) {
      console.error('Error parsing PDF:', error);
      setStatus('error');
      setIsProcessing(false);
      
      toast.error('Failed to parse PDF', {
        description: 'Click "Load Sample Diet Plan" to use sample data instead.'
      });
    }
  }, [onParsed, setIsProcessing, clientInfo.duration]);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    await processFile(file);
  }, [processFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    disabled: isProcessing
  });

  const clearFile = () => {
    setUploadedFile(null);
    setProgress(0);
    setStatus('idle');
  };

  const loadSampleData = useCallback(() => {
    setStatus('parsing');
    setProgress(50);
    setIsProcessing(true);
    
    setTimeout(() => {
      const sampleData = generateSampleDietData(clientInfo.duration || 7);
      setProgress(100);
      setStatus('complete');
      setIsProcessing(false);
      onParsed(sampleData);
      toast.success('Sample diet plan loaded!', {
        description: `${sampleData.days.length} days of meals ready to edit.`
      });
    }, 1200);
  }, [clientInfo.duration, onParsed, setIsProcessing]);

  const getStatusText = () => {
    switch (status) {
      case 'uploading': return 'Uploading file...';
      case 'parsing': return 'AI is parsing your diet plan...';
      case 'complete': return 'Processing complete!';
      case 'error': return 'Processing failed';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "upload-zone relative overflow-hidden",
          isDragActive && "active",
          isProcessing && "opacity-50 cursor-not-allowed",
          status === 'complete' && "border-success bg-success/5",
          status === 'error' && "border-destructive bg-destructive/5"
        )}
      >
        <input {...getInputProps()} />
        
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center">
          {status === 'complete' ? (
            <>
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Diet Plan Loaded!
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Switch to the Edit Diet tab to review and modify
              </p>
            </>
          ) : status === 'error' ? (
            <>
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Could not parse PDF
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Try uploading a different file or use sample data
              </p>
              <Button variant="outline" size="sm" onClick={(e) => {
                e.stopPropagation();
                clearFile();
              }}>
                Try Again
              </Button>
            </>
          ) : (
            <>
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors",
                isDragActive ? "bg-primary/20" : "bg-muted"
              )}>
                <Upload className={cn(
                  "w-8 h-8 transition-colors",
                  isDragActive ? "text-primary" : "text-muted-foreground"
                )} />
              </div>
              
              <h3 className="text-lg font-medium text-foreground mb-2">
                {isDragActive ? 'Drop your PDF here' : 'Upload Diet Plan PDF'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop or click to browse
              </p>
              <Button variant="outline" size="sm" disabled={isProcessing}>
                Choose File
              </Button>
            </>
          )}
        </div>
      </div>

      {/* File Info & Progress */}
      {uploadedFile && status !== 'idle' && status !== 'error' && (
        <div className="p-4 rounded-xl bg-card border border-border animate-scale-in">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                  {uploadedFile.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(uploadedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            {status === 'complete' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={clearFile}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {status === 'parsing' && (
                  <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                )}
                <span>{getStatusText()}</span>
              </div>
              <span className="text-xs font-medium text-foreground">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Sample Data Option */}
      {(status === 'idle' || status === 'error') && (
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-2">No PDF file available?</p>
          <Button
            variant="link"
            size="sm"
            onClick={loadSampleData}
            disabled={isProcessing}
          >
            Load Sample Diet Plan
          </Button>
        </div>
      )}
    </div>
  );
};

// Generate sample diet data
function generateSampleDietData(duration) {
  const meals = {
    breakfast: [
      'Oatmeal with fresh berries, almonds & honey',
      'Whole wheat toast with avocado, cherry tomatoes & scrambled eggs',
      'Greek yogurt parfait with granola, mixed nuts & seasonal fruits',
      'Vegetable poha with roasted peanuts & lemon',
      'Multigrain dosa with coconut chutney & sambar',
      'Smoothie bowl with banana, spinach, chia seeds & almond butter',
      'Idli (3 pcs) with sambar & coconut chutney'
    ],
    midMorning: [
      'Mixed nuts (30g) with green tea',
      'Apple slices with almond butter',
      'Fresh coconut water with a banana',
      'Carrot & cucumber sticks with hummus',
      'Buttermilk with roasted cumin',
      'Fresh fruit bowl (papaya, apple, pomegranate)',
      'Sprouted moong salad with lemon dressing'
    ],
    lunch: [
      'Brown rice, moong dal, mixed vegetable sabzi & fresh salad',
      'Quinoa pulao with raita & grilled paneer tikka',
      'Whole wheat roti (2), palak paneer, cucumber raita',
      'Vegetable biryani with boondi raita & green salad',
      'Multigrain roti, chole masala, onion salad',
      'Buddha bowl with chickpeas, roasted vegetables & tahini',
      'Rajma chawal with mint chutney & buttermilk'
    ],
    evening: [
      'Roasted makhana with herbal tea',
      'Vegetable cutlet (2) with green chutney',
      'Sprouts chaat with pomegranate & mint',
      'Trail mix (30g) with coconut water',
      'Steamed dhokla (4 pcs) with mint chutney',
      'Fresh vegetable juice (carrot, beetroot, apple)',
      'Roasted chickpeas with masala - 1/2 cup'
    ],
    dinner: [
      'Clear vegetable soup with whole wheat bread roll',
      'Grilled paneer with sautéed vegetables & mint dip',
      'Moong dal with steamed rice, bhindi sabzi & salad',
      'Vegetable khichdi with kadhi & papad',
      'Palak paneer with multigrain roti & cucumber salad',
      'Stuffed bell peppers with quinoa & cheese',
      'Moong dal cheela with mint chutney & curd'
    ]
  };

  const days = [];
  for (let i = 0; i < duration; i++) {
    days.push({
      day: i + 1,
      breakfast: meals.breakfast[i % 7],
      midMorning: meals.midMorning[i % 7],
      lunch: meals.lunch[i % 7],
      evening: meals.evening[i % 7],
      dinner: meals.dinner[i % 7]
    });
  }

  return { days };
}
