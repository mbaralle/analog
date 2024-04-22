<script lang="ts">
	import { type ObjectOption } from 'svelte-multiselect';

	import { PhotoForm } from '$lib/components';
	import { title } from '$lib/stores';
	export let data: { tags: ObjectOption[] };
</script>

<svelte:head>
	<title>Admin - Create - {$title}</title>
</svelte:head>

<PhotoForm title="Create" action="?/create" {data} />
