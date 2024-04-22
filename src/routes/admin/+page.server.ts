import { error, redirect } from '@sveltejs/kit';

import { checkAuth, deletePhoto, getPhotos } from '$lib/server';

export async function load({ cookies }) {
	checkAuth(cookies.get('accessToken'));
	const photos = await getPhotos();
	return { photos: photos.map((photo) => photo.toJson()) };
}

export const actions = {
	edit: async ({ request, cookies }) => {
		checkAuth(cookies.get('accessToken'));
		const data = await request.formData();
		const id = data.get('id');

		if (!id || isNaN(+id)) {
			throw error(400, {
				message: 'Bad request'
			});
		}

		redirect(303, `/admin/edit/${id}`);
	},
	delete: async ({ request, cookies }) => {
		checkAuth(cookies.get('accessToken'));
		const data = await request.formData();
		const id = data.get('id');

		if (!id || isNaN(+id)) {
			throw error(400, {
				message: 'Bad request'
			});
		}

		deletePhoto(+id);

		return {
			status: 204
		};
	}
};
