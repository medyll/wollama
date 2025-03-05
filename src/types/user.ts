import type { SettingsType } from './settings';

export type UserType = {
	id:            number;
	name:          string;
	email:         string;
	gravatarEmail: string;
	avatarImg:     string;
	color:         string;
	createdAt:     string;
	updated_at:    string;
	settings:      SettingsType;
};
