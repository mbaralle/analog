import { redirect } from '@sveltejs/kit';

import { auth } from '$lib/server';

export async function GET({ cookies }) {
	auth.set(null);
	cookies.delete('login', { path: '/' });
	cookies.delete('accessToken', { path: '/' });
	return redirect(302, '/');
}
