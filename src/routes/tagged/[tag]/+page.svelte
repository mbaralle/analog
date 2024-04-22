<script lang="ts">
	import { Masonry, PhotoComponent } from '$lib/components';
	import { title } from '$lib/stores';
	import { type Photo } from '$lib/types';

	export let data: { tag: string; photos: Photo[] };
</script>

<svelte:head>
	<title>#{data.tag} - {$title}</title>
</svelte:head>

<h2>#{data.tag}</h2>
<!--Content holder-->
<Masonry items={data.photos}>
	{#each data.photos as photo}
		<PhotoComponent {photo} />
	{/each}
</Masonry>

<style>
	h2 {
		text-align: center;
	}
</style>
