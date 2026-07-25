export default async function translateSkill(args: string[] = []) {
    // naive mock: first arg is target language, rest is text
    if (!args || args.length === 0) {
        return { output: 'Usage: /translate <lang> <text>' };
    }
    const lang = args[0];
    const text = args.slice(1).join(' ');
    if (!text) return { output: 'No text provided to translate' };

    // Mock translation: prefix with language code
    return {
        output: `[${lang}] ${text}`,
        metadata: { translated: true, lang }
    };
}
