const fs = require("fs");
const path = require("path");
const ts = require("typescript");
const glob = require("glob");
const resolve = require("enhanced-resolve");
const Replacer = require("./replacer");

/**
 *
 * @param {string} fileName - entrypoint to projects .d.ts file
 * @param {ts.CompilerOptions} configPath - tsconfig compilerOptions
 * @param {string} outDir - absolute path to base directory to write files to
 * @param {RegExp[]} excludes - list of modules to ignore
 * @param {object} cache - object that stores module resolution cache
 */
function compile(fileName, config, outDir, excludes = [], cache = { _errors: [] }) {
  const code = fs.readFileSync(fileName, { encoding: "utf8" });
  const ast = ts.createSourceFile(fileName, code, ts.ScriptTarget.Latest);
  const editor = new Replacer(code);
  for (const node of ast.statements) {
    node.excludes = excludes;
    node.cache = cache;
    node.fileName = fileName;
    node.editor = editor;
    switch (node.kind) {
      case ts.SyntaxKind.ExportDeclaration:
      case ts.SyntaxKind.ImportDeclaration:
        handleImportExport(node, config, outDir);
        break;
      default:
        continue;
    }
  }
  editor.save(fileName);
  return { errors: cache._errors };
}

/**
 * Find and load the tsconfig for the project. Return the compilerOptions
 * This method *should* load whatever config the user provided, handle tsconfig extensions,
 * and allow the user to pass in a custom config object to overload the loaded options.
 * @param {string} configPath - path to users tsconfig file
 * @param {ts.CompilerOptions} compilerOptions - an object containing configuration options to override in tsconfig
 */
function getConfig(configPath, config) {
  const configFileName = ts.findConfigFile(path.dirname(configPath), ts.sys.fileExists, path.basename(configPath));
  const configFile = ts.readConfigFile(configFileName, ts.sys.readFile, { config });
  const compilerOptions = ts.parseJsonConfigFileContent(configFile.config, ts.sys, "./");
  return compilerOptions;
}
/**
 * Handles transforming an export statement by resolving the type, copying it to the out directory
 * and replacing the path in the source .d.ts file.
 * @param {ts.Statement} node - The node statement information from typescript
 * @param {ts.CompilerOptions} options - tsconfig compiler options necessary to resolve imported module paths
 * @param {string} outDir - Base directory to write type definitions to
 */
function handleImportExport(node, options, outDir) {
  for (const excludePattern of node.excludes) {
    if (node.moduleSpecifier.text.match(excludePattern)) {
      return;
    }
  }
  // handle cases where export {var as <x>} has no moduleSpecifier
  if (!node.moduleSpecifier || !node.moduleSpecifier.text) return;
  const moduleName = resolveModuleName(node, options);
  if (node.cache[moduleName]) return;
  node.cache[moduleName] = true;
  if (!moduleName.match(/node_modules/)) {
    // follow this file
    return compile(moduleName, options, outDir, node.excludes, node.cache);
  }
  const copied = copyDefinitions(node, moduleName, outDir);
  if (copied) {
    const newImportPath = path.relative(path.dirname(node.fileName), path.join(outDir, node.moduleSpecifier.text));
    node.editor.replace(node.moduleSpecifier.pos, node.moduleSpecifier.end, ` "./${newImportPath}"`);
  }
}
/**
 * Find out where our module type definitions live
 * @param {ts.Statement} node - The node statement information from typescript
 * @param {ts.CompilerOptions} options - tsconfig compiler options necessary to resolve imported module paths
 */
function resolveModuleName(node, options) {
  const moduleName = ts.resolveModuleName(node.moduleSpecifier.text, node.fileName, options, {
    fileExists: fs.existsSync,
    readFile: fs.readFileSync,
  });
  if (moduleName.resolvedModule) {
    return moduleName.resolvedModule.resolvedFileName;
  }
  if (!moduleName.affectingLocations || !moduleName.affectingLocations.length) {
    node.cache._errors.push(new Error(`unable to resolve import module: ${node.moduleSpecifier.text}`));
    return node.moduleSpecifier.text;
  }
  // look for package.json of this module
  const modulePath = resolve.sync({}, process.cwd(), node.moduleSpecifier.text, {});
  let dirname = modulePath;
  while (!["/", "."].includes(dirname)) {
    dirname = path.dirname(dirname);
    const pkgPath = path.join(dirname, "package.json");
    if (!fs.existsSync(pkgPath)) {
      continue;
    }
    const pkg = require(pkgPath);
    if (!pkg.types) {
      throw new Error(`unable to resolve module types: ${node.moduleSpecifier.text}`);
    }
    return path.resolve(dirname, pkg.types);
  }
}

/**
 * naive copy all .d.ts files from the resolved module when it's in node_modules
 * @param {ts.Statement} node
 * @param {string} resolvedModule
 * @param {string} outDir
 * @returns {boolean}
 */
function copyDefinitions(node, resolvedModule, outDir) {
  const moduleName = node.moduleSpecifier.text;
  // get the base directory of the resolved module name the entry to our module types)
  const baseDir = path.dirname(resolvedModule);
  // ensure the directory exists in out directory
  fs.mkdirSync(path.join(outDir, moduleName), { recursive: true });
  // get all type definitions in the resolved node module folder
  const types = glob.sync(path.join(baseDir, "**/*.d.ts"));
  // copy all type definitions into our out directory preserving the node module name and folder structure
  for (const typeFile of types) {
    const outFile = path.join(outDir, moduleName, path.relative(baseDir, typeFile));
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.copyFileSync(typeFile, outFile);
  }
  return true;
}

module.exports = {
  compile,
  getConfig,
};
