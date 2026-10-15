<script>
  import { onMount, onDestroy } from 'svelte';
  let { EventSource, ready, log } = $props();

  onDestroy(() => log('onDestroy'));

  onMount(() => {
    log('onMount start');
    let eventSource;
    void (async () => {
      await Promise.resolve();
      eventSource = new EventSource('mock://local');
      log('setup complete');
      ready();
    })();
    return () => {
      log('returned cleanup invoked');
      eventSource.close();
    };
  });
</script>

<p>Mounted synchronous callback case</p>
