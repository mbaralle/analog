import { readable, writable } from 'svelte/store';

export const refresh = writable(false);
export const title = readable('mbaralle analog');
export const description = readable('One frame at a time 📷');
