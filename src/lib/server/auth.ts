import { error } from '@sveltejs/kit';
import { get, type Writable, writable } from 'svelte/store';

export const auth: Writable<{ login: string; accessToken: string } | null> = writable(null);

export function checkAuth(accessToken: string | undefined) {
	if (!get(auth) || accessToken !== get(auth)?.accessToken) {
		throw error(403, {
			message: 'Forbidden'
		});
	}
}
