import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    
    const req = await request.json();
    
    return fetch(`https://api.mathjs.org/api/generate`,{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(req)
    })   
};