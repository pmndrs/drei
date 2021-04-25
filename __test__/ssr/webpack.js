const path = require('path')
const nodeExternals = require('webpack-node-externals')

module.exports = {
  entry: './__test__/ssr/index.tsx',

  target: 'node',

  externals: [nodeExternals()],

  output: {
    path: path.resolve('__test__/ssr/server-build'),
    filename: 'index.js',
  },

  module: {
    rules: [
      {
        test: /\.tsx$/,
        use: 'babel-loader',
      },
    ],
  },
}
