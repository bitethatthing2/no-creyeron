'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { 
  ArrowLeft, 
  Search, 
  MessageCircle, 
  Users, 
  CheckCircle,
  Loader2,
  UserPlus,
  
  MoreVertical,
  Pin,
  Archive,
  Bell,
  BellOff,
  Trash2,
  User

} from 'lucide-react';
import { format, isToday, isYesterday, differenceInMinutes } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

// Database Types matching Supabase schema exactly
interface User {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  username: string;
  display_name?: string | null;
  avatar_url?: string | null;
  profile_image_url?: string | null;
  bio?: string | null;
  location?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  account_status?: string | null;
  is_verified?: boolean | null;
  is_private?: boolean | null;
  last_seen_at?: string | null;
  created_at: string;
  updated_at: string;
}

interface ChatConversation {
  id: string;
  conversation_type: 'direct' | 'group' | 'location' | 'broadcast';
  name?: string | null;
  description?: string | null;
  avatar_url?: string | null;
  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  last_message_at?: string | null;
  last_message_preview?: string | null;
  last_message_sender_id?: string | null;
  is_active?: boolean | null;
  metadata?: Record<string, unknown>;
  participant_count?: number | null;
  message_count?: number | null;
  is_archived?: boolean | null;
  is_pinned?: boolean | null;
  settings?: Record<string, unknown>;
  slug?: string | null;
  is_group?: boolean | null;
}

interface ChatParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  role?: 'admin' | 'moderator' | 'member' | null;
  joined_at?: string | null;
  left_at?: string | null;
  last_read_at?: string | null;
  is_active?: boolean | null;
  notification_settings?: { muted?: boolean } | null;
  updated_at?: string | null;
  user?: User;
}

interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type?: 'text' | 'image' | 'system' | 'deleted' | null;
  created_at?: string | null;
  edited_at?: string | null;
  deleted_at?: string | null;
  deleted_by?: string | null;
  metadata?: Record<string, unknown>;
  reply_count?: number | null;
  media_url?: string | null;
  media_type?: string | null;
  media_thumbnail_url?: string | null;
  attachments?: unknown;
  reply_to_id?: string | null;
  is_deleted?: boolean | null;
  is_edited?: boolean | null;
  sender?: User;
}

interface ConversationWithDetails extends ChatConversation {
  participants?: ChatParticipant[];
  unread_count?: number;
  last_message?: ChatMessage;
  other_user?: User; // For direct messages
}

