// app/components/ImageHistoryManager.tsx
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AvatarWithFallback } from './ImageWithFallback';
import { toast } from 'sonner';
import { useImageManagement } from '@/app/hooks/useImageManagement';
import { 
  History, 
  RotateCcw, 
  Eye, 
  Calendar,
  RefreshCw,
  X,
  Upload,
  Camera
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageHistoryItem {
  id: string;
  user_id: string;
  type: 'profile' | 'chat' | 'banner' | 'other';
  old_url: string;
  new_url: string;
  replaced_at: string;
  deletion_status: 'pending' | 'deleted' | 'failed' | 'kept';
  metadata?: {
    action?: string;
    [key: string]: unknown;
  };
}

interface ImageHistoryViewerProps {
  userId: string;
  imageType?: 'profile' | 'chat' | 'banner' | 'other';
  onClose?: () => void;
  onImageReverted?: (newImageUrl: string) => void;
  className?: string;
}

export function ImageHistoryViewer({ 
  userId, 
  imageType = 'profile', 
  onClose, 
  onImageReverted,
  className 
}: ImageHistoryViewerProps) {
  const [history, setHistory] = React.useState<ImageHistoryItem[]>([]);
  const [reverting, setReverting] = React.useState<string | null>(null);
  const { loading, getImageHistory, revertImage } = useImageManagement();

  // Load image history
  const loadHistory = React.useCallback(async () => {
    const items = await getImageHistory(userId, imageType);
    setHistory(items);
  }, [userId, imageType, getImageHistory]);

  React.useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Handle image revert
  const handleRevert = async (historyItem: ImageHistoryItem) => {
    setReverting(historyItem.id);
    
    const result = await revertImage(userId, historyItem);
    
    if (result.success) {
      toast.success('Image reverted successfully!');
      onImageReverted?.(historyItem.old_url);
      await loadHistory();
    } else {
      toast.error(result.error || 'Failed to revert image');
    }
    
    setReverting(null);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge variant
  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'deleted': return 'destructive';
      case 'failed': return 'outline';
      case 'kept': return 'default';
      default: return 'default';
    }
  };

  return (
    <Card className={cn("w-full max-w-2xl", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Image History
            </CardTitle>
            <CardDescription>
              View and revert to previous {imageType} images
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadHistory}
              disabled={loading}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              Refresh
            </Button>
            
            {onClose && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        <Badge variant="outline" className="w-fit">
          {history.length} {history.length === 1 ? 'item' : 'items'}
        </Badge>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No History Yet</p>
            <p className="text-sm">
              Your image replacement history will appear here
            </p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {history.map((item) => (
                <div 
                  key={item.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <AvatarWithFallback
                        src={item.old_url}
                        name="Previous"
                        size="md"
                        className="h-16 w-16"
                      />
                      <Badge 
                        variant={getStatusVariant(item.deletion_status)}
                        className="absolute -top-2 -right-2 text-xs px-1.5 py-0.5"
                      >
                        {item.deletion_status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">Previous Image</span>
                      <Badge variant="outline" className="text-xs">
                        {item.type}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                      <Calendar className="h-3 w-3" />
                      {formatDate(item.replaced_at)}
                    </div>
                    
                    {item.metadata?.action === 'reverted' && (
                      <Badge variant="secondary" className="text-xs">
                        Reverted
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(item.old_url, '_blank')}
                      className="h-8 px-2"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevert(item)}
                      disabled={reverting === item.id}
                      className="h-8 px-2"
                    >
                      {reverting === item.id ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
                      ) : (
                        <RotateCcw className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

// Enhanced Profile Image Uploader with History
interface ProfileImageUploaderProps {
  userId: string;
  currentImageUrl?: string;
  displayName?: string;
  emoji?: string;
  onSuccess?: (newImageUrl: string) => void;
  className?: string;
}

export function ProfileImageUploader({ 
  userId, 
  currentImageUrl, 
  displayName,
  emoji,
  onSuccess,
  className 
}: ProfileImageUploaderProps) {
  const [showHistory, setShowHistory] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { uploading, error, uploadImage, clearError } = useImageManagement();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    clearError();

    const result = await uploadImage(userId, file, 'profile', {
      deleteOld: true,
      keepHistory: 3
    });

    if (result.success && result.url) {
      onSuccess?.(result.url);
      toast.success('Profile image updated successfully!');
    } else {
      toast.error(result.error || 'Upload failed');
    }

    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageReverted = (newImageUrl: string) => {
    onSuccess?.(newImageUrl);
    setShowHistory(false);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative group">
        <AvatarWithFallback
          src={currentImageUrl}
          name={displayName || 'User'}
          emoji={emoji}
          size="xl"
          className="h-24 w-24"
        />
        
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <label className="cursor-pointer">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
            <div className="text-white text-sm font-medium px-3 py-1 bg-black/50 rounded flex items-center gap-1">
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Camera className="h-3 w-3" />
                  <span>Change Photo</span>
                </>
              )}
            </div>
          </label>
        </div>
      </div>

      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="text-xs"
        >
          <Upload className="h-3 w-3 mr-1" />
          Upload New
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowHistory(true)}
          className="text-xs"
        >
          <History className="h-3 w-3 mr-1" />
          View History
        </Button>
      </div>

      {error && (
        <div className="text-red-500 text-sm p-2 bg-red-50 rounded border border-red-200">
          {error}
        </div>
      )}

      {showHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <ImageHistoryViewer
            userId={userId}
            imageType="profile"
            onClose={() => setShowHistory(false)}
            onImageReverted={handleImageReverted}
          />
        </div>
      )}
    </div>
  );
}

// Export all components
const exportedComponents = {
  ImageHistoryViewer,
  ProfileImageUploader
};

export default exportedComponents;