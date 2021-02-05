import { LoadingManager } from 'three'
import create from 'zustand'

type Data = {
  errors: string[]
  active: boolean
  progress: number
  item: string
  loaded: number
  total: number
}

const useProgress = create<Data>((set) => {
  const loader = new LoadingManager()

  loader.onStart = (item, loaded, total) => set({ active: true, item, loaded, total, progress: (loaded / total) * 100 })
  loader.onLoad = () => set({ active: false })
  loader.onError = (item) => set((state) => ({ errors: [...state.errors, item] }))
  loader.onProgress = (item, loaded, total) => set({ item, loaded, total, progress: (loaded / total) * 100 })

  return {
    errors: [],
    active: false,
    progress: 0,
    item: '',
    loaded: 0,
    total: 0,
  }
})

export { useProgress }
