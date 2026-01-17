// Debug script to see if the test file can be imported
import { pathToFileURL } from 'url'

const testFile = 'c:/Users/denni/Documents/GitHub/drei/test/canary/imports.test.ts'
const fileUrl = pathToFileURL(testFile).href

console.log('Attempting to import:', fileUrl)

try {
  const module = await import(fileUrl)
  console.log('Module loaded successfully!')
  console.log('Exports:', Object.keys(module))
  console.log('Module:', module)
} catch (error) {
  console.error('Import failed:', error.message)
  console.error('Stack:', error.stack)
}
