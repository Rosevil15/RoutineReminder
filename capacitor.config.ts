import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.taskreminder.app',
  appName: 'TaskReminder',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      // Use the default Android notification icon — avoids silent failures
      // from missing drawable resources
      smallIcon: 'ic_launcher_foreground',
      iconColor: '#6366f1',
    },
  },
};

export default config;
