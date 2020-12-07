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

export const createImageUrl = (blob: string, type: string) =>
  URL.createObjectURL(new Blob([fixBinary(atob(blob))], { type }))
