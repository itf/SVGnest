import WasmNesting from './wasm-nesting';
import Parallel from './parallel';
import PlacementWrapper from './placement-wrapper';
import { DisplayCallback, f32, NestConfig, u16, u32, usize } from './types';
export default class PolygonPacker {
    #wasmNesting: WasmNesting = new WasmNesting();

    #isWorking: boolean = false;

    #progress: f32 = 0;

    #workerTimer: u32 = 0;

    #paralele: Parallel = new Parallel();

    #wasmBuffer: ArrayBuffer;

    #workersReady = false;

    #chunkSize: usize = 512;

    constructor() {
        this.initWasm();
    }

    private async initWasm() {
        this.#wasmBuffer = await (await fetch('dist/wasm-nesting.wasm')).arrayBuffer();
        this.#wasmNesting.init(this.cloneWasmBuffer());
        this.setupWorkers();
    }

    private async setupWorkers() {
        this.#workersReady = false;
        this.#paralele.start(
            new Array(this.#paralele.threadCount).fill(0).map(() => this.cloneWasmBuffer()),
            () => {
                this.#workersReady = true;
            },
            this.onError
        );
    }

    private cloneWasmBuffer(): ArrayBuffer {
        const dst = new ArrayBuffer(this.#wasmBuffer.byteLength);
        new Uint8Array(dst).set(new Uint8Array(this.#wasmBuffer));

        return dst;
    }

    // progressCallback is called when progress is made
    // displayCallback is called when a new placement has been made
    public start(
        configuration: NestConfig,
        polygons: Float32Array[],
        binPolygon: Float32Array,
        progressCallback: (progress: f32) => void,
        displayCallback: DisplayCallback
    ): void {
        const allPolygons = polygons.concat([binPolygon]);
        const polygonData: Float32Array = PolygonPacker.joinFloat32Arrays(allPolygons);

        this.#wasmNesting.wasm_packer_init(this.serializeConfig(configuration), polygonData);
        this.#isWorking = true;

        this.launchWorkers(displayCallback);

        this.#workerTimer = setInterval(() => {
            progressCallback(this.#progress);
        }, 100) as unknown as u32;
    }

    private onSpawn = (_: number, progress: number): void => {
        this.#progress = progress;
    };

    launchWorkers(displayCallback: DisplayCallback) {
        const serializedPairs = this.#wasmNesting.wasm_packer_get_pairs(this.#chunkSize);
        const pairs = PolygonPacker.splitFloat32Arrays(serializedPairs).map(pair => pair.buffer as ArrayBuffer);
        //console.log(pairs.map(p => p.byteLength));
        this.#paralele.start(
            pairs,
            (generatedNfp: ArrayBuffer[]) => this.onPair(generatedNfp, displayCallback),
            this.onError,
            this.onSpawn
        );
    }

    private onError(error: ErrorEvent) {
        console.log(error);
    }

    private onPair(generatedNfp: ArrayBuffer[], displayCallback: DisplayCallback): void {
        const placementData = this.getPlacementData(generatedNfp);

        this.#paralele.start(
            [placementData.buffer as ArrayBuffer],
            (placements: ArrayBuffer[]) => this.onPlacement(placements, displayCallback),
            this.onError
        );
    }

    private onPlacement(placements: ArrayBuffer[], displayCallback: DisplayCallback): void {
        if (placements.length === 0) {
            return;
        }

        const placementResult = this.getPlacemehntResult(placements);
        const placementWrapper = new PlacementWrapper(placementResult.buffer);

        if (this.#isWorking) {
            displayCallback(placementWrapper);
            this.launchWorkers(displayCallback);
        }
    }

    public stop(isClean: boolean): void {
        if (!this.#isWorking) {
            return;
        }

        this.#isWorking = false;

        if (this.#workerTimer) {
            clearInterval(this.#workerTimer);
            this.#workerTimer = 0;
        }

        this.#paralele.terminate();
        this.setupWorkers();

        if (isClean) {
            this.#wasmNesting.wasm_packer_stop();
        }
    }

    private serializeConfig(config: NestConfig): number {
        let result: number = 0;

        // Кодуємо значення в число
        result = this.#wasmNesting.set_bits_u32(result, config.curveTolerance * 10, 0, 4);
        result = this.#wasmNesting.set_bits_u32(result, config.spacing, 4, 5);
        result = this.#wasmNesting.set_bits_u32(result, config.rotations, 9, 5);
        result = this.#wasmNesting.set_bits_u32(result, config.populationSize, 14, 7);
        result = this.#wasmNesting.set_bits_u32(result, config.mutationRate, 21, 7);
        result = this.#wasmNesting.set_bits_u32(result, Number(config.useHoles), 28, 1);

        return result;
    }

    private static splitFloat32Arrays(flat: Float32Array): Float32Array[] {
        const result: Float32Array[] = [];
        const view = new DataView(flat.buffer, flat.byteOffset, flat.byteLength);
        let byteOffset: number = 0;

        while (byteOffset < flat.byteLength) {
            // read size encoded as u32 little-endian
            const size = view.getUint32(byteOffset, true);
            byteOffset += Uint32Array.BYTES_PER_ELEMENT;

            const floatByteOffset = flat.byteOffset + byteOffset;

            const arr = new Float32Array(flat.buffer, floatByteOffset, size);
            // copy to standalone array
            result.push(arr.slice());

            byteOffset += size * Float32Array.BYTES_PER_ELEMENT;
        }

        return result;
    }

    private static joinFloat32Arrays(arrays: Float32Array[]): Float32Array {
        // Build a flat buffer where each array is prefixed by its size encoded as u32 bits (little-endian)
        let totalFloats = 0;
        for (const a of arrays) totalFloats += a.length;

        const totalElements = totalFloats + arrays.length; // sizes + floats
        const buffer = new ArrayBuffer(totalElements * Float32Array.BYTES_PER_ELEMENT);
        const dv = new DataView(buffer);
        const f32view = new Float32Array(buffer);

        let byteOffset: number = 0;

        for (const a of arrays) {
            // write size as u32 bits (little-endian)
            dv.setUint32(byteOffset, a.length >>> 0, true);
            byteOffset += Uint32Array.BYTES_PER_ELEMENT;

            // write float words
            f32view.set(a, byteOffset / Float32Array.BYTES_PER_ELEMENT);
            byteOffset += a.length * Float32Array.BYTES_PER_ELEMENT;
        }

        return new Float32Array(buffer);
    }

    private static mergeFloat32Arrays(arrays: ArrayBuffer[]): Float32Array {
        // Convert each ArrayBuffer to a Float32Array view and concatenate
        const views: Float32Array[] = new Array(arrays.length);
        let total = 0;

        for (let i = 0; i < arrays.length; ++i) {
            const v = new Float32Array(arrays[i]);
            views[i] = v;
            total += v.length;
        }

        const out = new Float32Array(total);
        let offset = 0;
        for (const v of views) {
            out.set(v, offset);
            offset += v.length;
        }

        return out;
    }

    private getPlacementData(generatedNfp: ArrayBuffer[]): Float32Array {
        const flat = PolygonPacker.mergeFloat32Arrays(generatedNfp);

        return this.#wasmNesting.wasm_packer_get_placement_data(flat);
    }

    private getPlacemehntResult(placements: ArrayBuffer[]): Uint8Array {
        const flat = PolygonPacker.mergeFloat32Arrays(placements);

        return this.#wasmNesting.wasm_packer_get_placement_result(flat);
    }
}
