<script lang="ts">
	import MainChat from '$lib/components/MainChat.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import '../styles/app.css';
	import '../styles/tailwind.css';
</script>

<svelte:head>
	<title>AIUI</title>
</svelte:head>

<div
	class="flex w-full h-full text-gray-700
bg-white
dark:bg-gray-800 dark:text-gray-100
overflow-hidden"
>
	<div class="h-full overflow-hidden">
		<Sidebar />
	</div>
	<div class="flex-1 relative overflow-auto">
		<div class="flex flex-col flex-1 h-full">
			<div class="relative"><Navbar /></div>
			<div class="flex-1 w-full relative">
				<div class="h-full relative overflow-hidden mx-auto max-w-3xl">
					<MainChat />
				</div>
			</div>
		</div>
	</div>
</div>
