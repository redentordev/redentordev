<script lang="ts">
	let count = $state(0);
</script>

<div
	class="flex flex-col items-center justify-center h-full max-w-lg mx-auto h-screen"
>
	<button
		class="flex text-white font-bold bg-orange-500 p-2 shadow-md rounded-md mx-auto hover:scale-105 active:scale-95 transition-all active:bg-orange-400 hover:bg-orange-600"
		onclick={() => count++}
	>
		count is {count}
	</button>
</div>
