<!-- CollectionFieldGuess.svelte -->
<script lang="ts">
    import { Guesser } from '$lib/tools/Guesser ';
    import type { TplCollectionName } from '@medyll/idbql';
    import { IconButton } from '@medyll/slot-ui';
     

    let { collection, collectionId, fieldName, data, onGuess } = $props<{
        collection: TplCollectionName;
        collectionId?: any;
        fieldName: string;
        data: Record<string, any>;
        onGuess: (fieldName: string, value: string) => void;
    }>();

    const guesser = new Guesser();

    async function guessValue() {
        try {
            const result = await guesser.guessValue({ collection, collectionId, fieldName, data });
            console.log({ result })
            onGuess?.(fieldName, result.guessedValue);
        } catch (error) {
            console.error('Erreur lors de la devinette :', error);
            // Gérer l'erreur (par exemple, afficher un message à l'utilisateur)
        }
    }
</script>

<IconButton icon="mdi:brain" tall="tiny" class="guess-button" onclick={guessValue} />