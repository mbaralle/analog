<script lang="ts">
	import { refresh } from '$lib/stores';
	import { type Photo } from '$lib/types';
	import { formatDate, toTimeAgo } from '$lib/utils';

	export let photo: Photo;

	function onLoad() {
		refresh.set(true);
	}
</script>

{#if photo}
	<article>
		<div class="photo">
			<div class="container-l">
				<a href="/post/{photo.id}" title={formatDate(photo.date)}>
					<img src={photo.url} alt={photo.alt} loading="lazy" on:load={onLoad} />
				</a>
			</div>
			<div class="container caption">{photo.caption}</div>
		</div>
		<footer class="post__footer container">
			<!-- <div class="social">
				<span class="share__text">Share on </span>
			</div> -->
			<div class="metadata">
				<ul class="post__info">
					<li>
						<a class="time-ago" href="/post/{photo.id}" title={formatDate(photo.date)}>
							{toTimeAgo(photo.date)}
						</a>
					</li>
				</ul>

				{#if photo.tags.length > 0}
					<ul class="post__tags">
						{#each photo.tags as tag}
							<li>
								<a href="/tagged/{tag.tag}" title="#{tag.tag}">#{tag.tag}</a>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</footer>
	</article>
{/if}

<style>
	.container-l > a {
		display: inline-block;
		opacity: 1;
	}

	.container,
	.container-l {
		max-width: 560px;
		margin: 0 auto;
	}

	.container-l {
		margin-bottom: 35px;
	}

	img {
		transition: 0.3s;
	}
	img:hover {
		opacity: 0.8;
	}

	.post__footer {
		margin-top: 25px;
	}

	.post__footer ul:first-child li:first-child {
		margin-left: 0;
	}

	.post__footer li,
	.post__footer ul {
		display: inline;
		line-height: 1.5;
	}

	.post__footer,
	.post__footer a {
		font-size: 15px;
	}

	/* .social, */
	.metadata {
		margin: 0.278em 0;
		line-height: 1.056;
	}

	@media only screen and (max-width: 767px) {
		.container,
		.post__footer {
			padding: 0 25px;
		}
	}
</style>
