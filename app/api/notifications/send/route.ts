import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    // Use existing Firebase project config
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: 'sidehustle-22a6a',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recipientId, title, body, type, link, data } = await request.json();

    if (!recipientId || !title || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get recipient's FCM tokens
    const { data: tokens } = await supabase
      .from('user_fcm_tokens')
      .select('token')
      .eq('user_id', recipientId);

    if (!tokens || tokens.length === 0) {
      return NextResponse.json({ error: 'No FCM tokens found for user' }, { status: 404 });
    }

    // Send notification to all user's devices
    const notifications = tokens.map(async (tokenRecord) => {
      try {
        await admin.messaging().send({
          token: tokenRecord.token,
          notification: {
            title,
            body,
          },
          data: {
            type: type || 'message',
            link: link || '/messages',
            ...data,
          },
          webpush: {
            fcmOptions: {
              link: link || '/messages',
            },
            notification: {
              title,
              body,
              icon: '/icons/favicon-for-public/web-app-manifest-192x192.png',
              badge: '/icons/badge-72x72.png',
              tag: 'wolfpack-message',
              requireInteraction: true,
              actions: [
                {
                  action: 'open',
                  title: 'Open',
                },
                {
                  action: 'dismiss',
                  title: 'Dismiss',
                }
              ]
            },
          },
        });
        return { success: true };
      } catch (error) {
        console.error('Error sending to token:', tokenRecord.token, error);
        return { success: false, error };
      }
    });

    const results = await Promise.all(notifications);
    const successful = results.filter(result => result.success).length;

    return NextResponse.json({
      success: true,
      sentTo: successful,
      total: tokens.length
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}