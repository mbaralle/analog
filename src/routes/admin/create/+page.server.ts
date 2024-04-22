import { redirect } from '@sveltejs/kit';
import type { ObjectOption } from 'svelte-multiselect';

import { Photo, Tag } from '$lib/classes';
import { checkAuth, createPhoto, getTags } from '$lib/server';
import { formatDateFromInput } from '$lib/utils';

export async function load({ cookies }) {
	checkAuth(cookies.get('accessToken'));
	const tags = await getTags();
	return { tags: Tag.toObjectOptionArray(tags) };
}

export const actions = {
	create: async ({ request, cookies }) => {
		checkAuth(cookies.get('accessToken'));
		const data = await request.formData();

		await createPhoto(
			new Photo(
				null,
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
