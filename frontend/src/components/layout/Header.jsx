import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Settings, Upload, Image, Sparkles } from 'lucide-react';

export const Header = ({ brandName, brandLogo, onBrandChange, onLogoUpload }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempBrand, setTempBrand] = useState(brandName);
  const [tempLogo, setTempLogo] = useState(brandLogo);
  const fileInputRef = useRef(null);

  const handleSave = () => {
    onBrandChange(tempBrand);
    if (tempLogo !== brandLogo) {
      onLogoUpload(tempLogo);
    }
    setIsOpen(false);
    toast.success('Brand settings saved!');
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      setTempLogo(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border/50">
      <div className="mx-auto w-full max-w-[1400px] px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            {brandLogo ? (
              <img 
                src={brandLogo} 
                alt={brandName} 
                className="h-12 w-auto object-contain"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                <span className="text-primary-foreground font-bold text-base">
                  {brandName.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
              <Sparkles className="w-3 h-3" />
              AI Powered
            </div>
            
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full h-9 w-9">
                  <Settings className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-display">Brand Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-5 py-4">
                  {/* Logo Upload */}
                  <div className="space-y-3">
                    <Label>Brand Logo</Label>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-lg border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden">
                        {tempLogo ? (
                          <img src={tempLogo} alt="Logo" className="w-full h-full object-contain p-1" />
                        ) : (
                          <Image className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Logo
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG up to 2MB. Saved locally.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Brand Name */}
                  <div className="space-y-2">
                    <Label htmlFor="brandName">Brand Name</Label>
                    <Input
                      id="brandName"
                      value={tempBrand}
                      onChange={(e) => setTempBrand(e.target.value)}
                      placeholder="Enter your brand name"
                    />
                    <p className="text-xs text-muted-foreground">
                      Appears on exported PDF headers
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    Save Changes
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </header>
  );
};
