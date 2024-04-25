<script lang="ts">
	import { type ObjectOption } from 'svelte-multiselect';

	import { PhotoForm } from '$lib/components';
	import { pageTitle } from '$lib/stores';
	export let data: { tags: ObjectOption[] };
</script>

<svelte:head>
	<title>Admin - Create - {$pageTitle}</title>
</svelte:head>

<PhotoForm title="Create" action="?/create" {data} />
