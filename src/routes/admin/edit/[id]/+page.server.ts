import { error, redirect } from '@sveltejs/kit';
import type { ObjectOption } from 'svelte-multiselect';

import { Photo, Tag } from '$lib/classes';
import { checkAuth, getPhoto, getTags, updatePhoto } from '$lib/server';
import { formatDateFromInput } from '$lib/utils';

export async function load({ params, cookies }) {
	checkAuth(cookies.get('accessToken'));
	const photo: Photo | null = await getPhoto(+params?.id);

	if (!photo) {
		throw error(404, {
			message: 'Not found'
		});
	}

	const tags = Tag.toObjectOptionArray(await getTags()).map((tag) => ({
		...tag,
		preselected: photo.getTags().some((photoTag) => photoTag.getId() === tag.value)
	}));
	return { photo: photo.toJson(), tags, selectedTags: Tag.toObjectOptionArray(photo.getTags()) };
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

		await updatePhoto(
			new Photo(
				+id,
				data.get('url') as string,
				data.get('caption') as string,
				data.get('alt') as string,
				Tag.fromObjectOptionArray(JSON.parse(data.get('tags') as string) as ObjectOption[]),
				formatDateFromInput(data.get('date') as string)
			)
		);

		return redirect(303, '/admin');
	}
};
