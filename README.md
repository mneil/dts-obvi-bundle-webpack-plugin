# Webpack Bundle Typescript Definitions

Bundles the typescript definitions of your bundled webpack definitions in a way that is _obviously_ what you want, not what the rest of the community is offering.

## What Does This Do

Bundles all, and I mean **ALL**, of the types that are exported in your bundle. When you're using webpack you may intentionally bundle 3rd party dependencies and re-export them. This pattern is useful for extending existing projects, reducing dependencies, tree-shaking / reducing dependency size, security patching in controlled environments.

If you're not bundling external dependencies then you _do not want this_. There are other typescript definitions bundlers out there you might want:

- dts-bundle
- npm-dts
- dts-bundle-generator

> These other bundlers either do not bundle 3rd party modules or require you to write code a specific way or export everything in a global namespace.

## Usage

```sh
npm i -D dts-obvi-bundle-webpack-plugin
```

```js
// webpack.config.js
const DtsObviBundlePlugin = require("dts-obvi-bundle-webpack-plugin");


module.exports = {
  ...
  plugins: [
    new DtsObviBundlePlugin(),
  ]
}

```

### Options

## DtsObviBundlePluginOptions : <code>object</code>

**Properties**

| Name              | Type                                                                   | Default                                | Description                                                               |
| ----------------- | ---------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| [compilerOptions] | <code>ts.CompilerOptions</code>                                        | <code>{}</code>                        | tsconfig compilerOptions to override your tsconfig definition             |
| [config]          | <code>string</code>                                                    | <code>&quot;tsconfig.json&quot;</code> | Path to tsconfig.json                                                     |
| [entry]           | <code>string</code>                                                    |                                        | Entry to your .d.ts type definitions                                      |
| [excludes]        | <code>Array.&lt;string&gt;</code> \| <code>Array.&lt;RegExp&gt;</code> | <code>[]</code>                        | list of node_modules to exclude type definitions for                      |
| [out]             | <code>string</code>                                                    | <code>&quot;obvi-types&quot;</code>    | output path relative to webpack output directory to store generated types |
