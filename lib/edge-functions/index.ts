// Edge Functions - Centralized exports

// Services
export { MenuApiService } from './services/menu-api.service';
export { messageHandlerService } from './services/message-handler.service';

// Types
export type * from './types/MENU_ITEMS';

// Utils
export { EdgeFunctionTester } from './utils/edgeFunctionTests';
export type { TestResult, EdgeFunctionTestSuite } from './utils/edgeFunctionTests';

// Re-export common edge function utilities
export const EDGE_FUNCTION_BASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL + '/functions/v1';

export const createEdgeFunctionClient = (functionName: string) => {
  return `${EDGE_FUNCTION_BASE_URL}/${functionName}`;
};