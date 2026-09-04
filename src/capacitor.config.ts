import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yoursgermanly.app',
  appName: 'Yours Germanly',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
