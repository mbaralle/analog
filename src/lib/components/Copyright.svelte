<script lang="ts">
	const currentYear = new Date().getFullYear().toString();
	const copyrightYears = currentYear !== '2024' ? `2024 - ${currentYear}` : currentYear;
</script>

<span class="bottom__copyright">
	&copy; {copyrightYears} <a href="https://mbaralle.dev/">mbaralle</a>
</span>

<style>
	.bottom__copyright a:after {
		background: #000;
	}

	.bottom__copyright {
		position: fixed;
		font-size: 10px;
		right: 20px;
		bottom: 20px;
		font-family: Helvetica, sans-serif;
		line-height: 1.4444444444;
	}

	.bottom__copyright a {
		display: inline-block;
		font-size: 10px;
		opacity: 1;
	}

	.bottom__copyright a:after {
		content: '';
		display: block;
		height: 1px;
		width: 100%;
		transition:
			width 0.2s ease,
			background-color 0.2s ease;
	}

	.bottom__copyright a:hover:after {
		width: 0;
	}
</style>
