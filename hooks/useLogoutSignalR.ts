import { useEffect, useRef } from 'react';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { useAuth0 } from '@auth0/auth0-react';

const BACKEND_URL = 'https://dev.dynamicpricingbuilder.com';

export const useLogoutSignalR = () => {
  const { user, isAuthenticated, logout } = useAuth0();
  const connectionRef = useRef<HubConnection | null>(null);
  const joinGroupRetryRef = useRef<NodeJS.Timeout | null>(null);
  const userRef = useRef<string | undefined>(user?.sub);
  
  // Update user ref whenever user changes
  useEffect(() => {
    userRef.current = user?.sub;
    console.log('👤 User ref updated:', userRef.current);
  }, [user?.sub]);

  // Helper function to join logout group with retry logic
  const joinLogoutGroup = async (connection: HubConnection, userId: string, retryCount = 0) => {
    const maxRetries = 5;
    
    try {
      // Ensure connection is connected before joining group
      if (connection.state !== HubConnectionState.Connected) {
        console.log(`⏳ Waiting for connection... State: ${connection.state}`);
        if (retryCount < maxRetries) {
          setTimeout(() => joinLogoutGroup(connection, userId, retryCount + 1), 1000 * (retryCount + 1));
        }
        return;
      }

      await connection.invoke('JoinLogoutGroup', userId);
      console.log(`✅ Joined logout group for user: ${userId}`);
      
      // Clear any pending retry
      if (joinGroupRetryRef.current) {
        clearTimeout(joinGroupRetryRef.current);
        joinGroupRetryRef.current = null;
      }
    } catch (err: any) {
      console.error(`❌ Error joining logout group (attempt ${retryCount + 1}/${maxRetries}):`, err);
      
      // Retry joining group if connection is still connected
      if (retryCount < maxRetries && connection.state === HubConnectionState.Connected) {
        const delay = 1000 * Math.pow(2, retryCount); // Exponential backoff
        joinGroupRetryRef.current = setTimeout(() => {
          joinLogoutGroup(connection, userId, retryCount + 1);
        }, delay);
      }
    }
  };

  useEffect(() => {
    // Only connect if user is authenticated
    if (!isAuthenticated || !user?.sub) {
      // Clean up connection if user is not authenticated
      if (connectionRef.current) {
        connectionRef.current.stop().catch(err => console.error('Error stopping connection:', err));
        connectionRef.current = null;
      }
      return;
    }

    // Log current route for debugging
    console.log('🔍 SignalR Hook - User authenticated:', {
      userId: user.sub,
      currentPath: window.location.pathname,
      isAuthenticated
    });

    // IMPORTANT: Check if connection already exists and is connected
    // If connected, verify it's still in the correct group (user might have changed)
    if (connectionRef.current && connectionRef.current.state === HubConnectionState.Connected) {
      console.log('✅ SignalR already connected - verifying group membership');
      console.log('📍 Current route:', window.location.pathname);
      console.log('👤 Current user:', user.sub);
      console.log('👤 User ref:', userRef.current);
      
      // Ensure user is still in the group (in case of user change or re-authentication)
      // This is especially important on callback route where user just logged in
      if (user.sub) {
        console.log('🔄 Verifying/rejoining logout group for user:', user.sub);
        joinLogoutGroup(connectionRef.current, user.sub);
        
        // Also remove old event handler and set up new one to ensure latest user ref is used
        connectionRef.current.off('UserLoggedOut');
        
        // Re-setup event handler with latest user ref
        connectionRef.current.on('UserLoggedOut', async (data: any) => {
          const currentUserId = userRef.current;
          // Backend sends lowercase 'userId', handle both cases
          const eventUserId = data.UserId || data.userId || data.user_id;
          
          console.log('🔔 Logout event received (reconnected handler):', data);
          console.log('👤 Current user (ref):', currentUserId);
          console.log('🔍 Event UserId (extracted):', eventUserId);
          
          if (eventUserId && currentUserId && eventUserId === currentUserId) {
            console.log('🚪 Current user logged out - performing logout');
            
            // Clear cache
            Object.keys(localStorage).forEach(key => {
              if (key.includes('auth0') || key.includes('@@auth0spajs@@') || key.toLowerCase().includes('auth')) {
                localStorage.removeItem(key);
              }
            });
            Object.keys(sessionStorage).forEach(key => {
              if (key.startsWith('ss_check_')) {
                sessionStorage.removeItem(key);
              }
            });
            
            try {
              if (connectionRef.current?.state === HubConnectionState.Connected) {
                await connectionRef.current.stop();
              }
            } catch (err) {
              console.error('Error stopping connection:', err);
            }
            
            logout({
              logoutParams: { returnTo: window.location.origin }
            });
          } else {
            console.log('ℹ️ Logout event for different user - ignoring');
          }
        });
      }
      return;
    }

    // If connection exists but is not connected, clean it up and create new one
    if (connectionRef.current && connectionRef.current.state !== HubConnectionState.Connected) {
      console.log('🔄 Cleaning up disconnected connection, creating new one');
      connectionRef.current.stop().catch(() => {});
      connectionRef.current = null;
    }

    // Create SignalR connection
    const connection: HubConnection = new HubConnectionBuilder()
      .withUrl(`${BACKEND_URL}/hubs/logout`)
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          // Retry logic: 0s, 2s, 10s, 30s, then continue retrying
          if (retryContext.elapsedMilliseconds < 300000) { // Retry for 5 minutes
            return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
          }
          return null; // Stop retrying after 5 minutes (but will retry on next page load)
        }
      })
      .build();

    connectionRef.current = connection;

    // IMPORTANT: Set up event handler BEFORE starting connection
    // This ensures we catch logout events even if they arrive immediately after connection
    connection.on('UserLoggedOut', async (data: any) => {
      // Use ref to get latest user value (not closure)
      const currentUserId = userRef.current;
      
      // Backend sends lowercase 'userId', handle both cases
      const eventUserId = data.UserId || data.userId || data.user_id;
      
      console.log('🔔 Logout event received:', data);
      console.log('👤 Current user (from ref):', currentUserId);
      console.log('👤 Current user (from hook):', user?.sub);
      console.log('🔍 Event UserId (raw):', data.UserId);
      console.log('🔍 Event userId (raw):', data.userId);
      console.log('🔍 Event userId (extracted):', eventUserId);
      console.log('📍 Current URL:', window.location.href);
      console.log('📍 Current Path:', window.location.pathname);

      // Check if this logout is for current user (exact match)
      // Use ref value to avoid stale closure issues
      if (eventUserId && currentUserId && eventUserId === currentUserId) {
        console.log('🚪 Current user logged out - performing logout');

        // Clear all Auth0 cache
        Object.keys(localStorage).forEach(key => {
          if (key.includes('auth0') || 
              key.includes('@@auth0spajs@@') || 
              key.toLowerCase().includes('auth')) {
            localStorage.removeItem(key);
          }
        });

        // Clear session storage
        Object.keys(sessionStorage).forEach(key => {
          if (key.startsWith('ss_check_')) {
            sessionStorage.removeItem(key);
          }
        });

        // Disconnect SignalR before logout
        try {
          if (connection.state === HubConnectionState.Connected) {
            await connection.stop();
            console.log('✅ SignalR disconnected before logout');
          }
        } catch (err) {
          console.error('Error stopping SignalR connection:', err);
        }

        // Use Auth0 logout to clear session
        logout({
          logoutParams: {
            returnTo: window.location.origin
          }
        });
      } else {
        console.log('ℹ️ Logout event for different user - ignoring');
      }
    });

    // Start connection
    connection.start()
      .then(() => {
        console.log('✅ SignalR Connected to Logout Hub');
        console.log('🔗 Connection State:', connection.state);
        console.log('👤 User ID:', user.sub);

        // Join user-specific group with retry logic
        if (user.sub) {
          joinLogoutGroup(connection, user.sub);
        }
      })
      .catch(err => {
        console.error('❌ SignalR Connection Error:', err);
        // Retry connection after delay
        setTimeout(() => {
          if (connectionRef.current && connectionRef.current.state !== HubConnectionState.Connected) {
            connectionRef.current.start()
              .then(() => {
                console.log('✅ SignalR Reconnected after error');
                if (user?.sub) {
                  joinLogoutGroup(connectionRef.current!, user.sub);
                }
              })
              .catch(err => console.error('❌ Retry connection failed:', err));
          }
        }, 3000);
      });

    // Handle connection events
    connection.onreconnecting((error) => {
      console.log('🔄 SignalR Reconnecting...', error);
    });

    connection.onreconnected((connectionId) => {
      console.log('✅ SignalR Reconnected. Connection ID:', connectionId);
      console.log('👤 Rejoining group for user:', user?.sub);
      
      // Rejoin group after reconnection with retry logic
      if (user?.sub) {
        joinLogoutGroup(connection, user.sub);
      }
    });

    connection.onclose((error) => {
      console.log('❌ SignalR Connection Closed', error);
    });

    // Cleanup on unmount
    return () => {
      // Clear any pending retry timers
      if (joinGroupRetryRef.current) {
        clearTimeout(joinGroupRetryRef.current);
        joinGroupRetryRef.current = null;
      }

      if (connectionRef.current) {
        // Leave group before disconnecting (only if connected)
        if (user?.sub && connectionRef.current.state === HubConnectionState.Connected) {
          connectionRef.current.invoke('LeaveLogoutGroup', user.sub)
            .catch(err => console.error('Error leaving group:', err));
        }

        // Stop connection
        connectionRef.current.stop()
          .then(() => console.log('✅ SignalR Connection Stopped'))
          .catch(err => console.error('Error stopping connection:', err));
        
        connectionRef.current = null;
      }
    };
  }, [isAuthenticated, user?.sub, logout]);

  return connectionRef.current;
};

