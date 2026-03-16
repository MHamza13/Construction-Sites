import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.RBS.app',
  appName: 'RBS',
  webDir: 'out', // Next.js static export folder
  server: {
    url: 'https://construction-sites.vercel.app',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;