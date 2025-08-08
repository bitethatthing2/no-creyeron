'use client';

import { useState } from 'react';
import { CenteredModal } from '@/components/shared/CenteredModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  Megaphone, 
  Music, 
  Trophy, 
  MessageSquare, 
  Users, 
  Sparkles,
  Clock,
  Palette,
  Plus,
  X,
  Send
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { 
  BroadcastType, 
  BroadcastPriority,
  InteractionConfig,
  BroadcastOption,
  Json
} from '@/types/features/dj-dashboard-types';
import type { Database } from '@/types/database.types';

interface BroadcastFormProps {
  djId: string;
  locationId: string;
  sessionId?: string;
  isOpen: boolean;
  onClose: () => void;
  onBroadcastCreated?: (broadcast: Database['public']['Tables']['dj_broadcasts']['Row']) => void;
}

const BROADCAST_TYPE_CONFIG: Record<BroadcastType, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  defaultDuration: number;
}> = {
  general: { label: 'General Announcement', icon: Megaphone, color: 'bg-blue-500', defaultDuration: 30 },
  shout_out: { label: 'Shout Out', icon: Users, color: 'bg-purple-500', defaultDuration: 20 },
  poll: { label: 'Poll', icon: MessageSquare, color: 'bg-green-500', defaultDuration: 60 },
  quick_response: { label: 'Quick Response', icon: MessageSquare, color: 'bg-yellow-500', defaultDuration: 45 },
  song_request: { label: 'Song Request', icon: Music, color: 'bg-pink-500', defaultDuration: 90 },
  contest: { label: 'Contest', icon: Trophy, color: 'bg-orange-500', defaultDuration: 120 },
  spotlight: { label: 'Spotlight', icon: Sparkles, color: 'bg-indigo-500', defaultDuration: 30 },
  vibe_check: { label: 'Vibe Check', icon: Sparkles, color: 'bg-red-500', defaultDuration: 30 },
  custom: { label: 'Custom', icon: Megaphone, color: 'bg-gray-500', defaultDuration: 60 }
};

const ANIMATION_TYPES = [
  { value: 'bounce', label: 'Bounce' },
  { value: 'slide', label: 'Slide In' },
  { value: 'fade', label: 'Fade' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'pulse', label: 'Pulse' },
  { value: 'shake', label: 'Shake' }
];

const EMOJI_BURSTS = ['🎉', '🔥', '💃', '🎵', '⭐', '🎊', '✨', '🎶', '🏆', '💯'];

