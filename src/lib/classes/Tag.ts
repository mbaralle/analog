import type { ObjectOption } from 'svelte-multiselect';

import { type Tag as TYPE } from '$lib/types';

export class Tag {
	// Properties
	private id: number | null;
	private tag: string;

	// Constructor
	constructor(id: number | null, tag: string) {
		this.id = id;
		this.tag = tag;
	}

	// Methods
	public getId(): number | null {
		return this.id;
	}

	public setId(id: number): void {
		this.id = id;
	}

	public getTag(): string {
		return this.tag;
	}

	public static toJson(tag: Tag): TYPE {
		return {
			id: tag.id,
			tag: tag.tag
		};
	}

	public static toJsonArray(tags: Tag[]): TYPE[] {
		return tags.map((tag) => Tag.toJson(tag));
	}

	public static fromJson(json: TYPE): Tag {
		return new Tag(json.id, json.tag);
	}

	public static fromJsonArray(json: TYPE[]): Tag[] {
		return json.map((tag) => Tag.fromJson(tag));
	}

	public static toObjectOption(tag: Tag): ObjectOption {
		return {
			label: tag.getTag(),
			value: tag.getId()
		};
	}

	public static toObjectOptionArray(tags: Tag[]): ObjectOption[] {
		return tags.map((tag) => Tag.toObjectOption(tag));
	}

	public static fromObjectOption(option: ObjectOption): Tag {
		return new Tag(option.value as number, option.label as string);
	}

	public static fromObjectOptionArray(options: ObjectOption[]): Tag[] {
		return options.map((option) => Tag.fromObjectOption(option));
	}
}
