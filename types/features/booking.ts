export interface BookingData {
  name: string;
  email: string;
  phone?: string;
  date: string;
  time: string;
  partySize: number;
  specialRequests?: string;
}

export interface BookingFormData extends BookingData {
  termsAccepted: boolean;
}

export interface BookingResponse {
  success: boolean;
  bookingId?: string;
  message?: string;
  error?: string;
}