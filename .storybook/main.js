const path = require('path')

module.exports = {
  stories: ['./stories/**/*.stories.(js|mdx)'],
  addons: [
    '@storybook/addon-knobs/register', 
    '@storybook/addon-controls',
    {
      name: '@storybook/addon-docs',
      options: {
        transcludeMarkdown: true
      }
    }
  ],

  webpackFinal: (config) => {
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      exclude: /node_modules/,
      use: ['raw-loader', 'glslify-loader'],
      include: path.resolve(__dirname, '../'),
    })

    return config
  },
}
