<!--Navigation-->
<nav class="header">
	<ul class="nav">
		<li>
			<a href="https://mbaralle.dev/" class="nav-item" title="About" target="_blank">About</a>
		</li>
		<li>
			<a href="https://github.com/mbaralle/" class="nav-item" title="GitHub" target="_blank"
				>GitHub</a
			>
		</li>
		<li>
			<a
				href="https://instagram.com/mbaralle.analog/"
				class="nav-item"
				title="Instagram"
				target="_blank">Instagram</a
			>
		</li>
	</ul>
</nav>

<style>
	nav.header {
		margin: 35px auto 0;
		text-align: center;
	}

	.nav-item {
		font-size: 18px;
	}

	@media only screen and (min-width: 768px) {
		nav.header {
			width: initial;
			position: fixed;
			-webkit-transform: rotate(-90deg) translateX(-50%);
			-ms-transform: rotate(-90deg) translateX(-50%);
			transform: rotate(-90deg) translateX(-50%);
			margin: 0;
			top: 50%;
			left: 10px;
			-webkit-transform-origin: top left;
			transform-origin: top left;
		}

		nav.header > ul {
			width: 90vh;
		}
	}
</style>
