<script lang="ts">
	import { MultiSelect, type ObjectOption } from 'svelte-multiselect';

	import type { Photo } from '$lib/types';
	import { formatDateToInput } from '$lib/utils';

	export let title: string;
	export let action: string;
	export let data: { photo?: Photo; tags: ObjectOption[]; selectedTags?: ObjectOption[] };
</script>

<h2>Admin - {title}</h2>
<form method="POST" {action}>
	<input type="hidden" name="id" value={data.photo?.id || null} />
	<label>
		Date:
		<input
			type="datetime-local"
			name="date"
			required
			value={formatDateToInput(data.photo?.date || null)}
		/>
	</label>
	<label>
		Caption:
		<input type="text" name="caption" required value={data.photo?.caption || null} />
	</label>
	<label>
		URL:
		<input type="text" name="url" required value={data.photo?.url || null} />
	</label>
	<label>
		Alt:
		<input type="text" name="alt" required value={data.photo?.alt || null} />
	</label>
	<label for="tags"
		>Tags:
		<MultiSelect
			id="tags"
			options={data.tags}
			value={data.selectedTags || []}
			name="tags"
			allowUserOptions={true}
		/></label
	>
	<div class="actions">
		<button {title}>{title}</button>
		<a href="/admin" title="Cancel">Cancel</a>
	</div>
</form>

<style>
	h2 {
		text-align: center;
	}
	input {
		border-radius: 3pt;
		border: 1pt solid lightgray;
		font-size: inherit;
		min-height: 22pt;
		padding: 0 3pt;
	}
	.actions {
		margin: 1em;
		text-align: center;
	}
	button,
	a {
		border: 2px solid #ffd071;
		border-radius: 5px;
		padding: 0.3em 0.5em;
		margin: 0 0.2em;
		color: #0008;
		transition: 0.3s;
		background: none;
		font-size: 16px;
	}

	button:hover,
	a:hover {
		background: #ffd071;
		color: #000;
		box-shadow: 0 0 5px #c9ae78;
		cursor: pointer;
	}

	label {
		width: 100%;
		display: block;
		margin: 1rem 0;
	}
	input {
		width: 100%;
	}
</style>
