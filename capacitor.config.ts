import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rbs',
  appName: 'RBS',
  webDir: 'out', // Next.js static export ke liye 'out' behtar hai
  server: {
    url: 'https://construction-sites.vercel.app',
    cleartext: true,
    // Android par external URL ke plugins ko allow karne ke liye ye zaroori hai
    androidScheme: 'https',
    allowNavigation: [
      'construction-sites.vercel.app',
      '*.firebaseapp.com',
      '*.googleapis.com'
    ]
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    // FirebaseMessaging ko properly configure karein
    FirebaseMessaging: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    LocalNotifications: {
      smallIcon: "ic_launcher", 
      iconColor: "#488AFF",
      // Sound file ka naam bina extension ke behtar chalta hai native side par
      sound: "jackhammer", 
    },
  },
};

export default config;