import type { RunResult } from 'better-sqlite3';

import { Photo, Tag } from '$lib/classes';

import { getDatabase } from './database';
import { parsePhoto, parseTag, type RESPONSE_PHOTO, type RESPONSE_TAG } from './mapper';

export function getPhotos(): Photo[] {
	return getDatabase()
		.prepare('SELECT * FROM v_photo ORDER BY date DESC')
		.all()
		.map((obj) => parsePhoto(obj as RESPONSE_PHOTO));
}

export function getTagged(tag: string): Photo[] {
	return getDatabase()
		.prepare(
			'SELECT v_photo.* FROM v_photo LEFT JOIN photo_tag ON v_photo.id = photo_tag.photo_id INNER JOIN tag ON photo_tag.tag_id = tag.id WHERE tag.tag = ? ORDER BY date DESC'
		)
		.all(tag)
		.map((obj) => parsePhoto(obj as RESPONSE_PHOTO));
}

export function getPhoto(id: number): Photo | null {
	const response = getDatabase()
		.prepare('SELECT * FROM v_photo WHERE id = ?')
		.get(id) as RESPONSE_PHOTO;
	return response ? parsePhoto(response) : null;
}

export function updatePhoto(photo: Photo): number {
	const photoId: number = photo.getId() as number;

	getDatabase()
		.prepare('UPDATE photo SET url = ?, caption = ?, alt = ?, date = ? WHERE id = ?')
		.run(photo.getUrl(), photo.getCaption(), photo.getAlt(), photo.getDate().valueOf(), photoId);

	const tagsId = (
		photo
			.getTags()
			.map((tag) => tag.getId())
			.filter((id) => id !== null) as number[]
	).join(',');
	getDatabase()
		.prepare('DELETE FROM photo_tag WHERE photo_id = ? AND tag_id NOT IN (?)')
		.run(photoId, tagsId);

	linkTags(photoId, photo.getTags());
	deleteUnusedTags();
	return photoId;
}

export function createPhoto(photo: Photo): number {
	const photoId: number = getDatabase()
		.prepare('INSERT INTO photo (url, caption, alt, date) VALUES (?, ?, ?, ?)')
		.run(photo.getUrl(), photo.getCaption(), photo.getAlt(), photo.getDate().valueOf())
		.lastInsertRowid as number;

	linkTags(photoId, photo.getTags());

	return photoId;
}

export function deletePhoto(id: number): RunResult {
	getDatabase().prepare('DELETE FROM photo_tag WHERE photo_id = ?').run(id);
	deleteUnusedTags();
	return getDatabase().prepare('DELETE FROM photo WHERE id = ?').run(id);
}

export function getTags(): Tag[] {
	return getDatabase()
		.prepare('SELECT * FROM tag')
		.all()
		.map((obj) => parseTag(obj as RESPONSE_TAG));
}

function createTag(tag: Tag): number {
	return getDatabase().prepare('INSERT INTO tag (tag) VALUES (?)').run(tag.getTag())
		.lastInsertRowid as number;
}

function linkTag(photo: number, tag: number): RunResult {
	return getDatabase()
		.prepare('INSERT INTO photo_tag (photo_id, tag_id) VALUES (?, ?)')
		.run(photo, tag);
}

function linkTags(photo: number, tags: Tag[]): void {
	return tags.forEach((tag) => linkTag(photo, tag.getId() || createTag(tag)));
}

function deleteUnusedTags() {
	getDatabase().prepare('DELETE FROM tag WHERE id NOT IN (SELECT tag_id FROM photo_tag)').run();
}
