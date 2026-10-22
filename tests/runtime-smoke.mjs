import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import Database from 'better-sqlite3';
const directory = await mkdtemp(join(tmpdir(), 'analog-runtime-'));
const path = join(directory, 'runtime.db');
const origin = 'https://analog.example';
const base = 'http://127.0.0.1:4177';
let child;
let output = '';
function start() {
	child = spawn(process.execPath, ['build'], {
		env: {
			...process.env,
			HOST: '127.0.0.1',
			PORT: '4177',
			ORIGIN: origin,
			DATABASE_PATH: path,
			CLIENT_ID: 'runtime-client',
			CLIENT_SECRET: 'runtime-secret',
			AUTHORIZED_USER: 'owner'
		},
		stdio: ['ignore', 'pipe', 'pipe']
	});
	child.stdout.on('data', (chunk) => (output += chunk));
	child.stderr.on('data', (chunk) => (output += chunk));
}
async function ready() {
	for (let i = 0; i < 100; i++) {
		if (child.exitCode !== null) throw new Error(output);
		try {
			if ((await fetch(base + '/health')).ok) return;
		} catch {
			// The HTTP listener may not be ready yet.
		}
		await new Promise((resolve) => setTimeout(resolve, 100));
	}
	throw new Error(output || 'Startup timeout');
}
async function stop() {
	if (child && child.exitCode === null) {
		const exit = new Promise((resolve) => child.once('exit', resolve));
		child.kill();
		await exit;
	}
}
const token = 'runtime-session-token';
try {
	start();
	await ready();
	assert.equal((await fetch(base + '/')).status, 200);
	assert.equal((await fetch(base + '/admin')).status, 403);
	assert.equal((await fetch(base + '/auth/callback?state=forged&code=x')).status, 400);
	const login = await fetch(base + '/auth/login', { redirect: 'manual' });
	assert.equal(login.status, 302);
	const target = new URL(login.headers.get('location'));
	assert.equal(target.searchParams.get('client_id'), 'runtime-client');
	assert.equal(target.searchParams.get('redirect_uri'), origin + '/auth/callback');
	for (const cookie of login.headers.getSetCookie()) {
		assert.match(cookie, /HttpOnly/);
		assert.match(cookie, /Secure/);
		assert.match(cookie, /SameSite=Lax/);
		assert.ok(!cookie.includes('Domain='));
	}
	const db = new Database(path);
	db.prepare('INSERT INTO auth_session VALUES (?, ?, ?)').run(
		createHash('sha256').update(token).digest('hex'),
		'owner',
		Date.now() + 60000
	);
	db.close();
	const headers = { cookie: `analog_session=${token}` };
	assert.equal((await fetch(base + '/admin', { headers })).status, 200);
	await stop();
	start();
	await ready();
	assert.equal((await fetch(base + '/admin', { headers })).status, 200);
	assert.equal((await fetch(base + '/auth/logout', { headers })).status, 405);
	assert.equal(
		(
			await fetch(base + '/auth/logout', {
				method: 'POST',
				headers: {
					...headers,
					origin: 'https://evil.example',
					'content-type': 'application/x-www-form-urlencoded'
				},
				body: '',
				redirect: 'manual'
			})
		).status,
		403
	);
	const logout = await fetch(base + '/auth/logout', {
		method: 'POST',
		headers: { ...headers, origin, 'content-type': 'application/x-www-form-urlencoded' },
		body: '',
		redirect: 'manual'
	});
	assert.equal(logout.status, 303);
	assert.equal((await fetch(base + '/admin', { headers })).status, 403);
	console.log(
		'Production runtime smoke passed: runtime env, SQLite, secure cookies, admin, restart persistence, CSRF and logout.'
	);
} catch (error) {
	console.error(output);
	throw error;
} finally {
	await stop();
	await rm(directory, { recursive: true, force: true });
}
