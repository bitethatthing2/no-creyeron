/**
 * @deprecated This utility is deprecated and will be removed in a future release.
 * Please use the /api/send-notification API route directly instead.
 * This file exists only for backward compatibility.
 */

import { SendNotificationRequest, SendNotificationResponse } from '@/types/features/api';

export interface SendNotificationParams {
  title: string;
  message: string;
  token?: string;
  topic?: string;
  link?: string;
  image?: string;
  data?: Record<string, unknown>;
}

/**
 * @deprecated Use the /api/send-notification API route directly instead
 * 
 * This function is maintained for backward compatibility only.
 * It forwards all requests to the /api/send-notification API route.
 */
export async function sendNotification({ 
  title, 
  message, 
  token, 
  topic, 
  link,
  image,
  data
}: SendNotificationParams): Promise<SendNotificationResponse> {
  console.warn('DEPRECATED: sendNotification utility is deprecated. Use /api/send-notification API route directly.');
  
  // For backward compatibility, we'll call our API route
  const url = '/api/send-notification';

  const request: SendNotificationRequest = {
    title,
    body: message,
    token,
    topic,
    link,
    image,
    data
  };

  // If neither token nor topic is provided, send to all devices
  if (!token && !topic) {
    request.sendToAll = true;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    throw new Error(`Failed to send notification: ${res.statusText}`);
  }

  return res.json();
}
