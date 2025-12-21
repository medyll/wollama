export class PromptService {
	static buildSystemPrompt(baseSystemPrompt: string, profile: any, userPrompts: any[] = []): string {
		let prompt = ''; //baseSystemPrompt || 'You are a helpful AI assistant.';

		//prompt += '<system_context>';
		prompt += `${baseSystemPrompt}`;
		// prompt += '\n(The following information is for your adaptation only. Do not output it.)';

		// Level 1: Profile & Preferences
		/* if (profile) {
			prompt += `\n\nUser Profile:`;
			if (profile.nickname) prompt += `\n- Name: ${profile.nickname}`;
			if (profile.locale) prompt += `\n- Language: ${profile.locale}`;
			if (profile.theme) prompt += `\n- Theme Preference: ${profile.theme}`;
		} */

		// Level 1.5: User Custom Prompts
		if (userPrompts && userPrompts.length > 0) {
			prompt += `\n\nCustom Instructions:`;
			userPrompts.forEach((p) => {
				prompt += `\n- ${p.content}`;
			});
		}

		// MVP Requirement: Always respond in French
		// prompt += `\n\nIMPORTANT: You must imperatively respond in French to all requests, regardless of the user's input language or the system prompt language.`;

		//prompt += '\n</system_context>';

		return `<system_context>${prompt}</system_context>`;
	}

	static enrichUserMessage(message: string, contextFiles: any[]): string {
		if (!contextFiles || contextFiles.length === 0) return message;

		let enrichedMessage = 'Context provided:\n';

		for (const file of contextFiles) {
			enrichedMessage += `\n--- File: ${file.path} ---\n`;
			enrichedMessage += `${file.content}\n`;
			enrichedMessage += `--- End of file ---\n`;
		}

		enrichedMessage += `\nUser Question: ${message}`;

		return enrichedMessage;
	}
}
