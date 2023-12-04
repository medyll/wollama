import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'com.medyll.aiui',
	appName: 'aiui',
	webDir: 'dist',
	server: {
		androidScheme: 'https'
	}
};

export default config;
