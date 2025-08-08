'use client';

import Image from "next/image";
import { Calendar, Clock, Ticket, ExternalLink } from "lucide-react";
import type { Event } from '@/types/features/event';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface EventCardProps {
  event: Event;
}

export const EventCard = ({ event }: EventCardProps) => {
  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Determine if event is in the past
  const isPastEvent = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(event.date);
    return eventDate < today;
  };

  // Handle price display if available
  const formatPrice = (price?: number) => {
    if (!price) return 'Free';
    return `$${price.toFixed(2)}`;
  };

  // Placeholder for image loading or error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = '/images/event-placeholder.jpg';
  };

  // Determine if we should show the tickets button
  const showTicketsButton = event.external_ticket_link && !isPastEvent() && !event.is_cancelled;

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md group">
      <div className="relative">
        <AspectRatio ratio={16/9}>
          <Image 
            src={event.image} 
            alt={event.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={handleImageError}
          />
        </AspectRatio>
        
        {event.featured && (
          <Badge 
            variant="default" 
            className="absolute top-2 right-2 bg-primary/90 backdrop-blur-sm"
          >
            Featured
          </Badge>
        )}
        
        {event.is_cancelled && (
          <div className="absolute inset-0 bg-destructive/20 backdrop-blur-sm flex items-center justify-center">
            <Badge 
              variant="destructive" 
              className="text-sm font-medium px-3 py-1"
            >
              Cancelled
            </Badge>
          </div>
        )}
      </div>

      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-lg font-medium">{event.title}</CardTitle>
        
        <div className="flex flex-wrap gap-3 mt-2 text-muted-foreground text-sm">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{formatTime(event.date)}</span>
          </div>
        </div>
        
        {event.description && (
          <CardDescription className="mt-2 line-clamp-3">
            {event.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardFooter className="p-4 pt-2 flex justify-between items-center">
        {event.price ? (
          <span className="text-sm font-semibold text-primary">
            {formatPrice(event.price)}
          </span>
        ) : (
          <span></span> // Empty span to maintain flex layout
        )}
        
        {showTicketsButton && (
          <Button 
            size="sm" 
            className="gap-1"
            asChild
          >
            <a href={event.external_ticket_link} target="_blank" rel="noopener noreferrer">
              <Ticket className="h-4 w-4" />
              Get Tickets
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
