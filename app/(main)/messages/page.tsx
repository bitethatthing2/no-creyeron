'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { messagingHelpers } from '@/lib/utils/messaging-helpers';
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
  User,
  Check,
  CheckCheck
} from 'lucide-react';
import { format, isToday, isYesterday, differenceInMinutes } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

// Type definitions
interface User {
  id: string;
  email: string;
  username: string;
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  profile_image_url?: string | null;
  bio?: string | null;
  is_verified?: boolean | null;
  last_seen_at?: string | null;
  account_status?: string | null;
}

interface ConversationData {
  id: string;
  conversation_type: 'direct' | 'group' | 'location' | 'broadcast';
  name?: string | null;
  avatar_url?: string | null;
  last_message_at?: string | null;
  last_message_preview?: string | null;
  last_message_sender_id?: string | null;
  is_pinned?: boolean | null;
  is_archived?: boolean | null;
  participant_count?: number | null;
  message_count?: number | null;
  is_active?: boolean | null;
}

interface ParticipantData {
  conversation_id: string;
  user_id: string;
  last_read_at?: string | null;
  notification_settings?: { muted?: boolean } | null;
  user?: User | null;
  is_active?: boolean | null;
}

interface MessageData {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  message_type?: string | null;
  is_deleted?: boolean | null;
  sender?: User | null;
}

interface ConversationWithDetails extends ConversationData {
  participants: ParticipantData[];
  last_message?: MessageData | null;
  unread_count: number;
  other_user?: User | null;
  is_muted?: boolean;
  my_last_read_at?: string | null;
}

// Default avatar URL
const DEFAULT_AVATAR = 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/icons/wolf-512x512.png';

