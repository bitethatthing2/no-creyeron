import { NextResponse } from 'next/server';
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

interface DiagnosticError {
  message: string;
  code?: string;
  details?: string;
}

interface TableDiagnostic {
  success: boolean;
  error: DiagnosticError | null;
  latency: number;
  count: number;
}

/**
 * Safely extracts error information from various error types
 */
function createDiagnosticError(error: unknown): DiagnosticError {
  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>;
    return {
      message: (err.message as string) || (err.msg as string) || String(error),
      code: (err.code as string) || (err.status as string) || undefined,
      details: (err.details as string) || (err.hint as string) || undefined
    };
  }
  return {
    message: String(error),
    code: undefined,
    details: undefined
  };
}

/**
 * Enhanced database health check API endpoint
 * Verifies database connection and table accessibility
 * Provides detailed diagnostics for troubleshooting
 */
export async function GET() {
  try {
    // Create server-side Supabase client with our custom function
    const supabase = await createServerClient();
    
    // Test database connection and collect diagnostics
    const diagnostics = {
      ordersTable: { success: false, error: null, latency: 0, count: 0 } as TableDiagnostic,
      tablesTable: { success: false, error: null, latency: 0, count: 0 } as TableDiagnostic,
      orderItemsTable: { success: false, error: null, latency: 0, count: 0 } as TableDiagnostic,
      environment: {
        nextVersion: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'unknown',
        nodeEnv: process.env.NODE_ENV || 'unknown'
      }
    };
    
    // Test orders table
    let start = Date.now();
    let ordersResult;
    try {
      ordersResult = await supabase
        .from('bartender_orders')
        .select('count')
        .limit(1);
    } catch (err) {
      ordersResult = { data: null, error: err };
    }
    
    diagnostics.ordersTable.latency = Date.now() - start;
    diagnostics.ordersTable.success = !ordersResult.error;
    
    if (ordersResult.error) {
      diagnostics.ordersTable.error = createDiagnosticError(ordersResult.error);
    } else {
      diagnostics.ordersTable.count = ordersResult.data?.length || 0;
    }
    
    // Test tables table
    start = Date.now();
    let tablesResult;
    try {
      tablesResult = await supabase
        .from('restaurant_tables')
        .select('count')
        .limit(1);
    } catch (err) {
      tablesResult = { data: null, error: err };
    }
    
    diagnostics.tablesTable.latency = Date.now() - start;
    diagnostics.tablesTable.success = !tablesResult.error;
    
    if (tablesResult.error) {
      diagnostics.tablesTable.error = createDiagnosticError(tablesResult.error);
    } else {
      diagnostics.tablesTable.count = tablesResult.data?.length || 0;
    }
    
    // Test order_items table
    start = Date.now();
    let orderItemsResult;
    try {
      orderItemsResult = await supabase
        .from('order_items')
        .select('count')
        .limit(1);
    } catch (err) {
      orderItemsResult = { data: null, error: err };
    }
    
    diagnostics.orderItemsTable.latency = Date.now() - start;
    diagnostics.orderItemsTable.success = !orderItemsResult.error;
    
    if (orderItemsResult.error) {
      diagnostics.orderItemsTable.error = createDiagnosticError(orderItemsResult.error);
    } else {
      diagnostics.orderItemsTable.count = orderItemsResult.data?.length || 0;
    }
    
    // Overall health status
    const isHealthy = diagnostics.ordersTable.success || 
                      diagnostics.tablesTable.success || 
                      diagnostics.orderItemsTable.success;
    
    const status = isHealthy ? 200 : 500;
    
    return NextResponse.json({
      healthy: isHealthy,
      diagnostics,
      timestamp: new Date().toISOString(),
      troubleshooting: isHealthy ? null : {
        suggestions: [
          "Check Supabase connection string in environment variables",
          "Verify table permissions for the service role",
          "Ensure database tables exist with expected schema",
          "Check for network connectivity issues",
          "Verify middleware is not blocking API requests"
        ]
      }
    }, { status });
    
  } catch (err: unknown) {
    console.error('Server error during health check:', err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorStack = err instanceof Error ? err.stack : undefined;
    
    return NextResponse.json({
      healthy: false,
      error: errorMessage,
      errorType: 'SERVER_ERROR',
      details: 'Unexpected server error during database health check',
      stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
    }, { status: 500 });
  }
}
