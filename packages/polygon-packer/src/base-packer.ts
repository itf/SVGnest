import { DisplayCallback, f32, NestConfig } from "./types";
import WasmNesting from "./wasm-nesting";

/**
 * Base class for polygon packing algorithms.
 * 
 * This abstract class provides common functionality for both single-threaded
 * and multi-threaded packers, including WASM initialization and configuration.
 * 
 * @abstract
 */
export default class BasePacker {
    #wasmNesting: WasmNesting = new WasmNesting();

    #wasmBuffer: ArrayBuffer;

    constructor() {
        this.initWasm();
    }

    /**
     * Initializes the nesting algorithm with configuration and polygon data.
     * 
     * @param configuration - Nesting configuration (spacing, rotations, population size, etc.)
     * @param polygons - Array of polygons to nest
     * @param binPolygon - Container polygon to nest shapes into
     * @param progressCallback - Optional callback for progress updates (not used in base class)
     * @param displayCallback - Optional callback for placement updates (not used in base class)
     */
    public start(
        configuration: NestConfig,
        polygons: Float32Array[],
        binPolygon: Float32Array,
        progressCallback?: (progress: f32) => void,
        displayCallback?: DisplayCallback
    ): void {
        const allPolygons = polygons.concat([binPolygon]);

        this.wasmNesting.init(configuration, allPolygons);
    }

    protected async initWasm() {
        this.#wasmBuffer = await (await fetch('dist/polygon-packer.wasm')).arrayBuffer();
        this.#wasmNesting.initBuffer(this.cloneWasmBuffer());
    }

    protected cloneWasmBuffer(): ArrayBuffer {
        const dst = new ArrayBuffer(this.#wasmBuffer.byteLength);
        new Uint8Array(dst).set(new Uint8Array(this.#wasmBuffer));

        return dst;
    }

    protected get wasmNesting(): WasmNesting {
        return this.#wasmNesting;
    }

    /**
     * Stops the nesting algorithm and optionally cleans up internal state.
     * 
     * @param isClean - If true, resets the algorithm state. If false, preserves state.
     */
    public stop(isClean: boolean): void {
        if (isClean) {
            this.wasmNesting.stop();
        }
    }
}