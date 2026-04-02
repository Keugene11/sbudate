import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sbudate.app',
  appName: 'SBUdate',
  webDir: 'public',
  server: {
    url: 'https://sbudate.vercel.app',
    cleartext: false,
  },
  ios: {
    contentInset: 'always',
    preferredContentMode: 'mobile',
    scheme: 'SBUdate',
  },
};

export default config;
