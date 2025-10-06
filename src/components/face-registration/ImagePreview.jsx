import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

const ImagePreview = ({ capturedImages, showPreview, setShowPreview }) => {
  if (capturedImages.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Captured Images</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </Button>
      </div>

      {showPreview && (
        <div className="grid grid-cols-5 gap-2">
          {capturedImages.map((img) => (
            <div key={img.id} className="relative">
              <img
                src={img.data}
                alt={`Face capture ${img.position}`}
                className="w-full h-12 object-cover rounded border"
              />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border border-background rounded-full" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImagePreview;
