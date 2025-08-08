'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Shield, Mail, User, Phone } from 'lucide-react';

interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  agreedToTerms: boolean;
  marketingConsent: boolean;
}

export function WolfpackSignupForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<SignupFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    agreedToTerms: false,
    marketingConsent: false
  });  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.agreedToTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }

    setIsLoading(true);

    try {
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        toast.error('Please log in first to join the Wolfpack');
        router.push('/login');
        return;
      }

      // Update user profile with Wolfpack membership
      const { error: updateError } = await supabase
        .from('users')
        .update({
          wolfpack_status: 'active',
          wolfpack_joined_at: new Date().toISOString(),
          location_permissions_granted: true,
          // Update profile info if provided
          ...(formData.firstName && { first_name: formData.firstName }),
          ...(formData.lastName && { last_name: formData.lastName }),
          ...(formData.phone && { phone: formData.phone })
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Show success message
      toast.success('Welcome to the Wolfpack!', {
        description: 'Your membership is now active. Enjoy exclusive benefits!'
      });

      // Redirect to wolfpack main page
      router.push('/wolfpack');
    } catch (error) {
      console.error('Wolfpack signup error:', error);
      toast.error('Failed to join Wolfpack', {
        description: 'Please try again or contact support for assistance'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Join the Pack
        </CardTitle>
        <CardDescription>
          Fill out your information to become a Wolfpack member
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Personal Information
            </h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Enter your first name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your.email@example.com"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(555) 123-4567"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Membership Benefits */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Wolfpack Benefits
            </h3>
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="font-medium mb-2">As a Wolfpack member, you&apos;ll get:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Instant bar tab access</li>
                <li>• Location-based menu ordering</li>
                <li>• Exclusive Wolfpack chat</li>
                <li>• Member-only events and offers</li>
                <li>• Priority customer support</li>
              </ul>
            </div>
          </div>

          {/* Agreement Checkboxes */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={formData.agreedToTerms}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, agreedToTerms: !!checked }))}
              />
              <Label htmlFor="terms" className="text-sm cursor-pointer">
                I agree to the{' '}
                <span className="text-primary underline">Terms and Conditions</span> and{' '}
                <span className="text-primary underline">Privacy Policy</span>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="marketing"
                checked={formData.marketingConsent}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, marketingConsent: !!checked }))}
              />
              <Label htmlFor="marketing" className="text-sm cursor-pointer">
                I&apos;d like to receive marketing emails about exclusive offers and events
              </Label>
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !formData.agreedToTerms}
            size="lg"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Joining Wolfpack...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Join the Wolfpack
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            By joining, you&apos;ll get instant access to all Wolfpack benefits and become part of an exclusive community.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
