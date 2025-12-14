import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'com.wollama.app',
	appName: 'Wollama',
	webDir: 'build',
	server: {
		url: 'http://192.168.1.154:5173',
		cleartext: true
	}
};

export default config;
