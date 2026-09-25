import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import glslify from 'vite-plugin-glslify'

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ['babel-plugin-react-compiler', { target: '17' }],
      },
    }),
    ,
    glslify(),
  ],
})
