const { merge } = require('webpack-merge');
const base = require('./webpack.base.js');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const apiTarget = process.env.API_TARGET || 'http://localhost:8081';

module.exports = merge(base, {
  mode: 'development',
  devtool: 'inline-source-map',
  output: {
    filename: 'js/[name].[fullhash].js',
    path: path.resolve(__dirname, '../../../output/client')
  },
  devServer: {
    port: 8080,
    compress: true,
    proxy: { context: ['/api', '/api'], target: apiTarget }
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'css/[name].css',
      chunkFilename: 'css/[id].css'
    })
  ]
});
