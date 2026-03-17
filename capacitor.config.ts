import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.RBS.app',
  appName: 'RBS',
  webDir: '.next', 
   server: {
    url: 'https://construction-sites.vercel.app',
    cleartext: true,
    allowNavigation: ['*']
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;