export default function MessagesInboxPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const supabase = getSupabaseBrowserClient();

  // State
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [searchUsers, setSearchUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'groups'>('all');
  const [showNewChatSheet, setShowNewChatSheet] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);

  // Helper: Get display name for a user
  const getDisplayName = (user: User | undefined | null): string => {
    if (!user) return 'Unknown User';
    
    // Prioritize display_name if it exists and is not empty
    if (user.display_name?.trim()) return user.display_name.trim();
    
    // Use username as second priority (this should be the main identifier)
    if (user.username?.trim()) return user.username.trim();
    
    // Only fall back to email prefix as last resort
    if (user.email) return user.email.split('@')[0];
    
    return 'Unknown User';
  };

  // Helper: Get avatar URL for a user
  const getAvatarUrl = (user: User | undefined | null): string => {
    if (!user) return DEFAULT_AVATAR;
    return user.avatar_url || user.profile_image_url || DEFAULT_AVATAR;
  };

  // Helper: Format timestamp for messages
  const formatMessageTime = (timestamp: string | null | undefined): string => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInMin = differenceInMinutes(now, date);
      
      if (diffInMin < 1) return 'now';
      if (diffInMin < 60) return `${diffInMin}m`;
      if (diffInMin < 1440) return `${Math.floor(diffInMin / 60)}h`;
      
      if (isToday(date)) return format(date, 'HH:mm');
      if (isYesterday(date)) return 'Yesterday';
      
      const diffInDays = Math.floor(diffInMin / 1440);
      if (diffInDays < 7) return `${diffInDays}d ago`;
      if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
      
      return format(date, 'MMM d');
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  };

  // Helper: Check if user is online
  const isUserOnline = (lastSeenAt: string | null | undefined): boolean => {
    if (!lastSeenAt) return false;
    try {
      const lastSeen = new Date(lastSeenAt);
      const now = new Date();
      const diffInMin = differenceInMinutes(now, lastSeen);
      return diffInMin < 5;
    } catch {
      return false;
    }
  };

  // Load conversations - FIXED VERSION
  const loadConversations = useCallback(async () => {
    if (!currentUser) {
      console.log('No current user, skipping conversation load');
      return;
    }

    try {
      console.log('Loading conversations for user:', currentUser.id);
      setLoading(true);

      // Step 1: Get participant records
      const { data: participantRecords, error: participantError } = await supabase
        .from('chat_participants')
        .select('conversation_id, last_read_at, notification_settings')
        .eq('user_id', currentUser.id)
        .eq('is_active', true);

      if (participantError) {
        console.error('Error loading participant records:', participantError);
        toast.error('Failed to load conversations');
        return;
      }

      if (!participantRecords || participantRecords.length === 0) {
        console.log('No conversations found');
        setConversations([]);
        return;
      }

      const conversationIds = participantRecords.map(p => p.conversation_id);
      console.log(`Found ${conversationIds.length} conversations`);

      // Step 2: Get conversation details
      const { data: conversationsData, error: convError } = await supabase
        .from('chat_conversations')
        .select('*')
        .in('id', conversationIds)
        .eq('is_active', true);

      if (convError) {
        console.error('Error loading conversations:', convError);
        toast.error('Failed to load conversation details');
        return;
      }

      if (!conversationsData) {
        setConversations([]);
        return;
      }

      // Step 3: Process each conversation
      const conversationsWithDetails: ConversationWithDetails[] = [];

      for (const conversation of conversationsData) {
        const myParticipantRecord = participantRecords.find(
          p => p.conversation_id === conversation.id
        );

        // Get all participants WITHOUT join to avoid array issues
        const { data: participantsList, error: participantsError } = await supabase
          .from('chat_participants')
          .select('*')
          .eq('conversation_id', conversation.id)
          .eq('is_active', true);

        if (participantsError) {
          console.error('Error loading participants:', participantsError);
          continue;
        }

        if (!participantsList) {
          continue;
        }

        // Get user data separately to avoid join issues
        const userIds = participantsList.map(p => p.user_id);
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select(`
            id,
            email,
            username,
            display_name,
            first_name,
            last_name,
            avatar_url,
            profile_image_url,
            is_verified,
            last_seen_at,
            bio,
            account_status
          `)
          .in('id', userIds);

        if (usersError) {
          console.error('Error loading users:', usersError);
          continue;
        }

        // Attach user data to participants
        const participantsWithUsers: ParticipantData[] = participantsList.map(participant => ({
          ...participant,
          user: usersData?.find(u => u.id === participant.user_id) || null
        }));

        // For direct conversations, find the other user
        let otherUser: User | null = null;
        if (conversation.conversation_type === 'direct') {
          const otherParticipant = participantsWithUsers.find(p => p.user_id !== currentUser.id);
          if (otherParticipant?.user) {
            otherUser = otherParticipant.user;
          }
          
          // Skip broken direct conversations
          if (!otherUser) {
            console.log('Skipping direct conversation without other user');
            continue;
          }
        }

        // Get the last message
        const { data: messages, error: msgError } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('conversation_id', conversation.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(1);

        if (msgError) {
          console.error('Error loading messages:', msgError);
        }

        const lastMessage = messages?.[0] || null;

        // Get sender info for last message if exists
        if (lastMessage && usersData) {
          const sender = usersData.find(u => u.id === lastMessage.sender_id);
          if (sender) {
            lastMessage.sender = sender;
          }
        }

        // Calculate unread count
        let unreadCount = 0;
        if (myParticipantRecord?.last_read_at) {
          const { count } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conversation.id)
            .neq('sender_id', currentUser.id)
            .eq('is_deleted', false)
            .gt('created_at', myParticipantRecord.last_read_at);
          
          unreadCount = count || 0;
        }

        // Build the conversation object
        const conversationWithDetails: ConversationWithDetails = {
          ...conversation,
          participants: participantsWithUsers,
          last_message: lastMessage,
          unread_count: unreadCount,
          other_user: otherUser,
          is_muted: myParticipantRecord?.notification_settings?.muted || false,
          my_last_read_at: myParticipantRecord?.last_read_at,
          last_message_at: lastMessage?.created_at || conversation.last_message_at,
          last_message_preview: lastMessage?.content || conversation.last_message_preview,
          last_message_sender_id: lastMessage?.sender_id || conversation.last_message_sender_id
        };

        conversationsWithDetails.push(conversationWithDetails);
      }

      // Sort conversations
      conversationsWithDetails.sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        
        const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
        return bTime - aTime;
      });

      console.log(`Successfully loaded ${conversationsWithDetails.length} conversations`);
      setConversations(conversationsWithDetails);
      
    } catch (error) {
      console.error('Unexpected error loading conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [currentUser, supabase]);

  // Search for users - FIXED VERSION
  const searchForUsers = useCallback(async () => {
    if (!currentUser || !searchQuery.trim()) {
      setSearchUsers([]);
      return;
    }

    try {
      setSearchingUsers(true);

      const { data, error } = await supabase
        .from('users')
        .select(`
          id, 
          email, 
          username, 
          display_name, 
          avatar_url, 
          profile_image_url, 
          is_verified, 
          bio,
          account_status
        `)
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .neq('id', currentUser.id)
        .limit(10);

      if (error) {
        console.error('Error searching users:', error);
        setSearchUsers([]);
        return;
      }

      // Ensure we have an array of users
      const users: User[] = data || [];
      setSearchUsers(users);
      
    } catch (error) {
      console.error('Error in searchForUsers:', error);
      setSearchUsers([]);
    } finally {
      setSearchingUsers(false);
    }
  }, [currentUser, searchQuery, supabase]);

  // Start a direct chat - USING HELPER FUNCTIONS
  const handleStartDirectChat = async (userId: string) => {
    if (!currentUser?.id || creatingChat) return;

    try {
      setCreatingChat(true);
      console.log('Starting direct chat with user:', userId);

      const conversationId = await messagingHelpers.createOrGetDirectConversation(
        currentUser.id,
        userId
      );

      if (!conversationId) {
        toast.error('Failed to create conversation');
        return;
      }

      console.log('Got conversation ID:', conversationId);
      
      // Close sheet and navigate
      setShowNewChatSheet(false);
      setSearchQuery('');
      setSearchUsers([]);
      
      router.push(`/messages/conversation/${conversationId}`);
      
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setCreatingChat(false);
    }
  };

  // Conversation actions
  const handlePinConversation = async (conversationId: string, isPinned: boolean) => {
    try {
      const { error } = await supabase
        .from('chat_conversations')
        .update({ is_pinned: !isPinned })
        .eq('id', conversationId);

      if (error) throw error;
      
      toast.success(isPinned ? 'Conversation unpinned' : 'Conversation pinned');
      await loadConversations();
    } catch (error) {
      console.error('Error pinning conversation:', error);
      toast.error('Failed to update conversation');
    }
  };

  const handleArchiveConversation = async (conversationId: string, isArchived: boolean) => {
    try {
      const { error } = await supabase
        .from('chat_conversations')
        .update({ is_archived: !isArchived })
        .eq('id', conversationId);

      if (error) throw error;
      
      toast.success(isArchived ? 'Conversation unarchived' : 'Conversation archived');
      await loadConversations();
    } catch (error) {
      console.error('Error archiving conversation:', error);
      toast.error('Failed to update conversation');
    }
  };

  const handleMuteConversation = async (conversationId: string, isMuted: boolean) => {
    if (!currentUser) return;
    
    try {
      const { error } = await supabase
        .from('chat_participants')
        .update({ 
          notification_settings: { muted: !isMuted } 
        })
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUser.id);

      if (error) throw error;
      
      toast.success(isMuted ? 'Notifications enabled' : 'Notifications muted');
      await loadConversations();
    } catch (error) {
      console.error('Error muting conversation:', error);
      toast.error('Failed to update notification settings');
    }
  };

  // Real-time subscriptions
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel(`inbox-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages'
        },
        () => {
          console.log('New message event detected');
          loadConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_conversations'
        },
        () => {
          console.log('Conversation update detected');
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, supabase, loadConversations]);

  // Initial load
  useEffect(() => {
    if (currentUser) {
      loadConversations();
    }
  }, [currentUser, loadConversations]);

  // Search users effect
  useEffect(() => {
    if (!showNewChatSheet || !searchQuery.trim()) {
      setSearchUsers([]);
      return;
    }

    const timer = setTimeout(() => {
      searchForUsers();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, showNewChatSheet, searchForUsers]);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    let filtered = [...conversations];

    // Tab filter
    switch (activeTab) {
      case 'unread':
        filtered = filtered.filter(c => c.unread_count > 0);
        break;
      case 'groups':
        filtered = filtered.filter(c => c.conversation_type === 'group');
        break;
    }

    // Search filter
    if (searchQuery.trim() && !showNewChatSheet) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(conv => {
        if (conv.conversation_type === 'direct' && conv.other_user) {
          const name = getDisplayName(conv.other_user).toLowerCase();
          const username = conv.other_user.username?.toLowerCase() || '';
          return name.includes(query) || username.includes(query);
        }
        return conv.name?.toLowerCase().includes(query) || false;
      });
    }

    // Exclude archived unless searching
    if (!searchQuery.includes('archived')) {
      filtered = filtered.filter(c => !c.is_archived);
    }

    return filtered;
  }, [conversations, activeTab, searchQuery, showNewChatSheet]);

  // Total unread count
  const totalUnread = conversations.filter(c => c.unread_count > 0).length;

  // Redirect if not logged in
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
                {conversations.length} {conversations.length === 1 ? 'conversation' : 'conversations'}
                {totalUnread > 0 && ` • ${totalUnread} unread`}
              </p>
            </div>
          </div>

          <Button
            onClick={() => setShowNewChatSheet(true)}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Search Bar */}
        {!showNewChatSheet && (
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
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'unread' | 'groups')} className="px-4">
          <TabsList className="grid w-full grid-cols-3 bg-gray-900/50">
            <TabsTrigger value="all" className="data-[state=active]:bg-red-600/20">
              All
            </TabsTrigger>
            <TabsTrigger value="unread" className="data-[state=active]:bg-red-600/20">
              Unread
              {totalUnread > 0 && (
                <Badge className="ml-2 bg-red-600 text-white h-5 min-w-[20px] px-1">
                  {totalUnread}
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
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <MessageCircle className="h-16 w-16 text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">
              {searchQuery ? 'No conversations found' : activeTab === 'unread' ? 'No unread messages' : 'No conversations yet'}
            </h3>
            <p className="text-gray-500 text-center px-4 mb-6">
              {searchQuery ? 'Try a different search term' : 'Start a conversation with someone'}
            </p>
            {!searchQuery && (
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
              let displayName: string;
              let avatarUrl: string;
              let showOnlineStatus = false;
              let isOnline = false;
              
              if (conversation.conversation_type === 'direct' && conversation.other_user) {
                displayName = getDisplayName(conversation.other_user);
                avatarUrl = getAvatarUrl(conversation.other_user);
                showOnlineStatus = true;
                isOnline = isUserOnline(conversation.other_user.last_seen_at);
              } else if (conversation.conversation_type === 'group') {
                displayName = conversation.name || 'Group Chat';
                avatarUrl = conversation.avatar_url || DEFAULT_AVATAR;
              } else {
                displayName = conversation.name || 'Conversation';
                avatarUrl = conversation.avatar_url || DEFAULT_AVATAR;
              }

              let lastMessageText = '';
              if (conversation.last_message) {
                if (conversation.last_message.sender_id === currentUser.id) {
                  lastMessageText = 'You: ';
                } else if (conversation.conversation_type === 'group' && conversation.last_message.sender) {
                  const senderName = getDisplayName(conversation.last_message.sender);
                  lastMessageText = `${senderName}: `;
                }
                
                if (conversation.last_message.is_deleted) {
                  lastMessageText += 'Message deleted';
                } else if (conversation.last_message.message_type === 'image') {
                  lastMessageText += '📷 Photo';
                } else {
                  lastMessageText += conversation.last_message.content;
                }
              } else if (conversation.last_message_preview) {
                lastMessageText = conversation.last_message_preview;
              } else {
                lastMessageText = 'No messages yet';
              }

              return (
                <div
                  key={conversation.id}
                  className={cn(
                    "flex items-center gap-3 p-4 hover:bg-gray-900/30 cursor-pointer transition-colors",
                    conversation.unread_count > 0 && "bg-gray-900/20"
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
                    
                    {showOnlineStatus && isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-green-500 rounded-full border-2 border-black" />
                    )}
                    
                    {conversation.conversation_type === 'group' && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-gray-800 rounded-full border-2 border-black flex items-center justify-center">
                        <Users className="h-2.5 w-2.5 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className={cn(
                          "font-semibold truncate",
                          conversation.unread_count > 0 ? "text-white" : "text-gray-200"
                        )}>
                          {displayName}
                        </h3>
                        
                        <div className="flex items-center gap-1">
                          {conversation.is_pinned && (
                            <Pin className="h-3 w-3 text-red-500" />
                          )}
                          {conversation.is_muted && (
                            <BellOff className="h-3 w-3 text-gray-500" />
                          )}
                          {conversation.other_user?.is_verified && (
                            <CheckCircle className="h-3 w-3 text-blue-500" />
                          )}
                        </div>
                      </div>
                      
                      <span className="text-xs text-gray-500">
                        {formatMessageTime(conversation.last_message_at)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className={cn(
                        "text-sm truncate pr-2",
                        conversation.unread_count > 0 ? "text-gray-300" : "text-gray-400"
                      )}>
                        {lastMessageText}
                      </p>
                      
                      <div className="flex items-center gap-2">
                        {conversation.last_message?.sender_id === currentUser.id && (
                          <div className="text-gray-500">
                            {conversation.my_last_read_at && conversation.last_message?.created_at && 
                             new Date(conversation.my_last_read_at) >= new Date(conversation.last_message.created_at) ? (
                              <CheckCheck className="h-4 w-4 text-blue-500" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </div>
                        )}
                        
                        {conversation.unread_count > 0 && (
                          <Badge className="bg-red-600 text-white min-w-[20px] h-5 px-1.5">
                            {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                          </Badge>
                        )}
                      </div>
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
                        {conversation.is_pinned ? 'Unpin' : 'Pin'} conversation
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMuteConversation(conversation.id, conversation.is_muted || false);
                        }}
                      >
                        {conversation.is_muted ? (
                          <>
                            <Bell className="h-4 w-4 mr-2" />
                            Unmute notifications
                          </>
                        ) : (
                          <>
                            <BellOff className="h-4 w-4 mr-2" />
                            Mute notifications
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
                      
                      {conversation.conversation_type === 'direct' && conversation.other_user && (
                        <>
                          <DropdownMenuSeparator className="bg-gray-800" />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/profile/${conversation.other_user?.username || conversation.other_user?.id}`);
                            }}
                          >
                            <User className="h-4 w-4 mr-2" />
                            View profile
                          </DropdownMenuItem>
                        </>
                      )}
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
              Search for users to start a conversation
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, username or email..."
                className="w-full pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                autoFocus
              />
            </div>

            <ScrollArea className="h-[calc(100vh-250px)] mt-4">
              {searchingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-red-500" />
                </div>
              ) : searchUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery ? 'No users found' : 'Start typing to search for users'}
                </div>
              ) : (
                <div className="space-y-2">
                  {searchUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleStartDirectChat(user.id)}
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
                        {user.username && user.username !== user.display_name && (
                          <p className="text-sm text-gray-500">@{user.username}</p>
                        )}
                        {user.bio && (
                          <p className="text-xs text-gray-400 truncate">{user.bio}</p>
                        )}
                      </div>

                      <Button 
                        size="sm" 
                        className="bg-red-600 hover:bg-red-700"
                        disabled={creatingChat}
                      >
                        {creatingChat ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Message'
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}