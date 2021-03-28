const path = require('path');
const webpack = require('webpack');

// Webpack plugins
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const PROD = process.env.NODE_ENV == 'production';

const config = {
  target: 'web',
  mode: PROD ? process.env.NODE_ENV : 'development',

  //context: path.resolve(__dirname, 'client'),

  entry: {
    app: './client/index.js',
    vendors: ['phaser','web3']
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].bundle.js',
    library: 'PixelWorld',
    libraryTarget: 'var'
  },

  resolve: {
    extensions: ['.js'],
    alias: {
      '@actions': path.resolve(__dirname, 'client/actions/'),
      '@components': path.resolve(__dirname, 'client/components/'),
      '@models': path.resolve(__dirname, 'client/models/'),
      '@initializers': path.resolve(__dirname, 'client/initializers/'),
      '@scenes': path.resolve(__dirname, 'client/scenes/'),
      '@services': path.resolve(__dirname, 'client/services/'),
      '@util': path.resolve(__dirname, 'client/util/')
    }
    /*fallback: { // some browser fallbacks - for webpack v5 which had other issues, so currently still using v4
      "crypto": require.resolve("crypto-browserify"),
      "http": require.resolve("stream-http"),
      "https": require.resolve("https-browserify"),
      "os": require.resolve("os-browserify/browser"),
      "stream": require.resolve("stream-browserify")
    }*/
  },

  plugins: [
    new CleanWebpackPlugin(),
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
    /*new webpack.ProvidePlugin({ // in some cases fallback above did not work, so had to use https://webpack.js.org/guides/shimming/ (webpack v5 etc.)
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser'
    }),*/
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'client/index.html'),
      inject: 'head',
      chunksSortMode: (a, b) => { 
        if (a[0] < b[0]) 
          return 1;
        if (a[0] > b[0]) 
          return -1;
  
        return 0;
      }
    })
  ]
}

if (!PROD) { // DEV config
  config.output.filename = '[name].bundle.js';
  config.devtool = 'inline-source-map';
  config.devServer = {
    contentBase: path.join(__dirname, 'dist'),
    compress: true,
    port: 9000,
    watchOptions: {
      ignored: /assets/
    }
  }
}

module.exports = config;
