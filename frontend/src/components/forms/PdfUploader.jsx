import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Upload, FileText, X, Sparkles, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parsePdfContent } from '@/lib/pdfParser';

export const PdfUploader = ({ onParsed, isProcessing, setIsProcessing, clientInfo }) => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // idle, uploading, parsing, complete

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    setUploadedFile(file);
    setStatus('uploading');
    setProgress(0);

    // Simulate upload progress
    const uploadInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 40) {
          clearInterval(uploadInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    setTimeout(async () => {
      clearInterval(uploadInterval);
      setProgress(40);
      setStatus('parsing');
      setIsProcessing(true);

      try {
        // Parse the PDF content
        const parsedData = await parsePdfContent(file, clientInfo.duration || 7, (p) => {
          setProgress(40 + (p * 0.5));
        });

        setProgress(100);
        setStatus('complete');
        setIsProcessing(false);
        
        // Pass parsed data to parent
        onParsed(parsedData);
      } catch (error) {
        console.error('Error parsing PDF:', error);
        toast.error('Failed to parse PDF. Using sample diet plan instead.');
        
        // Use sample data as fallback
        const sampleData = generateSampleDietData(clientInfo.duration || 7);
        setProgress(100);
        setStatus('complete');
        setIsProcessing(false);
        onParsed(sampleData);
      }
    }, 1000);
  }, [onParsed, setIsProcessing, clientInfo.duration]);

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

  const getStatusText = () => {
    switch (status) {
      case 'uploading': return 'Uploading file...';
      case 'parsing': return 'AI is parsing your diet plan...';
      case 'complete': return 'Processing complete!';
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
          status === 'complete' && "border-success bg-success/5"
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
                Switch to the "Edit Diet" tab to review and modify
              </p>
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
      {uploadedFile && status !== 'idle' && (
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
      {status === 'idle' && (
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-2">Don't have a PDF?</p>
          <Button
            variant="link"
            size="sm"
            onClick={() => {
              setStatus('parsing');
              setProgress(50);
              setIsProcessing(true);
              
              setTimeout(() => {
                const sampleData = generateSampleDietData(clientInfo.duration || 7);
                setProgress(100);
                setStatus('complete');
                setIsProcessing(false);
                onParsed(sampleData);
                toast.success('Sample diet plan loaded!');
              }, 1500);
            }}
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
    veg: {
      breakfast: [
        'Oatmeal with fruits, almonds & honey',
        'Whole wheat toast with avocado & poached eggs',
        'Greek yogurt parfait with granola & berries',
        'Vegetable poha with peanuts',
        'Multigrain pancakes with maple syrup',
        'Smoothie bowl with chia seeds',
        'Idli with sambar & coconut chutney'
      ],
      midMorning: [
        'Mixed nuts (30g) & green tea',
        'Apple slices with almond butter',
        'Coconut water & banana',
        'Carrot sticks with hummus',
        'Buttermilk with roasted cumin',
        'Fresh fruit salad',
        'Sprouted moong chaat'
      ],
      lunch: [
        'Brown rice, dal, mixed vegetables & salad',
        'Quinoa bowl with roasted vegetables',
        'Whole wheat roti, paneer curry & raita',
        'Vegetable biryani with cucumber raita',
        'Lentil soup with multigrain bread',
        'Buddha bowl with tahini dressing',
        'Rajma chawal with mint chutney'
      ],
      evening: [
        'Roasted makhana & herbal tea',
        'Vegetable cutlets with green chutney',
        'Sprouts salad with lemon dressing',
        'Trail mix & coconut water',
        'Dhokla with mint chutney',
        'Fresh vegetable juice',
        'Roasted chickpeas'
      ],
      dinner: [
        'Vegetable soup with whole wheat bread',
        'Grilled paneer with sautéed vegetables',
        'Mixed dal with steamed rice & salad',
        'Vegetable khichdi with curd',
        'Palak paneer with multigrain roti',
        'Stuffed bell peppers with quinoa',
        'Moong dal cheela with mint chutney'
      ]
    }
  };

  const days = [];
  for (let i = 0; i < duration; i++) {
    days.push({
      day: i + 1,
      breakfast: meals.veg.breakfast[i % 7],
      midMorning: meals.veg.midMorning[i % 7],
      lunch: meals.veg.lunch[i % 7],
      evening: meals.veg.evening[i % 7],
      dinner: meals.veg.dinner[i % 7]
    });
  }

  return { days };
}
