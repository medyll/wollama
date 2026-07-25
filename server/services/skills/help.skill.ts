export default async function helpSkill(args: string[] = []) {
    return {
        output: 'Available builtin skills: /help, /translate, /summarize',
        metadata: { count: 3 }
    };
}
