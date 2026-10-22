import { env } from '$env/dynamic/private';

export function requireEnv(name: string): string {
	const value = env[name];
	if (!value?.trim()) throw new Error(`Missing required environment variable: ${name}`);
	return value;
}
