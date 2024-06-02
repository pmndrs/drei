//
// SVG favicon, with different themes for development and production
//
// Figma file: https://www.figma.com/design/4YFrr0TVqlNfL1d0h0Mdxs/Untitled?node-id=0-1&t=gqq4aoy97yC1u7dW-1
//

const themes = {
  development: {
    bg: '#66bf3b',
    txt: 'white',
  },
  production: {
    bg: '#f10055',
    txt: 'white',
  },
}

export const svg = (env: keyof typeof themes = 'production') => {
  const { bg, txt } = themes[env]

  return `
  <svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:svgjs="http://svgjs.com/svgjs" width="164" height="164">
    
    <svg width="164" height="164" viewBox="0 0 164 164" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path class="badge" d="M22.467 147.762L17.5 15.402C17.4207 13.2999 18.1662 11.2501 19.5774 9.69008C20.9885 8.13004 22.9535 7.18333 25.053 7.05202L137.637 0.016016C138.736 -0.0528338 139.838 0.104225 140.873 0.477503C141.909 0.850782 142.858 1.43236 143.661 2.18637C144.463 2.94038 145.103 3.85083 145.54 4.86155C145.977 5.87227 146.202 6.96183 146.202 8.06302V152.293C146.202 153.382 145.981 154.46 145.553 155.462C145.125 156.463 144.498 157.367 143.711 158.12C142.924 158.873 141.992 159.458 140.972 159.841C139.953 160.224 138.866 160.396 137.778 160.347L30.163 155.514C28.1416 155.423 26.2282 154.576 24.8026 153.14C23.3771 151.704 22.5438 149.784 22.468 147.762H22.467Z" />
      <path class="shape" fill-rule="evenodd" clip-rule="evenodd" d="M128.785 0.569946L113.29 1.53795L112.535 19.7099C112.526 19.9378 112.581 20.1635 112.696 20.3609C112.81 20.5583 112.978 20.7192 113.18 20.8248C113.382 20.9304 113.61 20.9765 113.837 20.9576C114.064 20.9386 114.281 20.8555 114.463 20.7179L121.523 15.3639L127.485 20.0609C127.665 20.2031 127.882 20.2908 128.11 20.3136C128.339 20.3363 128.569 20.2933 128.774 20.1895C128.978 20.0857 129.149 19.9255 129.265 19.7278C129.382 19.5302 129.439 19.3033 129.431 19.0739L128.785 0.569946Z" fill="white"/>
      <path class="shape" d="M121 36H62.7191V52.3669H81.7809L43 90.9928H81.7809L45.6292 127H68.1966L121 74.4077H82.4382L121 36Z" fill="white"/>
    </svg>
    
    <style>
    :root {
      --bg: ${bg};
      --txt: ${txt};
    }
    .badge {fill: var(--bg);}
    .shape {fill: var(--txt);}
    </style>
  </svg>
  `
}
