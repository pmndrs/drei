const path = require('path')
const nodeExternals = require('webpack-node-externals')

module.exports = {
  entry: './test-ssr/index.tsx',

  target: 'node',

  externals: [nodeExternals()],

  output: {
    path: path.resolve('test-ssr/server-build'),
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
