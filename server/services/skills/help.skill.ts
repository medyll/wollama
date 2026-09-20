/** `/help` — lists the builtin skills. */
export default async function helpSkill(_args: string[] = []) {
	return {
		output: 'Available builtin skills: /help, /translate, /summarize',
		metadata: { count: 3 }
	};
}
