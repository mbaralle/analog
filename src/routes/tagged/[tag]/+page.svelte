<script lang="ts">
	import { Masonry, PhotoComponent } from '$lib/components';
	import { pageTitle } from '$lib/stores';
	import { type Photo } from '$lib/types';

	export let data: { tag: string; photos: Photo[] };
</script>

<svelte:head>
	<title>#{data.tag} - {$pageTitle}</title>
</svelte:head>

<h2>#{data.tag}</h2>
<!--Content holder-->
<Masonry gridGap={'2rem'} items={data.photos}>
	{#each data.photos as photo}
		<PhotoComponent {photo} />
	{/each}
</Masonry>

<style>
	h2 {
		text-align: center;
	}
</style>
