const currentTask = process.env.npm_lifecycle_event
const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const imageminMozjpeg = require('imagemin-mozjpeg')
const ImageminPlugin = require('imagemin-webpack-plugin').default
const CopyWebpackPlugin = require('copy-webpack-plugin')
const fse = require('fs-extra')

const postCSSPlugins = []

const cssConfig = {
  // Apply rule for .sass, .scss or .css files
  test: /\.(sa|sc|c)ss$/,

  // Set loaders to transform files.
  // Loaders are applying from right to left(!)
  // The first loader will be applied after others
  use: [
    {
      // This loader resolves url() and @imports inside CSS
      loader: 'css-loader',
      options: {
        url: false,
        sourceMap: true
      }
    },
    {
      // Then we apply postCSS fixes like autoprefixer and minifying
      loader: 'postcss-loader',
      options: {
        plugins: postCSSPlugins,
        sourceMap: true
      }
    },
    {
      // First we transform SASS to standard CSS
      loader: "sass-loader",
      options: {
        implementation: require("node-sass"),
        sourceMap: true
      }
    }
  ]
}

const imagesConfig = {
  // Now we apply rule for images
  test: /\.(png|jpe?g|gif|svg)$/,
  use: [
    {
      // Using file-loader for these files
      loader: "file-loader",

      // In options we can set different things like format
      // and directory to save
      options: {
        outputPath: 'images'
      }
    }
  ],
}

const fontsConfig = {
  // Apply rule for fonts files
  test: /\.(woff|woff2|ttf|otf|eot)$/,
  use: [
    {
      // Using file-loader too
      loader: "file-loader",
      options: {
        outputPath: 'fonts'
      }
    }
  ]
}

/*
Loop through all the html files in the src directory and create a new instance
of HtmlWebpackPlugin for every html files in the directory.
*/
const htmlWebpackPluginConfig = fse.readdirSync('./src').filter(file => {
  return file.endsWith('.html')
}).map(page => {
  let title = page.split('.')[0]
  const titleCapitalized = title.charAt(0).toUpperCase() + title.slice(1)

  return new HtmlWebpackPlugin({
    filename: page,
    template: `./src/${page}`,
    title: `${titleCapitalized} Page`,
    minify: {
      collapseWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      useShortDoctype: true
    }
  })
})

let config = {
  entry: ['@babel/polyfill', './src/scripts/index.js'],
  module: {
    rules: [
      cssConfig,
      imagesConfig,
      fontsConfig
    ]
  },
  plugins: htmlWebpackPluginConfig
}

if (currentTask === 'dev') {
  config.mode = 'development'
  config.output = {
    path: path.resolve(__dirname, 'src'),
    filename: 'bundle.js'
  }
  config.devServer = {
    before: function(app, server) {
      server._watch('./src/**/*.html')
    },
    contentBase: path.join(__dirname, 'src'),
    hot: true,
    port: 3000,
    host: '0.0.0.0'
  }
  config.devtool = 'source-map'
  cssConfig.use.unshift('style-loader')
}

if (currentTask === 'build') {
  config.mode = 'production'
  config.output = {
    path: path.resolve(__dirname, 'docs'),
    filename: '[name].[chunkhash].js',
    chunkFilename: '[name].[chunkhash].js'
  }
  config.optimization = {
    splitChunks: { chunks: 'all' }
  }
  config.module.rules.push({
    test: /\.js$/,
    exclude: /(node_modules)/,
    use: {
      loader: 'babel-loader',
      options: {
        presets: ['@babel/preset-env']
      }
    }
  })
  cssConfig.use.unshift(MiniCssExtractPlugin.loader)
  postCSSPlugins.push(
    require('autoprefixer'),
    require('cssnano')
  )
  config.plugins.push(
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: 'styles.[chunkhash].css'
    }),
    new CopyWebpackPlugin([{
      from: 'src/images/',
      to: path.resolve(__dirname, 'docs/images/')
    }]),
    new ImageminPlugin({
      test: /\.(jpe?g|png|gif|svg)$/i,
      optipng: {
        // https://github.com/imagemin/imagemin-optipng
        optimizationLevel: 3
      },
      pngquant: {
        // https://github.com/imagemin/imagemin-pngquant
        quality: [0.65, 0.90],
        speed: 4
      },
      gifsicle: {
        // https://github.com/imagemin/imagemin-gifsicle
        optimizationLevel: 1,
      },      
      plugins: [
        imageminMozjpeg({ 
          quality: 85,
          progressive: true
        })
      ]
    })
  )
}

module.exports = config