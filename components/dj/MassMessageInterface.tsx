'use client';

import { useState } from 'react';
import { CenteredModal } from '@/components/shared/CenteredModal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  Megaphone, 
  AlertTriangle, 
  Music, 
  Send, 
  Clock, 
  Sparkles, 
  Trophy, 
  Heart,
  Info,
  Users,
  CheckCircle,
  Eye,
  EyeOff,
  History,
  Wand2,
  MapPin
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { 
  BroadcastType,
  BroadcastPriority,
  LocationKey
} from '@/types/features/dj-dashboard-types';
import type { Database } from '@/types/database.types';

interface MassMessageInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  packMemberCount: number;
  location: LocationKey;
}

interface MessageTemplate {
  id: string;
  title: string;
  content: string;
  type: BroadcastType;
  priority: BroadcastPriority;
  icon: React.ComponentType<{ className?: string }>;
  duration: number;
  emoji_burst?: string[];
  category: 'engagement' | 'announcement' | 'special' | 'urgent';
}

const LOCATION_CONFIG = {
  salem: '50d17782-3f4a-43a1-b6b6-608171ca3c7c',
  portland: 'ec1e8869-454a-49d2-93e5-ed05f49bb932'
} as const;

type LocationConfigKey = keyof typeof LOCATION_CONFIG;

const messageTemplates: MessageTemplate[] = [
  // Engagement Templates
  {
    id: 'vibe-check',
    title: 'Vibe Check',
    content: '✨ Quick vibe check! How\'s everyone feeling tonight? Drop your energy level in the chat! 🔥',
    type: 'vibe_check',
    priority: 'normal',
    icon: Sparkles,
    duration: 45,
    emoji_burst: ['✨', '🔥', '💯'],
    category: 'engagement'
  },
  {
    id: 'song-request',
    title: 'Song Requests Open',
    content: '🎵 Taking song requests now! What do you want to hear? Drop your favorites in the chat! 🎶',
    type: 'song_request',
    priority: 'normal',
    icon: Music,
    duration: 60,
    emoji_burst: ['🎵', '🎶', '🎤'],
    category: 'engagement'
  },
  {
    id: 'dance-floor-call',
    title: 'Hit the Dance Floor',
    content: '💃 Time to show your moves! Get on the dance floor and let\'s see what you got! 🕺',
    type: 'general',
    priority: 'high',
    icon: Music,
    duration: 30,
    emoji_burst: ['💃', '🕺', '🎉'],
    category: 'engagement'
  },
  
  // Announcement Templates
  {
    id: 'event-starting',
    title: 'Event Starting Soon',
    content: '🎉 Get ready! [EVENT_NAME] is starting in 5 minutes! Don\'t miss out on the fun! 🐺',
    type: 'general',
    priority: 'high',
    icon: Megaphone,
    duration: 30,
    emoji_burst: ['🎉', '🐺', '⭐'],
    category: 'announcement'
  },
  {
    id: 'last-call',
    title: 'Last Call',
    content: '🍺 LAST CALL! Get your final drinks at the bar. We\'ll be closing in 30 minutes! 🕐',
    type: 'general',
    priority: 'high',
    icon: Clock,
    duration: 60,
    emoji_burst: ['🍺', '🕐', '⏰'],
    category: 'announcement'
  },
  
  // Special Templates
  {
    id: 'single-ladies',
    title: 'Single Ladies Spotlight',
    content: '💃 All the single ladies, make some noise! This one\'s for you! Get on the dance floor! 💜',
    type: 'spotlight',
    priority: 'high',
    icon: Heart,
    duration: 30,
    emoji_burst: ['💃', '💜', '✨'],
    category: 'special'
  },
  {
    id: 'birthday-shoutout',
    title: 'Birthday Celebration',
    content: '🎂 We have a birthday in the house! Let\'s make some noise for [NAME]! 🎉',
    type: 'shout_out',
    priority: 'high',
    icon: Trophy,
    duration: 45,
    emoji_burst: ['🎂', '🎉', '🎊'],
    category: 'special'
  },
  {
    id: 'contest-announcement',
    title: 'Contest Time',
    content: '🏆 CONTEST ALERT! Who\'s ready to win big? Prizes up for grabs! Get ready! 🎊',
    type: 'contest',
    priority: 'urgent',
    icon: Trophy,
    duration: 120,
    emoji_burst: ['🏆', '🎊', '🔥'],
    category: 'special'
  },
  
  // Urgent Templates
  {
    id: 'emergency',
    title: 'Important Notice',
    content: '⚠️ ATTENTION: [MESSAGE] Please follow staff instructions. Thank you.',
    type: 'general',
    priority: 'urgent',
    icon: AlertTriangle,
    duration: 60,
    emoji_burst: ['⚠️'],
    category: 'urgent'
  }
];

