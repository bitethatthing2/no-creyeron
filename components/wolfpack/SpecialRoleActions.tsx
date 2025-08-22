'use client';

import * as React from 'react';
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
    display_name: string;
    role: 'admin' | 'user';
    avatar_url?: string;
    status?: string;
  };
}

export function SpecialRoleActions({ isOpen, onClose, memberData }: SpecialRoleActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleQuickOrder = () => {
    setIsLoading(true);
    toast.success(`🍽️ Opening menu - ${memberData.display_name} will help you!`);
    router.push('/menu');
    setTimeout(() => {
      setIsLoading(false);
      onClose();
    }, 1000);
  };

  const handleAdminRequest = () => {
    toast.success(`🛡️ Admin request sent to ${memberData.display_name}!`);
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

  // Admin member with special privileges
  if (memberData.role === 'admin') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
                <Crown className="h-5 w-5 text-white" />
              </div>
              <div>
                <span>🛡️ {memberData.display_name}</span>
                <Badge className="ml-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                  ADMIN
                </Badge>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Admin Profile */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
                  🛡️
                </div>
                <div>
                  <h3 className="font-bold text-blue-800">{memberData.display_name}</h3>
                  <p className="text-sm text-blue-600">Wolfpack Administrator</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-blue-700">
                  <div className="flex items-center gap-1 mb-1">
                    <Star className="h-3 w-3" />
                    <span className="font-medium">Access</span>
                  </div>
                  <div className="text-xs">Full Control</div>
                </div>
                <div className="text-blue-700">
                  <div className="flex items-center gap-1 mb-1">
                    <Zap className="h-3 w-3" />
                    <span className="font-medium">Powers</span>
                  </div>
                  <div className="text-xs">🔥 All Features</div>
                </div>
              </div>
            </div>

            {/* Admin Actions */}
            <div className="space-y-3">
              <Button
                onClick={handleAdminRequest}
                className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                <div className="flex items-center gap-3">
                  <Crown className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-bold">Admin Request</div>
                    <div className="text-xs opacity-90">Priority assistance</div>
                  </div>
                </div>
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handlePrivateMessage}
                  className="h-12 border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                >
                  <div className="text-center">
                    <MessageCircle className="h-4 w-4 mx-auto mb-1" />
                    <div className="text-xs">Message</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSendWink}
                  className="h-12 border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                >
                  <div className="text-center">
                    <Heart className="h-4 w-4 mx-auto mb-1" />
                    <div className="text-xs">Like</div>
                  </div>
                </Button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground text-center">
              🛡️ Admins have full access to all wolfpack features
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}