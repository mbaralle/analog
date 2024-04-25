import { derived, readable, writable } from 'svelte/store';

export const refresh = writable(false);
export const title = readable('ANALOG');
export const subtitle = readable('mbaralle');
export const pageTitle = derived(
	[title, subtitle],
	([$title, $subtitle]) => `${$title} ${$subtitle}`
);
export const description = readable('One frame at a time 📷');