// Helper function to get emoji for broadcast type
const getTypeEmoji = (type: BroadcastType): string => {
  const emojis: Record<BroadcastType, string> = {
    general: '📢',
    shout_out: '📣',
    poll: '📊',
    quick_response: '⚡',
    song_request: '🎵',
    contest: '🏆',
    spotlight: '✨',
    vibe_check: '🔥',
    custom: '🎯'
  };
  return emojis[type] || '📢';
};

export function MassMessageInterface({ isOpen, onClose, packMemberCount, location }: MassMessageInterfaceProps) {
  const [messageContent, setMessageContent] = useState('');
  const [messageTitle, setMessageTitle] = useState('');
  const [broadcastType, setBroadcastType] = useState<BroadcastType>('general');
  const [priority, setPriority] = useState<BroadcastPriority>('normal');
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [duration, setDuration] = useState(30);
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState('templates');
  const [showPreview, setShowPreview] = useState(true);
  
  const [recentBroadcasts, setRecentBroadcasts] = useState<Array<{
    type: BroadcastType;
    title: string;
    timestamp: string;
    responses: number;
  }>>([]);

  // Get current user
  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  };

  const handleTemplateSelect = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setMessageTitle(template.title);
    setMessageContent(template.content);
    setBroadcastType(template.type);
    setPriority(template.priority);
    setDuration(template.duration);
    setActiveTab('compose');
    toast.success(`Template loaded: ${template.title}`);
  };

  const sendMassMessage = async () => {
    if (!messageTitle.trim() || !messageContent.trim()) {
      toast.error('Please provide both title and message');
      return;
    }

    if (packMemberCount === 0) {
      toast.error('No pack members are currently active');
      return;
    }

    setIsSending(true);
    
    try {
      const user = await getCurrentUser();
      if (!user) {
        toast.error('Authentication required');
        return;
      }

      const locationId = LOCATION_CONFIG[location as LocationConfigKey];
      
      // Create broadcast using the new schema
      const broadcastData: Database['public']['Tables']['dj_broadcasts']['Insert'] = {
        dj_id: user.id,
        location_id: locationId,
        broadcast_type: broadcastType as string,
        title: messageTitle,
        message: messageContent,
        priority: priority as string,
        duration_seconds: duration,
        auto_close: true,
        status: 'active',
        sent_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + duration * 1000).toISOString(),
        // Default styling - black and white theme
        background_color: priority === 'urgent' ? '#ef4444' : '#000000',
        text_color: '#ffffff',
        accent_color: '#ffffff',
        animation_type: priority === 'urgent' ? 'shake' : 'slide',
        emoji_burst: selectedTemplate?.emoji_burst || null,
        // Basic interaction config
        interaction_config: {
          response_type: 'emoji',
          show_results_live: true,
          anonymous_responses: false
        } as Database['public']['Tables']['dj_broadcasts']['Insert']['interaction_config']
      };

      const { data, error } = await supabase
        .from('dj_broadcasts')
        .insert(broadcastData)
        .select()
        .single();

      if (error) throw error;

      // Send notification
      await supabase.rpc('send_broadcast_notification', {
        p_broadcast_id: data.id
      });

      // Add to recent broadcasts
      setRecentBroadcasts(prev => [{
        type: broadcastType,
        title: messageTitle,
        timestamp: new Date().toISOString(),
        responses: 0
      }, ...prev.slice(0, 4)]);
      
      // Reset form
      setMessageTitle('');
      setMessageContent('');
      setSelectedTemplate(null);
      setBroadcastType('general');
      setPriority('normal');
      setDuration(30);
      
      toast.success(`🎉 Broadcast sent to ${packMemberCount} pack members!`);
      onClose();
      
    } catch (error) {
      console.error('Error sending mass message:', error);
      toast.error('Failed to send broadcast. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const getPriorityLabel = (priority: BroadcastPriority): string => {
    const labels: Record<BroadcastPriority, string> = {
      low: '🟢 Low Priority',
      normal: '🟡 Normal Priority',
      high: '🟠 High Priority',
      urgent: '🔴 Urgent Alert'
    };
    return labels[priority];
  };

  const handleClose = () => {
    onClose();
    setMessageTitle('');
    setMessageContent('');
    setSelectedTemplate(null);
    setBroadcastType('general');
    setPriority('normal');
    setDuration(30);
    setActiveTab('templates');
  };

  // Group templates by category
  const templatesByCategory = messageTemplates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, MessageTemplate[]>);

  const categoryInfo = {
    engagement: { title: '💬 Engagement', description: 'Get the crowd involved' },
    announcement: { title: '📢 Announcements', description: 'Important updates' },
    special: { title: '⭐ Special Events', description: 'Contests & celebrations' },
    urgent: { title: '🚨 Urgent', description: 'Critical messages' }
  };

  return (
    <CenteredModal
      isOpen={isOpen}
      onClose={handleClose}
      title="🎙️ Broadcast Center"
      maxWidth="3xl"
      className="max-h-[calc(100vh-120px)] min-h-[400px]"
    >
      <div className="flex flex-col h-full">
        {/* Header Info */}
        <div className="flex items-center justify-between mb-4 p-2 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Users className="w-3 h-3" />
              {packMemberCount} online
            </Badge>
            <Badge variant="outline">
              <MapPin className="w-3 h-3 mr-1" />
              {location.toUpperCase()}
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="templates" className="gap-2 justify-center">
              <Wand2 className="w-4 h-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="compose" className="gap-2 justify-center">
              <MessageSquare className="w-4 h-4" />
              Compose
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2 justify-center">
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            {/* Templates Tab */}
            <TabsContent value="templates" className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Choose a template to quickly send common messages. You can customize any template before sending.
                </AlertDescription>
              </Alert>

              {Object.entries(templatesByCategory).map(([category, templates]) => (
                <div key={category} className="space-y-3">
                  <div className="sticky top-0 bg-background z-10 pb-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      {categoryInfo[category as keyof typeof categoryInfo].title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {categoryInfo[category as keyof typeof categoryInfo].description}
                    </p>
                  </div>
                  
                  <div className="grid gap-2">
                    {templates.map(template => {
                      const IconComponent = template.icon;
                      return (
                        <Card 
                          key={template.id}
                          className="cursor-pointer transition-all hover:shadow-md"
                          onClick={() => handleTemplateSelect(template)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-muted rounded-lg">
                                <IconComponent className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium">{template.title}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {template.duration}s
                                  </Badge>
                                  {template.priority === 'urgent' && (
                                    <Badge variant="destructive" className="text-xs">
                                      Urgent
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {template.content}
                                </p>
                                {template.emoji_burst && (
                                  <div className="mt-2 text-lg">
                                    {template.emoji_burst.join(' ')}
                                  </div>
                                )}
                              </div>
                              <Button variant="ghost" size="sm">
                                Use Template
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* Compose Tab */}
            <TabsContent value="compose" className="space-y-4">
              {selectedTemplate && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Template loaded! Feel free to customize the message before sending.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Message Type</label>
                  <Select value={broadcastType} onValueChange={(value: BroadcastType) => setBroadcastType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">📢 General Message</SelectItem>
                      <SelectItem value="shout_out">📣 Shout Out</SelectItem>
                      <SelectItem value="poll">📊 Poll</SelectItem>
                      <SelectItem value="quick_response">⚡ Quick Response</SelectItem>
                      <SelectItem value="song_request">🎵 Song Request</SelectItem>
                      <SelectItem value="contest">🏆 Contest</SelectItem>
                      <SelectItem value="spotlight">✨ Spotlight</SelectItem>
                      <SelectItem value="vibe_check">🔥 Vibe Check</SelectItem>
                      <SelectItem value="custom">🎯 Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Priority Level</label>
                  <Select value={priority} onValueChange={(value: BroadcastPriority) => setPriority(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{getPriorityLabel('low')}</SelectItem>
                      <SelectItem value="normal">{getPriorityLabel('normal')}</SelectItem>
                      <SelectItem value="high">{getPriorityLabel('high')}</SelectItem>
                      <SelectItem value="urgent">{getPriorityLabel('urgent')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Title <span className="text-muted-foreground">(Keep it short and catchy)</span>
                </label>
                <Input
                  value={messageTitle}
                  onChange={(e) => setMessageTitle(e.target.value)}
                  placeholder="e.g., Dance Floor Challenge!"
                  maxLength={100}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {messageTitle.length}/100 characters
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Message <span className="text-muted-foreground">(What do you want to say?)</span>
                </label>
                <Textarea 
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Type your message here... Use [NAME] or [EVENT_NAME] as placeholders"
                  rows={4}
                  maxLength={500}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {messageContent.length}/500 characters
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Display Duration: {duration} seconds
                  </span>
                  <span className="text-xs text-muted-foreground font-normal">
                    How long should the message stay on screen?
                  </span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="300"
                  step="5"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="w-full"
                  aria-label={`Display duration: ${duration} seconds`}
                  title={`Display duration: ${duration} seconds`}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>10s (Quick)</span>
                  <span>5 minutes (Long)</span>
                </div>
              </div>

              {/* Live Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Live Preview</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                
                {showPreview && (messageTitle || messageContent) && (
                  <Card className={`${priority === 'urgent' ? 'border-red-500' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">
                          {getTypeEmoji(broadcastType)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{messageTitle || 'Broadcast Title'}</h4>
                            <Badge variant={priority === 'urgent' ? 'destructive' : 'secondary'} className="text-xs">
                              {broadcastType.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm">{messageContent || 'Your message will appear here...'}</p>
                          {selectedTemplate?.emoji_burst && (
                            <div className="mt-2 text-lg">
                              {selectedTemplate.emoji_burst.join(' ')}
                            </div>
                          )}
                          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {duration}s
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {packMemberCount} will see this
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4">
              {recentBroadcasts.length > 0 ? (
                <>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Your recent broadcasts from this session. Use these as reference for what works!
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-2">
                    {recentBroadcasts.map((broadcast, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">{getTypeEmoji(broadcast.type)}</span>
                                <h4 className="font-medium">{broadcast.title}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {broadcast.type.replace('_', ' ')}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Sent at {new Date(broadcast.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                            {broadcast.responses > 0 && (
                              <div className="text-center">
                                <p className="text-lg font-semibold">{broadcast.responses}</p>
                                <p className="text-xs text-muted-foreground">responses</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <History className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">No Broadcast History</h3>
                    <p className="text-sm text-muted-foreground">
                      Your sent broadcasts will appear here
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer Actions */}
        <div className="border-t pt-4 mt-4">
          <div className="flex gap-2">
            <Button 
              onClick={sendMassMessage} 
              disabled={!messageTitle.trim() || !messageContent.trim() || isSending || packMemberCount === 0}
              className="flex-1"
              size="lg"
            >
              {isSending ? (
                <>Sending...</>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send to {packMemberCount} Members
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleClose} size="lg">
              Cancel
            </Button>
          </div>
          
          {packMemberCount === 0 && (
            <p className="text-xs text-destructive text-center mt-2">
              No active pack members to receive broadcasts
            </p>
          )}
        </div>
      </div>
    </CenteredModal>
  );
}