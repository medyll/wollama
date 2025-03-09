<script lang="ts">
	import { t } from '$lib/stores/i18n.js';
	import { page } from '$app/stores';

	import { ui } from '$lib/stores/ui.js';
	import { engine } from '$lib/tools/engine';
	import ChatList from './ChatList.svelte';
	import { Icon, MenuList, MenuListItem } from '@medyll/idae-slotui-svelte';
	import { settings } from '$lib/stores/settings.svelte';
	import { goto } from '$app/navigation';

	const openCloseConfig = async () => {
		if ($page.route.id?.includes('/configuration')) {
			ui.setActiveChatId();
			engine.goto('/');
		} else {
			engine.goto('/configuration');
		}
	};

	const openLibgs = () => {
		settings.setSetting('menuExpanded', !$settings.menuExpanded);
	};

	const getChatLink = (link: 'settings' | 'chat' | 'newChat' | 'lib' | 'explore' | 'books' | 'space') => {
		let goTo;
		switch (link) {
			case 'settings':
				goTo = `${window.location.origin}/settings`;
				break;
			case 'chat':
				goTo = `chat/${link}`;
				break;
			case 'newChat':
				goTo = `${window.location.origin}/chat`;
				break;
			case 'lib':
				goTo = `${window.location.origin}/lib`;
				break;
			case 'explore':
				goTo = `${window.location.origin}/explore`;
				break;
			case 'space':
				goTo = `${window.location.origin}/space`;
				break;
			default:
				goTo = `${window.location.origin}/${link}`;
		}

		goto(goTo);
	};
</script>

<div class="application-sideBar" aria-expanded={$settings.menuExpanded}>
	<div class="not-expanded">
		<div class="not-expanded line-gap-2 p-4">
			<img alt="logo" class="iconify" width="32" src="/assets/svg/lama.svg" style="transform: scaleX(-1)" />
			<div class="text-md">wOollama !</div>
			<full />
		</div>
		<div class="w-full px-2">
			<input class="input w-full" type="search" placeholder={$t('ui.searchChats')} bind:value={$ui.searchString} />
		</div>
	</div>

	<div class="application-sideBar-menu">
		<MenuList tall="small" class="flex h-full flex-col  ">
			<MenuListItem selectable={false} onclick={() => getChatLink('newChat')} title={$t('ui.newChat')}>
				<Icon icon="mdi:plus" alt={$t('ui.newChat')} />
				<span>{$t('ui.newChat')}</span>
			</MenuListItem>
			<MenuListItem
				selected={$page?.route?.id === '/[[lang]]/lib'}
				onclick={() => getChatLink('lib')}
				title={$t('ui.mylib')}
			>
				<Icon icon="fluent:library-20-filled" alt={$t('ui.mylib')} />
				<span>{$t('ui.myLib')}</span>
			</MenuListItem>
			<MenuListItem title={$t('ui.spaces')} onclick={getChatLink('spaces')}>
				<Icon icon="earth" alt={$t('ui.spaces')} />
				<span>{$t('ui.spaces')}</span>
			</MenuListItem>
			<div class="application-sideBar-content flex-1 overflow-auto">
				<ChatList />
			</div>
			<MenuListItem selectable={false} width="full" title={$t('ui.settings')} onclick={openLibgs}>
				<Icon icon="ri:expand-right-line" alt={$t('ui.settings')} class="red" />
			</MenuListItem>
			<hr />
			<!-- <MenuListItem title={$t('ui.books')} onclick={getChatLink('books')}>
					 <Icon icon="settings" alt={$t('ui.books')} />
					 <span>{$t('ui.books')}</span>
			 </MenuListItem> -->
			<!--  <MenuListItem title={$t('ui.settings')} onclick={getChatLink('explore')}>
					<Icon icon="settings" alt={$t('ui.newChat')} />
					<span>{$t('ui.settings')}</span>
			</MenuListItem> -->
			<MenuListItem
				selected={$page?.route?.id === '/[[lang]]/settings'}
				title={$t('ui.settings')}
				onclick={() => getChatLink('settings')}
			>
				<Icon icon="settings" alt={$t('ui.newChat')} />
				<span>{$t('ui.settings')}</span>
			</MenuListItem>
		</MenuList>
	</div>
</div>

<style lang="postcss">
	@reference "../../styles/references.css";
	:global(.red) {
		transition: all 1s ease;
	}

	.application-sideBar {
		.application-sideBar-menu {
			flex: 1;
		}

		.application-sideBar-content {
			content-visibility: hidden;
			overflow: auto;
		}

		:global(.menu-list-item-text) {
			@apply flex flex-1 place-items-center items-center gap-2;
			@apply overflow-hidden;
			width: 100%;
		}

		span {
			@apply overflow-hidden text-ellipsis;
			/* @apply flex flex-1 gap-2 items-center; */
			text-align: center;
			max-width: 100%;
			/*width: 100%;*/
		}

		&[aria-expanded='false'] {
			@apply items-center;

			:global(li.menu-list-item) {
				@apply flex aspect-square place-items-center items-center;
			}

			:global(.menu-list-item-text) {
				@apply w-full text-center;
				@apply flex aspect-square place-items-center;
			}

			.not-expanded {
				display: none;
				content-visibility: hidden;
			}
		}

		&[aria-expanded='true'] {
			.application-sideBar-content {
				content-visibility: visible;
			}

			span {
				@apply text-sm;
				text-align: left;
				/*width: 100%;*/
			}

			:global(.red) {
				transition: all 1s ease;
				rotate: 180deg;
			}
		}

		&[aria-expanded='false'] {
			span {
				display: none;
			}
		}
	}
</style>
