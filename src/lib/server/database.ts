import Database from 'better-sqlite3';

import { requireEnv } from './config';

let db: Database.Database | undefined;

// Lazy initialization lets SvelteKit analyze the application without a database or secrets.
export function getDatabase(): Database.Database {
	if (db) return db;
	const connection = new Database(requireEnv('DATABASE_PATH'));
	try {
		connection.exec(`
			CREATE TABLE IF NOT EXISTS photo (id INTEGER PRIMARY KEY, url TEXT, caption TEXT, alt TEXT, date INTEGER);
			CREATE TABLE IF NOT EXISTS tag (id INTEGER PRIMARY KEY, tag TEXT);
			CREATE TABLE IF NOT EXISTS photo_tag (photo_id INTEGER, tag_id INTEGER, PRIMARY KEY (photo_id, tag_id), FOREIGN KEY(photo_id) REFERENCES photo(id), FOREIGN KEY(tag_id) REFERENCES tag(id));
			CREATE VIEW IF NOT EXISTS v_photo AS SELECT photo.id, url, caption, alt, date, GROUP_CONCAT(tag, ',') AS tags_tag, GROUP_CONCAT(tag.id, ',') AS tags_id FROM photo LEFT JOIN photo_tag ON photo.id = photo_tag.photo_id LEFT JOIN tag ON photo_tag.tag_id = tag.id GROUP BY photo.id;
			CREATE TABLE IF NOT EXISTS auth_session (id_hash TEXT PRIMARY KEY, login TEXT NOT NULL, expires_at INTEGER NOT NULL);
		`);
		db = connection;
		return db;
	} catch (cause) {
		connection.close();
		throw cause;
	}
}
