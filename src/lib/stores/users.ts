import { writable } from 'svelte/store';

export type userProfileType = {};

const userProfileStore = () => {
	const { subscribe, set, update } = writable<userProfileType>({});

	return {
		set,
		subscribe,
		update
	};
};

export const userProfile = userProfileStore();
