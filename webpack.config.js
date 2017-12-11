//
// uglifyjsplugin still has issues with es6 code. 12/11/2017

const path = require('path');
const glob = require('glob');
//
//const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const MinifyPlugin = require("babel-minify-webpack-plugin");
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const config = {
  entry: {
    wings3d: glob.sync("./js/*.js"),
  },
  output: {
    path: path.resolve(__dirname, 'html'),
    filename: '[name].bundle.js', // The filename template
  },
  module: {
    rules: [
      { test: /\.js$/,
        include: path.resolve(__dirname, 'js'),
      },
      { test: /\.txt$/, use: 'raw-loader' },
      { test: /\.css$/, 
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: 'css-loader'
        })
      },
    ]
  },
  plugins: [
    //new UglifyJsPlugin(),
    //new MinifyPlugin(),
    new ExtractTextPlugin("styles.css"),
  ]
};

module.exports = config;

