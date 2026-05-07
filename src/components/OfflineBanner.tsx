import React from 'react';
import { IonChip, IonIcon, IonLabel } from '@ionic/react';
import { cloudOfflineOutline } from 'ionicons/icons';
import { useNetwork } from '../hooks/useNetwork';

const OfflineBanner: React.FC = () => {
  const { isOffline } = useNetwork();

  if (!isOffline) return null;

  return (
    <IonChip color="warning" style={{ margin: '8px 16px' }}>
      <IonIcon icon={cloudOfflineOutline} />
      <IonLabel>You are offline — changes will sync when reconnected</IonLabel>
    </IonChip>
  );
};

export default OfflineBanner;
