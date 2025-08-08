'use client';

import React, { useState } from 'react';
import { format } from "date-fns/format";
import { Calendar as CalendarIcon, Users, Phone, Clock, Loader2 } from 'lucide-react';
import { useLocationState } from '@/lib/hooks/useLocationState';
import { useToast } from '@/components/ui/use-toast';
import { BookingRequest, BookingType } from '@/types/features/booking';
import { submitBookingRequest } from '@/lib/booking/submitBookingRequest';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// Generate time slots from 11 AM to 10 PM with 30-minute intervals
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 11; hour <= 22; hour++) {
    const hourFormatted = hour > 12 ? hour - 12 : hour;
    const period = hour >= 12 ? 'PM' : 'AM';
    
    slots.push(`${hourFormatted}:00 ${period}`);
    slots.push(`${hourFormatted}:30 ${period}`);
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

const BOOKING_TYPES: { value: BookingType; label: string }[] = [
  { value: 'Table', label: 'Table Reservation' },
  { value: 'Party', label: 'Private Party' },
  { value: 'Catering', label: 'Catering' },
];

export interface BookingFormProps {
  onSuccessAction: () => void;
  location?: 'portland' | 'salem';
}

export function BookingForm({ onSuccessAction, location }: BookingFormProps) {
  const { location: locationState } = useLocationState();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string | undefined>(undefined);
  const [bookingType, setBookingType] = useState<BookingType>('Table');
  const [notes, setNotes] = useState('');
  
  // Form validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!contactInfo.trim()) newErrors.contactInfo = 'Contact information is required';
    if (!date) newErrors.date = 'Date is required';
    if (!time) newErrors.time = 'Time is required';
    if (!partySize || partySize < 1) newErrors.partySize = 'Valid party size is required';
    if (!bookingType) newErrors.bookingType = 'Booking type is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    // Construct the booking request
    const bookingRequest: BookingRequest = {
      name,
      contact_info: contactInfo,
      requested_date: date ? format(date, 'yyyy-MM-dd') : '',
      requested_time: time || '',
      party_size: partySize,
      booking_type: bookingType,
      notes: notes.trim() || undefined,
      location_id: location || locationState,
      status: 'pending'
    };
    
    try {
      await submitBookingRequest(bookingRequest);
      toast({
        title: "Booking request submitted",
        description: "We'll contact you shortly to confirm your reservation.",
      });
      onSuccessAction();
    } catch (error) {
      console.error("Error submitting booking request:", error);
      toast({
        title: "Something went wrong",
        description: "Unable to submit your booking request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name" className="block mb-1.5">
            Full Name
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            disabled={isSubmitting}
            className={errors.name ? "border-destructive" : ""}
          />
          {errors.name && (
            <p className="text-destructive text-sm mt-1">{errors.name}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="contactInfo" className="block mb-1.5">
            Contact Information
          </Label>
          <div className="flex items-center">
            <Phone className="h-4 w-4 text-muted-foreground mr-2" />
            <Input
              id="contactInfo"
              type="text"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              placeholder="Phone number or email"
              disabled={isSubmitting}
              className={errors.contactInfo ? "border-destructive" : ""}
            />
          </div>
          {errors.contactInfo && (
            <p className="text-destructive text-sm mt-1">{errors.contactInfo}</p>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date" className="block mb-1.5">
              Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-start text-left font-normal ${
                    !date ? "text-muted-foreground" : ""
                  } ${errors.date ? "border-destructive" : ""}`}
                  disabled={isSubmitting}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.date && (
              <p className="text-destructive text-sm mt-1">{errors.date}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="time" className="block mb-1.5">
              Time
            </Label>
            <Select onValueChange={setTime} value={time} disabled={isSubmitting}>
              <SelectTrigger id="time" className={errors.time ? "border-destructive" : ""}>
                <SelectValue placeholder="Select time">
                  {time ? (
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>{time}</span>
                    </div>
                  ) : (
                    "Select time"
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.time && (
              <p className="text-destructive text-sm mt-1">{errors.time}</p>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="partySize" className="block mb-1.5">
              Party Size
            </Label>
            <div className="flex items-center">
              <Users className="h-4 w-4 text-muted-foreground mr-2" />
              <Input
                id="partySize"
                type="number"
                min="1"
                max="50"
                value={partySize}
                onChange={(e) => setPartySize(parseInt(e.target.value) || 1)}
                disabled={isSubmitting}
                className={errors.partySize ? "border-destructive" : ""}
              />
            </div>
            {errors.partySize && (
              <p className="text-destructive text-sm mt-1">{errors.partySize}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="bookingType" className="block mb-1.5">
              Booking Type
            </Label>
            <Select
              onValueChange={(value: BookingType) => setBookingType(value)}
              value={bookingType}
              disabled={isSubmitting}
            >
              <SelectTrigger
                id="bookingType"
                className={errors.bookingType ? "border-destructive" : ""}
              >
                <SelectValue placeholder="Select booking type" />
              </SelectTrigger>
              <SelectContent>
                {BOOKING_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.bookingType && (
              <p className="text-destructive text-sm mt-1">{errors.bookingType}</p>
            )}
          </div>
        </div>
        
        <div>
          <Label htmlFor="notes" className="block mb-1.5">
            Special Requests <span className="text-muted-foreground">(Optional)</span>
          </Label>
          <Textarea
            id="notes"
            placeholder="Any dietary requirements, special occasions, etc."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isSubmitting}
            className="resize-none min-h-[100px]"
          />
        </div>
      </div>
      
      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
          </>
        ) : (
          "Submit Booking Request"
        )}
      </Button>
    </form>
  );
}