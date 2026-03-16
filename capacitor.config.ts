import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.RBS.app',
  appName: 'RBS',

  server: {
    url: 'https://construction-sites.vercel.app',
    cleartext: true
  }
};

export default config;
