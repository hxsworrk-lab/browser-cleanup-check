import { mount, unmount, flushSync, tick } from 'svelte';
import AsyncCleanup from './AsyncCleanup.svelte';
import SyncCleanup from './SyncCleanup.svelte';

const version = __SVELTE_VERSION__;
const compilerVersion = __COMPILER_VERSION__;
const button = document.getElementById('run');
const status = document.getElementById('status');
const resultBody = document.getElementById('results');
const eventsNode = document.getElementById('events');
const jsonNode = document.getElementById('report');
const target = document.getElementById('mount-target');
document.getElementById('version').textContent = `Svelte runtime ${version}; compiler ${compilerVersion}`;
let runNumber = 0;

async function runCase(name, Component) {
  const events = [];
  const resources = [];
  let closeCalls = 0;
  const log = (event) => events.push({ sequence: events.length + 1, event });
  class ControlledEventSource {
    constructor(url) {
      this.url = url;
      this.closed = false;
      resources.push(this);
      log('EventSource created');
    }
    close() {
      closeCalls += 1;
      this.closed = true;
      log('EventSource.close called');
    }
  }
  const counters = () => ({
    created: resources.length,
    closed: closeCalls,
    live: resources.filter((resource) => !resource.closed).length
  });
  let markReady;
  const setupReady = new Promise((resolve) => { markReady = resolve; });
  const instance = mount(Component, {
    target,
    props: { EventSource: ControlledEventSource, ready: markReady, log }
  });
  log('mount returned');
  flushSync();
  let timeoutId;
  try {
    await Promise.race([
      setupReady,
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`${name}: setup timed out`)), 3000);
      })
    ]);
    await Promise.resolve();
    log('harness confirmed setup complete');
    const afterSetup = counters();
    const mountedDomPresent = target.querySelector('p') !== null;
    log('unmount requested');
    await unmount(instance);
    await tick();
    log('unmount resolved');
    const afterUnmount = counters();
    const domRemoved = target.querySelector('p') === null;
    const destroyHooks = events.filter(({ event }) => event === 'onDestroy').length;
    const cleanupCallbacks = events.filter(({ event }) => event === 'returned cleanup invoked').length;
    return {
      name, timing: 'unmount after setup completion', afterSetup, afterUnmount,
      mountedDomPresent, domRemoved, destroyHooks, cleanupCallbacks, events
    };
  } finally {
    clearTimeout(timeoutId);
    if (target.querySelector('p')) await unmount(instance);
  }
}

button.addEventListener('click', async () => {
  button.disabled = true;
  status.textContent = 'Running real Svelte mount / unmount...';
  resultBody.replaceChildren();
  eventsNode.textContent = '';
  jsonNode.textContent = '';
  try {
    const cases = [
      await runCase('async onMount callback', AsyncCleanup),
      await runCase('synchronous onMount callback', SyncCleanup)
    ];
    const asyncCase = cases[0];
    const syncCase = cases[1];
    const lifecycleVerified = cases.every((item) =>
      item.mountedDomPresent && item.domRemoved && item.destroyHooks === 1
    );
    const documentedDifferenceObserved = lifecycleVerified &&
      asyncCase.afterUnmount.created === 1 && asyncCase.afterUnmount.closed === 0 &&
      asyncCase.afterUnmount.live === 1 && asyncCase.cleanupCallbacks === 0 &&
      syncCase.afterUnmount.created === 1 && syncCase.afterUnmount.closed === 1 &&
      syncCase.afterUnmount.live === 0 && syncCase.cleanupCallbacks === 1;
    for (const item of cases) {
      for (const stage of ['afterSetup', 'afterUnmount']) {
        const row = document.createElement('tr');
        const values = [item.name, stage, item[stage].created, item[stage].closed,
          item[stage].live, stage === 'afterUnmount' ? String(item.domRemoved) : 'mounted'];
        for (const value of values) {
          const cell = document.createElement('td');
          cell.textContent = value;
          row.appendChild(cell);
        }
        resultBody.appendChild(row);
      }
    }
    const report = {
      run: ++runNumber,
      observedAt: new Date().toISOString(),
      runtimeVersion: version,
      compilerVersion,
      method: 'Compiled Svelte components, real mount/unmount, injected ControlledEventSource',
      setup: 'await Promise.resolve() in both cases; readiness awaited before unmount',
      pendingSetupUnmount: 'not tested',
      fullHttpSseEndToEnd: 'not tested',
      lifecycleVerified,
      documentedDifferenceObserved,
      cases
    };
    eventsNode.textContent = cases.map((item) => `${item.name}\n${item.events.map(({ sequence, event }) => `${sequence}. ${event}`).join('\n')}`).join('\n\n');
    jsonNode.textContent = JSON.stringify(report, null, 2);
    window.__probeReport = report;
    status.textContent = documentedDifferenceObserved
      ? `Run ${runNumber} complete: async created 1 / closed 0 / live 1; sync created 1 / closed 1 / live 0. Real component destruction verified.`
      : `Run ${runNumber} complete: observed a different result; inspect counters and report.`;
  } catch (error) {
    status.textContent = `ERROR: ${error.message}`;
    jsonNode.textContent = error.stack ?? String(error);
  } finally {
    button.disabled = false;
  }
});

window.addEventListener('error', (event) => {
  status.textContent = `RUNTIME ERROR: ${event.message}`;
});
window.addEventListener('unhandledrejection', (event) => {
  status.textContent = `UNHANDLED REJECTION: ${event.reason}`;
});
