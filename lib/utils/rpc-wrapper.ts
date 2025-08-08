import { supabase } from '@/lib/supabase';

/**
 * Wrapper for Supabase RPC calls that handles missing functions gracefully
 * @param functionName - The name of the RPC function to call
 * @param params - Parameters to pass to the function
 * @param fallbackValue - Value to return if the function doesn't exist
 * @returns Promise with data or fallback value
 */
export async function safeRpcCall<T = any>(
  functionName: string,
  params: any = {},
  fallbackValue: T = null as T
): Promise<{ data: T; error: any }> {
  try {
    const { data, error } = await supabase.rpc(functionName, params);
    
    if (error) {
      // Check if error is due to missing function
      if (error.code === 'PGRST202' || error.message?.includes('Could not find the function')) {
        console.log(`RPC function '${functionName}' not found, using fallback value`);
        return { data: fallbackValue, error: null };
      }
      
      // Log other errors but don't fail
      console.warn(`RPC call '${functionName}' failed:`, error);
      return { data: fallbackValue, error };
    }
    
    return { data, error: null };
  } catch (err) {
    console.warn(`RPC call '${functionName}' threw exception:`, err);
    return { data: fallbackValue, error: err };
  }
}

/**
 * Wrapper for regular Supabase table queries that handles missing tables gracefully
 * @param tableName - The name of the table to query
 * @param query - The query to execute
 * @param fallbackValue - Value to return if the table doesn't exist
 * @returns Promise with data or fallback value
 */
export async function safeTableQuery<T = any>(
  tableName: string,
  query: (table: any) => any,
  fallbackValue: T = [] as T
): Promise<{ data: T; error: any }> {
  try {
    const result = await query(supabase.from(tableName));
    
    if (result.error) {
      // Check if error is due to missing table
      if (result.error.message?.includes('does not exist') || 
          result.error.message?.includes('relation') ||
          result.error.code === '42P01') {
        console.log(`Table '${tableName}' not found, using fallback value`);
        return { data: fallbackValue, error: null };
      }
      
      // Log other errors but don't fail
      console.warn(`Table query '${tableName}' failed:`, result.error);
      return { data: fallbackValue, error: result.error };
    }
    
    return { data: result.data, error: null };
  } catch (err) {
    console.warn(`Table query '${tableName}' threw exception:`, err);
    return { data: fallbackValue, error: err };
  }
}