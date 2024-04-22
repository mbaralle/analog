import { getPhotos } from '$lib/server';

export async function load() {
	const photos = await getPhotos();

	return { photos: photos.map((photo) => photo.toJson()) };
}
