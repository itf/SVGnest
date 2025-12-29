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
        const sizes: u16[] = [];
        const polygonData: f32[] = [];
        let size: usize = 0;

        for (let i = 0; i < allPolygons.length; ++i) {
            size = allPolygons[i].length;
            sizes.push(size as u16);

            for (let j = 0; j < size; ++j) {
                polygonData.push(allPolygons[i][j]);
            }
        }

        this.#wasmNesting.wasm_packer_init(this.serializeConfig(configuration), new Float32Array(polygonData), new Uint16Array(sizes));
        this.#isWorking = true;

        this.launchWorkers(displayCallback);

        this.#workerTimer = setInterval(() => {
            progressCallback(this.#progress);
        }, 100) as unknown as u32;
    }

    private onSpawn = (spawnCount: number): void => {
        this.#progress = spawnCount / this.#wasmNesting.wasm_packer_pair_count();
    };

    launchWorkers(displayCallback: DisplayCallback) {
        const serializedPairs = this.#wasmNesting.wasm_packer_get_pairs();
        const pairs = PolygonPacker.deserializePairs(serializedPairs);
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
        const placements = [this.getPlacementData(generatedNfp.map(nfp => new Float32Array(nfp))).buffer];

        this.#paralele.start(
            placements,
            (placements: ArrayBuffer[]) => this.onPlacement(placements, displayCallback),
            this.onError
        );
    }

    private onPlacement(placements: ArrayBuffer[], displayCallback: DisplayCallback): void {
        if (placements.length === 0) {
            return;
        }

        const placementResult = this.getPlacemehntResult(placements.map(data => new Float32Array(data)));
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

    private static deserializePairs(data: Float32Array): ArrayBuffer[] {
        let offset: usize = 0;
        let sliceIndex: usize = 1;
        let sizeBits: u32 = 0;
        let pairData: Float32Array = null;
        const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
        const pairs: ArrayBuffer[] = [];
        const countBits = view.getUint32(offset, true);

        offset += Float32Array.BYTES_PER_ELEMENT;

        for (let i = 0; i < countBits; ++i) {
            sizeBits = view.getUint32(offset, true);
            sliceIndex += 1;
            pairData = data.slice(sliceIndex, sliceIndex + sizeBits);
            sliceIndex += sizeBits;
            offset = sliceIndex * Float32Array.BYTES_PER_ELEMENT;

            pairs.push(pairData.buffer);
        }

        return pairs;
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

    private getPlacementData(generatedNfp: Float32Array[]): Float32Array {
        // Flatten the NFP arrays and build a sizes array to pass to WASM
        let totalSize = 0;
        for (const nfp of generatedNfp) {
            totalSize += nfp.length;
        }

        const flat = new Float32Array(totalSize);
        const sizes = new Uint16Array(generatedNfp.length);
        let offset: usize = 0;

        for (let i = 0; i < generatedNfp.length; ++i) {
            const nfp = generatedNfp[i];
            sizes[i] = nfp.length as u16;
            flat.set(nfp, offset);
            offset += nfp.length;
        }

        return this.#wasmNesting.wasm_packer_get_placement_data(flat, sizes);
    }

    private getPlacemehntResult(placements: Float32Array[]): Uint8Array {
        // Serialize Float32Array[] into a flat array
        // Format: count (u32 as f32) + [size (u32 as f32) + data] for each item
        let totalSize = 1; // count
        for (const placement of placements) {
            totalSize += 1 + placement.length; // size + data
        }

        const buffer = new Float32Array(totalSize);
        let offset = 0;

        // Write count as f32 (reinterpreted from u32)
        buffer[offset] = new Float32Array(new Uint32Array([placements.length]).buffer)[0];
        offset += 1;

        // Write each placement
        for (const placement of placements) {
            buffer[offset] = new Float32Array(new Uint32Array([placement.length]).buffer)[0];
            offset += 1;
            buffer.set(placement, offset);
            offset += placement.length;
        }

        return this.#wasmNesting.wasm_packer_get_placement_result(buffer);
    }
}
