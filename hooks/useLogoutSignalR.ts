import { useEffect, useRef } from 'react';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { useAuth0 } from '@auth0/auth0-react';

const BACKEND_URL = 'https://dev.dynamicpricingbuilder.com';

export const useLogoutSignalR = () => {
  const { user, isAuthenticated, logout } = useAuth0();
  const connectionRef = useRef<HubConnection | null>(null);

  useEffect(() => {
    // Only connect if user is authenticated
    if (!isAuthenticated || !user?.sub) {
      return;
    }

    // Create SignalR connection
    const connection: HubConnection = new HubConnectionBuilder()
      .withUrl(`${BACKEND_URL}/hubs/logout`)
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          // Retry logic: 0s, 2s, 10s, 30s, then stop
          if (retryContext.elapsedMilliseconds < 60000) {
            return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
          }
          return null; // Stop retrying after 60 seconds
        }
      })
      .build();

    connectionRef.current = connection;

    // Start connection
    connection.start()
      .then(() => {
        console.log('✅ SignalR Connected to Logout Hub');

        // Join user-specific group
        if (user.sub) {
          connection.invoke('JoinLogoutGroup', user.sub)
            .then(() => {
              console.log(`✅ Joined logout group for user: ${user.sub}`);
            })
            .catch(err => {
              console.error('❌ Error joining logout group:', err);
            });
        }
      })
      .catch(err => {
        console.error('❌ SignalR Connection Error:', err);
      });

    // Listen for logout event
    connection.on('UserLoggedOut', async (data: { 
      UserId: string; 
      SessionId?: string; 
      LogoutTime: string;
      Message?: string;
    }) => {
      console.log('🔔 Logout event received:', data);

      // Check if this logout is for current user
      if (data.UserId === user?.sub) {
        console.log('🚪 Current user logged out - logging out from frontend');

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
          await connection.stop();
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
      }
    });

    // Handle connection events
    connection.onreconnecting((error) => {
      console.log('🔄 SignalR Reconnecting...', error);
    });

    connection.onreconnected((connectionId) => {
      console.log('✅ SignalR Reconnected. Connection ID:', connectionId);
      
      // Rejoin group after reconnection
      if (user?.sub) {
        connection.invoke('JoinLogoutGroup', user.sub)
          .catch(err => console.error('Error rejoining group:', err));
      }
    });

    connection.onclose((error) => {
      console.log('❌ SignalR Connection Closed', error);
    });

    // Cleanup on unmount
    return () => {
      if (connectionRef.current) {
        // Leave group before disconnecting
        if (user?.sub) {
          connectionRef.current.invoke('LeaveLogoutGroup', user.sub)
            .catch(err => console.error('Error leaving group:', err));
        }

        // Stop connection
        connectionRef.current.stop()
          .then(() => console.log('✅ SignalR Connection Stopped'))
          .catch(err => console.error('Error stopping connection:', err));
      }
    };
  }, [isAuthenticated, user, logout]);

  return connectionRef.current;
};

