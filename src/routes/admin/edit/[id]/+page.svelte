<script lang="ts">
	import type { ObjectOption } from 'svelte-multiselect';

	import { PhotoForm } from '$lib/components';
	import { title } from '$lib/stores';
	import { type Photo } from '$lib/types';

	export let data: { photo: Photo; tags: ObjectOption[] };
</script>

<svelte:head>
	<title>Admin - Edit - {$title}</title>
</svelte:head>

<PhotoForm title="Edit" action="?/edit" {data} />
