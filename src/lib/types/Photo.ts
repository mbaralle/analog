import type { Tag } from './Tag';

export type Photo = {
	id: number | null;
	url: string;
	caption: string;
	alt: string;
	tags: Tag[];
	date: Date;
};
