import Database, { type RunResult } from 'better-sqlite3';

import { DATABASE_PATH } from '$env/static/private';
import { Photo, Tag } from '$lib/classes';

import { parsePhoto, parseTag, type RESPONSE_PHOTO, type RESPONSE_TAG } from './mapper';

const options = {};
const db = new Database(DATABASE_PATH, options);

initTables();

function initTables() {
	db.prepare(
		'CREATE TABLE IF NOT EXISTS photo (id INTEGER PRIMARY KEY, url TEXT, caption TEXT, alt TEXT, date INTEGER)'
	).run();
	db.prepare('CREATE TABLE IF NOT EXISTS tag (id INTEGER PRIMARY KEY, tag TEXT)').run();
	db.prepare(
		'CREATE TABLE IF NOT EXISTS photo_tag (photo_id INTEGER, tag_id INTEGER, PRIMARY KEY (photo_id, tag_id), FOREIGN KEY(photo_id) REFERENCES photo(id), FOREIGN KEY(tag_id) REFERENCES tag(id))'
	).run();
	db.prepare(
		"CREATE VIEW IF NOT EXISTS v_photo AS SELECT photo.id, url, caption, alt, date, GROUP_CONCAT(tag, ',') AS tags_tag, GROUP_CONCAT(tag.id, ',') AS tags_id FROM photo LEFT JOIN photo_tag ON photo.id = photo_tag.photo_id LEFT JOIN tag ON photo_tag.tag_id = tag.id GROUP BY photo.id"
	).run();
}

export function getPhotos(): Photo[] {
	return db
		.prepare('SELECT * FROM v_photo ORDER BY date DESC')
		.all()
		.map((obj) => parsePhoto(obj as RESPONSE_PHOTO));
}

export function getTagged(tag: string): Photo[] {
	return db
		.prepare(
			'SELECT v_photo.* FROM v_photo LEFT JOIN photo_tag ON v_photo.id = photo_tag.photo_id INNER JOIN tag ON photo_tag.tag_id = tag.id WHERE tag.tag = ? ORDER BY date DESC'
		)
		.all(tag)
		.map((obj) => parsePhoto(obj as RESPONSE_PHOTO));
}

export function getPhoto(id: number): Photo | null {
	const response = db.prepare('SELECT * FROM v_photo WHERE id = ?').get(id) as RESPONSE_PHOTO;
	return response ? parsePhoto(response) : null;
}

export function updatePhoto(photo: Photo): number {
	const photoId: number = photo.getId() as number;

	db.prepare('UPDATE photo SET url = ?, caption = ?, alt = ?, date = ? WHERE id = ?').run(
		photo.getUrl(),
		photo.getCaption(),
		photo.getAlt(),
		photo.getDate().valueOf(),
		photoId
	);

	const tagsId = (
		photo
			.getTags()
			.map((tag) => tag.getId())
			.filter((id) => id !== null) as number[]
	).join(',');
	db.prepare('DELETE FROM photo_tag WHERE photo_id = ? AND tag_id NOT IN (?)').run(photoId, tagsId);

	linkTags(photoId, photo.getTags());
	deleteUnusedTags();
	return photoId;
}

export function createPhoto(photo: Photo): number {
	const photoId: number = db
		.prepare('INSERT INTO photo (url, caption, alt, date) VALUES (?, ?, ?, ?)')
		.run(photo.getUrl(), photo.getCaption(), photo.getAlt(), photo.getDate().valueOf())
		.lastInsertRowid as number;

	linkTags(photoId, photo.getTags());

	return photoId;
}

export function deletePhoto(id: number): RunResult {
	db.prepare('DELETE FROM photo_tag WHERE photo_id = ?').run(id);
	deleteUnusedTags();
	return db.prepare('DELETE FROM photo WHERE id = ?').run(id);
}

export function getTags(): Tag[] {
	return db
		.prepare('SELECT * FROM tag')
		.all()
		.map((obj) => parseTag(obj as RESPONSE_TAG));
}

function createTag(tag: Tag): number {
	return db.prepare('INSERT INTO tag (tag) VALUES (?)').run(tag.getTag()).lastInsertRowid as number;
}

function linkTag(photo: number, tag: number): RunResult {
	return db.prepare('INSERT INTO photo_tag (photo_id, tag_id) VALUES (?, ?)').run(photo, tag);
}

function linkTags(photo: number, tags: Tag[]): void {
	return tags.forEach((tag) => linkTag(photo, tag.getId() || createTag(tag)));
}

function deleteUnusedTags() {
	db.prepare('DELETE FROM tag WHERE id NOT IN (SELECT tag_id FROM photo_tag)').run();
}
