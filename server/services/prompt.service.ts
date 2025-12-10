
export class PromptService {
    static buildSystemPrompt(baseSystemPrompt: string, profile: any, userPrompts: any[] = []): string {
        let prompt = baseSystemPrompt || "You are a helpful AI assistant.";
        
        prompt += "\n\n[CONTEXT & INSTRUCTIONS]";
        
        // Level 1: Profile & Preferences
        if (profile) {
            prompt += `\nUser Profile (For your adaptation, do not repeat this):`;
            if (profile.nickname) prompt += `\n- Name: ${profile.nickname}`;
            if (profile.locale) prompt += `\n- Language: ${profile.locale}`;
            if (profile.theme) prompt += `\n- Theme Preference: ${profile.theme}`;
        }

        // Level 1.5: User Custom Prompts
        if (userPrompts && userPrompts.length > 0) {
            prompt += `\n\nCustom User Instructions (Apply these rules):`;
            userPrompts.forEach(p => {
                prompt += `\n- ${p.content}`;
            });
        }
        
        prompt += "\n[END CONTEXT]";
        
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
