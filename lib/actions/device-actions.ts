export interface DeviceRegistrationData {
  deviceId: string;
  type: 'staff' | 'customer';
  staffId?: string;
  isPrimary?: boolean;
}

export interface DeviceRegistrationResult {
  success: boolean;
  error?: string | Error;
}

export async function registerDevice(data: DeviceRegistrationData): Promise<DeviceRegistrationResult> {
  try {
    // TODO: Implement actual device registration logic
    console.log('Device registration:', data);
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error : 'Unknown error' 
    };
  }
}