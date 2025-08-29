'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {} from '@/components/shared/ImageWithFallback';
import { ProfileImageUploader } from '@/components/shared/ImageHistoryViewer';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { createBrowserClient } from '@supabase/ssr';
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
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Type definitions based on your Supabase schema
export interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  auth_id: string | null;
  display_name: string | null;
  bio: string | null;
  favorite_drink: string | null;
  favorite_song: string | null;
  instagram_handle: string | null;
  vibe_status: string | null;
  wolf_emoji: string | null;
  looking_for: string | null;
  gender: string | null;
  pronouns: string | null;
  is_profile_visible: boolean;
  allow_messages: boolean;
  profile_image_url: string | null;
  profile_pic_url: string | null;
  avatar_url: string | null;
  wolfpack_status: string | null;
  wolfpack_tier: string | null;
  location_permissions_granted: boolean;
  favorite_bartender: string | null;
  created_at: string;
  updated_at: string;
}

// Form data interface
interface FormData {
  first_name: string;
  last_name: string;
  display_name: string;
  bio: string;
  favorite_drink: string;
  favorite_song: string;
  instagram_handle: string;
  vibe_status: string;
  wolf_emoji: string;
  looking_for: string;
  gender: string;
  pronouns: string;
  is_profile_visible: boolean;
  allow_messages: boolean;
  favorite_bartender: string;
  profile_image_url: string;
}

const WOLF_EMOJIS = [
  '🐺', '🌙', '⭐', '🔥', '💫', '🌟', '✨', '🎭', 
  '🎨', '🎵', '🎸', '🍺', '🍹', '🌮', '🌶️', '💃',
  '🕺', '🎯', '🎲', '🃏', '🎪', '🎬', '🎤', '🎊'
];

const VIBE_OPTIONS = [
  "Ready to party! 🎉",
  "Looking for good vibes ✨",
  "Here for the music 🎵",
  "Making new friends 👥",
  "Just chilling 😎",
  "Dancing all night 💃",
  "Bar hopping 🍻",
  "Celebrating 🥳",
  "First time here! 👋",
  "Regular wolf 🐺"
];

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

const LOOKING_FOR_OPTIONS = [
  "New friends",
  "Dance partners", 
  "Good conversation",
  "Gaming buddies",
  "Music lovers",
  "Just hanging out",
  "Adventure seekers",
  "Party crew"
];

