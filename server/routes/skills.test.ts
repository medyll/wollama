import express from 'express';
import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import skillsRouter from './skills.js';
import { dbManager } from '../db/database.js';

const app = express();
app.use(express.json());
app.use('/api/skills', skillsRouter);

const SKILL_ID = 'test-help-skill';
let server: any;
let baseUrl = '';

async function upsertSkill() {
    const db = dbManager.getDb('skills');
    const doc = {
        _id: SKILL_ID,
        skill_id: SKILL_ID,
        name: 'help',
        display_name: 'Help',
        description: 'Provides help about builtin skills',
        command: '/help',
        handler_type: 'builtin',
        handler_ref: 'help',
        is_enabled: true,
        created_at: Date.now()
    } as any;

    try {
        const existing: any = await db.get(SKILL_ID);
        await db.put({ ...existing, ...doc, _id: SKILL_ID, _rev: existing._rev });
    } catch (e: any) {
        if (e.status === 404) {
            await db.put(doc);
        } else {
            throw e;
        }
    }
}

describe('Skills Routes', () => {
    beforeAll(async () => {
        await upsertSkill();
        server = app.listen(0);
        const addr: any = server.address();
        const port = typeof addr === 'string' ? 0 : addr.port;
        baseUrl = `http://127.0.0.1:${port}`;
    });

    afterAll(() => {
        if (server) server.close();
    });

    it('GET /api/skills returns skills list', async () => {
        const res = await fetch(`${baseUrl}/api/skills`);
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(Array.isArray(body)).toBe(true);
        const found = body.find((s: any) => s.skill_id === SKILL_ID || s.name === 'help');
        expect(found).toBeTruthy();
    });

    it('POST /api/skills/:slug/invoke calls builtin handler', async () => {
        const res = await fetch(`${baseUrl}/api/skills/help/invoke`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ args: [] })
        });
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toHaveProperty('skill_id');
        expect(body).toHaveProperty('output');
        expect(body.output).toMatch(/Available builtin skills/);
    });

    it('POST /api/skills/:slug/invoke returns 404 for missing skill', async () => {
        const res = await fetch(`${baseUrl}/api/skills/doesnotexist/invoke`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ args: [] })
        });
        expect(res.status).toBe(404);
    });
});
