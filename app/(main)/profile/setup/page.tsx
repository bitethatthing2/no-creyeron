'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function ProfileSetupPage() {
  const router = useRouter();
  const { currentUser, updateProfile, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    display_name: '',
    username: '',
    bio: '',
  });

  // Redirect if not authenticated
  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  // If user already has a profile, redirect to feed
  if (currentUser?.displayName || currentUser?.username) {
    router.push('/wolfpack/feed');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        display_name: formData.display_name || `${formData.first_name} ${formData.last_name}`.trim(),
        username: formData.username,
        bio: formData.bio,
      });

      toast({
        title: 'Profile created!',
        description: 'Welcome to the Wolf Pack!',
      });

      router.push('/wolfpack/feed');
    } catch (error) {
      console.error('Profile setup error:', error);
      toast({
        title: 'Error',
        description: 'Failed to create profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
          <h1 className="text-2xl font-bold text-white mb-2">Complete Your Profile</h1>
          <p className="text-zinc-400 mb-6">Let's get you set up in the Wolf Pack</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name" className="text-zinc-300">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="last_name" className="text-zinc-300">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="display_name" className="text-zinc-300">Display Name</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="How you want to be known"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            <div>
              <Label htmlFor="username" className="text-zinc-300">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                placeholder="@username"
                className="bg-zinc-800 border-zinc-700 text-white"
                required
              />
            </div>

            <div>
              <Label htmlFor="bio" className="text-zinc-300">Bio (optional)</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                className="bg-zinc-800 border-zinc-700 text-white"
                rows={3}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Profile...
                </>
              ) : (
                'Complete Setup'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}