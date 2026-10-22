import { createHash } from 'node:crypto';

import { redirect } from '@sveltejs/kit';

import { oauthCookieOptions, randomToken, STATE_COOKIE, VERIFIER_COOKIE } from '$lib/server/auth';
import { requireEnv } from '$lib/server/config';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url, cookies }) => {
	const clientId = requireEnv('CLIENT_ID');
	requireEnv('CLIENT_SECRET');
	requireEnv('AUTHORIZED_USER');
	const state = randomToken();
	const verifier = randomToken();
	cookies.set(STATE_COOKIE, state, oauthCookieOptions);
	cookies.set(VERIFIER_COOKIE, verifier, oauthCookieOptions);
	const target = new URL('https://github.com/login/oauth/authorize');
	target.search = new URLSearchParams({
		client_id: clientId,
		redirect_uri: new URL('/auth/callback', url).href,
		state,
		code_challenge: createHash('sha256').update(verifier).digest('base64url'),
		code_challenge_method: 'S256'
	}).toString();
	redirect(302, target.href);
};
