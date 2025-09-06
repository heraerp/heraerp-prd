/**
 * Notification Center Component
 * Shows real-time alerts and notifications for the Factory Dashboard
 */

import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  X, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle,
  Clock,
  ExternalLink,
  Settings,
  BellOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
// date-fns import - using a simple alternative for now
const formatDistanceToNow = (date: Date, options?: { addSuffix?: boolean }) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  let result = '';
  if (days > 0) result = `${days} day${days > 1 ? 's' : ''}`;
  else if (hours > 0) result = `${hours} hour${hours > 1 ? 's' : ''}`;
  else if (minutes > 0) result = `${minutes} minute${minutes > 1 ? 's' : ''}`;
  else result = 'just now';

  return options?.addSuffix ? `${result} ago` : result;
};

interface Notification {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read?: boolean;
  actionLabel?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  onMarkAllRead?: () => void;
  onAction?: (notification: Notification) => void;
}

export function NotificationCenter({
  notifications,
  onDismiss,
  onMarkAllRead,
  onAction,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mutedTypes, setMutedTypes] = useState<Set<string>>(new Set());

  const unreadCount = notifications.filter(n => !n.read && !mutedTypes.has(n.type)).length;
  const visibleNotifications = notifications.filter(n => !mutedTypes.has(n.type));

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'error': return AlertCircle;
      case 'warning': return AlertTriangle;
      case 'success': return CheckCircle;
      default: return Info;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-500';
      case 'warning': return 'text-orange-500';
      case 'success': return 'text-green-500';
      default: return 'text-blue-500';
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'error': return 'bg-red-50 dark:bg-red-900/20';
      case 'warning': return 'bg-orange-50 dark:bg-orange-900/20';
      case 'success': return 'bg-green-50 dark:bg-green-900/20';
      default: return 'bg-blue-50 dark:bg-blue-900/20';
    }
  };

  const toggleMute = (type: string) => {
    const newMuted = new Set(mutedTypes);
    if (newMuted.has(type)) {
      newMuted.delete(type);
    } else {
      newMuted.add(type);
    }
    setMutedTypes(newMuted);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative"
        >
          <Bell className="w-4 h-4" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1"
              >
                <Badge 
                  variant="destructive" 
                  className="h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  {unreadCount}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96">
        <div className="flex items-center justify-between px-4 py-2">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && onMarkAllRead && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMarkAllRead}
                className="h-auto p-1 text-xs"
              >
                Mark all read
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-auto p-1">
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Notification Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {['error', 'warning', 'info'].map(type => {
                  const Icon = getNotificationIcon(type);
                  const isMuted = mutedTypes.has(type);
                  return (
                    <DropdownMenuItem
                      key={type}
                      onClick={() => toggleMute(type)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <Icon className={cn("w-4 h-4", getNotificationColor(type))} />
                          <span className="capitalize">{type}s</span>
                        </div>
                        {isMuted && <BellOff className="w-3 h-3 text-gray-400" />}
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <DropdownMenuSeparator />

        <ScrollArea className="h-[400px]">
          {visibleNotifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="px-2 py-2 space-y-2">
              <AnimatePresence>
                {visibleNotifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type);
                  
                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className={cn(
                        "relative p-3 rounded-lg border cursor-pointer transition-colors",
                        getBgColor(notification.type),
                        "hover:bg-gray-100 dark:hover:bg-gray-800",
                        !notification.read && "border-l-4",
                        !notification.read && notification.type === 'error' && "border-l-red-500",
                        !notification.read && notification.type === 'warning' && "border-l-orange-500",
                        !notification.read && notification.type === 'info' && "border-l-blue-500",
                        !notification.read && notification.type === 'success' && "border-l-green-500"
                      )}
                      onClick={() => {
                        if (notification.actionUrl && onAction) {
                          onAction(notification);
                        }
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDismiss(notification.id);
                        }}
                        className="absolute top-2 right-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                      >
                        <X className="w-3 h-3 text-gray-500" />
                      </button>

                      <div className="flex gap-3 pr-6">
                        <div className="flex-shrink-0 mt-0.5">
                          <Icon className={cn("w-5 h-5", getNotificationColor(notification.type))} />
                        </div>
                        <div className="flex-1 space-y-1">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {notification.message}
                          </p>
                          {notification.actionLabel && (
                            <Button
                              variant="link"
                              className="p-0 h-auto text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onAction) onAction(notification);
                              }}
                            >
                              {notification.actionLabel} 
                              <ExternalLink className="w-3 h-3 ml-1" />
                            </Button>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>

        {visibleNotifications.length > 5 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-4 py-2 text-center">
              <Button variant="ghost" size="sm" className="text-xs">
                View all notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}