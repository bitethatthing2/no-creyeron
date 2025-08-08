'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Shield, UserCheck, Mail, MapPin, Clock, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface VerificationResult {
  success: boolean;
  message: string;
  member_number?: number;
  user_id?: string;
  error?: string;
}

interface VerificationHistory {
  id: string;
  user_email: string;
  verified_by_name: string;
  verification_method: string;
  verification_date: string;
  member_number: number;
  location_name?: string;
  notes?: string;
}

export function WolfPackVerificationPanel() {
  const [userEmail, setUserEmail] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [recentVerifications, setRecentVerifications] = useState<VerificationHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // Using sonner toast (imported above)

  // Quick verify a user at the bar
  const handleQuickVerify = async () => {
    if (!userEmail.trim()) {
      toast.error("Please enter a user's email address to verify them.");
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

      const result = data as VerificationResult;

      if (result.success) {
        toast.success(`${userEmail} is now a permanent Wolf Pack member #${result.member_number}`);
        setUserEmail('');
        loadRecentVerifications();
      } else {
        toast.error(result.error || result.message);
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error("Failed to verify user. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Load recent verification history
  const loadRecentVerifications = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await (supabase as any)
        .from('verification_history')
        .select(`
          id,
          verification_date,
          verification_method,
          notes,
          metadata,
          user:users!verification_history_user_id_fkey(email, member_number),
          verifier:users!verification_history_verified_by_fkey(first_name, last_name),
          location:locations(name)
        `)
        .order('verification_date', { ascending: false })
        .limit(10);

      if (error) {
        throw error;
      }

      const formattedData: VerificationHistory[] = data?.map((item: any) => ({
        id: item.id,
        user_email: item.user?.email || 'Unknown',
        verified_by_name: `${item.verifier?.first_name || ''} ${item.verifier?.last_name || ''}`.trim() || 'Unknown',
        verification_method: item.verification_method,
        verification_date: item.verification_date,
        member_number: item.user?.member_number || item.metadata?.member_number || 0,
        location_name: item.location?.name,
        notes: item.notes
      })) || [];

      setRecentVerifications(formattedData);
    } catch (error) {
      console.error('Error loading verification history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load verification history on component mount
  useEffect(() => {
    loadRecentVerifications();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getMethodBadgeColor = (method: string) => {
    switch (method) {
      case 'in_person':
        return 'bg-green-500';
      case 'email':
        return 'bg-blue-500';
      case 'manual':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold">Wolf Pack Verification</h1>
          <p className="text-muted-foreground">Verify customers as permanent Wolf Pack members</p>
        </div>
      </div>

      {/* Quick Verification Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Quick Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Enter customer's email address"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuickVerify()}
                disabled={isVerifying}
              />
            </div>
            <Button 
              onClick={handleQuickVerify}
              disabled={isVerifying || !userEmail.trim()}
              className="flex items-center gap-2"
            >
              {isVerifying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  Verify Member
                </>
              )}
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            💡 <strong>Tip:</strong> Once verified, they're a Wolf Pack member forever and get access to all member benefits.
          </div>
        </CardContent>
      </Card>

      {/* Recent Verifications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Verifications
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadRecentVerifications}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
        </CardHeader>
        <CardContent>
          {recentVerifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent verifications</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentVerifications.map((verification) => (
                <div 
                  key={verification.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{verification.user_email}</span>
                      <Badge variant="outline" className="text-xs">
                        Member #{verification.member_number}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Verified by {verification.verified_by_name}</span>
                      <Badge className={`text-xs ${getMethodBadgeColor(verification.verification_method)}`}>
                        {verification.verification_method.replace('_', ' ')}
                      </Badge>
                      {verification.location_name && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {verification.location_name}
                        </span>
                      )}
                    </div>
                    
                    {verification.notes && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Note: {verification.notes}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground text-right">
                    {formatDate(verification.verification_date)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <h3 className="font-medium text-blue-900 mb-2">Wolf Pack Verification Benefits</h3>
              <ul className="space-y-1 text-blue-700">
                <li>• <strong>Verify once, member forever</strong> - No need to re-verify</li>
                <li>• Priority seating and special event access</li>
                <li>• Member discounts and exclusive offers</li>
                <li>• Verified badge in the app</li>
                <li>• Access to Wolf Pack community features</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default WolfPackVerificationPanel;