<script lang="ts">
	import { activeChatId, chatList } from './../stores/chatList.js';
	import { goto } from '$app/navigation';
	import { settings } from '$lib/stores/settings';
	import { userProfile } from '../stores/users';
	let search: any = '';

	let showDropDown: boolean = false;
	const loadChat = async (id: string) => {
		activeChatId.set(id)
		goto(`/chat/${id}`);
	};
</script>

<input placeholder="Search" bind:value={search} />
{#each Object.values($chatList ?? []) as chat}
	<button
		class=" flex rounded-md p-3.5 w-full"
		on:click={() => {
			loadChat(chat.id);
		}}
	>
		<div>{chat.title}</div>
	</button>
{/each}
<button
	on:click={() => {
		goto('/admin');
	}}>admin</button
>

<div class="  h-full">
	<button
		class=" flex rounded-md p-3.5 w-full"
		on:click={() => {
			showDropDown = !showDropDown;
		}}
		on:focusout={() => {
			setTimeout(() => {
				showDropDown = false;
			}, 150);
		}}
	>
		<div>User profile</div>
	</button>

	<button
		on:click={() => {
			goto('/auth');
		}}
	>
		Sign Out
	</button>
</div>
