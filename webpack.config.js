const path = require('path');
const webpack = require('webpack');

// Webpack plugins
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const PROD = process.env.NODE_ENV == 'production';
const RPC_URL = process.env.RPC_URL;
const WS_URL = process.env.WS_URL;
const CANVAS_ADDRESS = process.env.CANVAS_ADDRESS;
const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS;

const config = {
  target: 'web',
  mode: PROD ? process.env.NODE_ENV : 'development',
  devtool: 'source-map',

  entry: {
    app: './client/index.js'
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].bundle.js',
    library: 'collabs',
    libraryTarget: 'var'
  },

  resolve: {
    extensions: ['.js'],
    alias: { // must keep in sync with jsconfig
      '@actions': path.resolve(__dirname, 'client/actions/'),
      '@components': path.resolve(__dirname, 'client/components/'),
      '@models': path.resolve(__dirname, 'client/models/'),
      '@initializers': path.resolve(__dirname, 'client/initializers/'),
      '@scenes': path.resolve(__dirname, 'client/scenes/'),
      '@services': path.resolve(__dirname, 'client/services/'),
      '@util': path.resolve(__dirname, 'client/util/'),
      '@root': path.resolve(__dirname, __dirname)
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
    new CopyPlugin([{
      from: path.resolve(__dirname, 'client/assets'),
      to: path.resolve(__dirname, 'dist/assets')
    }]),
    new CopyPlugin([{
      from: path.resolve(__dirname, 'client/abis'),
      to: path.resolve(__dirname, 'dist/abis')
    }]),
    new CopyPlugin([{
      from: path.resolve(__dirname, 'config.json'),
      to: path.resolve(__dirname, 'dist/config.json'),
      transform: (content) => {
        // copy-webpack-plugin passes a buffer
        const config = JSON.parse(content.toString());

        console.log('RPC_URL', RPC_URL);
        console.log('WS_URL', WS_URL);
        config.httpUrl = RPC_URL;
        config.wsUrl = WS_URL;

        console.log('CANVAS_ADDRESS', CANVAS_ADDRESS);
        console.log('TOKEN_ADDRESS', TOKEN_ADDRESS);
        config.CollabCanvasAddress = CANVAS_ADDRESS;
        config.CollabTokenAddress = TOKEN_ADDRESS;

        return JSON.stringify(config, null, 2);
      }
    }]),
    new webpack.DefinePlugin({
      PRODUCTION: PROD,
      VERSION: "0.1.1",
      DEBUG: false // !PROD
    }),
    /*new webpack.ProvidePlugin({ // in some cases fallback above did not work, so had to use https://webpack.js.org/guides/shimming/ (webpack v5)
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser'
    }),*/
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'client/public/index.html'),
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
    static: path.join(__dirname, 'dist'),
    compress: true,
    port: 9000
  }
}

module.exports = config;
