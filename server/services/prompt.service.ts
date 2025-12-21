export class PromptService {
	static buildSystemPrompt(baseSystemPrompt: string, profile: any, userPrompts: any[] = []): string {
		let prompt = baseSystemPrompt || 'You are a helpful AI assistant.';

		// prompt += '\n(The following information is for your adaptation only. Do not output it.)';

		// Level 1: Profile & Preferences
		if (profile) {
			prompt += `\n<user_profile>`;
			if (profile.nickname) prompt += `\n- Name: ${profile.nickname}`;
			if (profile.locale) prompt += `\n- Language: ${profile.locale}`;
			prompt += `\n</user_profile>`;
		}

		// Level 1.5: User Custom Prompts
		if (userPrompts && userPrompts.length > 0) {
			prompt += `\n\n<custom_instructions>`;
			userPrompts.forEach((p) => {
				prompt += `\n- ${p.content}`;
			});
			prompt += `\n</custom_instructions>`;
		}

		prompt += `\n\n<language_config>
    TARGET LANGUAGE: FRENCH.
    CRITICAL: 
    - Output MUST be in French.
    - Ignore the language of the examples above, only follow their formatting syntax.
</language_config>`;

		return `<system_context>\n${prompt}\n</system_context>`;
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
