import { DefaultLoadingManager } from 'three'
import create from 'zustand'

type Data = {
  errors: string[]
  active: boolean
  progress: number
  item: string
  loaded: number
  total: number
}
let saveLastTotalLoaded = 0

const useProgress = create<Data>((set) => {
  DefaultLoadingManager.onStart = (item, loaded, total) => {
    set({
      active: true,
      item,
      loaded,
      total,
      progress: ((loaded - saveLastTotalLoaded) / (total - saveLastTotalLoaded)) * 100,
    })
  }
  DefaultLoadingManager.onLoad = () => {
    set({ active: false })
  }
  DefaultLoadingManager.onError = (item) => set((state) => ({ errors: [...state.errors, item] }))
  DefaultLoadingManager.onProgress = (item, loaded, total) => {
    if (loaded === total) {
      saveLastTotalLoaded = total
    }
    set({
      active: true,
      item,
      loaded,
      total,
      progress: ((loaded - saveLastTotalLoaded) / (total - saveLastTotalLoaded)) * 100 || 100,
    })
  }
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
