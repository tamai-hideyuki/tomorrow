module.exports = {
    // ビルドした際の出力先
    output: {
      path: `${__dirname}/dist`,
      filename: "bundle.js",
    },
    // モード指定（development,production）
    mode: "development",
    // import時のパス指定で拡張子を省略する
    resolve: {
      extensions: [".ts", ".js"],
    },
    // 開発用サーバで起動するパス
    devServer: {
      static: {
        directory: `${__dirname}/dist`,
      },
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          loader: "ts-loader",
        },
      ],
    },
  };