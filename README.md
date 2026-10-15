# Controlled browser cleanup comparison

A self-initiated Hx Works engineering study, using a fixed Svelte 5.23.2 compiler/runtime bundle. The page is a technical exhibit, not a customer project, testimonial or production repair.

## Run the comparison

Open the published page and choose **Run cleanup comparison**. Each run mounts real Svelte components, waits for their asynchronous setup to complete, then unmounts them. The table, ordered events and JSON report are produced by that browser run; they are not prefilled success data.

The injected `ControlledEventSource` records creation and `close()` calls without opening a network connection. In the tested setup-complete timing, an asynchronous `onMount` callback does not register its returned cleanup, while a synchronous callback does. Real DOM removal and `onDestroy` are also observed.

## Limits

This test does not verify real HTTP/SSE traffic, reconnect behavior, network teardown, memory retention, destruction while setup is pending, or acceptance in a production application. The synchronous control is not a complete production fix; pending-setup destruction needs a separate design and test.

## Contents and provenance

- `index.html`, `showcase.css`: the technical presentation, with pricing, business contact and supporting portfolio links omitted from this public edition.
- `bundle.js`: the existing tested bundle, unchanged. SHA256: `1804d60e0b3ea87b512318946225d2b48001687bf8be02b30b98dd0f4cd65336`.
- `source/`: the seven original minimal probe/build files, including the dependency lock.
- `licenses/`: Svelte, esm-env and esbuild notices.
- `PROVENANCE.json`: hashes of the distributed runtime and source files.

The prebuilt page needs no install, credentials, backend or paid service. It loads only local static resources and the controlled comparison makes no network requests. It contains no analytics or input collection.

For optional local rebuilding, use the locked dependencies from the `source` directory. Do not publish generated `dist`, source maps or build metadata: the build script records the local build directory. The public page intentionally uses the audited prebuilt root bundle.

Third-party MIT notices apply to their respective dependencies. No additional distribution license is assigned here to the self-written study or to any reference collection. The reference collection supplied only general spacing/frame principles; none of its content, data, logos, images or scripts is included.
