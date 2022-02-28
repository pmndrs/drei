import { resolve } from 'path'

export default {
  staticDirs: ['./public'],
  stories: ['./stories/**/*.stories.{ts,tsx}'],
  addons: [
    '@storybook/addon-controls',
    '@storybook/addon-knobs',
    '@storybook/addon-actions',
    '@storybook/addon-storysource',
  ],
  typescript: {
    check: true,
  },
  // https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#deprecated-implicit-postcss-loader
  features: {
    postcss: false,
  },
  webpackFinal: (config) => {
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      exclude: /node_modules/,
      use: ['raw-loader', 'glslify-loader'],
      include: resolve(__dirname, '../'),
    })

    return config
  },
}
