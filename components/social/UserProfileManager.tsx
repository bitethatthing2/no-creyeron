'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ProfileImageUploader } from '@/components/shared/ImageHistoryViewer';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { 
  Camera, 
  Save, 
  User, 
  Heart, 
  Music, 
  Coffee, 
  Instagram, 
  Eye, 
  EyeOff,
  Sparkles,
  Settings,
  MapPin,
  Building,
  Briefcase,
  Globe,
  Calendar
} from 'lucide-react';

// Type definition based on actual Supabase schema
export interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  auth_id: string | null;
  display_name: string | null;
  bio: string | null;
  gender: string | null;
  pronouns: string | null;
  profile_image_url: string | null;
  avatar_url: string | null;
  username: string;
  is_verified: boolean | null;
  is_private: boolean | null;
  email_notifications: boolean | null;
  push_notifications: boolean | null;
  location: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  date_of_birth: string | null;
  occupation: string | null;
  company: string | null;
  website: string | null;
  phone: string | null;
  role: string | null;
  account_status: string | null;
  settings: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  last_seen_at: string | null;
  deleted_at: string | null;
}

// Form data interface
interface FormData {
  first_name: string;
  last_name: string;
  display_name: string;
  bio: string;
  gender: string;
  pronouns: string;
  is_private: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  profile_image_url: string;
  avatar_url: string;
  location: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  date_of_birth: string;
  occupation: string;
  company: string;
  website: string;
  phone: string;
  instagram_handle: string;
  favorite_drink: string;
  favorite_song: string;
}

const GENDER_OPTIONS = [
  "male",
  "female", 
  "other",
  "prefer_not_to_say"
];

const GENDER_DISPLAY_MAP: Record<string, string> = {
  "male": "Male",
  "female": "Female",
  "other": "Non-binary",
  "prefer_not_to_say": "Prefer not to say"
};

