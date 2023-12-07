<script lang="ts">
	import { activeChatId, chatList } from './../stores/chatList.js';
	import { goto } from '$app/navigation';
	import { settings } from '$lib/stores/settings';
	import { userProfile } from '../stores/users';
	import { messageByGroupDate } from '$lib/tools/utils.js';
	let search: any = '';

	let showDropDown: boolean = false;

	const loadChat = async (id: string) => {
		activeChatId.set(id);
		goto(`/chat/${id}`);
	};

	$: console.log($chatList,$messageByGroupDate);
</script>

<input placeholder="Search" bind:value={search} />
<div>
	{#each $messageByGroupDate as erd}
	<div>
		<div>{erd.name}</div>
		<div>
			{#each erd.items as chat}
			<div><button class="text-ellipsis" >{chat.title}</button></div>
			{/each}
		</div>
	</div>
	{/each}
</div>
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