export default function MessagesInboxPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const supabase = getSupabaseBrowserClient();

  // State management
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [searchUsers, setSearchUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'groups'>('all');
  const [showNewChatSheet, setShowNewChatSheet] = useState(false);
  // Removed unused selectedConversation state

  // Helper function to get display name
  const getDisplayName = (user: User | undefined | null): string => {
    if (!user) return 'Wolf Pack Member';
    
    // Try display_name first (most likely to be set by user)
    if (user.display_name && user.display_name.trim()) return user.display_name.trim();
    
    // Try full name
    const firstName = user.first_name?.trim() || '';
    const lastName = user.last_name?.trim() || '';
    const fullName = `${firstName} ${lastName}`.trim();
    if (fullName) return fullName;
    
    // Then username
    if (user.username && user.username.trim()) return user.username.trim();
    
    // Fallback
    return 'Wolf Pack Member';
  };

  // Helper function to get avatar URL
  const getAvatarUrl = (user: User | undefined | null): string => {
    if (!user) return 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/icons/wolf-512x512.png';
    return user.avatar_url || user.profile_image_url || 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/icons/wolf-512x512.png';
  };

  // Helper function to format time
  const formatMessageTime = (timestamp: string | null | undefined): string => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMin = differenceInMinutes(now, date);
    
    if (diffInMin < 1) return 'now';
    if (diffInMin < 60) return `${diffInMin}m`;
    if (diffInMin < 1440) return `${Math.floor(diffInMin / 60)}h`;
    
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return 'Yesterday';
    
    return format(date, 'MMM d');
  };

  // Check if user is online
  const isUserOnline = (lastSeenAt: string | null | undefined): boolean => {
    if (!lastSeenAt) return false;
    const lastSeen = new Date(lastSeenAt);
    const now = new Date();
    const diffInMin = differenceInMinutes(now, lastSeen);
    return diffInMin < 5; // Consider online if seen in last 5 minutes
  };

  // Load conversations from Supabase
  const loadConversations = useCallback(async () => {
    if (!currentUser) {
      console.log('❌ No current user, skipping conversation load');
      return;
    }

    try {
      console.log('🔄 Loading conversations for user:', currentUser.id);
      setLoading(true);
      setError(null);

      // Get conversations where user is a participant
      const { data: participantData, error: participantError } = await supabase
        .from('chat_participants')
        .select(`
          conversation_id,
          last_read_at,
          notification_settings,
          conversation:chat_conversations(*)
        `)
        .eq('user_id', currentUser.id)
        .eq('is_active', true);

      if (participantError) {
        console.error('❌ Error loading conversations:', participantError);
        toast.error('Failed to load conversations');
        return;
      }

      console.log('📊 Found participant records:', participantData?.length || 0);

      if (!participantData || participantData.length === 0) {
        console.log('📭 No conversations found');
        setConversations([]);
        return;
      }

      // Process conversations
      const conversationsWithDetails: ConversationWithDetails[] = [];
      
      for (const participantRecord of participantData) {
        let conversation = participantRecord.conversation as ChatConversation | ChatConversation[] | undefined;
        
        // Handle nested array structure
        if (Array.isArray(conversation)) {
          conversation = conversation[0];
        }
        
        if (!conversation || !conversation.is_active) {
          console.log('⚠️ Skipping inactive/missing conversation');
          continue;
        }

        console.log('🔍 Processing conversation:', conversation.id, conversation.conversation_type);

        // Get participants first
        const { data: allParticipants } = await supabase
          .from('chat_participants')
          .select('*')
          .eq('conversation_id', conversation.id)
          .eq('is_active', true);

        // For direct conversations, find the other user
        let otherUser: User | undefined;
        if (conversation.conversation_type === 'direct' && allParticipants) {
          console.log('📋 Participants in direct conversation:', allParticipants.map(p => ({ user_id: p.user_id, currentUser: currentUser.id })));
          const otherParticipant = allParticipants.find(p => p.user_id !== currentUser.id);
          if (otherParticipant) {
            console.log('👤 Found other participant:', otherParticipant.user_id);
            // Fetch the user data separately
            const { data: userData } = await supabase
              .from('users')
              .select(`
                id,
                email,
                first_name,
                last_name,
                display_name,
                username,
                avatar_url,
                profile_image_url,
                is_verified,
                bio,
                location,
                city,
                state,
                country,
                account_status,
                is_private,
                last_seen_at,
                created_at,
                updated_at
              `)
              .eq('id', otherParticipant.user_id)
              .single();
            
            if (userData) {
              otherUser = userData as User;
              console.log('✅ Found user data for participant:', userData.display_name || userData.username || userData.email);
              // Attach user data to participant for consistency
              otherParticipant.user = userData;
            } else {
              // Skip broken direct conversations that don't have the other participant
              console.log('⚠️ Skipping broken direct conversation - missing user data for participant:', otherParticipant.user_id);
              continue;
            }
          } else {
            console.log('⚠️ No other participant found in direct conversation:', conversation.id);
            continue;
          }
        }
        
        // Fetch user data for all participants to enrich the data
        if (allParticipants && allParticipants.length > 0) {
          const userIds = allParticipants.map(p => p.user_id);
          const { data: usersData } = await supabase
            .from('users')
            .select(`
              id,
              first_name,
              last_name,
              display_name,
              username,
              avatar_url,
              profile_image_url,
              is_verified
            `)
            .in('id', userIds);
          
          // Attach user data to participants
          if (usersData) {
            allParticipants.forEach(participant => {
              const userData = usersData.find(u => u.id === participant.user_id);
              if (userData) {
                participant.user = userData;
              }
            });
          }
        }

        // Get the last message
        const { data: lastMessageData } = await supabase
          .from('chat_messages')
          .select(`
            id,
            content,
            created_at,
            sender_id,
            message_type,
            sender:users(
              id,
              display_name,
              username,
              first_name,
              last_name,
              avatar_url,
              profile_image_url
            )
          `)
          .eq('conversation_id', conversation.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Calculate unread count
        const { count: unreadCount } = await supabase
          .from('chat_messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conversation.id)
          .neq('sender_id', currentUser.id)
          .eq('is_deleted', false)
          .gt('created_at', participantRecord.last_read_at || '1970-01-01');

        const conversationWithDetails: ConversationWithDetails = {
          ...conversation,
          participants: allParticipants as ChatParticipant[],
          unread_count: unreadCount || 0,
          last_message: lastMessageData ? {
            ...lastMessageData,
            conversation_id: conversation.id
          } as ChatMessage : undefined,
          other_user: otherUser,
          last_message_at: lastMessageData?.created_at || conversation.last_message_at,
          last_message_preview: lastMessageData?.content || conversation.last_message_preview,
          last_message_sender_id: lastMessageData?.sender_id || conversation.last_message_sender_id
        };

        conversationsWithDetails.push(conversationWithDetails);
        console.log('✅ Added conversation:', conversation.id, {
          type: conversation.conversation_type,
          name: conversation.name,
          otherUser: otherUser ? (otherUser.display_name || otherUser.username || otherUser.email) : 'N/A',
          lastMessage: conversationWithDetails.last_message_preview,
          unreadCount: conversationWithDetails.unread_count
        });
      }

      // Sort by last message time (most recent first)
      conversationsWithDetails.sort((a, b) => {
        const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
        return bTime - aTime;
      });

      console.log('✅ Loaded', conversationsWithDetails.length, 'conversations');
      setConversations(conversationsWithDetails);

    } catch (error) {
      console.error('❌ Error in loadConversations:', error);
      toast.error('An error occurred while loading conversations');
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [currentUser, supabase]);

  // Search for users
  const searchForUsers = useCallback(async () => {
    if (!currentUser || !searchQuery.trim()) {
      setSearchUsers([]);
      return;
    }

    try {
      setSearchingUsers(true);

      const { data: users, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          first_name,
          last_name,
          display_name,
          username,
          avatar_url,
          profile_image_url,
          is_verified,
          bio,
          account_status,
          created_at,
          updated_at
        `)
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%,first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`)
        .neq('id', currentUser.id)
        .eq('account_status', 'active')
        .limit(20);

      if (error) {
        console.error('Error searching users:', error);
        toast.error('Failed to search users');
        return;
      }

      setSearchUsers(users || []);
    } catch (error) {
      console.error('Error in searchForUsers:', error);
      toast.error('An error occurred while searching');
    } finally {
      setSearchingUsers(false);
    }
  }, [currentUser, searchQuery, supabase]);

  // Create or navigate to direct conversation
  const handleStartDirectChat = async (userId: string) => {
    if (!currentUser) {
      toast.error('Please log in to start a conversation');
      return;
    }

    try {
      console.log('🚀 Starting direct chat with user:', userId);
      
      // First check if a direct conversation already exists
      console.log('🔍 Checking for existing conversation...');
      const { data: existingParticipants, error: existingError } = await supabase
        .from('chat_participants')
        .select(`
          conversation_id,
          conversation:chat_conversations(
            id,
            conversation_type,
            created_by,
            is_active
          )
        `)
        .eq('user_id', currentUser.id)
        .eq('is_active', true);

      if (existingError) {
        console.error('❌ Error checking existing conversations:', existingError);
        // Continue with creation anyway
      }

      // Find if there's already a direct conversation with this user
      if (existingParticipants) {
        for (const participant of existingParticipants) {
          const conv = Array.isArray(participant.conversation) 
            ? participant.conversation[0] 
            : participant.conversation;
          
          if (conv && conv.conversation_type === 'direct' && conv.is_active) {
            // Check if the other user is in this conversation
            const { data: otherParticipant } = await supabase
              .from('chat_participants')
              .select('user_id')
              .eq('conversation_id', conv.id)
              .eq('user_id', userId)
              .eq('is_active', true)
              .single();

            if (otherParticipant) {
              console.log('✅ Found existing conversation:', conv.id);
              setShowNewChatSheet(false);
              setSearchQuery('');
              router.push(`/messages/conversation/${conv.id}`);
              return;
            }
          }
        }
      }

      console.log('📝 Creating new conversation...');
      
      // Create new direct conversation
      const { data: newConversation, error: convError } = await supabase
        .from('chat_conversations')
        .insert({
          conversation_type: 'direct',
          created_by: currentUser.id,
          is_active: true
        })
        .select()
        .single();

      if (convError) {
        console.error('❌ Error creating conversation:', convError);
        toast.error('Failed to create conversation - please check your connection');
        return;
      }

      console.log('✅ Created conversation:', newConversation.id);

      // Add participants
      const { error: participantError } = await supabase
        .from('chat_participants')
        .insert([
          { 
            conversation_id: newConversation.id, 
            user_id: currentUser.id, 
            role: 'member',
            is_active: true
          },
          { 
            conversation_id: newConversation.id, 
            user_id: userId, 
            role: 'member',
            is_active: true
          }
        ]);

      if (participantError) {
        console.error('❌ Error adding participants:', participantError);
        toast.error('Failed to add participants - please try again');
        return;
      }

      console.log('✅ Added participants successfully');
      
      // Close the new chat sheet and navigate
      setShowNewChatSheet(false);
      setSearchQuery('');
      router.push(`/messages/conversation/${newConversation.id}`);
      
    } catch (error) {
      console.error('❌ Error starting direct chat:', error);
      toast.error('Failed to start conversation');
    }
  };

  // Handle conversation actions
  const handlePinConversation = async (conversationId: string, isPinned: boolean) => {
    const { error } = await supabase
      .from('chat_conversations')
      .update({ is_pinned: !isPinned })
      .eq('id', conversationId);

    if (error) {
      toast.error('Failed to update conversation');
    } else {
      toast.success(isPinned ? 'Conversation unpinned' : 'Conversation pinned');
      loadConversations();
    }
  };

  const handleArchiveConversation = async (conversationId: string, isArchived: boolean) => {
    const { error } = await supabase
      .from('chat_conversations')
      .update({ is_archived: !isArchived })
      .eq('id', conversationId);

    if (error) {
      toast.error('Failed to update conversation');
    } else {
      toast.success(isArchived ? 'Conversation unarchived' : 'Conversation archived');
      loadConversations();
    }
  };

  const handleMuteConversation = async (conversationId: string, participantId: string, isMuted: boolean) => {
    const { error } = await supabase
      .from('chat_participants')
      .update({ 
        notification_settings: { muted: !isMuted } 
      })
      .eq('conversation_id', conversationId)
      .eq('user_id', currentUser?.id);

    if (error) {
      toast.error('Failed to update notification settings');
    } else {
      toast.success(isMuted ? 'Notifications enabled' : 'Notifications muted');
      loadConversations();
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    if (!currentUser) return;

    // Subscribe to conversation updates
    const conversationChannel = supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_conversations'
        },
        () => {
          loadConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversationChannel);
    };
  }, [currentUser, supabase, loadConversations]);

  // Initial load
  useEffect(() => {
    if (currentUser) {
      loadConversations();
    }
  }, [currentUser, loadConversations]);

  // Search effect
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchForUsers();
      } else {
        setSearchUsers([]);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, searchForUsers]);

  // Filter conversations based on active tab
  const filteredConversations = useMemo(() => {
    let filtered = [...conversations];

    // Apply tab filter
    switch (activeTab) {
      case 'unread':
        filtered = filtered.filter(c => (c.unread_count || 0) > 0);
        break;
      case 'groups':
        filtered = filtered.filter(c => c.conversation_type === 'group');
        break;
    }

    // Apply search filter
    if (searchQuery.trim() && !showNewChatSheet) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(conv => {
        if (conv.conversation_type === 'direct' && conv.other_user) {
          const name = getDisplayName(conv.other_user).toLowerCase();
          return name.includes(query);
        }
        return conv.name?.toLowerCase().includes(query) || false;
      });
    }

    // Sort: pinned first, then by last message time
    filtered.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return bTime - aTime;
    });

    return filtered;
  }, [conversations, activeTab, searchQuery, showNewChatSheet]);

  if (!currentUser) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-red-900/20">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="hover:bg-red-900/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
                Messages
              </h1>
              <p className="text-xs text-gray-400">
                {conversations.length} conversations
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={loadConversations}
              variant="outline"
              className="border-red-600/20 text-red-400 hover:bg-red-600/10"
              disabled={loading}
            >
              🔄 Reload
            </Button>
            <Button
              onClick={() => setShowNewChatSheet(true)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-10 bg-gray-900/50 border-gray-800 focus:border-red-500 text-white placeholder-gray-500"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'unread' | 'groups')} className="px-4">
          <TabsList className="grid w-full grid-cols-3 bg-gray-900/50">
            <TabsTrigger value="all" className="data-[state=active]:bg-red-600/20">
              All
            </TabsTrigger>
            <TabsTrigger value="unread" className="data-[state=active]:bg-red-600/20">
              Unread
              {conversations.filter(c => (c.unread_count || 0) > 0).length > 0 && (
                <Badge className="ml-2 bg-red-600" variant="secondary">
                  {conversations.filter(c => (c.unread_count || 0) > 0).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="groups" className="data-[state=active]:bg-red-600/20">
              Groups
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1 h-[calc(100vh-200px)]">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <MessageCircle className="h-16 w-16 text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </h3>
            <p className="text-gray-500 text-center px-4 mb-6">
              {error ? (
                <>
                  Error: {error}
                  <br />
                  <Button 
                    onClick={loadConversations} 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    disabled={loading}
                  >
                    Try Again
                  </Button>
                </>
              ) : searchQuery ? (
                'Try a different search term'
              ) : (
                'Start a conversation with someone from the Wolf Pack'
              )}
            </p>
            {!error && (
              <Button
                onClick={() => setShowNewChatSheet(true)}
                className="bg-red-600 hover:bg-red-700"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Start New Chat
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-800/50">
            {filteredConversations.map((conversation) => {
              // Get display name with better fallbacks
              let displayName: string;
              if (conversation.conversation_type === 'direct') {
                if (conversation.other_user) {
                  displayName = getDisplayName(conversation.other_user);
                } else {
                  // Try to get name from participants
                  const otherParticipant = conversation.participants?.find(p => p.user_id !== currentUser.id);
                  if (otherParticipant?.user) {
                    displayName = getDisplayName(otherParticipant.user as User);
                  } else {
                    displayName = 'Unknown User';
                  }
                }
              } else {
                displayName = conversation.name || 'Group Chat';
              }
              
              // Get avatar URL with better fallbacks
              let avatarUrl: string;
              if (conversation.conversation_type === 'direct') {
                if (conversation.other_user) {
                  avatarUrl = getAvatarUrl(conversation.other_user);
                } else {
                  // Try to get avatar from participants
                  const otherParticipant = conversation.participants?.find(p => p.user_id !== currentUser.id);
                  if (otherParticipant?.user) {
                    avatarUrl = getAvatarUrl(otherParticipant.user as User);
                  } else {
                    avatarUrl = 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/icons/wolf-512x512.png';
                  }
                }
              } else {
                avatarUrl = conversation.avatar_url || 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/icons/wolf-512x512.png';
              }

              const isOnline = conversation.conversation_type === 'direct' 
                ? isUserOnline(conversation.other_user?.last_seen_at)
                : false;

              const isMuted = conversation.participants?.find(
                p => p.user_id === currentUser.id
              )?.notification_settings?.muted || false;

              return (
                <div
                  key={conversation.id}
                  className={cn(
                    "flex items-center gap-3 p-4 hover:bg-gray-900/30 cursor-pointer transition-colors"
                  )}
                  onClick={() => router.push(`/messages/conversation/${conversation.id}`)}
                >
                  {/* Avatar */}
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={avatarUrl} alt={displayName} />
                      <AvatarFallback className="bg-red-600/20 text-red-400">
                        {displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {isOnline && (
                      <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-black" />
                    )}
                    {conversation.conversation_type === 'group' && (
                      <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-gray-800 rounded-full border-2 border-black flex items-center justify-center">
                        <Users className="h-3 w-3 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white truncate">
                          {displayName}
                        </h3>
                        {conversation.is_pinned && (
                          <Pin className="h-3 w-3 text-red-500" />
                        )}
                        {isMuted && (
                          <BellOff className="h-3 w-3 text-gray-500" />
                        )}
                        {conversation.other_user?.is_verified && (
                          <CheckCircle className="h-3 w-3 text-blue-500" />
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatMessageTime(conversation.last_message_at)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-400 truncate">
                        {conversation.last_message ? (
                          <>
                            {conversation.last_message.sender_id === currentUser.id && (
                              <span className="text-gray-500">You: </span>
                            )}
                            {conversation.last_message.message_type === 'image' ? (
                              <span className="italic">📷 Image</span>
                            ) : conversation.last_message.is_deleted ? (
                              <span className="italic">Message deleted</span>
                            ) : (
                              conversation.last_message.content
                            )}
                          </>
                        ) : (
                          <span className="italic">No messages yet</span>
                        )}
                      </p>
                      {(conversation.unread_count || 0) > 0 && (
                        <Badge className="bg-red-600 text-white min-w-[20px] h-5">
                          {conversation.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="hover:bg-gray-800">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePinConversation(conversation.id, conversation.is_pinned || false);
                        }}
                      >
                        <Pin className="h-4 w-4 mr-2" />
                        {conversation.is_pinned ? 'Unpin' : 'Pin'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMuteConversation(
                            conversation.id, 
                            conversation.id,
                            isMuted
                          );
                        }}
                      >
                        {isMuted ? (
                          <>
                            <Bell className="h-4 w-4 mr-2" />
                            Unmute
                          </>
                        ) : (
                          <>
                            <BellOff className="h-4 w-4 mr-2" />
                            Mute
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArchiveConversation(conversation.id, conversation.is_archived || false);
                        }}
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        {conversation.is_archived ? 'Unarchive' : 'Archive'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-gray-800" />
                      <DropdownMenuItem className="text-red-500">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* New Chat Sheet */}
      <Sheet open={showNewChatSheet} onOpenChange={setShowNewChatSheet}>
        <SheetContent className="bg-gray-900 border-gray-800 text-white">
          <SheetHeader>
            <SheetTitle className="text-white">Start New Conversation</SheetTitle>
            <SheetDescription className="text-gray-400">
              Search for Wolf Pack members to start a conversation
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or username..."
                className="w-full pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                autoFocus
              />
            </div>

            <ScrollArea className="h-[calc(100vh-250px)] mt-4">
              {searchingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-red-500" />
                </div>
              ) : searchUsers.length === 0 && searchQuery ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No users found</p>
                </div>
              ) : searchUsers.length > 0 ? (
                <div className="space-y-2">
                  {searchUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => {
                        handleStartDirectChat(user.id);
                        setShowNewChatSheet(false);
                        setSearchQuery('');
                      }}
                      className="flex items-center gap-3 p-3 hover:bg-gray-800 rounded-lg cursor-pointer transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={getAvatarUrl(user)} alt={getDisplayName(user)} />
                        <AvatarFallback className="bg-red-600/20 text-red-400">
                          {getDisplayName(user).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">
                            {getDisplayName(user)}
                          </p>
                          {user.is_verified && (
                            <CheckCircle className="h-3 w-3 text-blue-500" />
                          )}
                        </div>
                        {user.username && (
                          <p className="text-sm text-gray-500">@{user.username}</p>
                        )}
                        {user.bio && (
                          <p className="text-xs text-gray-400 truncate">{user.bio}</p>
                        )}
                      </div>

                      <Button size="sm" className="bg-red-600 hover:bg-red-700">
                        Message
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Start typing to search for users</p>
                </div>
              )}
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}