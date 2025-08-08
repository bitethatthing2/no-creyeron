import { BookingRequest } from '@/types/features/booking';

/**
 * Submits a booking request to the Supabase Edge Function
 * 
 * @param bookingRequest The booking request data to submit
 * @returns A promise that resolves to the response data
 */
export async function submitBookingRequest(bookingRequest: BookingRequest): Promise<{
  success: boolean;
  message: string;
  data?: BookingRequest & { id: string; created_at: string };
  error?: string;
}> {
  try {
    // In production, use the actual endpoint URL
    // const endpoint = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/submit-booking-request`;
    
    // For development, we'll use a mock response
    // Remove this in production and uncomment the above endpoint
    
    // Simulate API call with a delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // In production, make the actual fetch request:
    // const response = await fetch(endpoint, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     // Add any auth headers if needed
    //   },
    //   body: JSON.stringify(bookingRequest),
    // });
    
    // if (!response.ok) {
    //   const errorData = await response.json();
    //   return {
    //     success: false,
    //     message: errorData.error || 'Failed to submit booking request',
    //     error: errorData.error,
    //   };
    // }
    
    // const data = await response.json();
    // return {
    //   success: true,
    //   message: data.message || 'Booking request submitted successfully',
    //   data: data.data,
    // };
    
    // Mock successful response
    return {
      success: true,
      message: 'Booking request submitted successfully',
      data: {
        ...bookingRequest,
        id: `mock-${Date.now()}`,
        created_at: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Error submitting booking request:', error);
    return {
      success: false,
      message: 'An unexpected error occurred',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
