'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { SendNotificationRequest, SendNotificationResponse } from '@/types/features/api';
import { Loader2, Send, Bell, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface NotificationResult {
  success: boolean;
  message: string;
  messageId?: string;
  recipients?: number;
}

export const NotificationSender = () => {
  // Basic notification fields
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<NotificationResult | null>(null);
  const { toast } = useToast();
  
  // Add error boundary state
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Target selection
  const [activeTab, setActiveTab] = useState<'all' | 'token' | 'topic'>('all');
  const [targetToken, setTargetToken] = useState('');
  const [targetTopic, setTargetTopic] = useState('');
  
  // Additional options
  const [imageLink, setImageLink] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [actionButtonLabel, setActionButtonLabel] = useState('View');
  const [actionButtonUrl, setActionButtonUrl] = useState('');
  const [customDataText, setCustomDataText] = useState('{}');
  const [customData, setCustomData] = useState<Record<string, any>>({});

  // Update custom data when text changes
  useEffect(() => {
    try {
      if (customDataText.trim()) {
        const parsed = JSON.parse(customDataText);
        setCustomData(parsed);
      } else {
        setCustomData({});
      }
    } catch (_e) {
      // Invalid JSON, keep the previous value
      console.warn('Invalid JSON in custom data field');
    }
  }, [customDataText]);
  
  // Send notification function
  const sendNotification = async () => {
    setIsSending(true);
    setResult(null);
    setHasError(false);
    setErrorMessage('');
    
    try {
      // Construct the notification payload based on the selected target type
      const payload: SendNotificationRequest = {
        title,
        body,
        link: imageLink || undefined,
        image: imageUrl || undefined,
        data: {
          timestamp: new Date().toISOString(),
          ...customData
        }
      };
      
      // Add action button if provided
      if (actionButtonLabel && actionButtonUrl) {
        payload.actionButton = actionButtonUrl;
        payload.actionButtonText = actionButtonLabel;
      }
      
      // Add the appropriate targeting parameter based on the selected tab
      if (activeTab === 'token') {
        payload.token = targetToken;
      } else if (activeTab === 'topic') {
        payload.topic = targetTopic;
      } else if (activeTab === 'all') {
        payload.sendToAll = true;
      }
      
      // Send the notification
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const data: SendNotificationResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.errors?.[0]?.message || 'Unknown error occurred');
      }
      
      const resultData: NotificationResult = {
        success: true,
        message: 'Notification sent successfully',
        messageId: Array.isArray(data.messageIds) ? data.messageIds[0] : undefined,
        recipients: data.recipients
      };
      
      setResult(resultData);
      
      toast({
        title: 'Notification Sent',
        description: `Successfully sent to ${data.recipients || 0} device(s)`,
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      
      setHasError(true);
      setErrorMessage(error instanceof Error ? error.message : String(error));
      
      toast({
        variant: 'destructive',
        title: 'Failed to send notification',
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsSending(false);
    }
  };

  // Add error boundary effect
  useEffect(() => {
    // Reset error state on component mount
    setHasError(false);
    setErrorMessage('');
    
    return () => {
      // Clean up on unmount
    };
  }, []);

  // If there's an error, show a simplified version of the component
  if (hasError) {
    return (
      <div className="space-y-4 p-4 border rounded-md bg-card">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Send Notification
        </h2>
        <div className="p-4 border border-destructive rounded-md bg-destructive/10">
          <p className="text-destructive-foreground">Error loading notification sender: {errorMessage}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-2 bg-background text-foreground border border-input"
          >
            Reload Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 border rounded-md bg-card">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Bell className="h-5 w-5" />
        Send Notification
      </h2>
      
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter notification title"
              className="bg-background text-foreground"
              aria-label="Notification title"
              title="Enter the notification title"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter notification message"
              className="bg-background text-foreground"
              rows={3}
              aria-label="Notification message"
              title="Enter the notification message"
            />
          </div>
          
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <input 
                type="radio" 
                id="all" 
                name="targetType" 
                value="all" 
                checked={true} 
                readOnly
                className="h-4 w-4"
                title="Send to all devices"
                aria-label="Send to all devices"
              />
              <Label htmlFor="all">Send to all devices</Label>
            </div>
          </div>
          
          <Button 
            onClick={sendNotification} 
            disabled={isSending || !title || !body}
            className="w-full bg-primary text-primary-foreground border-0"
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Notification
              </>
            )}
          </Button>
          
          {result && (
            <div className={`p-3 rounded-md ${result.success ? 'bg-primary/20' : 'bg-destructive/20'}`}>
              <p className="text-sm font-medium">{result.message}</p>
              {result.recipients && (
                <p className="text-xs text-muted-foreground mt-1">
                  Sent to {result.recipients} {result.recipients === 1 ? 'recipient' : 'recipients'}
                </p>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="advanced" className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Notification Image
            </Label>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  id="imageInput"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="bg-background text-foreground"
                  aria-label="Image URL"
                  title="Enter a full URL for the notification image (must start with http:// or https://)"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Image URL must be a full URL starting with http:// or https://
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Notification Link
            </Label>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  id="linkInput"
                  value={imageLink}
                  onChange={(e) => setImageLink(e.target.value)}
                  placeholder="/orders/123 or https://example.com"
                  className="bg-background text-foreground"
                  aria-label="URL to open when notification is clicked"
                  title="Enter the URL to open when the notification is clicked"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                URL to open when notification is clicked (can be relative like /orders/123 or absolute)
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Action Button
            </Label>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  id="actionButtonLabel"
                  value={actionButtonLabel}
                  onChange={(e) => setActionButtonLabel(e.target.value)}
                  placeholder="View Order"
                  className="bg-background text-foreground"
                  aria-label="Action button label"
                  title="Enter the label for the action button"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Input
                  id="actionButtonUrl"
                  value={actionButtonUrl}
                  onChange={(e) => setActionButtonUrl(e.target.value)}
                  placeholder="/orders/123 or https://example.com"
                  className="bg-background text-foreground"
                  aria-label="Action button URL"
                  title="Enter the URL for the action button"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Add a custom action button to your notification
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="customData">Custom Data (JSON)</Label>
            <Textarea
              id="customData"
              value={customDataText}
              onChange={(e) => setCustomDataText(e.target.value)}
              placeholder={`{\n  "orderId": "123",\n  "priority": "high"\n}`}
              className="bg-background text-foreground font-mono text-sm"
              rows={5}
              aria-label="Custom data"
              title="Enter custom data in JSON format"
            />
            <p className="text-xs text-muted-foreground">
              Add any additional data as JSON that will be sent with the notification
            </p>
          </div>
          
          <Button 
            onClick={sendNotification} 
            disabled={isSending || !title || !body}
            className="w-full bg-primary text-primary-foreground border-0"
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Notification
              </>
            )}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
};
