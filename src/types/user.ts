import type { SettingsType } from './settings';

export type UserType = {
	id: number;
	name: string;
	email: string;
	gravatarEmail: string;
	avatarImg: string;
	color: string;
	created_at: string;
	updated_at: string;
	settings: SettingsType;
};
