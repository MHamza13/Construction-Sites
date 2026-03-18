import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rbs',
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
    LocalNotifications: {
      smallIcon: "ic_launcher", 
      iconColor: "#488AFF",
      sound: "jackhammer.mp3",
    },
  },
};

export default config;