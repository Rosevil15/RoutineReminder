import { useState, useEffect } from 'react';
import { Network } from '@capacitor/network';

interface NetworkState {
  isOffline: boolean;
  connectionType: string;
}

/**
 * useNetwork — tracks device network connectivity.
 * isOffline is true when connected === false OR connectionType === 'none'.
 * Property 21: Offline indicator reflects network status correctly.
 */
export function useNetwork(): NetworkState {
  const [state, setState] = useState<NetworkState>({
    isOffline: false,
    connectionType: 'unknown',
  });

  useEffect(() => {
    let listenerHandle: { remove: () => void } | null = null;

    // Initialise from current status
    Network.getStatus().then((status) => {
      setState({
        isOffline: !status.connected || status.connectionType === 'none',
        connectionType: status.connectionType,
      });
    });

    // Listen for changes
    Network.addListener('networkStatusChange', (status) => {
      setState({
        isOffline: !status.connected || status.connectionType === 'none',
        connectionType: status.connectionType,
      });
    }).then((handle) => {
      listenerHandle = handle;
    });

    return () => {
      listenerHandle?.remove();
    };
  }, []);

  return state;
}
