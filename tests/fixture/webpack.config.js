const DtsObviBundlePlugin = require("../../index");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = () => {
  return {
    entry: "./src/index.ts",
    mode: "development",
    target: "node",
    optimization: {
      minimize: false,
    },
    devtool: "inline-source-map",
    output: {
      library: {
        type: "umd",
      },
    },
    externalsPresets: { node: true },
    resolve: {
      extensions: [".ts", ".js"],
    },
    plugins: [
      //new DtsObviBundlePlugin(),
      new CopyPlugin({
        patterns: [{ from: "package.json" }],
      }),
    ],
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: [
            {
              loader: "ts-loader",
            },
          ],
          exclude: /node_modules/,
        },
      ],
    },
  };
};
