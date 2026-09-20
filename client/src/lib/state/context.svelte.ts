import { userState } from './user.svelte';

/** A file attached to the conversation, either picked by the user or detected automatically. */
export type ContextFile = {
	name: string;
	path: string;
	content: string;
	source: 'user' | 'auto'; // user selected or auto-detected
};

/** The files attached to the current conversation, deduplicated by path. */
export class ContextState {
	activeFiles = $state<ContextFile[]>([]);

	addFile(file: ContextFile) {
		// Avoid duplicates
		if (!this.activeFiles.find((f) => f.path === file.path)) {
			this.activeFiles.push(file);
		}
	}

	removeFile(path: string) {
		this.activeFiles = this.activeFiles.filter((f) => f.path !== path);
	}

	clear() {
		this.activeFiles = [];
	}

	getPayload() {
		return {
			files: $state.snapshot(this.activeFiles),
			profile: $state.snapshot(userState.preferences)
		};
	}
}

/** App-wide attached-file state. */
export const contextState = new ContextState();
