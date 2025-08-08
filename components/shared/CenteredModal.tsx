'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getZIndexClass } from '@/lib/constants/z-index';

interface CenteredModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
}

export function CenteredModal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'lg',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = ''
}: CenteredModalProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl'
  };

  return (
    <div className={`fixed inset-0 ${getZIndexClass('USER_PROFILE_MODAL_OVERRIDE')} flex items-center justify-center p-4`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeOnOverlayClick ? onClose : undefined}
      />
      
      {/* Modal */}
      <div 
        className={`
          relative w-full ${maxWidthClasses[maxWidth]} 
          bg-background border border-border rounded-lg shadow-lg
          max-h-full overflow-hidden
          animate-in fade-in-0 zoom-in-95 duration-200
          ${className} ${getZIndexClass('USER_PROFILE_MODAL_OVERRIDE')}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {showCloseButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          )}
        </div>
        
        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(100vh-200px)] p-4">
          {children}
        </div>
      </div>
    </div>
  );
}

// Event Creation Modal Component
interface EventCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreate: (eventData: any) => void;
}

export function EventCreationModal({ isOpen, onClose, onEventCreate }: EventCreationModalProps) {
  const [selectedEventType, setSelectedEventType] = React.useState<string | null>(null);
  const [eventTitle, setEventTitle] = React.useState('');
  const [eventDuration, setEventDuration] = React.useState('15min');

  const eventTypes = [
    {
      id: 'freestyle_friday',
      title: 'Freestyle Friday',
      description: 'Rap battle and freestyle competition',
      icon: '🎤',
      category: 'single',
      defaultDuration: '15min'
    },
    {
      id: 'costume_contest',
      title: 'Costume Contest',
      description: 'Best dressed competition',
      icon: '⭐',
      category: 'single',
      defaultDuration: '10min'
    },
    {
      id: 'dance_battle',
      title: 'Dance Battle',
      description: 'Show off your moves',
      icon: '🎵',
      category: 'single',
      defaultDuration: '12min'
    },
    {
      id: 'trivia_challenge',
      title: 'Trivia Challenge',
      description: 'Test your knowledge',
      icon: '🧠',
      category: 'multiple',
      defaultDuration: '20min'
    }
  ];

  const handleEventTypeSelect = (eventType: any) => {
    setSelectedEventType(eventType.id);
    setEventTitle(eventType.title);
    setEventDuration(eventType.defaultDuration);
  };

  const handleCreateEvent = () => {
    if (!selectedEventType || !eventTitle.trim()) return;

    const eventData = {
      type: selectedEventType,
      title: eventTitle,
      duration: eventDuration,
      created_at: new Date().toISOString()
    };

    onEventCreate(eventData);
    
    // Reset form
    setSelectedEventType(null);
    setEventTitle('');
    setEventDuration('15min');
    onClose();
  };

  return (
    <CenteredModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Event"
      maxWidth="2xl"
    >
      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-4">Choose Event Type</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {eventTypes.map((eventType) => (
              <button
                key={eventType.id}
                onClick={() => handleEventTypeSelect(eventType)}
                className={`
                  p-4 border-2 rounded-lg text-left transition-all
                  hover:border-primary hover:bg-muted/50
                  ${selectedEventType === eventType.id 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{eventType.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{eventType.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {eventType.description}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs bg-muted px-2 py-1 rounded">
                        {eventType.category}
                      </span>
                      <span className="text-xs bg-muted px-2 py-1 rounded">
                        {eventType.defaultDuration}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedEventType && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Event Title</label>
              <input
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="w-full p-3 border border-border rounded-lg bg-background"
                placeholder="Enter event title..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Duration</label>
              <select
                value={eventDuration}
                onChange={(e) => setEventDuration(e.target.value)}
                className="w-full p-3 border border-border rounded-lg bg-background"
              >
                <option value="5min">5 minutes</option>
                <option value="10min">10 minutes</option>
                <option value="15min">15 minutes</option>
                <option value="20min">20 minutes</option>
                <option value="30min">30 minutes</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleCreateEvent}
                className="flex-1"
                disabled={!eventTitle.trim()}
              >
                Create Event
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </CenteredModal>
  );
}

// Mass Message Modal Component
interface MassMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (messageData: any) => void;
  memberCount?: number;
}

export function MassMessageModal({ 
  isOpen, 
  onClose, 
  onSendMessage, 
  memberCount = 5 
}: MassMessageModalProps) {
  const [selectedTemplate, setSelectedTemplate] = React.useState<string | null>(null);
  const [customMessage, setCustomMessage] = React.useState('');

  const messageTemplates = [
    {
      id: 'event_starting',
      title: 'Event Starting Soon',
      category: 'event',
      icon: '🎵',
      message: '🎉 Get ready! [EVENT_NAME] is starting in 5 minutes! Join the fun and show your pack spirit! 🐺'
    },
    {
      id: 'voting_open',
      title: 'Voting Now Open',
      category: 'announcement',
      icon: '🗳️',
      message: '🗳️ Voting is now LIVE for [EVENT_NAME]! Cast your vote and help decide the winner! Every vote counts! ⭐'
    },
    {
      id: 'energy_boost',
      title: 'Energy Boost',
      category: 'general',
      icon: '🔥',
      message: '🔥 The energy in here is AMAZING! Keep it up, Wolf Pack! Let&apos;s make this night unforgettable! 🎵'
    }
  ];

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template.id);
    setCustomMessage(template.message);
  };

  const handleSendMessage = () => {
    if (!customMessage.trim()) return;

    const messageData = {
      template: selectedTemplate,
      message: customMessage,
      recipient_count: memberCount,
      sent_at: new Date().toISOString()
    };

    onSendMessage(messageData);
    
    // Reset form
    setSelectedTemplate(null);
    setCustomMessage('');
    onClose();
  };

  return (
    <CenteredModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Mass Message to Wolf Pack (${memberCount} members)`}
      maxWidth="xl"
    >
      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-4">Quick Templates</h3>
          <div className="space-y-3">
            {messageTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className={`
                  w-full p-4 border-2 rounded-lg text-left transition-all
                  hover:border-primary hover:bg-muted/50
                  ${selectedTemplate === template.id 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">{template.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-foreground">{template.title}</h4>
                      <span className="text-xs bg-muted px-2 py-1 rounded">
                        {template.category}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {template.message}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Message Content</label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full p-3 border border-border rounded-lg bg-background min-h-[120px] resize-none"
              placeholder="Type your message to the wolf pack..."
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {customMessage.length}/500 characters
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSendMessage}
              className="flex-1"
              disabled={!customMessage.trim()}
            >
              Send to {memberCount} Members
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </CenteredModal>
  );
}