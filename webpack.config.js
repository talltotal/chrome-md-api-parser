const path = require('path')
const webpack = require('webpack')
const { VueLoaderPlugin } = require('vue-loader')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin')

const devMode = process.env.NODE_ENV !== 'production'

const bg = {
  devtool: false,
  mode: devMode ? 'development' : 'production',
  entry: './src/bg.js',
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'bg.js',
    publicPath: '',
  },
  resolve: {
    extensions: ['.ts', '.js', '.json'],
    alias: {
      '@': path.join(__dirname, './src'),
    },
  },
  module: {
    rules: [
    ],
  },
  optimization: {
  },
  plugins: [
    new webpack.DefinePlugin({
    }),
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, './static'),
        to: './',
        ignore: ['.*','*.psd']
      },
    ]),
  ],
}

const pages = {
    devtool: false,
    mode: devMode ? 'development' : 'production',
    entry: {
      options: './src/options/index.js',
      popup: './src/popup/index.js'
    },
    output: {
      path: path.resolve(__dirname, './dist'),
      filename: '[name].js',
      publicPath: '',
    },
    resolve: {
      extensions: ['.ts', '.js', '.vue', '.json'],
      alias: {
        'vue$': 'vue/dist/vue.esm.js',
        '@': path.join(__dirname, './src'),
      },
    },
    module: {
      rules: [
        {
          test: /\.vue$/,
          loader: 'vue-loader',
          options: {
            loaders: {
              'scss': 'vue-style-loader!css-loader!sass-loader',
            },
            cacheBusting: true,
            transformToRequire: {
              video: ['src', 'poster'],
              source: 'src',
              img: 'src',
              image: 'xlink:href'
            },
          },
        },
        {
          test: /\.scss$/,
          oneOf: [
            // this matches `<style module>`
            {
              resourceQuery: /module/,
              loader: MiniCssExtractPlugin.loader + '!css-loader?modules!postcss-loader!sass-loader',
            },
            {
              loader: MiniCssExtractPlugin.loader + '!css-loader!postcss-loader!sass-loader',
            }
          ]
        },
        {
          test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
          loader: 'url-loader',
          options: {
            limit: 10000,
            name: 'img/[name].[hash:7].[ext]'
          },
        },
        {
          test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
          loader: 'url-loader',
          options: {
            limit: 10000,
            name: 'fonts/[name].[hash:7].[ext]'
          },
        },
      ],
    },
    optimization: {
    },
    plugins: [
      new VueLoaderPlugin(),
      new webpack.DefinePlugin({
      }),
      // 将css文件单独文件
      new MiniCssExtractPlugin({
        filename: devMode ? 'css/[name].css' : 'css/[name].[hash].css',
        chunkFilename: devMode ? 'css/[id].css' : 'css/[id].[hash].css',
      }),
      // 除去组件中重复的样式
      new OptimizeCSSPlugin({
        cssProcessorOptions: { safe: true }
      }),
      new HtmlWebpackPlugin({
        assetsPublicPath: '/',
        filename: 'options.html',
        template: './src/options/index.html',
        inject: true,
        minify: {
          removeComments: true,
          collapseWhitespace: true,
          removeAttributeQuotes: true
        },
        excludeChunks: ['options'],
        chunksSortMode: 'dependency'
      }),
      new HtmlWebpackPlugin({
        assetsPublicPath: '/',
        filename: 'popup.html',
        template: './src/popup/index.html',
        inject: true,
        minify: {
          removeComments: true,
          collapseWhitespace: true,
          removeAttributeQuotes: true
        },
        excludeChunks: ['popup'],
        chunksSortMode: 'dependency'
      }),
    ],
}

const list = [bg, pages]

module.exports = list

if (devMode) {
  list.forEach(item => {
    item.watch = true
    item.watchOptions = {
      // 重新build的延迟
      aggregateTimeout: 3000,
      // 忽略文件，避免cpu耗损
      ignored: '/node_modules/',
    }
  })
}