'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Clock, 
  Eye, 
  Heart, 
  Users,
  Download,
  Trash2
} from 'lucide-react';
import { BroadcastStatusService } from '@/lib/services/broadcast-status.service';
import { useToast } from '@/components/ui/use-toast';

interface BroadcastCardProps {
  broadcast: {
    id: string;
    title: string;
    message: string;
    broadcast_type: string;
    status: string;
    created_at: string;
    expires_at?: string;
    view_count?: number;
    interaction_count?: number;
    unique_participants?: number;
    priority?: string;
  };
  showActions?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function BroadcastCard({ 
  broadcast, 
  showActions = false, 
  onClick, 
  className = '' 
}: BroadcastCardProps) {
  const { toast } = useToast();
  
  const getDaysUntilDeletion = () => {
    return BroadcastStatusService.getDaysUntilDeletion(broadcast);
  };
  
  const handleExport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await BroadcastStatusService.exportBroadcast(broadcast.id);
      toast({
        title: 'Export Complete',
        description: 'Broadcast data has been downloaded'
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export broadcast data',
        variant: 'destructive'
      });
    }
  };

  const getBroadcastTypeColor = (type: string) => {
    switch (type) {
      case 'announcement': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'contest': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'poll': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'howl_request': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'expired': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const daysUntilDeletion = getDaysUntilDeletion();

  return (
    <div 
      className={`bg-white dark:bg-gray-800 border rounded-lg p-4 hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge className={getBroadcastTypeColor(broadcast.broadcast_type)}>
            {broadcast.broadcast_type}
          </Badge>
          <Badge className={getStatusColor(broadcast.status)}>
            {broadcast.status}
          </Badge>
          {broadcast.priority && (
            <Badge variant={broadcast.priority === 'urgent' ? 'destructive' : 'secondary'}>
              {broadcast.priority}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          <span>{formatDate(broadcast.created_at)}</span>
        </div>
      </div>

      {/* Title and Message */}
      <div className="mb-3">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
          {broadcast.title}
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
          {broadcast.message}
        </p>
      </div>

      {/* Stats */}
      {(broadcast.view_count || broadcast.interaction_count || broadcast.unique_participants) && (
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
          {broadcast.view_count !== undefined && (
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{broadcast.view_count}</span>
            </div>
          )}
          {broadcast.interaction_count !== undefined && (
            <div className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              <span>{broadcast.interaction_count}</span>
            </div>
          )}
          {broadcast.unique_participants !== undefined && (
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{broadcast.unique_participants}</span>
            </div>
          )}
        </div>
      )}

      {/* Deletion Warning */}
      {daysUntilDeletion !== null && daysUntilDeletion <= 7 && (
        <div className="mb-3 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-red-700 dark:text-red-300 text-xs font-medium">
              {daysUntilDeletion === 0 
                ? '⚠️ Will be deleted today' 
                : `⚠️ Will be deleted in ${daysUntilDeletion} day${daysUntilDeletion !== 1 ? 's' : ''}`
              }
            </div>
            <div className="text-red-600 dark:text-red-400 text-xs">
              Export now to save this broadcast
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-2 pt-2 border-t dark:border-gray-700">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            className="flex-1"
          >
            <Download className="w-3 h-3 mr-1" />
            Export
          </Button>
          {daysUntilDeletion !== null && daysUntilDeletion <= 7 && (
            <div className="flex items-center gap-1 text-xs text-red-500">
              <Trash2 className="w-3 h-3" />
              <span>{daysUntilDeletion}d</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}