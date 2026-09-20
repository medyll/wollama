import { GenericService } from './generic.service.js';
import { User, UserPreferences, Companion, Chat, Message } from '../types/data.js';

/** One `GenericService` per core table, so call sites do not construct their own. */
export const StorageService = {
	users: new GenericService<User>('users'),
	userPreferences: new GenericService<UserPreferences>('user_preferences'),
	companions: new GenericService<Companion>('companions'),
	chats: new GenericService<Chat>('chats'),
	messages: new GenericService<Message>('messages')
};