export function BroadcastForm({ djId, locationId, sessionId, isOpen, onClose, onBroadcastCreated }: BroadcastFormProps) {
  // Form state
  const [broadcastType, setBroadcastType] = useState<BroadcastType>('general');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [priority, setPriority] = useState<BroadcastPriority>('normal');
  const [duration, setDuration] = useState(30);
  const [autoClose, setAutoClose] = useState(true);
  
  // Styling state
  const [backgroundColor, setBackgroundColor] = useState('#6366f1');
  const [textColor, setTextColor] = useState('#ffffff');
  const [accentColor, setAccentColor] = useState('#a855f7');
  const [animationType, setAnimationType] = useState('bounce');
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([]);
  
  // Interaction state
  const [responseType, setResponseType] = useState<'multiple_choice' | 'text' | 'emoji'>('multiple_choice');
  const [options, setOptions] = useState<BroadcastOption[]>([
    { id: '1', text: 'Option 1', emoji: '👍' },
    { id: '2', text: 'Option 2', emoji: '👎' }
  ]);
  const [showResultsLive, setShowResultsLive] = useState(true);
  const [anonymousResponses, setAnonymousResponses] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const needsOptions = ['poll', 'quick_response', 'contest'].includes(broadcastType);

  const handleAddOption = () => {
    const newOption: BroadcastOption = {
      id: Date.now().toString(),
      text: `Option ${options.length + 1}`,
      emoji: '🔵'
    };
    setOptions([...options, newOption]);
  };

  const handleRemoveOption = (id: string) => {
    if (options.length > 2) {
      setOptions(options.filter(opt => opt.id !== id));
    }
  };

  const handleUpdateOption = (id: string, field: keyof BroadcastOption, value: string) => {
    setOptions(options.map(opt => 
      opt.id === id ? { ...opt, [field]: value } : opt
    ));
  };

  const handleEmojiToggle = (emoji: string) => {
    setSelectedEmojis(prev => 
      prev.includes(emoji) 
        ? prev.filter(e => e !== emoji)
        : [...prev, emoji]
    );
  };

  const handleSubmit = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Please fill in the title and message');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const interactionConfig: InteractionConfig = needsOptions ? {
        response_type: responseType,
        options: options,
        allow_multiple: false,
        show_results_live: showResultsLive,
        anonymous_responses: anonymousResponses,
        show_responders: !anonymousResponses,
        highlight_responders: true,
        responder_display: 'avatar_with_name',
        animation_on_select: 'pulse',
        show_timer: true,
        countdown_seconds: duration
      } : {
        response_type: 'emoji',
        show_results_live: true,
        anonymous_responses: false
      };

      const broadcastData: Database['public']['Tables']['dj_broadcasts']['Insert'] = {
        dj_id: djId,
        location_id: locationId,
        session_id: sessionId,
        broadcast_type: broadcastType,
        title,
        message,
        subtitle: subtitle || null,
        priority,
        duration_seconds: duration,
        auto_close: autoClose,
        background_color: backgroundColor,
        text_color: textColor,
        accent_color: accentColor,
        animation_type: animationType,
        emoji_burst: selectedEmojis.length > 0 ? selectedEmojis : null,
        interaction_config: interactionConfig as unknown as Json,
        status: 'active',
        sent_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + duration * 1000).toISOString()
      };

      const { data, error } = await supabase
        .from('dj_broadcasts')
        .insert(broadcastData)
        .select()
        .single();

      if (error) throw error;

      // Send broadcast notification
      await supabase.rpc('send_broadcast_notification', {
        p_broadcast_id: data.id
      });

      toast.success('Broadcast sent successfully!');
      
      if (onBroadcastCreated) {
        onBroadcastCreated(data);
      }

      // Close modal and reset form
      onClose();
      setTitle('');
      setMessage('');
      setSubtitle('');
      setOptions([
        { id: '1', text: 'Option 1', emoji: '👍' },
        { id: '2', text: 'Option 2', emoji: '👎' }
      ]);
      setSelectedEmojis([]);

    } catch (error) {
      console.error('Error creating broadcast:', error);
      toast.error('Failed to create broadcast');
    } finally {
      setIsSubmitting(false);
    }
  };

  const config = BROADCAST_TYPE_CONFIG[broadcastType];
  const Icon = config.icon;

  return (
    <CenteredModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Broadcast"
      maxWidth="3xl"
      className="broadcast-modal"
    >
      <div className="p-4 broadcast-modal-content">
        <Card className="w-full bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Icon className="w-5 h-5" />
          Create New Broadcast
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Broadcast Type Selection */}
        <div className="space-y-2">
          <Label className="text-white">Broadcast Type</Label>
          <Select value={broadcastType} onValueChange={(value) => setBroadcastType(value as BroadcastType)}>
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(BROADCAST_TYPE_CONFIG).map(([type, config]) => {
                const TypeIcon = config.icon;
                return (
                  <SelectItem key={type} value={type}>
                    <div className="flex items-center gap-2">
                      <TypeIcon className="w-4 h-4" />
                      {config.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Title and Message */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter broadcast title..."
              maxLength={100}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle" className="text-white">Subtitle (optional)</Label>
            <Input
              id="subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Add a subtitle..."
              maxLength={150}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="text-white">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              rows={4}
              maxLength={500}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
            <span className="text-xs text-slate-400">{message.length}/500</span>
          </div>
        </div>

        {/* Options for polls/contests */}
        {needsOptions && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-white">Response Options</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddOption}
                disabled={options.length >= 6}
                className="border-slate-600 text-white hover:bg-slate-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Option
              </Button>
            </div>
            <div className="space-y-2">
              {options.map((option) => (
                <div key={option.id} className="flex items-center gap-2">
                  <Input
                    value={option.emoji || ''}
                    onChange={(e) => handleUpdateOption(option.id, 'emoji', e.target.value)}
                    className="w-16 text-center bg-slate-700 border-slate-600 text-white"
                    placeholder="🔵"
                    maxLength={2}
                  />
                  <Input
                    value={option.text}
                    onChange={(e) => handleUpdateOption(option.id, 'text', e.target.value)}
                    placeholder="Option text..."
                    className="flex-1 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveOption(option.id)}
                      className="text-white hover:bg-slate-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="show-results"
                  checked={showResultsLive}
                  onCheckedChange={setShowResultsLive}
                />
                <Label htmlFor="show-results" className="text-sm text-white">Show results live</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="anonymous"
                  checked={anonymousResponses}
                  onCheckedChange={setAnonymousResponses}
                />
                <Label htmlFor="anonymous" className="text-sm text-white">Anonymous responses</Label>
              </div>
            </div>
          </div>
        )}

        {/* Styling Options */}
        <div className="space-y-4">
          <Label className="text-white">Styling</Label>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bg-color" className="text-sm text-white">Background</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="bg-color"
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-full h-10"
                />
                <Input
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-24 text-xs bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="text-color" className="text-sm text-white">Text</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="text-color"
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-full h-10"
                />
                <Input
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-24 text-xs bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accent-color" className="text-sm text-white">Accent</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="accent-color"
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-full h-10"
                />
                <Input
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-24 text-xs bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Animation</Label>
            <Select value={animationType} onValueChange={setAnimationType}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ANIMATION_TYPES.map(anim => (
                  <SelectItem key={anim.value} value={anim.value}>
                    {anim.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Emoji Burst</Label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_BURSTS.map(emoji => (
                <Button
                  key={emoji}
                  type="button"
                  variant={selectedEmojis.includes(emoji) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleEmojiToggle(emoji)}
                  className="text-lg w-10 h-10 p-0"
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Broadcast Settings */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white">Priority</Label>
            <Select value={priority} onValueChange={(value) => setPriority(value as BroadcastPriority)}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">🚨 Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-white">
              <Clock className="w-4 h-4" />
              Duration: {duration} seconds
            </Label>
            <Slider
              value={[duration]}
              onValueChange={([value]) => setDuration(value)}
              min={10}
              max={300}
              step={5}
              className="w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="auto-close"
              checked={autoClose}
              onCheckedChange={setAutoClose}
            />
            <Label htmlFor="auto-close" className="text-white">Auto-close after duration</Label>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <Label className="text-white">Preview</Label>
          <div 
            className="rounded-lg p-4 relative overflow-hidden"
            style={{ 
              backgroundColor, 
              color: textColor,
              borderColor: accentColor,
              borderWidth: '2px',
              borderStyle: 'solid'
            }}
          >
            {selectedEmojis.length > 0 && (
              <div className="absolute top-2 right-2 flex gap-1">
                {selectedEmojis.map(emoji => (
                  <span key={emoji} className="text-2xl animate-bounce">{emoji}</span>
                ))}
              </div>
            )}
            <div className="space-y-2">
              <h3 className="font-bold text-lg">{title || 'Broadcast Title'}</h3>
              {subtitle && <p className="text-sm opacity-80">{subtitle}</p>}
              <p className="text-sm">{message || 'Your message will appear here...'}</p>
              {needsOptions && (
                <div className="mt-4 space-y-2">
                  {options.map(option => (
                    <div 
                      key={option.id} 
                      className="p-2 rounded"
                      style={{ backgroundColor: accentColor + '33' }}
                    >
                      <span className="mr-2">{option.emoji}</span>
                      {option.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !title.trim() || !message.trim()}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? (
            <>Sending...</>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send Broadcast
            </>
          )}
        </Button>
        </CardContent>
      </Card>
      </div>
    </CenteredModal>
  );
}