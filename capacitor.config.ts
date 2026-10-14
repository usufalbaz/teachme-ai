import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.teachme.ai',
  appName: 'TeachMe AI',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  android: {
    backgroundColor: '#070b14',
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true, // مفيدة أثناء التطوير وتجربة الصوت
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#070b14',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
  },
};

export default config;
