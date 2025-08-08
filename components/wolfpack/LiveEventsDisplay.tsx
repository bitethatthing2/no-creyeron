'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AvatarWithFallback } from '@/components/shared/ImageWithFallback';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Trophy, 
  Users, 
  Clock, 
  Vote,
  Music,
  Star,
  Crown,
  Zap,
  PartyPopper,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface ParticipantMetadata {
  display_name?: string;
  avatar_url?: string;
  wolf_emoji?: string;
  [key: string]: unknown;
}

interface EventConfig {
  duration_minutes?: number;
  max_contestants?: number;
  [key: string]: unknown;
}

interface VotingOption {
  id?: string;
  value?: string;
  label?: string;
  name?: string;
  text?: string;
  image?: string;
  emoji?: string;
  [key: string]: unknown;
}

interface WinnerData {
  [key: string]: unknown;
}

// Helper function to safely access Json properties
function getJsonProperty(obj: unknown, key: string): unknown {
  if (obj && typeof obj === 'object' && !Array.isArray(obj) && obj !== null) {
    return (obj as Record<string, unknown>)[key];
  }
  return undefined;
}

// Type guard for checking if value is a record
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// Safe metadata access
function getMetadataProperty(metadata: unknown, key: string): string | undefined {
  const value = getJsonProperty(metadata, key);
  return typeof value === 'string' ? value : undefined;
}

// Convert Json to ParticipantMetadata safely
function jsonToParticipantMetadata(json: unknown): ParticipantMetadata | undefined {
  if (!isRecord(json)) return undefined;
  
  return {
    display_name: getMetadataProperty(json, 'display_name'),
    avatar_url: getMetadataProperty(json, 'avatar_url'),
    wolf_emoji: getMetadataProperty(json, 'wolf_emoji'),
    ...json
  };
}

// Convert Json to EventConfig safely
function jsonToEventConfig(json: unknown): EventConfig {
  if (!isRecord(json)) return {};
  
  const duration = getJsonProperty(json, 'duration_minutes');
  const maxContestants = getJsonProperty(json, 'max_contestants');
  
  return {
    duration_minutes: typeof duration === 'number' ? duration : undefined,
    max_contestants: typeof maxContestants === 'number' ? maxContestants : undefined,
    ...json
  };
}

// Convert Json array to VotingOption array safely
function jsonToVotingOptions(json: unknown): VotingOption[] {
  if (!Array.isArray(json)) return [];
  
  return json.map((item, index) => {
    if (!isRecord(item)) return { id: `option_${index}` };
    
    return {
      id: getMetadataProperty(item, 'id'),
      value: getMetadataProperty(item, 'value'),
      label: getMetadataProperty(item, 'label'),
      name: getMetadataProperty(item, 'name'),
      text: getMetadataProperty(item, 'text'),
      image: getMetadataProperty(item, 'image'),
      emoji: getMetadataProperty(item, 'emoji'),
      ...item
    };
  });
}

interface EventContestant {
  id: string;
  participant_id: string | null;
  participant_number?: number | null;
  display_name: string;
  avatar_url?: string;
  wolf_emoji?: string;
  votes: number;
  metadata?: ParticipantMetadata;
}

interface LiveEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  status: string | null;
  location_id: string | null;
  dj_id: string | null;
  dj_name: string;
  duration_minutes: number;
  max_contestants: number;
  created_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  voting_ends_at: string | null;
  contestants: EventContestant[];
  total_votes: number;
  user_voted: boolean;
  winner_id: string | null;
  winner_data: WinnerData;
  event_config: EventConfig;
  voting_format: string | null;
  options: VotingOption[];
}

const EVENT_EMOJIS: Record<string, string> = {
  freestyle_friday: '🎤',
  rap_battle: '⚔️',
  costume_contest: '🎭',
  karaoke: '🎵',
  dance_off: '💃',
  trivia: '🧠',
  'dj-battle': '🎧',
  'crowd-favorite': '👏',
  'best-dressed': '👔',
  'dance-contest': '🕺'
};


