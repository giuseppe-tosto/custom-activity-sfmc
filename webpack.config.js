const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    main: './src/index.js'
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist/src'),
    clean: true
  },
  mode: 'production',
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'html', to: 'dist/html' },
        { from: 'config/config.json', to: 'dist' },
        { from: 'images', to: 'dist/images' }
      ]
    })
  ],
  module: {
    rules: []
  }
};
