<script>
	import { Loader } from '$lib/components';
</script>

<div id="content">
	<Loader>
		<slot />
	</Loader>
</div>

<style>
	#content {
		margin: 40px 0 0;
		padding-bottom: 160px;
	}

	@media only screen and (min-width: 768px) {
		#content {
			margin: 40px auto 0;
			width: 80%;
		}
	}
</style>
