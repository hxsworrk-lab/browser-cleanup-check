<script>
  import { onMount, onDestroy } from 'svelte';
  let { EventSource, ready, log } = $props();

  onDestroy(() => log('onDestroy'));

  onMount(async () => {
    log('onMount start');
    await Promise.resolve();
    const eventSource = new EventSource('mock://local');
    log('setup complete');
    ready();
    return () => {
      log('returned cleanup invoked');
      eventSource.close();
    };
  });
</script>

<p>Mounted async callback case</p>
