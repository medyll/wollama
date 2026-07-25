const MAX_CONTENT_LENGTH = 4000;

export interface PageFetchOutput {
    url: string;
    content: string;
    truncated: boolean;
    error?: string;
}

function stripHtml(html: string): string {
    // Remove script/style blocks entirely
    let text = html.replace(/<script[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<style[\s\S]*?<\/style>/gi, '');
    // Replace block-level tags with newlines
    text = text.replace(/<\/(p|div|li|h[1-6]|br|tr|blockquote)>/gi, '\n');
    // Strip all remaining tags
    text = text.replace(/<[^>]+>/g, '');
    // Decode common HTML entities
    text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
    // Collapse whitespace
    text = text.replace(/[ \t]+/g, ' ');
    text = text.replace(/\n{3,}/g, '\n\n');
    return text.trim();
}

export class PageFetchAgent {
    static readonly slug = 'page-fetch';

    static async run(input: { url: string }): Promise<PageFetchOutput> {
        const { url } = input;

        if (!url || typeof url !== 'string' || url.trim() === '') {
            return { url: url ?? '', content: '', truncated: false, error: 'URL must be a non-empty string' };
        }

        const trimmedUrl = url.trim();

        // Basic URL validation
        try {
            new URL(trimmedUrl);
        } catch {
            return { url: trimmedUrl, content: '', truncated: false, error: 'Invalid URL' };
        }

        try {
            const res = await fetch(trimmedUrl, {
                signal: AbortSignal.timeout(10000),
                headers: { 'User-Agent': 'Wollama/1.0 (page-fetch-agent)' }
            });

            if (!res.ok) {
                return { url: trimmedUrl, content: '', truncated: false, error: `HTTP ${res.status}` };
            }

            const contentType = res.headers.get('content-type') ?? '';
            const html = await res.text();
            const text = contentType.includes('text/html') ? stripHtml(html) : html;

            const truncated = text.length > MAX_CONTENT_LENGTH;
            const content = truncated
                ? text.slice(0, MAX_CONTENT_LENGTH) + '\n\n[Content truncated — showing first 4000 characters]'
                : text;

            return { url: trimmedUrl, content, truncated };
        } catch (err: any) {
            return { url: trimmedUrl, content: '', truncated: false, error: err?.message ?? 'Network error' };
        }
    }
}

export default PageFetchAgent;
