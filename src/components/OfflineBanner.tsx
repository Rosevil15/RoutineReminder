import React from 'react';
import { IonIcon } from '@ionic/react';
import { cloudOfflineOutline } from 'ionicons/icons';
import { useNetwork } from '../hooks/useNetwork';

const OfflineBanner: React.FC = () => {
  const { isOffline } = useNetwork();
  if (!isOffline) return null;

  return (
    <div style={{
      margin: '8px 16px 0',
      padding: '10px 14px',
      borderRadius: 12,
      background: '#fef3c7',
      border: '1px solid #fde68a',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}>
      <IonIcon icon={cloudOfflineOutline} style={{ color: '#d97706', fontSize: 18, flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: '#92400e', fontWeight: 500 }}>
        You're offline — changes will sync when reconnected
      </span>
    </div>
  );
};

export default OfflineBanner;
