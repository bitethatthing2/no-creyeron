'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, UserCheck, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface QuickWolfPackVerifyProps {
  onSuccess?: (memberNumber: number, userEmail: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function QuickWolfPackVerify({ 
  onSuccess, 
  onError,
  className = '' 
}: QuickWolfPackVerifyProps) {
  const [userEmail, setUserEmail] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [lastVerification, setLastVerification] = useState<{
    email: string;
    memberNumber: number;
    timestamp: Date;
  } | null>(null);

  const handleQuickVerify = async () => {
    if (!userEmail.trim()) {
      const error = "Please enter a user's email address to verify them.";
      onError?.(error);
      return;
    }

    setIsVerifying(true);
    
    try {
      const { data, error } = await supabase.rpc('quick_verify_at_bar' as any, {
        p_user_email: userEmail.trim()
      });

      if (error) {
        throw error;
      }

      const result = data as any;
      if (result.success) {
        const verification = {
          email: userEmail,
          memberNumber: result.member_number,
          timestamp: new Date()
        };
        
        setLastVerification(verification);
        setUserEmail('');
        onSuccess?.(result.member_number, userEmail);
      } else {
        onError?.(result.error || result.message);
      }
    } catch (error) {
      console.error('Verification error:', error);
      onError?.('Failed to verify user. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5 text-blue-600" />
          Quick Wolf Pack Verify
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Success Message */}
        {lastVerification && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-green-800">
              <UserCheck className="h-4 w-4" />
              <span className="text-sm font-medium">
                ✅ {lastVerification.email} verified as Member #{lastVerification.memberNumber}
              </span>
            </div>
            <div className="text-xs text-green-600 mt-1">
              {lastVerification.timestamp.toLocaleTimeString()}
            </div>
          </div>
        )}

        {/* Input and Button */}
        <div className="flex gap-2">
          <Input
            placeholder="customer@email.com"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuickVerify()}
            disabled={isVerifying}
            className="flex-1"
          />
          <Button 
            onClick={handleQuickVerify}
            disabled={isVerifying || !userEmail.trim()}
            size="sm"
          >
            {isVerifying ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Shield className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Help Text */}
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span>
            Once verified, customers become permanent Wolf Pack members with lifetime access to member benefits.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default QuickWolfPackVerify;