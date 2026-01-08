'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Link2, Unlink, RefreshCw, AlertCircle } from 'lucide-react';

interface GoogleAccountCardProps {
  userId: string;
}

interface GoogleStatus {
  connected: boolean;
  email?: string;
  expiresAt?: number;
}

export function GoogleAccountCard({ userId }: GoogleAccountCardProps) {
  const [status, setStatus] = useState<GoogleStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/auth/google/status');
      if (!response.ok) throw new Error('Failed to fetch status');
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      console.error('Error fetching Google status:', err);
      setError('Failed to check connection status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleConnect = () => {
    // Redirect to Google OAuth
    window.location.href = `/api/auth/google?teacherId=${userId}`;
  };

  const handleDisconnect = async () => {
    try {
      setActionLoading(true);
      setError(null);
      const response = await fetch('/api/auth/google/disconnect', {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to disconnect');
      
      // Refresh status
      await fetchStatus();
    } catch (err) {
      console.error('Error disconnecting Google account:', err);
      setError('Failed to disconnect Google account');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <CardTitle className="text-lg">Google Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-10 bg-secondary rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={status?.connected ? 'border-green-200 dark:border-green-900' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google Calendar
          </CardTitle>
          {status?.connected && (
            <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-950/30 px-2 py-1 rounded-full">
              <Check className="h-3 w-3" />
              Connected
            </span>
          )}
        </div>
        <CardDescription>
          {status?.connected 
            ? 'Your Google Calendar is connected for scheduling meetings'
            : 'Connect to automatically create Google Meet links for your classes'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
        
        {status?.connected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-lg font-medium text-primary">
                  {status.email?.charAt(0).toUpperCase() || 'G'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{status.email || 'Connected Account'}</p>
                <p className="text-xs text-muted-foreground">Linked Google Account</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleConnect}
                disabled={actionLoading}
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reconnect
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                disabled={actionLoading}
                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <Unlink className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={handleConnect}
            disabled={actionLoading}
            className="w-full"
          >
            <Link2 className="h-4 w-4 mr-2" />
            Connect Google Calendar
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default GoogleAccountCard;
