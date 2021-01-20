import { Blob } from 'blob-polyfill'

global['Blob'] = Blob

// https://stackoverflow.com/questions/14967647/encode-decode-image-with-base64-breaks-image
function fixBinary(bin) {
  var length = bin.length
  var buf = new ArrayBuffer(length)
  var arr = new Uint8Array(buf)
  for (var i = 0; i < length; i++) {
    arr[i] = bin.charCodeAt(i)
  }
  return buf
}

// polyfill for SSR as atob is not available - https://gist.github.com/jmshal/b14199f7402c8f3a4568733d8bed0f25
const atobPolyfill = (a: string) => Buffer.from(a, 'base64').toString('binary')

export const createImageUrl = (blob: string, type: string) =>
  URL.createObjectURL(new Blob([fixBinary(atobPolyfill(blob))], { type }))
