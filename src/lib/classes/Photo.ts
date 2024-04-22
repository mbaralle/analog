import { type Photo as TYPE } from '$lib/types';

import { Tag } from './Tag';

export class Photo {
	// Properties
	private id: number | null;
	private url: string;
	private caption: string;
	private alt: string;
	private tags: Tag[];
	private date: Date;

	// Constructor
	constructor(
		id: number | null,
		url: string,
		caption: string,
		alt: string,
		tags: Tag[],
		date: Date | number
	) {
		this.id = id;
		this.url = url;
		this.caption = caption;
		this.alt = alt;
		this.tags = tags;
		this.date = typeof date === 'number' ? new Date(date) : date;
	}

	// Methods
	public getId(): number | null {
		return this.id;
	}

	public getUrl(): string {
		return this.url;
	}

	public getCaption(): string {
		return this.caption;
	}

	public getAlt(): string {
		return this.alt;
	}

	public getTags(): Tag[] {
		return this.tags;
	}

	public getDate(): Date {
		return this.date;
	}

	public toJson(): TYPE {
		return {
			id: this.id,
			url: this.url,
			caption: this.caption,
			alt: this.alt,
			tags: Tag.toJsonArray(this.tags),
			date: this.date
		};
	}
}
