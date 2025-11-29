import { strict as assert } from 'assert';

const BASE_URL = 'http://127.0.0.1:3000';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function waitForServer() {
    for (let i = 0; i < 10; i++) {
        try {
            await fetch(`${BASE_URL}/api/health`);
            return;
        } catch (e) {
            await sleep(1000);
        }
    }
    throw new Error('Server did not start in time');
}

async function runTests() {
    console.log('Starting server tests...');
    await waitForServer();

    // 1. Health Check
    try {
        const res = await fetch(`${BASE_URL}/api/health`);
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.deepEqual(data, { status: 'ok' });
        console.log('✅ Health check passed');
    } catch (err) {
        console.error('❌ Health check failed:', err);
        process.exit(1);
    }

    // 2. Create User via PouchDB API
    const userId = 'test-user-' + Date.now();
    const userDoc = {
        _id: userId,
        user_id: userId,
        username: 'Test User',
        created_at: Date.now()
    };

    try {
        const res = await fetch(`${BASE_URL}/_db/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userDoc)
        });
        
        if (res.status !== 201) {
            const text = await res.text();
            throw new Error(`Failed to create user: ${res.status} ${text}`);
        }
        
        const data = await res.json();
        assert.ok(data.ok);
        assert.equal(data.id, userId);
        console.log('✅ Create user passed');
    } catch (err) {
        console.error('❌ Create user failed:', err);
        process.exit(1);
    }

    // 3. Retrieve User
    try {
        const res = await fetch(`${BASE_URL}/_db/users/${userId}`);
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data._id, userId);
        assert.equal(data.username, 'Test User');
        console.log('✅ Retrieve user passed');
    } catch (err) {
        console.error('❌ Retrieve user failed:', err);
        process.exit(1);
    }

    console.log('🎉 All tests passed!');
    process.exit(0);
}

runTests();
