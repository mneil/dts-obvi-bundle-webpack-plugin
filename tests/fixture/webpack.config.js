const DtsObviBundlePlugin = require("../../index");

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
    plugins: [new DtsObviBundlePlugin()],
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
