/** `/summarize <text>` — placeholder summarizer: returns the first sentence, or the
 *  first 100 characters when there is no sentence break. */
export default async function summarizeSkill(args: string[] = []) {
	const text = args.join(' ');
	if (!text) return { output: 'No text provided to summarize' };
	// Very naive summary: first sentence or first 100 chars
	const firstSentence = text.split(/[.!?]\s/)[0];
	const summary = firstSentence.length > 0 ? firstSentence : text.slice(0, 100);
	return { output: summary, metadata: { length: summary.length } };
}
