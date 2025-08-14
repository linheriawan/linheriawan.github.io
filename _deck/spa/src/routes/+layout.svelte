<script lang="ts">
	import '../app.css';
</script>
<main>
	<slot />
</main>

<style>
	main {
		height: 100vh;
		display: flex;
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		overflow: hidden;
	}
</style>