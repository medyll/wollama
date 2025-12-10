
export class PromptService {
    static buildSystemPrompt(baseSystemPrompt: string, profile: any, userPrompts: any[] = []): string {
        let prompt = baseSystemPrompt || "You are a helpful AI assistant.";
        
        // Level 1: Profile & Preferences
        if (profile) {
            prompt += `\n\nUser Profile:\n`;
            if (profile.nickname) prompt += `- Name: ${profile.nickname}\n`;
            if (profile.locale) prompt += `- Language: ${profile.locale}\n`;
            if (profile.theme) prompt += `- Theme Preference: ${profile.theme}\n`;
        }

        // Level 1.5: User Custom Prompts
        if (userPrompts && userPrompts.length > 0) {
            prompt += `\n\nUser Instructions:\n`;
            userPrompts.forEach(p => {
                prompt += `- ${p.content}\n`;
            });
        }
        
        return prompt;
    }

    static enrichUserMessage(message: string, contextFiles: any[]): string {
        if (!contextFiles || contextFiles.length === 0) return message;

        let enrichedMessage = "Context provided:\n";
        
        for (const file of contextFiles) {
            enrichedMessage += `\n--- File: ${file.path} ---\n`;
            enrichedMessage += `${file.content}\n`;
            enrichedMessage += `--- End of file ---\n`;
        }

        enrichedMessage += `\nUser Question: ${message}`;
        
        return enrichedMessage;
    }
}
