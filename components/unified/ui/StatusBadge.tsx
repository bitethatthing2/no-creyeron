import { Badge } from '@/components/ui/badge';
import { OrderStatus } from '@/types/features/order';

interface StatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

/**
 * Reusable component for displaying order status badges with consistent styling
 * Part of the unified component system
 */
export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const statusConfig: Record<OrderStatus, { text: string; className: string }> = {
    pending: {
      text: 'Pending',
      className: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
    },
    accepted: {
      text: 'Accepted',
      className: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800'
    },
    preparing: {
      text: 'Preparing',
      className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
    },
    ready: {
      text: 'Ready',
      className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
    },
    delivered: {
      text: 'Delivered',
      className: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
    },
    cancelled: {
      text: 'Cancelled',
      className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
    },
    completed: {
      text: 'Completed',
      className: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
    }
  };
  
  const config = statusConfig[status];
  
  return (
    <Badge 
      variant="outline" 
      className={`${config.className} ${className}`}
    >
      {config.text}
    </Badge>
  );
}
