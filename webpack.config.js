const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  target: 'web',
  mode: 'development',
  entry: {
    app: './src/index.js',
    vendors: ['phaser']
  },

  module: {
    rules: [],
  },

  resolve: {
    extensions: ['.js'],
    alias: {
      '@actions': path.resolve(__dirname, 'src/actions/'),
      '@components': path.resolve(__dirname, 'src/components/'),
      '@initializers': path.resolve(__dirname, 'src/initializers/'),
      '@scenes': path.resolve(__dirname, 'src/scenes/'),
      '@util': path.resolve(__dirname, 'src/util/')
    }
  },

  devtool: 'inline-source-map',

  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    port: 8000
  },

  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'index.html'),
          to: path.resolve(__dirname, 'dist/index.html')
        },
        {
          from: path.resolve(__dirname, 'assets'),
          to: path.resolve(__dirname, 'dist/assets')
        }
      ]
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
    filename: 'app.js',
    library: 'PixelWorld',
    libraryTarget: 'var' //'commonjs2'
  }
}
