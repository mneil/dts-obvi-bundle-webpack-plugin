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
      // const files = stats.toJson().assets.map((x) => x.name);

      // // 4. Run assertions. Make sure that the three expected
      // //    HTML files were generated
      // t.true(files.indexOf("index.html") !== -1);
      // t.true(files.indexOf("about.html") !== -1);
      // t.true(files.indexOf("404.html") !== -1);

      // t.end();
      done();
    });
  }, 30000);
});
