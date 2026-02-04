import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'

// Accept any renderer type - R3F can return WebGLRenderer or WebGPURenderer
type Renderer = any

const SERVICE_KEY = '__drei_ktx2_service__'
const DEFAULT_TRANSCODER_PATH = 'https://cdn.jsdelivr.net/gh/pmndrs/drei-assets@master/basis/'

/**
 * Internal service that manages KTX2Loader lifecycle with deferred initialization.
 * Handles the challenge that KTX2Loader.detectSupport(renderer) must be called before loading,
 * but useLoader.preload() runs outside React context (no renderer access).
 *
 * Pattern: Singleton with pending callback queue, HMR-safe via globalThis.
 */
class KTX2LoaderServiceImpl {
  private loader: KTX2Loader | null = null
  private renderer: Renderer | null = null
  private _isReady = false
  private transcoderPath = DEFAULT_TRANSCODER_PATH
  private pendingCallbacks: Array<() => void> = []

  /**
   * Get or create the singleton KTX2Loader instance.
   * The loader is created lazily on first access.
   */
  getLoader(): KTX2Loader {
    if (!this.loader) {
      this.loader = new KTX2Loader()
      this.loader.setTranscoderPath(this.transcoderPath)
    }
    return this.loader
  }

  /**
   * Register a renderer and call detectSupport.
   * Should be called from within React context (useLayoutEffect).
   * Flushes any queued callbacks.
   */
  registerRenderer(renderer: Renderer): void {
    // Skip if already registered with same renderer
    if (this._isReady && this.renderer === renderer) {
      return
    }

    this.renderer = renderer
    const loader = this.getLoader()
    loader.detectSupport(renderer)
    this._isReady = true

    // Flush queued callbacks
    this.flushPendingCallbacks()
  }

  /**
   * Check if the service is ready (has renderer registered).
   */
  isReady(): boolean {
    return this._isReady
  }

  /**
   * Get the registered renderer, if any.
   */
  getRenderer(): Renderer | null {
    return this.renderer
  }

  /**
   * Register a callback to run when renderer becomes available.
   * If renderer is already available, runs immediately.
   */
  onReady(callback: () => void): void {
    if (this._isReady) {
      callback()
    } else {
      this.pendingCallbacks.push(callback)
    }
  }

  /**
   * Process all pending callbacks.
   */
  private flushPendingCallbacks(): void {
    const callbacks = this.pendingCallbacks
    this.pendingCallbacks = []

    for (const callback of callbacks) {
      try {
        callback()
      } catch (error) {
        console.error('KTX2LoaderService: Error in pending callback:', error)
      }
    }
  }

  /**
   * Set the transcoder path for basis/ktx2 decoding.
   */
  setTranscoderPath(path: string): void {
    this.transcoderPath = path
    if (this.loader) {
      this.loader.setTranscoderPath(path)
    }
  }

  /**
   * Get the current transcoder path.
   */
  getTranscoderPath(): string {
    return this.transcoderPath
  }

  /**
   * Dispose of the loader and reset state.
   * Useful for testing or cleanup.
   */
  dispose(): void {
    if (this.loader) {
      this.loader.dispose()
    }
    const path = this.transcoderPath // Preserve path setting
    this.loader = null
    this.renderer = null
    this._isReady = false
    this.transcoderPath = path
    this.pendingCallbacks = []
  }
}

// Global singleton with HMR survival (following View.tsx pattern)
export const KTX2LoaderService: KTX2LoaderServiceImpl =
  (globalThis as any)[SERVICE_KEY] || ((globalThis as any)[SERVICE_KEY] = new KTX2LoaderServiceImpl())
