<script lang="ts">
	import { PhotoComponent } from '$lib/components';
	import { title } from '$lib/stores';
	import type { Photo } from '$lib/types';

	export let data: { photo: Photo };
</script>

<svelte:head>
	<title>{data.photo.caption} - {$title}</title>
</svelte:head>

<!--Content holder-->
<PhotoComponent photo={data.photo} />
