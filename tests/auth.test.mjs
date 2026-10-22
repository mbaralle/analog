import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, test } from 'node:test';

import { createServer } from 'vite';

let server, auth, login, callback, logout, database, directory;

before(async () => {
	directory = await mkdtemp(join(tmpdir(), 'analog-auth-'));
	process.env.DATABASE_PATH = join(directory, 'test.db');
	process.env.CLIENT_ID = 'test-client';
	process.env.CLIENT_SECRET = 'test-secret';
	process.env.AUTHORIZED_USER = 'owner';
	server = await createServer({ server: { middlewareMode: true }, mode: 'test' });
	auth = await server.ssrLoadModule('/src/lib/server/auth.ts');
	login = await server.ssrLoadModule('/src/routes/auth/login/+server.ts');
	callback = await server.ssrLoadModule('/src/routes/auth/callback/+server.ts');
	logout = await server.ssrLoadModule('/src/routes/auth/logout/+server.ts');
	database = (await server.ssrLoadModule('/src/lib/server/database.ts')).getDatabase();
});

after(async () => {
	database?.close();
	await server?.close();
	if (directory) await rm(directory, { recursive: true, force: true });
});

function cookies(initial = {}) {
	const values = new Map(Object.entries(initial));
	const options = new Map();
	return {
		values,
		options,
		get: (name) => values.get(name),
		set: (name, value, settings) => {
			values.set(name, value);
			options.set(name, settings);
		},
		delete: (name) => values.delete(name)
	};
}

function event(
	jar,
	query = '?state=valid&code=code',
	fetch = () => assert.fail('Unexpected GitHub request')
) {
	return { cookies: jar, url: new URL(`https://analog.example/auth/callback${query}`), fetch };
}

function oauthCookies() {
	return cookies({ [auth.STATE_COOKIE]: 'valid', [auth.VERIFIER_COOKIE]: 'verifier' });
}

function githubFetch(user = 'Owner', tokenResponse = { access_token: 'github-secret' }) {
	return async (url, options) => {
		if (url === 'https://github.com/login/oauth/access_token') {
			const body = JSON.parse(options.body);
			assert.equal(body.client_secret, 'test-secret');
			assert.equal(body.redirect_uri, 'https://analog.example/auth/callback');
			assert.equal(body.code_verifier, 'verifier');
			return Response.json(tokenResponse);
		}
		assert.equal(url, 'https://api.github.com/user');
		assert.equal(options.headers.Authorization, 'Bearer github-secret');
		return Response.json({ login: user });
	};
}

test('login generates fresh state, PKCE and an explicit callback', () => {
	const jar = cookies();
	let target;
	assert.throws(
		() => login.GET(event(jar)),
		(response) => {
			target = new URL(response.location);
			return response.status === 302;
		}
	);
	const state = jar.get(auth.STATE_COOKIE);
	assert.equal(target.searchParams.get('state'), state);
	assert.equal(state.length, 43);
	assert.equal(target.searchParams.get('redirect_uri'), 'https://analog.example/auth/callback');
	assert.equal(target.searchParams.get('code_challenge_method'), 'S256');
	assert.equal(
		target.searchParams.get('code_challenge'),
		createHash('sha256').update(jar.get(auth.VERIFIER_COOKIE)).digest('base64url')
	);
	assert.equal(jar.options.get(auth.STATE_COOKIE).httpOnly, true);
	assert.equal(jar.options.get(auth.STATE_COOKIE).sameSite, 'lax');
	assert.equal(jar.options.get(auth.STATE_COOKIE).maxAge, 600);
	assert.throws(
		() => login.GET(event(jar)),
		(response) => response.status === 302
	);
	assert.notEqual(jar.get(auth.STATE_COOKIE), state);
});

test('missing/mismatched state, missing PKCE, denied consent and missing code fail before GitHub requests', async () => {
	for (const jar of [
		cookies(),
		cookies({ [auth.STATE_COOKIE]: 'wrong', [auth.VERIFIER_COOKIE]: 'v' }),
		cookies({ [auth.STATE_COOKIE]: 'valid' })
	]) {
		await assert.rejects(callback.GET(event(jar)), (response) => response.status === 400);
		assert.equal(jar.get(auth.STATE_COOKIE), undefined);
	}
	for (const query of ['?state=valid&error=access_denied', '?state=valid']) {
		await assert.rejects(
			callback.GET(event(oauthCookies(), query)),
			(response) => response.status === 400
		);
	}
});

test('wrong GitHub user and failed token exchange never create a session', async () => {
	const jar = oauthCookies();
	await assert.rejects(
		callback.GET(event(jar, undefined, githubFetch('outsider'))),
		(response) => response.status === 403
	);
	assert.equal(jar.get(auth.SESSION_COOKIE), undefined);
	await assert.rejects(
		callback.GET(
			event(oauthCookies(), undefined, githubFetch('Owner', { error: 'bad_verification_code' }))
		),
		(response) => response.status === 502
	);
	await assert.rejects(
		callback.GET(event(oauthCookies(), undefined, async () => new Response('', { status: 503 }))),
		(response) => response.status === 502
	);
	await assert.rejects(
		callback.GET(
			event(oauthCookies(), undefined, async () => {
				throw new Error('network');
			})
		),
		(response) => response.status === 502
	);
});

test('successful login rotates sessions, persists only a hash and rejects callback replay', async () => {
	const oldSession = auth.createSession('owner');
	const jar = oauthCookies();
	jar.set(auth.SESSION_COOKIE, oldSession, {});
	await assert.rejects(
		callback.GET(event(jar, undefined, githubFetch())),
		(response) => response.status === 302 && response.location === '/admin'
	);
	const token = jar.get(auth.SESSION_COOKIE);
	assert.notEqual(token, oldSession);
	assert.notEqual(token, 'github-secret');
	assert.equal(jar.options.get(auth.SESSION_COOKIE).maxAge, 43200);
	assert.equal(jar.options.get(auth.SESSION_COOKIE).httpOnly, true);
	auth.checkAuth(token);
	assert.throws(
		() => auth.checkAuth(oldSession),
		(response) => response.status === 403
	);
	const rows = database.prepare('SELECT * FROM auth_session').all();
	assert.equal(rows.length, 1);
	assert.equal(rows[0].id_hash, createHash('sha256').update(token).digest('hex'));
	assert.ok(!JSON.stringify(rows).includes('github-secret'));
	await assert.rejects(callback.GET(event(jar)), (response) => response.status === 400);
});

test('sessions expire; logout revokes only the current session', () => {
	assert.throws(
		() => auth.checkAuth(undefined),
		(response) => response.status === 403
	);
	assert.throws(
		() => auth.checkAuth('forged'),
		(response) => response.status === 403
	);
	const expired = auth.createSession('owner');
	database.prepare('UPDATE auth_session SET expires_at = 0').run();
	assert.throws(
		() => auth.checkAuth(expired),
		(response) => response.status === 403
	);
	const first = auth.createSession('owner');
	const second = auth.createSession('owner');
	const jar = cookies({ [auth.SESSION_COOKIE]: first });
	assert.throws(
		() => logout.POST(event(jar)),
		(response) => response.status === 303
	);
	assert.equal(jar.get(auth.SESSION_COOKIE), undefined);
	assert.throws(
		() => auth.checkAuth(first),
		(response) => response.status === 403
	);
	auth.checkAuth(second);
});
