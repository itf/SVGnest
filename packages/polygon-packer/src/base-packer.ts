import { DisplayCallback, f32, NestConfig } from "./types";
import WasmNesting from "./wasm-nesting";

export default class BasePacker {
    #wasmNesting: WasmNesting = new WasmNesting();

    #wasmBuffer: ArrayBuffer;

    constructor() {
        this.initWasm();
    }

    public start(
        configuration: NestConfig,
        polygons: Float32Array[],
        binPolygon: Float32Array,
        progressCallback?: (progress: f32) => void,
        displayCallback?: DisplayCallback
    ): void {
        const allPolygons = polygons.concat([binPolygon]);

        this.wasmNesting.wasm_packer_init(configuration, allPolygons);
    }

    protected async initWasm() {
        this.#wasmBuffer = await (await fetch('dist/wasm-nesting.wasm')).arrayBuffer();
        this.#wasmNesting.init(this.cloneWasmBuffer());
    }

    protected cloneWasmBuffer(): ArrayBuffer {
        const dst = new ArrayBuffer(this.#wasmBuffer.byteLength);
        new Uint8Array(dst).set(new Uint8Array(this.#wasmBuffer));

        return dst;
    }

    protected get wasmNesting(): WasmNesting {
        return this.#wasmNesting;
    }

    public stop(isClean: boolean): void {
        if (isClean) {
            this.wasmNesting.wasm_packer_stop();
        }
    }
}