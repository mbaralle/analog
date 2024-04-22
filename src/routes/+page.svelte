<script lang="ts">
	import { Masonry, PhotoComponent } from '$lib/components';
	import { title } from '$lib/stores';
	import { type Photo } from '$lib/types';

	export let data: { photos: Photo[] };
</script>

<svelte:head>
	<title>{$title}</title>
</svelte:head>

<!--Content holder-->
<Masonry gridGap={'2rem'} items={data.photos}>
	{#each data.photos as photo}
		<PhotoComponent {photo} />
	{/each}
</Masonry>

<!-- <nav id="pagination">
	<ul>
		<li>
			<a href="/page/PreviousPage" class="previous">Previous page</a>
		</li>
		<li>
			<a href="/page/NextPage" class="next">Loading..</a>
		</li>
	</ul>
</nav> -->
