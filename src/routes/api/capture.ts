import puppeteer from 'puppeteer';
import type { RequestHandler } from './$types';
export async function post(request: RequestHandler & { body: { url: string } }) {
	const { url } = request.body;
	const browser = await puppeteer.launch();
	const page = await browser.newPage();
	await page.goto(url);
	const screenshotBuffer = await page.screenshot();
	await browser.close();

	const base64Image = screenshotBuffer.toString('base64');
	return {
		status: 200,
		body:   { base64Image }
	};
}