export function UserProfileManager() {
  const { currentUser, loading: userLoading } = useAuth();
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setSaving] = React.useState(false);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  // Form state with proper typing
  const [formData, setFormData] = React.useState<FormData>({
    first_name: '',
    last_name: '',
    display_name: '',
    bio: '',
    favorite_drink: '',
    favorite_song: '',
    instagram_handle: '',
    vibe_status: '',
    wolf_emoji: '🐺',
    looking_for: '',
    gender: '',
    pronouns: '',
    is_profile_visible: true,
    allow_messages: true,
    favorite_bartender: '',
    profile_image_url: ''
  });

  // Load existing profile
  const loadProfile = async () => {
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
        setFormData({
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
          display_name: profileData.display_name || '',
          bio: profileData.bio || '',
          favorite_drink: profileData.favorite_drink || '',
          favorite_song: profileData.favorite_song || '',
          instagram_handle: profileData.instagram_handle || '',
          vibe_status: profileData.vibe_status || 'Ready to party! 🎉',
          wolf_emoji: profileData.wolf_emoji || '🐺',
          looking_for: profileData.looking_for || '',
          gender: profileData.gender || '',
          pronouns: profileData.pronouns || '',
          is_profile_visible: profileData.is_profile_visible ?? true,
          allow_messages: profileData.allow_messages ?? true,
          favorite_bartender: profileData.favorite_bartender || '',
          profile_image_url: profileData.profile_image_url || profileData.profile_pic_url || ''
        });
      } else if (authUser?.id) {
        // No profile exists, create one
        console.log('No profile found, creating new profile for auth user:', authUser.id);
        
        const defaultName = authUser.email ? authUser.email.split('@')[0] : 'Wolf';
        
        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert({
            auth_id: authUser.id,
            email: authUser.email!,
            display_name: defaultName,
            wolf_emoji: '🐺',
            vibe_status: 'Ready to party! 🎉',
            is_profile_visible: true,
            allow_messages: true,
            wolfpack_status: 'pending',
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
          setFormData({
            first_name: newProfile.first_name || '',
            last_name: newProfile.last_name || '',
            display_name: newProfile.display_name || defaultName,
            bio: '',
            favorite_drink: '',
            favorite_song: '',
            instagram_handle: '',
            vibe_status: newProfile.vibe_status || "Ready to party! 🎉",
            wolf_emoji: newProfile.wolf_emoji || '🐺',
            looking_for: '',
            gender: '',
            pronouns: '',
            is_profile_visible: true,
            allow_messages: true,
            favorite_bartender: '',
            profile_image_url: ''
          });
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

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
      // Prepare update data
      const updateData: any = {
        first_name: data.first_name || null,
        last_name: data.last_name || null,
        display_name: data.display_name,
        bio: data.bio || null,
        favorite_drink: data.favorite_drink || null,
        favorite_song: data.favorite_song || null,
        instagram_handle: data.instagram_handle || null,
        vibe_status: data.vibe_status || null,
        wolf_emoji: data.wolf_emoji,
        looking_for: data.looking_for || null,
        gender: data.gender || null,
        pronouns: data.pronouns || null,
        is_profile_visible: data.is_profile_visible,
        allow_messages: data.allow_messages,
        favorite_bartender: data.favorite_bartender || null,
        updated_at: new Date().toISOString()
      };

      // If data contains profile_image_url (from avatar upload), use it
      if (data.profile_image_url) {
        updateData.profile_image_url = data.profile_image_url;
        updateData.profile_pic_url = data.profile_image_url; // Keep both in sync
      }

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
      
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error(error.message || 'Failed to save profile');
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
      profile_image_url: newImageUrl
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

  const avatarUrl = formData.profile_image_url || profile?.profile_image_url || profile?.profile_pic_url;
  const profileUserId = profile?.id || currentUser?.id;

  return (
    <div className="space-y-6 bottom-nav-safe">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Avatar Section with History */}
            <div className="flex flex-col items-center space-y-4">
              {profileUserId ? (
                <ProfileImageUploader
                 conversationid={profileUserId}
                  currentImageUrl={avatarUrl}
                  displayName={formData.display_name}
                  emoji={formData.wolf_emoji}
                  onSuccess={handleAvatarUploadSuccess}
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center">
                  <Camera className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              
              <div className="text-center">
                <p className="font-medium">{formData.display_name || 'Your Name'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={formData.is_profile_visible ? "default" : "secondary"}>
                    {formData.is_profile_visible ? (
                      <><Eye className="h-3 w-3 mr-1" /> Visible</>
                    ) : (
                      <><EyeOff className="h-3 w-3 mr-1" /> Private</>
                    )}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Quick Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Current Vibe</h3>
                <p className="text-muted-foreground">
                  {formData.vibe_status || "Set your vibe status"}
                </p>
              </div>
              
              {formData.bio && (
                <div>
                  <h3 className="font-semibold mb-2">Bio</h3>
                  <p className="text-muted-foreground">{formData.bio}</p>
                </div>
              )}
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
              Your basic profile information and display preferences
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
                placeholder="Your email address"
              />
              <p className="text-xs text-muted-foreground">
                This is your account email and cannot be changed here
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">First Name</Label>
                <Input
                  id="first-name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  placeholder="Your first name"
                  maxLength={50}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input
                  id="last-name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  placeholder="Your last name"
                  maxLength={50}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                value={formData.display_name}
                onChange={(e) => handleInputChange('display_name', e.target.value)}
                placeholder="How you want to be known"
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell other wolves about yourself..."
                maxLength={250}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {(formData.bio || '').length}/250 characters
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <select
                  id="gender"
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-full p-2 border border-input rounded-md bg-background"
                  title="Select your gender"
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

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is-visible"
                checked={formData.is_profile_visible}
                onChange={(e) => handleInputChange('is_profile_visible', e.target.checked)}
                className="rounded"
                title="Make profile visible to other wolves"
              />
              <Label htmlFor="is-visible" className="flex items-center gap-2 cursor-pointer">
                <Eye className="h-4 w-4" />
                Make profile visible to other wolves
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Personality & Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Personality & Vibe
            </CardTitle>
            <CardDescription>
              Express your personality and what you&apos;re looking for
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Wolf Emoji</Label>
              <div className="grid grid-cols-8 gap-2">
                {WOLF_EMOJIS.map((emoji, index) => (
                  <button
                    key={`wolf-emoji-${index}-${emoji}`}
                    type="button"
                    onClick={() => handleInputChange('wolf_emoji', emoji)}
                    className={cn(
                      "p-2 text-xl rounded-md hover:bg-muted transition-colors",
                      formData.wolf_emoji === emoji && "bg-primary text-primary-foreground"
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vibe-status">Current Vibe</Label>
              <select
                id="vibe-status"
                value={formData.vibe_status}
                onChange={(e) => handleInputChange('vibe_status', e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background"
                title="Select your current vibe"
              >
                <option value="">Select your vibe...</option>
                {VIBE_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="looking-for">Looking For</Label>
              <select
                id="looking-for"
                value={formData.looking_for}
                onChange={(e) => handleInputChange('looking_for', e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background"
                title="What are you looking for"
              >
                <option value="">What are you looking for?</option>
                {LOOKING_FOR_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Interests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Interests
            </CardTitle>
            <CardDescription>
              Share your interests and favorites
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="favorite-drink" className="flex items-center gap-2">
                <Coffee className="h-4 w-4" />
                Favorite Drink
              </Label>
              <Input
                id="favorite-drink"
                value={formData.favorite_drink}
                onChange={(e) => handleInputChange('favorite_drink', e.target.value)}
                placeholder="e.g., Margarita, IPA, Whiskey Sour"
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
                placeholder="e.g., Bad Bunny, Taylor Swift, Classic Rock"
              />
            </div>

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
              <Label htmlFor="favorite-bartender">
                Favorite Bartender
              </Label>
              <Input
                id="favorite-bartender"
                value={formData.favorite_bartender}
                onChange={(e) => handleInputChange('favorite_bartender', e.target.value)}
                placeholder="Who makes the best drinks?"
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Privacy & Settings
            </CardTitle>
            <CardDescription>
              Control how others see and interact with you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">Profile Visibility</p>
                    <p className="text-sm text-muted-foreground">
                      Control who can see your profile in the wolfpack
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="visibility-toggle"
                      checked={formData.is_profile_visible}
                      onChange={(e) => handleInputChange('is_profile_visible', e.target.checked)}
                      className="rounded"
                      aria-label="Toggle profile visibility"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">Allow Messages</p>
                    <p className="text-sm text-muted-foreground">
                      Let other wolves send you private messages
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="messages-toggle"
                      checked={formData.allow_messages}
                      onChange={(e) => handleInputChange('allow_messages', e.target.checked)}
                      className="rounded"
                      aria-label="Toggle message permissions"
                    />
                  </div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>Visible:</strong> Other wolves can see your profile and send you winks</p>
                <p><strong>Private:</strong> You can still chat and order, but your profile is hidden</p>
              </div>
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