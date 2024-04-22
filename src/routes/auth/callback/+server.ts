import { error, redirect } from '@sveltejs/kit';

import { AUTHORIZED_USER, VITE_CLIENT_ID, VITE_CLIENT_SECRET } from '$env/static/private';
import { auth } from '$lib/server';

const tokenURL = 'https://github.com/login/oauth/access_token';
const userURL = 'https://api.github.com/user';

export async function GET({ url: { searchParams }, cookies }) {
	const code = searchParams.get('code') || '';
	const accessToken = await getAccessToken(code);
	const user = await getUser(accessToken);

	const login: string = user.login;

	if (login === AUTHORIZED_USER) {
		auth.set({ login, accessToken });
		cookies.set('login', login, { path: '/' });
		cookies.set('accessToken', accessToken, { path: '/' });
		return redirect(302, '/admin');
	} else if (login !== undefined) {
		return error(401, `Unauthorized user (${login})`);
	} else {
		return error(403, 'Bad credentials');
	}
}

function getAccessToken(code: string) {
	return fetch(tokenURL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
		body: JSON.stringify({
			client_id: VITE_CLIENT_ID,
			client_secret: VITE_CLIENT_SECRET,
			code
		})
	})
		.then((r) => r.json())
		.then((r) => r.access_token);
}

function getUser(accessToken: string) {
	return fetch(userURL, {
		headers: {
			Accept: 'application/json',
			Authorization: `Bearer ${accessToken}`
		}
	}).then((r) => r.json());
}
