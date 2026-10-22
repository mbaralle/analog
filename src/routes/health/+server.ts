import { getDatabase } from '$lib/server/database';

export function GET() {
	getDatabase().prepare('SELECT 1').get();
	return new Response('ok', { headers: { 'Cache-Control': 'no-store' } });
}
