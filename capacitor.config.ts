import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.quill.notes',
  appName: 'Quill',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;
