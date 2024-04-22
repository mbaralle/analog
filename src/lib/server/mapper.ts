import { Photo, Tag } from '$lib/classes';

export type RESPONSE_PHOTO = {
	id: number;
	url: string;
	caption: string;
	alt: string;
	tags_tag: string | null;
	tags_id: string | null;
	date: number;
};

export function parsePhoto(obj: RESPONSE_PHOTO): Photo {
	const tags_tag = obj.tags_tag?.split(',') || [];
	const tags_id = obj.tags_id?.split(',') || [];
	if (tags_tag.length !== tags_id.length) {
		throw new Error('Arrays must have the same length');
	}

	const tags = tags_id.map((id, index) => {
		return new Tag(+id, tags_tag[index]);
	});
	return new Photo(obj.id, obj.url, obj.caption, obj.alt, tags, obj.date);
}

export type RESPONSE_TAG = {
	id: number;
	tag: string;
};

export function parseTag(obj: RESPONSE_TAG): Tag {
	return new Tag(obj.id, obj.tag);
}
