
import { writable } from 'svelte/store';

export interface ChatListType {
    [key: string]: {
        id: string;
        title: string;
    }
}

export const chatList = writable<ChatListType>({});