import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'com.medyll.aiui',
	appName: 'aiui',
	server: {
		androidScheme: 'https'
	},
	webDir: 'dist'
};

export default config;
