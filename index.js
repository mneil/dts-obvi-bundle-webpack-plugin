const path = require("path");
const _ = require("lodash");
const glob = require("glob");
const tsCompiler = require("./lib/compiler");
const ts = require("typescript");
/**
 * @typedef DtsObviBundlePluginOptions
 * @type {object}
 * @property {ts.CompilerOptions} [compilerOptions={}] - tsconfig compilerOptions to override your tsconfig definition
 * @property {string} [config=tsconfig.json] - Path to tsconfig.json
 * @property {string} [entry=undefined] - Entry to your .d.ts type definitions
 * @property {string[]|RegExp[]} [excludes=[]] - list of node_modules to exclude type definitions for
 * @property {string} [out=obvi-types] - output path relative to webpack output directory to store generated types
 */

/**
 * @typedef Compilation
 * @type {object}
 * @property {Error[]} errors - array of errors that occur during compilation
 * @property {Error[]} warnings - array of warnings that occur during compilation
 */

class DtsObviBundlePlugin {
  /**
   * @param {DtsObviBundlePluginOptions} options
   */
  constructor(options = {}) {
    this.options = _.defaults(options, {
      entry: "",
      config: "tsconfig.json",
      compilerOptions: {},
      out: "obvi-types",
      excludes: [],
    });
  }

  /**
   * Webpack plugin entrypoint. If you are reading this thinking you're going to use
   * it outside of webpack... don't. Instead, create a new DtsObviBundlePlugin and
   * call bundle
   *
   * @example (new DtsObviBundlePlugin()).bundle({errors:[], warnings:[]})
   *
   * @param {object} compiler - webpack compiler object
   * @returns {void}
   */
  apply(compiler) {
    this.compiler = compiler;
    compiler.hooks.afterEmit.tap(this.constructor.name, (compilation) => {
      this.bundle(compilation);
    });
  }
  /**
   * Compiles the .d.ts files - importing node_module references / exports
   * @param {Compilation} compilation
   * @returns {void}
   */
  bundle(compilation) {
    try {
      const entry = this._findTypeEntry(compilation);
      const config = tsCompiler.getConfig(this.options.config, this.options.compilerOptions);
      const excludes = this.options.excludes.map((exclude) => {
        if (typeof exclude === "string") {
          return new RegExp(exclude);
        }
        return exclude;
      });
      const res = tsCompiler.compile(entry, config, path.resolve(this.compiler.outputPath, this.options.out), excludes);
      if (res.errors) {
        res.errors.forEach((e) => compilation.warnings.push(e));
      }
    } catch (e) {
      return compilation.errors.push(e);
    }
    return;
  }
  /**
   * Find the entry .d.ts file
   * @param {Compilation} compilation
   * @returns {string}
   */
  _findTypeEntry(compilation) {
    if (this.options.entry) {
      return path.resolve(this.options.entry);
    }
    const pkg = this._readPackage();
    if (pkg && pkg.types) {
      return path.resolve(this.compiler.outputPath, pkg.types);
    }
    const typesDefinitions = glob.sync(path.join(this.compiler.outputPath, "**/*.d.ts"));
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
  /**
   * Tries to read the package.json of your webpack build
   * @returns {object}
   */
  _readPackage() {
    try {
      return require(path.join(this.compiler.outputPath, "package.json"));
    } catch (e) {
      return undefined;
    }
  }
}

module.exports = DtsObviBundlePlugin;
