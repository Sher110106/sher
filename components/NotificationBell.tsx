'use client';

import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';
import NotificationDrawer from './NotificationDrawer';

interface NotificationBellProps {
  userId: string;
}

export default function NotificationBell({ userId }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch('/api/notifications?limit=1');
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    // Set up real-time subscription for new notifications
    const supabase = createClient();
    
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        () => {
          // Increment unread count when new notification arrives
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleDrawerClose = () => {
    setIsOpen(false);
    // Refresh count after drawer closes
    fetchUnreadCount();
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="relative h-8 w-8 sm:h-9 sm:w-9 p-0"
        onClick={() => setIsOpen(true)}
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
        {!isLoading && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-red-500 text-[10px] sm:text-xs font-bold text-white flex items-center justify-center animate-in zoom-in duration-200">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      <NotificationDrawer
        isOpen={isOpen}
        onClose={handleDrawerClose}
        userId={userId}
      />
    </>
  );
}
