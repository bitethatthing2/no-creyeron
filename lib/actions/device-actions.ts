"use server";

import { createServerClient } from '@/lib/supabase/server';
import type { Database } from "@/types/database.types";

type DeviceRegistrationInsert = Database['public']['Tables']['device_registrations']['Insert'];

interface RegisterDeviceParams {
  deviceId: string;
  type: 'staff' | 'customer';
  staffId?: string;
  tableId?: string;
  isPrimary?: boolean;
}

interface RegisterDeviceResult {
  success: boolean;
  error?: { 
    message: string; 
    details?: string; 
    hint?: string; 
    code?: string 
  };
  data?: Database['public']['Tables']['device_registrations']['Row'];
}

/**
 * Registers or updates a device in the database.
 * Performs an upsert based on the deviceId.
 * @param params - The device registration parameters.
 * @returns Object indicating success or failure, with error details if applicable.
 */
export async function registerDevice(params: RegisterDeviceParams): Promise<RegisterDeviceResult> {
  const supabase = await createServerClient();

  const { deviceId, type, staffId, tableId, isPrimary } = params;

  // Basic validation
  if (!deviceId || !type) {
    console.error("Device registration failed: deviceId and type are required.");
    return { 
      success: false, 
      error: { 
        message: "Device ID and type are required", 
        code: "INVALID_INPUT" 
      } 
    };
  }

  // Type-specific validation
  if (type === 'staff' && !staffId) {
    console.error("Device registration failed: staffId is required for staff type.");
    return { 
      success: false, 
      error: { 
        message: "Staff ID is required for staff type registration", 
        code: "INVALID_INPUT" 
      } 
    };
  }

  if (type === 'customer' && !tableId) {
    console.error("Device registration failed: tableId is required for customer type.");
    return { 
      success: false, 
      error: { 
        message: "Table ID is required for customer type registration", 
        code: "INVALID_INPUT" 
      } 
    };
  }

  // Additional validation: ensure staff members exist
  if (type === 'staff' && staffId) {
    const { data: staffUser, error: staffError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', staffId)
      .single();

    if (staffError || !staffUser) {
      console.error(`Staff validation failed: ${staffError?.message || 'Staff member not found'}`);
      return {
        success: false,
        error: {
          message: "Invalid staff member",
          details: "The specified staff member does not exist",
          code: "INVALID_STAFF"
        }
      };
    }

    // Verify the user has a staff role
    if (!['admin', 'bartender', 'dj'].includes(staffUser.role || '')) {
      console.error(`Staff validation failed: User ${staffId} does not have a staff role`);
      return {
        success: false,
        error: {
          message: "Invalid staff member",
          details: "The specified user is not a staff member",
          code: "INVALID_ROLE"
        }
      };
    }
  }

  // Additional validation: ensure table exists
  if (type === 'customer' && tableId) {
    const { data: table, error: tableError } = await supabase
      .from('restaurant_tables')
      .select('id, is_active')
      .eq('id', tableId)
      .single();

    if (tableError || !table) {
      console.error(`Table validation failed: ${tableError?.message || 'Table not found'}`);
      return {
        success: false,
        error: {
          message: "Invalid table",
          details: "The specified table does not exist",
          code: "INVALID_TABLE"
        }
      };
    }

    if (!table.is_active) {
      return {
        success: false,
        error: {
          message: "Table is not active",
          details: "The specified table is currently inactive",
          code: "INACTIVE_TABLE"
        }
      };
    }
  }

  // Handle primary device logic for staff
  if (type === 'staff' && isPrimary) {
    // Unset any existing primary devices for this staff member
    const { error: updateError } = await supabase
      .from('device_registrations')
      .update({ is_primary: false })
      .eq('staff_id', staffId!)
      .neq('device_id', deviceId);

    if (updateError) {
      console.warn(`Failed to unset other primary devices: ${updateError.message}`);
      // Continue with registration even if this fails
    }
  }

  const registrationData: DeviceRegistrationInsert = {
    device_id: deviceId,
    type: type,
    staff_id: type === 'staff' ? staffId : null,
    table_id: type === 'customer' ? tableId : null,
    is_primary: type === 'staff' ? (isPrimary ?? false) : false,
    last_active: new Date().toISOString(),
  };

  console.log(`Attempting to register/update device: ${deviceId}, Type: ${type}`);

  const { data, error } = await supabase
    .from("device_registrations")
    .upsert(registrationData, { 
      onConflict: 'device_id',
      ignoreDuplicates: false 
    })
    .select()
    .single();

  if (error) {
    console.error(`Error registering device ${deviceId}:`, error);
    
    // Parse Supabase error for better error messages
    let errorMessage = "Failed to register device";
    let errorCode = "REGISTRATION_FAILED";
    
    if (error.code === '23505') {
      errorMessage = "Device already registered";
      errorCode = "DUPLICATE_DEVICE";
    } else if (error.code === '23503') {
      errorMessage = "Invalid reference: staff or table does not exist";
      errorCode = "INVALID_REFERENCE";
    } else if (error.code === '23514') {
      errorMessage = "Invalid device registration data";
      errorCode = "CONSTRAINT_VIOLATION";
    }
    
    return { 
      success: false, 
      error: {
        message: errorMessage,
        details: error.message,
        hint: error.hint || undefined,
        code: errorCode
      }
    };
  }

  console.log(`Successfully registered/updated device: ${deviceId}`);
  return { 
    success: true, 
    data,
    error: undefined 
  };
}

/**
 * Unregisters a device from the database.
 * @param deviceId - The unique device identifier to unregister.
 * @returns Object indicating success or failure.
 */
export async function unregisterDevice(deviceId: string): Promise<RegisterDeviceResult> {
  const supabase = await createServerClient();

  if (!deviceId) {
    return {
      success: false,
      error: {
        message: "Device ID is required",
        code: "INVALID_INPUT"
      }
    };
  }

  const { error } = await supabase
    .from("device_registrations")
    .delete()
    .eq('device_id', deviceId);

  if (error) {
    console.error(`Error unregistering device ${deviceId}:`, error);
    return {
      success: false,
      error: {
        message: "Failed to unregister device",
        details: error.message,
        code: "UNREGISTRATION_FAILED"
      }
    };
  }

  console.log(`Successfully unregistered device: ${deviceId}`);
  return { success: true };
}

/**
 * Gets device registration details.
 * @param deviceId - The unique device identifier.
 * @returns The device registration data or error.
 */
export async function getDeviceRegistration(deviceId: string): Promise<RegisterDeviceResult> {
  const supabase = await createServerClient();

  if (!deviceId) {
    return {
      success: false,
      error: {
        message: "Device ID is required",
        code: "INVALID_INPUT"
      }
    };
  }

  const { data, error } = await supabase
    .from("device_registrations")
    .select("*")
    .eq('device_id', deviceId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return {
        success: false,
        error: {
          message: "Device not found",
          code: "NOT_FOUND"
        }
      };
    }
    
    return {
      success: false,
      error: {
        message: "Failed to fetch device registration",
        details: error.message,
        code: "FETCH_FAILED"
      }
    };
  }

  return { success: true, data };
}
