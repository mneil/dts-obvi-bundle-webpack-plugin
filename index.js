const path = require("path");
const _ = require("lodash");
const shelljs = require("shelljs");

/**
 * @typedef DtsObviBundlePluginOptions
 * @type {object}
 * @property {string} entry - Entry to your .d.ts type definitions
 */

class DtsObviBundlePlugin {
  /**
   *
   * @param {DtsObviBundlePluginOptions} options
   */
  constructor(options = {}) {
    this.options = _.defaults(options, {
      watch: true,
      entry: "",
    });
  }
  apply(compiler) {
    this.compiler = compiler;
    compiler.hooks.afterEmit.tap(this.constructor.name, (compilation) => {
      this.bundle(compilation);
    });
  }

  bundle(compilation) {
    try {
      const entry = this.findTypeEntry(compilation);
      console.log(entry);
    } catch (e) {
      return compilation.errors.push(e);
    }
    return;
  }

  findTypeEntry(compilation) {
    if (this.options.entry) {
      return path.resolve(this.options.entry);
    }
    const pkg = this.readPackage();
    if (pkg && pkg.types) {
      return path.resolve(this.compiler.outputPath, pkg.types);
    }
    const typesDefinitions = shelljs.ls(path.join(this.compiler.outputPath, "**/*.d.ts"));
    if (!typesDefinitions.code === 0 || typesDefinitions.length === 0) {
      throw new Error("unable to determine entry point path");
    }
    compilation.warnings.push(
      new Error(
        `${this.constructor.name}\nguessing types entrypoint ${typesDefinitions[0]}\nsetting entry option is recommended`
      )
    );
    return typesDefinitions[0];
  }

  readPackage() {
    try {
      return require(path.join(this.compiler.outputPath, "package.json"));
    } catch (e) {
      return undefined;
    }
  }
}

module.exports = DtsObviBundlePlugin;
