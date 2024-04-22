import { error } from '@sveltejs/kit';

import { Photo } from '$lib/classes';
import { getPhoto } from '$lib/server';

export async function load({ params }) {
	const photo: Photo | null = await getPhoto(+params?.id);

	if (!photo) {
		throw error(404, {
			message: 'Not found'
		});
	}

	return { photo: photo.toJson() };
}
