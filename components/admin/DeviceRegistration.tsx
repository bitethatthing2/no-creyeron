'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import { registerDevice } from '@/lib/actions/device-actions';

// Simple function to generate a unique ID
function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function DeviceRegistration() {
  const [deviceId, setDeviceId] = useState<string>('');
  const [staffId, setStaffId] = useState<string>('');
  const [isPrimary, setIsPrimary] = useState<boolean>(true);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);

  // Check if device is already registered on component mount
  useEffect(() => {
    // Try to get existing device ID from localStorage
    const storedDeviceId = localStorage.getItem('admin_device_id');
    if (storedDeviceId) {
      setDeviceId(storedDeviceId);
      setIsRegistered(true);
    } else {
      // Generate a new device ID if none exists
      const newDeviceId = generateUniqueId();
      setDeviceId(newDeviceId);
    }

    // Try to get existing staff ID from localStorage
    const storedStaffId = localStorage.getItem('admin_staff_id');
    if (storedStaffId) {
      setStaffId(storedStaffId);
    }
  }, []);

  const handleRegisterDevice = async () => {
    if (!deviceId || !staffId) {
      toast({
        title: "Missing Information",
        description: "Please provide both a device ID and staff ID.",
        variant: "destructive",
      });
      return;
    }

    setIsRegistering(true);

    try {
      const result = await registerDevice({
        deviceId,
        type: 'staff',
        staffId,
        isPrimary,
      });

      if (result.success) {
        // Store device and staff IDs in localStorage
        localStorage.setItem('admin_device_id', deviceId);
        localStorage.setItem('admin_staff_id', staffId);
        
        setIsRegistered(true);
        
        toast({
          title: "Device Registered",
          description: "Your device has been registered as a staff device and will now receive order notifications.",
          variant: "default",
        });
      } else {
        toast({
          title: "Registration Failed",
          description: result.error?.message || "An unknown error occurred.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error registering device:", error);
      toast({
        title: "Registration Error",
        description: "An unexpected error occurred while registering your device.",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleUnregisterDevice = () => {
    localStorage.removeItem('admin_device_id');
    localStorage.removeItem('admin_staff_id');
    setIsRegistered(false);
    setStaffId('');
    const newDeviceId = generateUniqueId();
    setDeviceId(newDeviceId);
    
    toast({
      title: "Device Unregistered",
      description: "Your device has been unregistered and will no longer receive notifications.",
      variant: "default",
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Staff Device Registration</CardTitle>
        <CardDescription>
          Register this device to receive order notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="device-id">Device ID</Label>
          <Input
            id="device-id"
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            placeholder="Device identifier"
            disabled={isRegistered}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="staff-id">Staff ID</Label>
          <Input
            id="staff-id"
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            placeholder="Your staff identifier"
            disabled={isRegistered}
          />
          <p className="text-sm text-muted-foreground">
            Enter your staff ID or email to identify yourself
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="is-primary"
            checked={isPrimary}
            onCheckedChange={(checked) => setIsPrimary(checked as boolean)}
            disabled={isRegistered}
          />
          <Label htmlFor="is-primary" className="text-sm font-normal">
            Set as primary device (receives all notifications)
          </Label>
        </div>
      </CardContent>
      <CardFooter>
        {isRegistered ? (
          <Button 
            variant="destructive" 
            onClick={handleUnregisterDevice}
            className="w-full"
          >
            Unregister Device
          </Button>
        ) : (
          <Button 
            onClick={handleRegisterDevice} 
            disabled={isRegistering} 
            className="w-full"
          >
            {isRegistering ? "Registering..." : "Register Device"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
