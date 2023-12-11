import { writable } from 'svelte/store';

export type userProfileType = {};

const userProfileStore = () => {
	const { subscribe, set, update } = writable<userProfileType>({});

	return {
		subscribe,
		set,
		update
	};
};

export const userProfile = userProfileStore();