export function UserProfileManager() {
  const { currentUser, loading: userLoading } = useAuth();
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setSaving] = React.useState(false);
  
  // Form state with proper typing
  const [formData, setFormData] = React.useState<FormData>({
    first_name: '',
    last_name: '',
    display_name: '',
    bio: '',
    gender: '',
    pronouns: '',
    is_private: false,
    email_notifications: true,
    push_notifications: true,
    profile_image_url: '',
    avatar_url: '',
    location: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    date_of_birth: '',
    occupation: '',
    company: '',
    website: '',
    phone: '',
    // Custom fields stored in settings JSON
    instagram_handle: '',
    favorite_drink: '',
    favorite_song: ''
  });

  // Load existing profile - wrapped in useCallback to fix ESLint warning
  const loadProfile = React.useCallback(async () => {
    // Get the authenticated user
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!currentUser?.id && !authUser?.id) {
      setIsLoading(false);
      return;
    }

    try {
      let profileData = null;
      
      // Try to load profile using database user ID first
      if (currentUser?.id) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', currentUser.id)
          .single();
          
        if (!error && data) {
          profileData = data;
        }
      }
      
      // If no profile found and we have auth ID, try loading by auth_id
      if (!profileData && authUser?.id) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', authUser.id)
          .single();
          
        if (!error && data) {
          profileData = data;
        }
      }
      
      if (profileData) {
        setProfile(profileData as UserProfile);
        
        // Parse settings for custom fields
        const settings = profileData.settings || {};
        
        setFormData({
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
          display_name: profileData.display_name || '',
          bio: profileData.bio || '',
          gender: profileData.gender || '',
          pronouns: profileData.pronouns || '',
          is_private: profileData.is_private ?? false,
          email_notifications: profileData.email_notifications ?? true,
          push_notifications: profileData.push_notifications ?? true,
          profile_image_url: profileData.profile_image_url || '',
          avatar_url: profileData.avatar_url || '',
          location: profileData.location || '',
          city: profileData.city || '',
          state: profileData.state || '',
          country: profileData.country || '',
          postal_code: profileData.postal_code || '',
          date_of_birth: profileData.date_of_birth || '',
          occupation: profileData.occupation || '',
          company: profileData.company || '',
          website: profileData.website || '',
          phone: profileData.phone || '',
          // Custom fields from settings
          instagram_handle: (settings as Record<string, string>).instagram_handle || '',
          favorite_drink: (settings as Record<string, string>).favorite_drink || '',
          favorite_song: (settings as Record<string, string>).favorite_song || ''
        });
      } else if (authUser?.id) {
        // No profile exists, create one
        console.log('No profile found, creating new profile for auth user:', authUser.id);
        
        // Generate username from email
        const defaultUsername = authUser.email ? authUser.email.split('@')[0] : `user_${Date.now()}`;
        const defaultDisplayName = authUser.email ? authUser.email.split('@')[0] : 'New User';
        
        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert({
            auth_id: authUser.id,
            email: authUser.email!,
            username: defaultUsername,
            display_name: defaultDisplayName,
            is_private: false,
            email_notifications: true,
            push_notifications: true,
            account_status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (createError) {
          console.error('Error creating profile:', createError);
          toast.error('Failed to create profile');
        } else if (newProfile) {
          setProfile(newProfile as UserProfile);
          setFormData(prev => ({
            ...prev,
            display_name: newProfile.display_name || defaultDisplayName
          }));
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id, supabase]);

  React.useEffect(() => {
    // Load profile when user is loaded OR when we're not loading
    if (!userLoading) {
      loadProfile();
    }
  }, [loadProfile, userLoading]);

  // Save profile with proper typing
  const saveProfile = async (data: FormData = formData, showToast = true) => {
    // Get the authenticated user
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!profile?.id && !authUser?.id) {
      console.error('Cannot save profile: No profile or auth user available');
      toast.error('Please log in to save your profile');
      return;
    }

    // Validate required fields
    if (!data.display_name?.trim()) {
      toast.error('Display name is required');
      return;
    }

    setSaving(true);

    try {
      // Prepare settings JSON for custom fields
      const settings = {
        ...(profile?.settings || {}),
        instagram_handle: data.instagram_handle || null,
        favorite_drink: data.favorite_drink || null,
        favorite_song: data.favorite_song || null
      };

      // Prepare update data
      const updateData: Partial<UserProfile> = {
        first_name: data.first_name || null,
        last_name: data.last_name || null,
        display_name: data.display_name,
        bio: data.bio || null,
        gender: data.gender || null,
        pronouns: data.pronouns || null,
        is_private: data.is_private,
        email_notifications: data.email_notifications,
        push_notifications: data.push_notifications,
        profile_image_url: data.profile_image_url || null,
        avatar_url: data.avatar_url || data.profile_image_url || null,
        location: data.location || null,
        city: data.city || null,
        state: data.state || null,
        country: data.country || null,
        postal_code: data.postal_code || null,
        date_of_birth: data.date_of_birth || null,
        occupation: data.occupation || null,
        company: data.company || null,
        website: data.website || null,
        phone: data.phone || null,
        settings: settings,
        updated_at: new Date().toISOString()
      };

      let updatedProfile;
      
      // Update using the profile ID if we have it
      if (profile?.id) {
        const { data: updated, error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', profile.id)
          .select()
          .single();
          
        if (error) throw error;
        updatedProfile = updated;
      } else if (authUser?.id) {
        // Update by auth_id if that's all we have
        const { data: updated, error } = await supabase
          .from('users')
          .update(updateData)
          .eq('auth_id', authUser.id)
          .select()
          .single();
          
        if (error) throw error;
        updatedProfile = updated;
      } else {
        throw new Error('Unable to identify user for profile update');
      }
      
      setProfile(updatedProfile as UserProfile);
      
      if (showToast) {
        toast.success('Profile saved successfully!');
      }
      
      // Reload the profile to ensure everything is in sync
      await loadProfile();
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save profile';
      console.error('Error saving profile:', error);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle avatar upload success
  const handleAvatarUploadSuccess = async (newImageUrl: string) => {
    // Update form data
    const updatedData = {
      ...formData,
      profile_image_url: newImageUrl,
      avatar_url: newImageUrl
    };
    setFormData(updatedData);
    
    // Save the profile with the new image
    await saveProfile(updatedData, false);
    
    // Reload profile to get latest data
    await loadProfile();
    
    toast.success('Profile image updated!');
  };

  if (userLoading || isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!currentUser && !profile) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Please log in to manage your profile</p>
        </CardContent>
      </Card>
    );
  }

  const avatarUrl = formData.avatar_url || formData.profile_image_url;
  const profileUserId = profile?.id || currentUser?.id;

  return (
    <div className="space-y-6 bottom-nav-safe">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4">
              {profileUserId ? (
                <ProfileImageUploader
                  userId={profileUserId}
                  currentImageUrl={avatarUrl}
                  displayName={formData.display_name}
                  emoji="👤"
                  onSuccess={handleAvatarUploadSuccess}
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center">
                  <Camera className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              
              <div className="text-center">
                <p className="font-medium">{formData.display_name || 'Your Name'}</p>
                <p className="text-sm text-muted-foreground">@{profile?.username || 'username'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={formData.is_private ? "secondary" : "default"}>
                    {formData.is_private ? (
                      <><EyeOff className="h-3 w-3 mr-1" /> Private</>
                    ) : (
                      <><Eye className="h-3 w-3 mr-1" /> Public</>
                    )}
                  </Badge>
                  {profile?.is_verified && (
                    <Badge variant="default">Verified</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Info */}
            <div className="flex-1 space-y-4">
              {formData.bio && (
                <div>
                  <h3 className="font-semibold mb-2">Bio</h3>
                  <p className="text-muted-foreground">{formData.bio}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                {formData.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{formData.location}</span>
                  </div>
                )}
                {formData.occupation && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>{formData.occupation}</span>
                  </div>
                )}
                {formData.company && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>{formData.company}</span>
                  </div>
                )}
                {formData.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a href={formData.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      Website
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Forms */}
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Info
            </CardTitle>
            <CardDescription>
              Your basic profile information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                value={profile?.email || currentUser?.email || ''}
                disabled
                className="bg-muted text-muted-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">First Name</Label>
                <Input
                  id="first-name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  placeholder="First name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input
                  id="last-name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  placeholder="Last name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name *</Label>
              <Input
                id="display-name"
                value={formData.display_name}
                onChange={(e) => handleInputChange('display_name', e.target.value)}
                placeholder="How you want to be known"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell others about yourself..."
                maxLength={500}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {(formData.bio || '').length}/500 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+1 234 567 8900"
                type="tel"
              />
            </div>
          </CardContent>
        </Card>

        {/* Personal Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Personal Details
            </CardTitle>
            <CardDescription>
              Additional information about you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <select
                  id="gender"
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-full p-2 border border-input rounded-md bg-background"
                  title="Select your gender"
                  aria-label="Select your gender"
                >
                  <option value="">Select...</option>
                  {GENDER_OPTIONS.map(option => (
                    <option key={option} value={option}>
                      {GENDER_DISPLAY_MAP[option] || option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pronouns">Pronouns</Label>
                <Input
                  id="pronouns"
                  value={formData.pronouns}
                  onChange={(e) => handleInputChange('pronouns', e.target.value)}
                  placeholder="e.g., they/them"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dob" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date of Birth
              </Label>
              <Input
                id="dob"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="occupation">Occupation</Label>
              <Input
                id="occupation"
                value={formData.occupation}
                onChange={(e) => handleInputChange('occupation', e.target.value)}
                placeholder="Your job title or role"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="Where you work"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://yourwebsite.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location
            </CardTitle>
            <CardDescription>
              Where you&apos;re based
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location">General Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="e.g., San Francisco Bay Area"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="City"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="State"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  placeholder="Country"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postal">Postal Code</Label>
                <Input
                  id="postal"
                  value={formData.postal_code}
                  onChange={(e) => handleInputChange('postal_code', e.target.value)}
                  placeholder="12345"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social & Interests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Social & Interests
            </CardTitle>
            <CardDescription>
              Connect and share your interests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="instagram" className="flex items-center gap-2">
                <Instagram className="h-4 w-4" />
                Instagram Handle
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">@</span>
                <Input
                  id="instagram"
                  value={formData.instagram_handle}
                  onChange={(e) => handleInputChange('instagram_handle', e.target.value)}
                  placeholder="username"
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="favorite-drink" className="flex items-center gap-2">
                <Coffee className="h-4 w-4" />
                Favorite Drink
              </Label>
              <Input
                id="favorite-drink"
                value={formData.favorite_drink}
                onChange={(e) => handleInputChange('favorite_drink', e.target.value)}
                placeholder="Coffee, tea, or something stronger?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="favorite-song" className="flex items-center gap-2">
                <Music className="h-4 w-4" />
                Favorite Song/Artist
              </Label>
              <Input
                id="favorite-song"
                value={formData.favorite_song}
                onChange={(e) => handleInputChange('favorite_song', e.target.value)}
                placeholder="What&apos;s on your playlist?"
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Settings */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Privacy & Notifications
            </CardTitle>
            <CardDescription>
              Control your privacy and notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">Private Profile</p>
                    <p className="text-sm text-muted-foreground">
                      Only approved followers can see your content
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.is_private}
                    onChange={(e) => handleInputChange('is_private', e.target.checked)}
                    className="rounded"
                    aria-label="Toggle private profile"
                  />
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive updates via email
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.email_notifications}
                    onChange={(e) => handleInputChange('email_notifications', e.target.checked)}
                    className="rounded"
                    aria-label="Toggle email notifications"
                  />
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.push_notifications}
                    onChange={(e) => handleInputChange('push_notifications', e.target.checked)}
                    className="rounded"
                    aria-label="Toggle push notifications"
                  />
                </div>
              </div>
            </div>

            <div className="text-sm text-muted-foreground space-y-2 mt-4">
              <p><strong>Public:</strong> Anyone can see your profile and follow you</p>
              <p><strong>Private:</strong> People must request to follow you and you approve who can see your content</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save and Cancel Buttons */}
      <div className="flex justify-end gap-3">
        <Button 
          variant="outline"
          onClick={() => window.history.back()}
          size="lg"
          className="min-w-32"
        >
          Cancel
        </Button>
        <Button 
          onClick={() => saveProfile()}
          disabled={isSaving}
          size="lg"
          className="min-w-32"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Profile
            </>
          )}
        </Button>
      </div>
    </div>
  );
}