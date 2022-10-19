const fs = require("fs");
const path = require("path");
const ts = require("typescript");
const glob = require("glob");
const Replacer = require("./replacer");

/**
 *
 * @param {string} fileName - entrypoint to projects .d.ts file
 * @param {ts.CompilerOptions} configPath - tsconfig compilerOptions
 * @param {string} outDir - absolute path to base directory to write files to
 * @param {RegExp[]} excludes - list of modules to ignore
 * @param {object} cache - object that stores module resolution cache
 */
function compile(fileName, config, outDir, excludes = [], cache = {}) {
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
 * @param {ts.CompilerOptions} compilerOptions - tsconfig compiler options necessary to resolve imported module paths
 * @param {string} outDir - Base directory to write type definitions to
 */
function handleImportExport(node, options, outDir) {
  for (const excludePattern of node.excludes) {
    if (node.moduleSpecifier.text.match(excludePattern)) {
      return;
    }
  }
  const moduleName = ts.resolveModuleName(node.moduleSpecifier.text, node.fileName, options, {
    fileExists: fs.existsSync,
    readFile: fs.readFileSync,
  });
  if (!moduleName.resolvedModule.resolvedFileName.match(/node_modules/)) {
    // follow this file
    return compile(moduleName.resolvedModule.resolvedFileName, options, outDir, node.excludes, node.cache);
  }
  const copied = copyDefinitions(node, moduleName.resolvedModule, outDir);
  if (copied) {
    const newImportPath = path.relative(path.dirname(node.fileName), path.join(outDir, node.moduleSpecifier.text));
    node.editor.replace(node.moduleSpecifier.pos, node.moduleSpecifier.end, ` "./${newImportPath}"`);
  }
}

/**
 * naive copy all .d.ts files from the resolved module when it's in node_modules
 * @param {ts.Statement} node
 * @param {ts.ResolvedModuleFull} resolvedModule
 * @param {string} outDir
 * @returns {boolean}
 */
function copyDefinitions(node, resolvedModule, outDir) {
  const moduleName = node.moduleSpecifier.text;
  if (node.cache[moduleName]) {
    return true;
  }
  // get the base directory of the resolved module name the entry to our module types)
  const baseDir = path.dirname(resolvedModule.resolvedFileName);
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
  node.cache[moduleName] = true;
  return true;
}

module.exports = {
  compile,
  getConfig,
};