export function LiveEventsDisplay({ locationId, userId }: { locationId: string; userId: string }) {
  const { user } = useAuth();
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votingFor, setVotingFor] = useState<string | null>(null);

    // Load active events
  useEffect(() => {
    async function loadEvents() {
      try {
        setIsLoading(true);
        setError(null);

        // Get active events for this location
        const { data: eventsData, error: eventsError } = await supabase
          .from('dj_events')
          .select('*')
          .eq('location_id', locationId)
          .in('status', ['active', 'voting'])
          .order('created_at', { ascending: false });

        if (eventsError) {
          console.error('Events error:', eventsError);
          throw eventsError;
        }

        if (!eventsData || eventsData.length === 0) {
          setEvents([]);
          setIsLoading(false);
          return;
        }

        // Get DJs info
        const djIds = [...new Set(eventsData.map(e => e.dj_id).filter((id): id is string => typeof id === 'string'))];
        let djsMap = new Map<string, { id: string; first_name: string | null; last_name: string | null; email: string; avatar_url: string | null }>();
        
        if (djIds.length > 0) {
          const { data: djsData } = await supabase
            .from('users')
            .select('id, email, first_name, last_name, avatar_url')
            .in('id', djIds);
          
          djsMap = new Map(djsData?.map(dj => [dj.id, dj]) || []);
        }

        // For each event, get participants and votes
        const processedEvents: LiveEvent[] = await Promise.all(
          eventsData.map(async (event) => {
            // Get participants
            const { data: participants, error: participantsError } = await supabase
              .from('dj_event_participants')
              .select('*')
              .eq('event_id', event.id);

            if (participantsError) {
              console.error('Error loading participants:', participantsError);
            }

            // Get participant user details and wolf profiles
            const participantIds = [...new Set((participants || []).map(p => p.participant_id).filter((id): id is string => id !== null))];
            let participantUsersMap = new Map();
            let wolfProfilesMap = new Map();
            
            if (participantIds.length > 0) {
              // Get user data
              const { data: participantUsers } = await supabase
                .from('users')
                .select('id, first_name, last_name, avatar_url')
                .in('id', participantIds);

              participantUsersMap = new Map(participantUsers?.map(u => [u.id, u]) || []);

              // Get user profiles (now in users table)
              const { data: userProfiles } = await supabase
                .from('users')
                .select('id, display_name, wolf_emoji, profile_image_url, vibe_status')
                .in('id', participantIds);

              wolfProfilesMap = new Map(userProfiles?.map(p => [p.id, p]) || []);
            }

            // TODO: Implement voting when wolf_pack_votes table is created
            // For now, mock the voting data to avoid breaking the interface
            const votes: any[] = [];
            
            // Check if current user voted - always false for now
            const userVoted = false;

            // Count votes per option/participant
            const voteCounts = new Map<string, number>();
            votes?.forEach(vote => {
              // Use voted_for_id or participant_id as the vote key
              const voteKey = vote.voted_for_id || vote.participant_id;
              if (voteKey) {
                const count = voteCounts.get(voteKey) || 0;
                voteCounts.set(voteKey, count + 1);
              }
            });

            // Map participants to contestants with vote counts
            const contestants: EventContestant[] = (participants || []).map(p => {
              const participantUser = p.participant_id ? participantUsersMap.get(p.participant_id) : null;
              const wolfProfile = p.participant_id ? wolfProfilesMap.get(p.participant_id) : null;
              
              // Safe metadata access using helper functions
              const metadataDisplayName = getMetadataProperty(p.metadata, 'display_name');
              const metadataAvatarUrl = getMetadataProperty(p.metadata, 'avatar_url');
              const metadataWolfEmoji = getMetadataProperty(p.metadata, 'wolf_emoji');
              
              // Build display name from available data
              let displayName = 'Anonymous Wolf';
              if (wolfProfile?.display_name) {
                displayName = wolfProfile.display_name;
              } else if (participantUser?.first_name) {
                displayName = participantUser.first_name;
                if (participantUser.last_name) {
                  displayName += ` ${participantUser.last_name}`;
                }
              } else if (metadataDisplayName) {
                displayName = metadataDisplayName;
              } else if (p.participant_number) {
                displayName = `Contestant ${p.participant_number}`;
              }
              
              // Get vote count - check both participant_id and the participant record id
              let voteCount = 0;
              if (p.participant_id) {
                voteCount = voteCounts.get(p.participant_id) || 0;
              }
              // Also check if votes are stored by participant record ID
              voteCount = voteCount || voteCounts.get(p.id) || 0;
              
              return {
                id: p.id,
                participant_id: p.participant_id,
                participant_number: p.participant_number,
                display_name: displayName,
                avatar_url: wolfProfile?.profile_image_url || 
                           participantUser?.avatar_url || 
                           metadataAvatarUrl || 
                           undefined,
                wolf_emoji: wolfProfile?.wolf_emoji || metadataWolfEmoji || '🐺',
                votes: voteCount,
                metadata: jsonToParticipantMetadata(p.metadata)
              };
            });

            // If event has options in JSON, add those as contestants too
            const votingOptions = jsonToVotingOptions(event.options);
            votingOptions.forEach((option, index) => {
              const optionId = option.id || option.value || `option_${index}`;
              contestants.push({
                id: optionId,
                participant_id: null,
                display_name: option.label || option.name || option.text || `Option ${index + 1}`,
                avatar_url: option.image || undefined,
                wolf_emoji: option.emoji || '🎯',
                votes: voteCounts.get(optionId) || 0,
                metadata: jsonToParticipantMetadata(option)
              });
            });

            const totalVotes = Array.from(voteCounts.values()).reduce((sum, count) => sum + count, 0);

            // Get DJ info
            const dj = event.dj_id ? djsMap.get(event.dj_id) : null;
            const djName = dj?.first_name 
              ? `${dj.first_name}${dj.last_name ? ' ' + dj.last_name : ''}`
              : 'DJ';

            // Extract duration and max contestants from event_config using helper function
            const eventConfig = jsonToEventConfig(event.event_config);
            const duration = eventConfig.duration_minutes || 30;
            const maxContestants = eventConfig.max_contestants || 10;

            // Determine the effective end time
            let effectiveEndTime = event.voting_ends_at || event.ended_at;
            if (!effectiveEndTime && event.created_at) {
              // If no end time specified, calculate based on duration
              effectiveEndTime = new Date(new Date(event.created_at).getTime() + duration * 60000).toISOString();
            }

            return {
              id: event.id,
              title: event.title,
              description: event.description,
              event_type: event.event_type,
              status: event.status || 'active',
              location_id: event.location_id,
              dj_id: event.dj_id,
              dj_name: djName,
              duration_minutes: duration,
              max_contestants: maxContestants,
              created_at: event.created_at,
              started_at: event.started_at,
              ended_at: event.ended_at,
              voting_ends_at: event.voting_ends_at,
              contestants,
              total_votes: totalVotes,
              user_voted: userVoted,
              winner_id: event.winner_id,
              winner_data: isRecord(event.winner_data) ? event.winner_data : {},
              event_config: eventConfig,
              voting_format: event.voting_format,
              options: votingOptions
            };
          })
        );

        setEvents(processedEvents);

      } catch (error) {
        console.error('Error loading events:', error);
        setError('Failed to load live events');
        toast.error('Failed to load live events');
      } finally {
        setIsLoading(false);
      }
    }

    if (locationId) {
      loadEvents();

      // Set up real-time subscription for events
      const eventsSubscription = supabase
        .channel(`live_events_${locationId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'dj_events',
            filter: `location_id=eq.${locationId}`
          },
          () => {
            loadEvents(); // Reload when events change
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'wolf_pack_votes'
          },
          () => {
            loadEvents(); // Reload when votes change
          }
        )
        .subscribe();

      return () => {
        eventsSubscription.unsubscribe();
      };
    }
  }, [locationId, userId]);

  // Vote for contestant
  const voteForContestant = async (eventId: string, optionId: string) => {
    if (!user || votingFor) return;

    try {
      setVotingFor(optionId);

      const { error } = await supabase
        .from('wolf_pack_votes')
        .insert({
          event_id: eventId,
          voter_id: user.id,
          voted_for_id: optionId,
          created_at: new Date().toISOString()
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast.error('You have already voted in this event');
        } else {
          throw error;
        }
        return;
      }

      // Update local state optimistically
      setEvents(prev => prev.map(event => {
        if (event.id === eventId) {
          return {
            ...event,
            user_voted: true,
            contestants: event.contestants.map(c => 
              c.id === optionId 
                ? { ...c, votes: c.votes + 1 }
                : c
            ),
            total_votes: event.total_votes + 1
          };
        }
        return event;
      }));

      toast.success('Vote cast! 🗳️');

    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Failed to cast vote');
    } finally {
      setVotingFor(null);
    }
  };

  // Format time remaining
  const getTimeRemaining = (endsAt: string | null) => {
    if (!endsAt) return 'Ongoing';
    
    const now = new Date();
    const end = new Date(endsAt);
    const diffMs = end.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins <= 0) return 'Ending soon';
    if (diffMins < 60) return `${diffMins}m left`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m left`;
  };

  // Get event status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'voting': return 'bg-blue-500';
      case 'ended': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  // Get event emoji
  const getEventEmoji = (eventType: string) => {
    return EVENT_EMOJIS[eventType] || '🎉';
  };


  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading live events...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Live Events & Contests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Live Events & Contests
          </CardTitle>
          <CardDescription>
            No live events right now. Check back later for DJ-hosted contests!
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <PartyPopper className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">
            The DJ will create interactive events throughout the night
          </p>
          <div className="text-sm text-muted-foreground">
            <p>• Freestyle Fridays</p>
            <p>• Rap Battles</p>
            <p>• Costume Contests</p>
            <p>• Dance Battles</p>
            <p>• And more!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Trophy className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Live Events & Contests</h2>
        <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
      </div>

      <AnimatePresence>
        {events.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className={`overflow-hidden border-2 ${event.status === 'active' ? 'border-green-500/50' : 'border-blue-500/50'}`}>
              {/* Event Header */}
              <div className={`event-gradient-${event.event_type.replace(/_/g, '-')} p-4 text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">
                      {getEventEmoji(event.event_type)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{event.title}</h3>
                      {event.description && (
                        <p className="text-sm opacity-90">{event.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="mb-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(event.status || 'active')} mr-2 status-dot`} />
                      {(event.status || 'active').toUpperCase()}
                    </Badge>
                    <div className="text-sm opacity-90">
                      {event.dj_id && (
                        <div className="flex items-center gap-1">
                          <Music className="h-3 w-3" />
                          DJ {event.dj_name}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {getTimeRemaining(event.voting_ends_at || event.ended_at)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <CardContent className="p-6">
                {/* Event Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{event.contestants.length}</div>
                    <div className="text-sm text-muted-foreground">
                      {event.voting_format === 'options' ? 'Options' : 'Contestants'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{event.total_votes}</div>
                    <div className="text-sm text-muted-foreground">Total Votes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{event.duration_minutes}m</div>
                    <div className="text-sm text-muted-foreground">Duration</div>
                  </div>
                </div>

                {/* Contestants & Voting */}
                {event.contestants.length > 0 ? (
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {event.voting_format === 'options' ? 'Vote Options' : 'Contestants'}
                      {event.status === 'voting' && !event.user_voted && (
                        <Badge variant="outline" className="animate-pulse">Vote Now!</Badge>
                      )}
                    </h4>

                    <div className="grid gap-4">
                      {event.contestants
                        .sort((a, b) => b.votes - a.votes)
                        .map((contestant, contestantIndex) => {
                          const votePercentage = event.total_votes > 0 
                            ? (contestant.votes / event.total_votes) * 100 
                            : 0;
                          const isWinner = event.winner_id === contestant.id || 
                                         (contestant.participant_id && event.winner_id === contestant.participant_id);
                          const isLeading = contestantIndex === 0 && contestant.votes > 0;

                          return (
                            <div
                              key={contestant.id}
                              className={`p-4 border rounded-lg transition-all event-card-wrapper ${
                                isWinner
                                  ? 'winner-card'
                                  : isLeading
                                    ? 'leading-card'
                                    : 'border-border hover:border-primary/50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {isWinner && <Crown className="h-5 w-5 text-yellow-500" />}
                                  {isLeading && !isWinner && <Star className="h-5 w-5 text-green-500" />}
                                  
                                  {contestant.participant_id && (
                                    <AvatarWithFallback
                                      src={contestant.avatar_url}
                                      name={contestant.display_name}
                                      emoji={contestant.wolf_emoji}
                                      size="md"
                                    />
                                  )}
                                  
                                  <div>
                                    <div className="font-medium flex items-center gap-2">
                                      {contestant.display_name}
                                      {isWinner && <span className="text-yellow-500">👑</span>}
                                      {isLeading && !isWinner && <span className="text-green-500">🔥</span>}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {contestant.votes} votes ({votePercentage.toFixed(1)}%)
                                    </div>
                                  </div>
                                </div>

                                {event.status === 'voting' && !event.user_voted && !isWinner && (
                                  <Button
                                    onClick={() => voteForContestant(event.id, contestant.id)}
                                    disabled={votingFor === contestant.id}
                                    size="sm"
                                    className="ml-4"
                                  >
                                    {votingFor === contestant.id ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    ) : (
                                      <>
                                        <Vote className="h-4 w-4 mr-1" />
                                        Vote
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>

                              {/* Vote Progress Bar */}
                              {event.total_votes > 0 && (
                                <div className="mt-3">
                                  <div className="vote-progress-container">
                                    <div
                                      className="vote-progress-bar"
                                      style={{ '--progress-width': `${votePercentage}%` } as React.CSSProperties}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>

                    {/* Voting Status */}
                    {event.user_voted ? (
                      <Alert>
                        <Zap className="h-4 w-4" />
                        <AlertDescription>
                          Thanks for voting! Results will be announced when the event ends.
                        </AlertDescription>
                      </Alert>
                    ) : event.status === 'voting' ? (
                      <Alert>
                        <Vote className="h-4 w-4" />
                        <AlertDescription>
                          Voting is open! Cast your vote for your favorite{' '}
                          {event.voting_format === 'options' ? 'option' : 'contestant'}.
                        </AlertDescription>
                      </Alert>
                    ) : null}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Waiting for contestants to join...</p>
                    <p className="text-sm">The DJ will select participants from the Wolf Pack</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
