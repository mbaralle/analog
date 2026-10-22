import { createHash, randomBytes } from 'node:crypto';

import { error } from '@sveltejs/kit';

import { dev } from '$app/environment';

import { requireEnv } from './config';
import { getDatabase } from './database';

export const SESSION_COOKIE = 'analog_session';
export const STATE_COOKIE = 'analog_oauth_state';
export const VERIFIER_COOKIE = 'analog_oauth_verifier';
export const SESSION_MAX_AGE = 12 * 60 * 60;
export const cookieOptions = { path: '/', httpOnly: true, secure: !dev, sameSite: 'lax' as const };
export const oauthCookieOptions = { ...cookieOptions, path: '/auth/callback', maxAge: 600 };

export function randomToken(): string {
	return randomBytes(32).toString('base64url');
}

function hashSession(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

export function createSession(login: string): string {
	const token = randomToken();
	const db = getDatabase();
	db.prepare('DELETE FROM auth_session WHERE expires_at <= ?').run(Date.now());
	db.prepare('INSERT INTO auth_session (id_hash, login, expires_at) VALUES (?, ?, ?)').run(
		hashSession(token),
		login,
		Date.now() + SESSION_MAX_AGE * 1000
	);
	return token;
}

export function deleteSession(token: string | undefined): void {
	if (token)
		getDatabase().prepare('DELETE FROM auth_session WHERE id_hash = ?').run(hashSession(token));
}

export function checkAuth(token: string | undefined): void {
	if (!token) error(403, 'Forbidden');
	const session = getDatabase()
		.prepare('SELECT login FROM auth_session WHERE id_hash = ? AND expires_at > ?')
		.get(hashSession(token), Date.now()) as { login: string } | undefined;
	if (!session || session.login.toLowerCase() !== requireEnv('AUTHORIZED_USER').toLowerCase()) {
		error(403, 'Forbidden');
	}
}
