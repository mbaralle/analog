// Offline helper. Stop every application task before mounting its volume here.
import {
	chmodSync,
	chownSync,
	closeSync,
	existsSync,
	mkdirSync,
	openSync,
	renameSync,
	rmSync
} from 'node:fs';

import Database from 'better-sqlite3';

const source = process.argv[2] || '/backup/data.db';
const target = '/data/data.db';
const temporary = '/data/import.db';
const lock = '/data/.analog-import.lock';
const descriptor = openSync(lock, 'wx', 0o600);
let input;
try {
	if (existsSync(temporary))
		throw new Error('A previous /data/import.db exists; inspect it before retrying.');
	input = new Database(source, { readonly: true, fileMustExist: true });
	const integrity = input.pragma('integrity_check');
	if (integrity.length !== 1 || integrity[0].integrity_check !== 'ok')
		throw new Error('Source integrity check failed');
	const counts = Object.fromEntries(
		['photo', 'tag', 'photo_tag'].map((table) => [
			table,
			input.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count
		])
	);
	await input.backup(temporary);
	input.close();
	input = undefined;
	const copy = new Database(temporary, { readonly: true, fileMustExist: true });
	try {
		if (copy.pragma('integrity_check', { simple: true }) !== 'ok')
			throw new Error('Imported integrity check failed');
		for (const [table, count] of Object.entries(counts)) {
			if (copy.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count !== count)
				throw new Error(`Count mismatch: ${table}`);
		}
	} finally {
		copy.close();
	}
	const previous = `${target}.before-import-${Date.now()}`;
	mkdirSync(previous, { mode: 0o700 });
	for (const suffix of ['', '-wal', '-shm', '-journal']) {
		if (existsSync(target + suffix)) renameSync(target + suffix, `${previous}/data.db${suffix}`);
	}
	renameSync(temporary, target);
	// The image's node user has UID/GID 1000. Only this maintenance helper runs as root.
	chownSync('/data', 1000, 1000);
	chmodSync('/data', 0o700);
	chownSync(target, 1000, 1000);
	chmodSync(target, 0o600);
	console.log(JSON.stringify({ imported: target, counts, previous }));
} finally {
	input?.close();
	closeSync(descriptor);
	rmSync(lock);
}
