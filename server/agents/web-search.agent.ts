export interface WebSearchResult {
    title: string;
    url: string;
    snippet: string;
}

export interface WebSearchOutput {
    query: string;
    results: WebSearchResult[];
    error?: string;
}

export class WebSearchAgent {
    static readonly slug = 'web-search';

    static async run(input: { query: string }): Promise<WebSearchOutput> {
        const { query } = input;

        if (!query || typeof query !== 'string' || query.trim() === '') {
            return { query: query ?? '', results: [], error: 'Query must be a non-empty string' };
        }

        const q = query.trim();

        try {
            const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`;
            const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
            if (!res.ok) {
                return { query: q, results: [], error: `Search API returned ${res.status}` };
            }

            const data: any = await res.json();
            const results: WebSearchResult[] = [];

            // Abstract (top result)
            if (data.AbstractText && data.AbstractURL) {
                results.push({
                    title: data.Heading ?? q,
                    url: data.AbstractURL,
                    snippet: data.AbstractText
                });
            }

            // Related topics
            if (Array.isArray(data.RelatedTopics)) {
                for (const topic of data.RelatedTopics) {
                    if (topic.FirstURL && topic.Text) {
                        results.push({ title: topic.Text.split(' - ')[0] ?? topic.Text, url: topic.FirstURL, snippet: topic.Text });
                        if (results.length >= 5) break;
                    }
                }
            }

            if (results.length === 0) {
                return { query: q, results: [], error: 'No results found' };
            }

            return { query: q, results };
        } catch (err: any) {
            return { query: q, results: [], error: err?.message ?? 'Network error' };
        }
    }
}

export default WebSearchAgent;
