<script lang="ts">
    import { page } from '$app/stores';
    import BookHome from '$components/book/BookHome.svelte';

    let { id } = $page.params;

    $inspect($page.params)
</script>

<BookHome id={Number(id)} /> 
