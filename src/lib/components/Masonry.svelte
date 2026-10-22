<script lang="ts">
	import { onDestroy, onMount, tick } from 'svelte';

	import { refresh } from '$lib/stores';
	import { type Photo } from '$lib/types';

	export let stretchFirst = false;
	export let gridGap = '0.5em';
	export let colWidth = 'minmax(Min(20em, 100%), 1fr)';
	export let items: Photo[] = [];

	type Grid = { _el: HTMLElement; gap: number; items: HTMLElement[]; ncol: number; mod: number };
	let grids: Grid[] = [];
	let masonryElement: HTMLDivElement;

	const refreshLayout = async () => {
		grids.forEach(async (grid) => {
			/* get the post relayout number of columns */
			let ncol = getComputedStyle(grid._el).gridTemplateColumns.split(' ').length;

			grid.items.forEach((c) => {
				let new_h = c.getBoundingClientRect().height;

				if (new_h !== Number(c.dataset.h)) {
					c.dataset.h = String(new_h);
					grid.mod++;
				}
			});

			/* if the number of columns has changed */
			if (grid.ncol !== ncol || grid.mod) {
				/* update number of columns */
				grid.ncol = ncol;
				/* revert to initial positioning, no margin */
				grid.items.forEach((c) => c.style.removeProperty('margin-top'));
				/* if we have more than one column */
				if (grid.ncol > 1) {
					grid.items.slice(ncol).forEach((c, i) => {
						let prev_fin =
								grid.items[i].getBoundingClientRect().bottom /* bottom edge of item above */,
							curr_ini = c.getBoundingClientRect().top; /* top edge of current item */

						c.style.marginTop = `${prev_fin + grid.gap - curr_ini}px`;
					});
				}

				grid.mod = 0;
			}
		});
	};

	const calcGrid = async (_masonryArr: HTMLElement[]) => {
		await tick();
		if (_masonryArr.length && getComputedStyle(_masonryArr[0]).gridTemplateRows !== 'masonry') {
			grids = _masonryArr.map((grid) => {
				return {
					_el: grid,
					gap: parseFloat(getComputedStyle(grid).gridRowGap),
					items: [...grid.children].filter(
						(c): c is HTMLElement =>
							c instanceof HTMLElement && +getComputedStyle(c).gridColumnEnd !== -1
					),
					ncol: 0,
					mod: 0
				};
			});
			refreshLayout(); /* initial load */
		}
	};

	let _window: Window | undefined;
	onMount(() => {
		_window = window;
		_window.addEventListener('resize', refreshLayout, false); /* on resize */
	});
	onDestroy(() => {
		if (_window) {
			_window.removeEventListener('resize', refreshLayout, false); /* on resize */
		}
	});

	$: if (masonryElement) {
		calcGrid([masonryElement]);
	}

	$: if (items) {
		masonryElement = masonryElement;
	}

	$: if ($refresh) {
		refreshLayout();
		refresh.set(false);
	}
</script>

<div
	bind:this={masonryElement}
	class={`__grid--masonry ${stretchFirst ? '__stretch-first' : ''}`}
	style={`--grid-gap: ${gridGap}; --col-width: ${colWidth};`}
>
	<slot></slot>
</div>

<style>
	:global(.__grid--masonry) {
		display: grid;
		grid-template-columns: repeat(auto-fit, var(--col-width));
		grid-template-rows: masonry;
		justify-content: center;
		grid-gap: var(--grid-gap);
		padding: var(--grid-gap);
	}
	:global(.__grid--masonry > *) {
		align-self: start;
	}
	:global(.__grid--masonry.__stretch-first > *:first-child) {
		grid-column: 1/ -1;
	}
</style>
