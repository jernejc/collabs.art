const path = require('path');
const webpack = require('webpack');

const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const PROD = process.env.NODE_ENV == 'production';

const config = {
  target: 'web',
  entry: {
    app: './client/index.js',
    vendors: ['phaser','web3']
  },

  module: {
    rules: [],
  },

  resolve: {
    extensions: ['.js'],
    alias: {
      '@actions': path.resolve(__dirname, 'client/actions/'),
      '@components': path.resolve(__dirname, 'client/components/'),
      '@initializers': path.resolve(__dirname, 'client/initializers/'),
      '@scenes': path.resolve(__dirname, 'client/scenes/'),
      '@services': path.resolve(__dirname, 'client/services/'),
      '@util': path.resolve(__dirname, 'client/util/')
    }
  },

  plugins: [
    new CopyPlugin({
      patterns: [{
        from: path.resolve(__dirname, 'assets'),
        to: path.resolve(__dirname, 'dist/assets')
      }]
    }),
    new webpack.DefinePlugin({
      PRODUCTION: PROD,
      VERSION: "0.1.1",
      DEBUG: false // !PROD
    }),
    new HtmlWebpackPlugin({
      title: 'PixelWorld',
      template: path.resolve(__dirname, 'index.html'),
      inject: 'head'
    })
  ],

  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
    }
  },

  output: {
    path: path.resolve('dist'),
    filename: '[name].[contenthash].bundle.js',
    library: 'PixelWorld',
    libraryTarget: 'var' // 'commonjs2'
  }
}

if (!PROD) { // DEV config
  config.devtool = 'inline-source-map';
  config.devServer = {
    contentBase: path.join(__dirname, 'dist'),
    compress: true,
    port: 9000
  }
}

module.exports = config;
