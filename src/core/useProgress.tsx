import { DefaultLoadingManager } from 'three'
import create from 'zustand'

type Data = {
  errors: string[]
  active: boolean
  progress: number
  item: string
  itemsMap: Map<string, boolean>
  loaded: number
  total: number
}
let saveLastTotalLoaded = 0
let saveItemsMap = new Map<string, boolean>()

const useProgress = create<Data>((set) => {
  DefaultLoadingManager.onStart = (item, loaded, total) => {
    // set in raw map to prevent data loss from batched updates
    saveItemsMap.set(item, false)
    set({
      active: true,
      item,
      itemsMap: saveItemsMap,
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
    saveItemsMap.set(item, true)
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
    itemsMap: new Map<string, boolean>(),
    loaded: 0,
    total: 0,
  }
})

export { useProgress }
