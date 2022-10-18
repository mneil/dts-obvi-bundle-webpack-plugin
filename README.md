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
