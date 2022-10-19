const fs = require("fs");
const assert = require("assert");
const path = require("path");
const webpack = require("webpack");
const options = require("./fixture/webpack.config");
const cwd = process.cwd();

describe("obvi bundle", () => {
  beforeAll(() => {
    process.chdir(path.resolve("tests/fixture"));
  });
  afterAll(() => {
    process.chdir(cwd);
  });

  it("should compile", (done) => {
    webpack(options(), function (err, stats) {
      if (err) {
        return done(err);
      } else if (stats.hasErrors()) {
        return done(new Error(stats.toString()));
      }

      // 3. Map asset objects to output filenames
      const files = stats.toJson().assets.map((x) => x.name);
      const allFiles = files.every((file) => ["main.js", "sqs.d.ts", "index.d.ts"].includes(file));
      assert.ok(allFiles);

      const index = fs.readFileSync("./dist/index.d.ts", "utf8");
      assert.ok(
        index ===
          `export * as kms from "./obvi-types/aws-cdk-lib/aws-kms";
export { default as sqs } from "./sqs";
`
      );

      const sqs = fs.readFileSync("./dist/sqs.d.ts", "utf8");
      assert.ok(
        sqs ===
          `import * as sqs from "./obvi-types/aws-cdk-lib/aws-sqs";
declare class Queue extends sqs.Queue {
}
declare const _default: typeof sqs & {
    Queue: typeof Queue;
};
export default _default;
`
      );

      done();
    });
  }, 30000);
});
