'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

/**
 * Component for notification system utilities like token cleanup and testing
 */
export function NotificationUtilities() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{
    action?: string;
    removed?: number;
    total?: number;
    success?: boolean;
    error?: string;
  } | null>(null);

  /**
   * Run token cleanup to remove invalid tokens from the database
   */
  const handleCleanupTokens = async () => {
    try {
      setIsLoading(true);
      setResults(null);

      const response = await fetch("/api/send-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Cleanup Operation",
          body: "Running token cleanup",
          action: "cleanup_tokens",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResults({
          action: "cleanup",
          removed: data.removed,
          total: data.total,
          success: true,
        });
        toast.success(`Cleaned up ${data.removed} invalid tokens out of ${data.total} total tokens`);
      } else {
        setResults({
          action: "cleanup",
          error: data.error || "Unknown error",
          success: false,
        });
        toast.error(`Failed to clean up tokens: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error cleaning up tokens:", error);
      setResults({
        action: "cleanup",
        error: error instanceof Error ? error.message : "Unknown error",
        success: false,
      });
      toast.error(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Send a test notification to all devices
   */
  const handleSendTestToAll = async () => {
    try {
      setIsLoading(true);
      setResults(null);

      const response = await fetch("/api/send-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Test Notification",
          body: "This is a test notification sent to all devices",
          sendToAll: true,
          data: {
            type: "test",
            timestamp: new Date().toISOString(),
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResults({
          action: "test_all",
          total: data.totalTokens,
          success: true,
        });
        toast.success(
          `Test notification sent to ${data.recipients} devices (${data.failures} failures)`
        );
      } else {
        setResults({
          action: "test_all",
          error: data.error || "Unknown error",
          success: false,
        });
        toast.error(`Failed to send test notification: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error sending test notification:", error);
      setResults({
        action: "test_all",
        error: error instanceof Error ? error.message : "Unknown error",
        success: false,
      });
      toast.error(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Notification System Utilities</CardTitle>
        <CardDescription>
          Tools to manage and test the notification system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col space-y-2">
          <h3 className="text-sm font-medium">Token Management</h3>
          <p className="text-sm text-muted-foreground">
            Clean up invalid tokens to ensure notifications are delivered efficiently
          </p>
          <Button
            onClick={handleCleanupTokens}
            disabled={isLoading}
            className="w-full sm:w-auto bg-secondary text-secondary-foreground"
          >
            {isLoading && results?.action === "cleanup" ? "Cleaning..." : "Clean Up Invalid Tokens"}
          </Button>
        </div>

        <div className="flex flex-col space-y-2">
          <h3 className="text-sm font-medium">Test Notifications</h3>
          <p className="text-sm text-muted-foreground">
            Send test notifications to verify the system is working
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleSendTestToAll}
              disabled={isLoading}
              className="w-full sm:w-auto bg-secondary text-secondary-foreground"
            >
              {isLoading && results?.action === "test_all" ? "Sending..." : "Send Test to All Devices"}
            </Button>
          </div>
        </div>

        {results && (
          <div className="mt-4 p-4 rounded-md bg-muted">
            <h3 className="text-sm font-medium mb-2">Results</h3>
            {results.success ? (
              <div className="text-sm">
                {results.action === "cleanup" && (
                  <p>
                    Successfully cleaned up {results.removed} invalid tokens out of {results.total} total tokens.
                  </p>
                )}
                {results.action === "test_all" && (
                  <p>
                    Test notification sent to devices. Total tokens: {results.total}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-destructive">Error: {results.error}</p>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-xs text-muted-foreground">
          Use these tools to maintain the notification system
        </p>
      </CardFooter>
    </Card>
  );
}
