import { useEffect, useRef } from 'react';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { useAuth0 } from '@auth0/auth0-react';

const BACKEND_URL = 'https://dev.dynamicpricingbuilder.com';

export const useLogoutSignalR = () => {
  const { user, isAuthenticated, logout } = useAuth0();
  const connectionRef = useRef<HubConnection | null>(null);
  const joinGroupRetryRef = useRef<NodeJS.Timeout | null>(null);

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

    // If connection already exists and is connected, don't create a new one
    if (connectionRef.current && connectionRef.current.state === HubConnectionState.Connected) {
      console.log('✅ SignalR already connected');
      return;
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

    // Listen for logout event - set up BEFORE starting connection
    connection.on('UserLoggedOut', async (data: { 
      UserId: string; 
      SessionId?: string; 
      LogoutTime: string;
      Message?: string;
    }) => {
      console.log('🔔 Logout event received:', data);
      console.log('👤 Current user:', user?.sub);
      console.log('🔍 Event UserId:', data.UserId);

      // Check if this logout is for current user (exact match)
      if (data.UserId === user?.sub) {
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
          },
          localOnly: false
        });
      } else {
        console.log('ℹ️ Logout event for different user - ignoring');
      }
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

