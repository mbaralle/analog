<script lang="ts">
	import { PhotoComponent } from '$lib/components';
	import { pageTitle } from '$lib/stores';
	import type { Photo } from '$lib/types';

	export let data: { photo: Photo };
</script>

<svelte:head>
	<title>{data.photo.caption} - {$pageTitle}</title>
</svelte:head>

<!--Content holder-->
<PhotoComponent photo={data.photo} />
