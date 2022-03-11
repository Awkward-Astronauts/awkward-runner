const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: "./bootstrap.js",
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Awkward Astronaut Runner',
      template: './index.html'
    }),
  ],
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "output.js"
  },
  mode: "production"
};
