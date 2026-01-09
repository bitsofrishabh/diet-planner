import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Upload, FileText, X, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parsePdfContent } from '@/lib/pdfParser';

export const PdfUploader = ({ onParsed, isProcessing, setIsProcessing, clientInfo, mealColumns }) => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle');

  const processFile = useCallback(async (file) => {
    setUploadedFile(file);
    setStatus('uploading');
    setProgress(0);

    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      currentProgress += 5;
      if (currentProgress <= 30) {
        setProgress(currentProgress);
      }
    }, 100);

    await new Promise(resolve => setTimeout(resolve, 600));
    clearInterval(progressInterval);
    setProgress(35);
    setStatus('parsing');
    setIsProcessing(true);

    try {
      const parsedData = await parsePdfContent(
        file, 
        clientInfo.duration || 7, 
        (p) => setProgress(35 + Math.round(p * 55)),
        mealColumns
      );

      setProgress(100);
      setStatus('complete');
      setIsProcessing(false);
      
      const message = parsedData.usedAI 
        ? `AI extracted ${parsedData.days.length} days from your PDF!`
        : parsedData.parsedFromPdf
          ? `Parsed ${parsedData.days.length} days from PDF`
          : 'Loaded sample diet plan';
      
      toast.success(message, {
        description: 'Review and edit the diet plan as needed.'
      });
      
      onParsed(parsedData);
    } catch (error) {
      console.error('Error parsing PDF:', error);
      setStatus('error');
      setIsProcessing(false);
      
      toast.error('Failed to parse PDF', {
        description: 'Click "Load Sample" to use sample data instead.'
      });
    }
  }, [onParsed, setIsProcessing, clientInfo.duration, mealColumns]);

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
    accept: { 'application/pdf': ['.pdf'] },
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
    
    setTimeout(async () => {
      try {
        const { parsePdfContent } = await import('@/lib/pdfParser');
        // Create a mock file to trigger sample data generation
        const mockFile = new File([''], 'sample.pdf', { type: 'application/pdf' });
        const sampleData = await parsePdfContent(
          mockFile, 
          clientInfo.duration || 7,
          () => {},
          mealColumns
        );
        
        setProgress(100);
        setStatus('complete');
        setIsProcessing(false);
        onParsed(sampleData);
        toast.success('Sample diet plan loaded!', {
          description: `${sampleData.days.length} days ready to edit.`
        });
      } catch (e) {
        setStatus('error');
        setIsProcessing(false);
        toast.error('Failed to load sample data');
      }
    }, 1000);
  }, [clientInfo.duration, onParsed, setIsProcessing, mealColumns]);

  const getStatusText = () => {
    switch (status) {
      case 'uploading': return 'Uploading file...';
      case 'parsing': return 'AI is analyzing your diet plan...';
      case 'complete': return 'Processing complete!';
      case 'error': return 'Processing failed';
      default: return '';
    }
  };

  return (
    <div className="space-y-4">
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
        
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center py-6">
          {status === 'complete' ? (
            <>
              <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mb-3">
                <CheckCircle className="w-7 h-7 text-success" />
              </div>
              <h3 className="text-base font-medium text-foreground mb-1">
                Diet Plan Loaded!
              </h3>
              <p className="text-sm text-muted-foreground">
                Switch to Edit tab to review and modify
              </p>
            </>
          ) : status === 'error' ? (
            <>
              <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
                <AlertCircle className="w-7 h-7 text-destructive" />
              </div>
              <h3 className="text-base font-medium text-foreground mb-1">
                Could not parse PDF
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Try a different file or use sample data
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
                "w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-colors",
                isDragActive ? "bg-primary/20" : "bg-muted"
              )}>
                <Upload className={cn(
                  "w-7 h-7 transition-colors",
                  isDragActive ? "text-primary" : "text-muted-foreground"
                )} />
              </div>
              
              <h3 className="text-base font-medium text-foreground mb-1">
                {isDragActive ? 'Drop your PDF here' : 'Upload Diet Plan PDF'}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                AI will extract and structure your diet plan automatically
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
        <div className="p-3 rounded-lg bg-card border border-border animate-scale-in">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground truncate max-w-[180px]">
                  {uploadedFile.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(uploadedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            {status === 'complete' && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearFile}>
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>

          <div className="space-y-1.5">
            <Progress value={progress} className="h-1.5" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
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
        <div className="text-center pt-2">
          <p className="text-xs text-muted-foreground mb-1.5">No PDF available?</p>
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
