import { addons } from 'storybook/manager-api'
import { defaultConfig, type TagBadgeParameters } from 'storybook-addon-tag-badges/manager-helpers'
import theme from './theme'

addons.setConfig({
  theme,
  panelPosition: 'right',
  showPanel: true,
  tagBadges: [
    // Add an entry that matches 'frog' and displays a cool badge in the sidebar only
    {
      tags: 'legacyOnly',
      badge: {
        text: 'Legacy Only',
        style: {
          backgroundColor: '#001c13',
          color: '#e0eb0b',
        },
        tooltip: 'This component can catch flies!',
      },
      display: {
        sidebar: [
          {
            type: 'component',
            skipInherited: true,
          },
        ],
        toolbar: true,
        mdx: true,
      },
    },
    {
      tags: 'webgpuOnly',
      badge: {
        text: 'WebGPU Only',
        style: {
          backgroundColor: '#0b1c40',
          color: '#1caaff',
        },
        tooltip: 'This component only works with WebGPU renderer.',
      },
      display: {
        sidebar: [
          {
            type: 'component',
            skipInherited: true,
          },
        ],
        toolbar: true,
        mdx: true,
      },
    },
    {
      tags: 'dual',
      badge: {
        text: 'Dual',
        style: {
          backgroundColor: '#0a3534',
          color: '#16e3b7',
        },
        tooltip: 'This works in both, but with specific import paths',
      },
      display: {
        sidebar: [
          {
            type: 'component',
            skipInherited: true,
          },
        ],
        toolbar: true,
        mdx: true,
      },
    },
    // Place the default config after your custom matchers.
    ...defaultConfig,
  ] satisfies TagBadgeParameters,
})
