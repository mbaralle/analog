<script lang="ts">
	import { pageTitle } from '$lib/stores';
	import { type Photo } from '$lib/types';
	import { formatDate, formatTime } from '$lib/utils';

	export let data: { photos: Photo[] };
</script>

<svelte:head>
	<title>Admin - {$pageTitle}</title>
</svelte:head>

<h2>Admin</h2>
<div class="admin-nav">
	<a href="/admin/create" title="Add Photo">Add Photo</a>
	<a href="/auth/logout" title="Logout">Logout</a>
</div>
<table>
	<tr>
		<th>Photo</th>
		<th>Date</th>
		<th>Time</th>
		<th>Caption</th>
		<th>Alt</th>
		<th>Tags</th>
		<th>Actions</th>
	</tr>
	{#each data.photos as photo}
		<tr>
			<td><img src={photo.url.replace('1024', '250')} alt={photo.alt} /></td>
			<td>{formatDate(photo.date)}</td>
			<td>{formatTime(photo.date)}</td>
			<td>{photo.caption}</td>
			<td>{photo.alt}</td>
			<td>{photo.tags.map((tag) => tag.tag).join(', ')}</td>
			<td class="actions">
				<form method="POST" action="?/edit">
					<input type="hidden" name="id" value={photo.id} />
					<button title="Edit">Edit</button>
				</form>
				<form method="POST" action="?/delete">
					<input type="hidden" name="id" value={photo.id} />
					<button title="Delete">Delete</button>
				</form>
			</td></tr
		>
	{/each}
</table>

<style>
	h2,
	.admin-nav {
		text-align: center;
		margin: 1em;
	}

	a,
	button {
		border: 2px solid #ffd071;
		background: white;
		border-radius: 5px;
		padding: 0.3em 0.5em;
		margin: 0.2em;
		color: #0008;
		transition: 0.3s;
	}

	a:hover,
	button:hover {
		cursor: pointer;
		background: #ffd071;
		color: #000;
		box-shadow: 0 0 5px #c9ae78;
	}

	table {
		border-collapse: collapse;
		margin: auto;
	}

	table td,
	table th {
		border: 1px solid #dfd1b5;
		padding: 8px;
	}

	table tr:nth-child(even) {
		background-color: #ffeecc;
	}

	table tr:hover {
		background-color: #dfd1b5;
	}

	table th {
		padding-top: 12px;
		padding-bottom: 12px;
		text-align: left;
		background-color: #ffdd99;
		color: #222;
	}

	table img {
		border-radius: 5px;
		max-width: 100px;
		max-height: 100px;
	}

	.actions {
		text-align: center;
	}
</style>
