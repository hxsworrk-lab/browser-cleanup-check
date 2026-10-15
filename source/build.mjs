import { readFile, mkdir, writeFile, copyFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { compile, VERSION } from 'svelte/compiler';
import { build, version as esbuildVersion } from 'esbuild';

const packageInfo = JSON.parse(await readFile('./node_modules/svelte/package.json', 'utf8'));
if (packageInfo.version !== '5.23.2' || VERSION !== '5.23.2') {
  throw new Error(`Version mismatch: runtime ${packageInfo.version}; compiler ${VERSION}`);
}
await mkdir('./dist', { recursive: true });
const warnings = [];
await build({
  entryPoints: ['./main.js'],
  outfile: './dist/bundle.js',
  bundle: true,
  format: 'esm',
  platform: 'browser',
  conditions: ['browser'],
  sourcemap: true,
  define: {
    __SVELTE_VERSION__: JSON.stringify(packageInfo.version),
    __COMPILER_VERSION__: JSON.stringify(VERSION),
    'process.env.NODE_ENV': JSON.stringify('development')
  },
  plugins: [{
    name: 'local-svelte-compiler',
    setup(builder) {
      builder.onLoad({ filter: /\.svelte$/ }, async ({ path }) => {
        const source = await readFile(path, 'utf8');
        const output = compile(source, { filename: path, generate: 'client', dev: true });
        warnings.push(...output.warnings.map((warning) => ({ file: path, code: warning.code, message: warning.message })));
        return { contents: output.js.code, loader: 'js', resolveDir: dirname(path) };
      });
    }
  }]
});
await copyFile('./index.html', './dist/index.html');
const metadata = {
  builtAt: new Date().toISOString(),
  nodeVersion: process.version,
  compilerVersion: VERSION,
  runtimePackageVersion: packageInfo.version,
  esbuildVersion,
  registry: 'https://registry.npmjs.org',
  directory: resolve('./dist'),
  compileWarnings: warnings
};
await writeFile('./dist/build-metadata.json', JSON.stringify(metadata, null, 2) + '\n');
console.log(JSON.stringify(metadata, null, 2));
