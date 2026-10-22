import { error, redirect } from '@sveltejs/kit';

import {
	cookieOptions,
	createSession,
	deleteSession,
	SESSION_COOKIE,
	SESSION_MAX_AGE,
	STATE_COOKIE,
	VERIFIER_COOKIE
} from '$lib/server/auth';
import { requireEnv } from '$lib/server/config';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, cookies, fetch }) => {
	const state = cookies.get(STATE_COOKIE);
	const verifier = cookies.get(VERIFIER_COOKIE);
	cookies.delete(STATE_COOKIE, { path: '/auth/callback' });
	cookies.delete(VERIFIER_COOKIE, { path: '/auth/callback' });
	if (!state || state !== url.searchParams.get('state') || !verifier) {
		error(400, 'Invalid OAuth state. Please start login again.');
	}
	const code = url.searchParams.get('code');
	if (url.searchParams.has('error') || !code) error(400, 'GitHub authorization was not completed.');
	const clientId = requireEnv('CLIENT_ID');
	const clientSecret = requireEnv('CLIENT_SECRET');
	const authorizedUser = requireEnv('AUTHORIZED_USER');

	let login: string;
	try {
		const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
			body: JSON.stringify({
				client_id: clientId,
				client_secret: clientSecret,
				code,
				redirect_uri: new URL('/auth/callback', url).href,
				code_verifier: verifier
			}),
			signal: AbortSignal.timeout(10000)
		});
		if (!tokenResponse.ok) throw new Error('Token exchange failed');
		const token = await tokenResponse.json();
		if (typeof token.access_token !== 'string' || !token.access_token)
			throw new Error('No access token');
		const userResponse = await fetch('https://api.github.com/user', {
			headers: {
				Accept: 'application/vnd.github+json',
				Authorization: `Bearer ${token.access_token}`
			},
			signal: AbortSignal.timeout(10000)
		});
		if (!userResponse.ok) throw new Error('Identity lookup failed');
		const user = await userResponse.json();
		if (typeof user.login !== 'string' || !user.login) throw new Error('No GitHub login');
		login = user.login;
	} catch {
		error(502, 'GitHub authentication failed. Please start login again.');
	}
	if (login.toLowerCase() !== authorizedUser.toLowerCase()) error(403, 'Unauthorized GitHub user');

	deleteSession(cookies.get(SESSION_COOKIE));
	cookies.set(SESSION_COOKIE, createSession(login), { ...cookieOptions, maxAge: SESSION_MAX_AGE });
	// Expire cookies from the previous authentication implementation.
	cookies.delete('login', { path: '/' });
	cookies.delete('accessToken', { path: '/' });
	redirect(302, '/admin');
};
