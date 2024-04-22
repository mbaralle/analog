import { getTagged } from '$lib/server';

export async function load({ params }) {
	const tag: string = params.tag;
	const photos = await getTagged(tag);

	return { tag, photos: photos.map((photo) => photo.toJson()) };
}
