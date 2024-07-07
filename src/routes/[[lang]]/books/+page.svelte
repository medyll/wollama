<script lang="ts">
    import { idbqlState } from '$lib/db/dbSchema';
    import { Button, Looper, openWindow } from '@medyll/slot-ui';
    import { IDbCollectionValues } from '$lib/db/dbFields';
    import PageTitle from '$components/ui/PageTitle.svelte';
    import CreateUpdate from '$components/form/CreateUpdate.svelte';

    let { collection = 'book'} = $props(); 
    let collectionList = $derived(idbqlState[collection].getAll());

    let fieldValues = new IDbCollectionValues(collection);

    function openCrud(collection: string) {
        openWindow(`create-${collection}`, {
            component: CreateUpdate,
            componentProps: { collection: collection, mode: 'create' },
            hideCloseButton: false,
        });
    }
</script>

<PageTitle icon="mdi:books" title="ui.book-list" />
<Button onclick={() => openCrud(collection)} width="auto" icon="ep:files" value="ui.create-new" />

<Looper data={collectionList}>
    {#snippet children({ item })}
        <div>
            <!-- Utilisez la méthode presentation pour afficher les champs de présentation -->
            <h3><a href="/books/{fieldValues.indexValue(item)}">{fieldValues.presentation(item)}</a></h3>

            <!-- Affichez la valeur de l'index -->
            <p>Index: {fieldValues.indexValue(item)}</p>

            <!-- Affichez d'autres champs spécifiques si nécessaire -->
            <p>Title: {fieldValues.format('title', item)}</p> 

            <!-- Vous pouvez ajouter d'autres champs selon vos besoins -->
        </div>
    {/snippet}
</Looper>
