import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kisansetu.app',
  appName: 'KisanSetu',
  webDir: 'dist',
  server: {
  androidScheme: 'http',
  cleartext: true,
},
};

export default config;
