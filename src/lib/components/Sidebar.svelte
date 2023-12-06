<script lang="ts">
	import { goto } from '$app/navigation';
	import { userProfile } from '../stores/users';
	let search: any = '';

	let showDropDown: boolean = false;
	const loadChat = async (id: string) => {
		goto(`/chat/${id}`);
	};
</script>

<input placeholder="Search" bind:value={search} />
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
