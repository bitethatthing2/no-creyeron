'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  UtensilsCrossed, 
  Music, 
  Star, 
  MessageCircle, 
  Heart,
  Zap,
  Crown
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface SpecialRoleActionsProps {
  isOpen: boolean;
  onClose: () => void;
  memberData: {
    id: string;
    id: string;
    display_name: string;
    role: 'dj' | 'bartender';
    avatar_url?: string;
    status?: string;
  };
}

export function SpecialRoleActions({ isOpen, onClose, memberData }: SpecialRoleActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleQuickOrder = () => {
    setIsLoading(true);
    toast.success(`🍽️ Opening menu - ${memberData.display_name} will help you!`);
    router.push('/menu');
    setTimeout(() => {
      setIsLoading(false);
      onClose();
    }, 1000);
  };

  const handleDJRequest = () => {
    toast.success(`🎵 Song request sent to DJ ${memberData.display_name}!`);
    onClose();
  };

  const handlePrivateMessage = () => {
    toast.success(`💬 Starting private chat with ${memberData.display_name}!`);
    onClose();
  };

  const handleSendWink = () => {
    toast.success(`😉 Wink sent to ${memberData.display_name}!`);
    onClose();
  };

  if (memberData.role === 'bartender') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg">
                <UtensilsCrossed className="h-5 w-5 text-white" />
              </div>
              <div>
                <span>🐺 {memberData.display_name}</span>
                <Badge className="ml-2 bg-green-600 text-white">BARTENDER</Badge>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Bartender Profile */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
                  🐺
                </div>
                <div>
                  <h3 className="font-bold text-green-800">{memberData.display_name}</h3>
                  <p className="text-sm text-green-600">Your dedicated bartender</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Crown className="h-4 w-4" />
                <span>Exclusive wolf emoji • Direct menu access</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <Button
                onClick={handleQuickOrder}
                disabled={isLoading}
                className="w-full h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              >
                <div className="flex items-center gap-3">
                  <UtensilsCrossed className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-bold">Quick Order</div>
                    <div className="text-xs opacity-90">Direct to menu</div>
                  </div>
                </div>
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handlePrivateMessage}
                  className="h-12 border-green-200 hover:border-green-300 hover:bg-green-50"
                >
                  <div className="text-center">
                    <MessageCircle className="h-4 w-4 mx-auto mb-1" />
                    <div className="text-xs">Message</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSendWink}
                  className="h-12 border-green-200 hover:border-green-300 hover:bg-green-50"
                >
                  <div className="text-center">
                    <Heart className="h-4 w-4 mx-auto mb-1" />
                    <div className="text-xs">Wink</div>
                  </div>
                </Button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground text-center">
              💡 Bartenders have exclusive access to help with your orders
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (memberData.role === 'dj') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
                <Music className="h-5 w-5 text-white" />
              </div>
              <div>
                <span>⭐ {memberData.display_name}</span>
                <Badge className="ml-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white">DJ</Badge>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* DJ Profile */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
                  🎵
                </div>
                <div>
                  <h3 className="font-bold text-purple-800">{memberData.display_name}</h3>
                  <p className="text-sm text-purple-600">Tonight&#39;s DJ</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-purple-700">
                  <div className="flex items-center gap-1 mb-1">
                    <Star className="h-3 w-3" />
                    <span className="font-medium">Now Playing</span>
                  </div>
                  <div className="text-xs">Crowd Favorites</div>
                </div>
                <div className="text-purple-700">
                  <div className="flex items-center gap-1 mb-1">
                    <Zap className="h-3 w-3" />
                    <span className="font-medium">Energy</span>
                  </div>
                  <div className="text-xs">🔥 High Vibes</div>
                </div>
              </div>
            </div>

            {/* DJ Actions */}
            <div className="space-y-3">
              <Button
                onClick={handleDJRequest}
                className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                <div className="flex items-center gap-3">
                  <Music className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-bold">Song Request</div>
                    <div className="text-xs opacity-90">Ask for your favorite</div>
                  </div>
                </div>
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handlePrivateMessage}
                  className="h-12 border-purple-200 hover:border-purple-300 hover:bg-purple-50"
                >
                  <div className="text-center">
                    <MessageCircle className="h-4 w-4 mx-auto mb-1" />
                    <div className="text-xs">Message</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSendWink}
                  className="h-12 border-purple-200 hover:border-purple-300 hover:bg-purple-50"
                >
                  <div className="text-center">
                    <Heart className="h-4 w-4 mx-auto mb-1" />
                    <div className="text-xs">Like</div>
                  </div>
                </Button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground text-center">
              ⭐ DJs create events, polls, and control the vibe
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}