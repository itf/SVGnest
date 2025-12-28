import {
    wasm_packer_init,
    wasm_packer_get_pairs,
    wasm_packer_get_placement_data,
    wasm_packer_get_placement_result,
    wasm_packer_stop,
    wasm_packer_pair_count,
    set_bits_u32
} from 'wasm-nesting';
import Parallel from './parallel';
import PlacementWrapper from './placement-wrapper';
import { DisplayCallback, f32, NestConfig, u16, u32, usize } from './types';

export default class PolygonPacker {
    #isWorking: boolean = false;

    #progress: f32 = 0;

    #workerTimer: u32 = 0;

    #paralele: Parallel = new Parallel();


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

        wasm_packer_init(PolygonPacker.serializeConfig(configuration), new Float32Array(polygonData), new Uint16Array(sizes));
        this.#isWorking = true;

        this.launchWorkers(displayCallback);

        this.#workerTimer = setInterval(() => {
            progressCallback(this.#progress);
        }, 100) as unknown as u32;
    }

    private onSpawn = (spawnCount: number): void => {
        this.#progress = spawnCount / wasm_packer_pair_count();
    };

    launchWorkers(displayCallback: DisplayCallback) {
        const serializedPairs = PolygonPacker.getPairs();
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
        const placements = [PolygonPacker.getPlacementData(generatedNfp.map(nfp => new Float32Array(nfp))).buffer];

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

        const placementResult = PolygonPacker.getPlacemehntResult(placements.map(data => new Float32Array(data)));
        const placementWrapper = new PlacementWrapper(placementResult.buffer);

        if (this.#isWorking) {
            displayCallback(placementWrapper);
            this.launchWorkers(displayCallback);
        }
    }

    public stop(isClean: boolean): void {
        this.#isWorking = false;

        if (this.#workerTimer) {
            clearInterval(this.#workerTimer);
            this.#workerTimer = 0;
        }

        this.#paralele.terminate();

        if (isClean) {
            wasm_packer_stop();
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

    private static serializeConfig(config: NestConfig): number {
        let result: number = 0;
    
        // Кодуємо значення в число
        result = set_bits_u32(result, config.curveTolerance * 10, 0, 4);
        result = set_bits_u32(result, config.spacing, 4, 5);
        result = set_bits_u32(result, config.rotations, 9, 5);
        result = set_bits_u32(result, config.populationSize, 14, 7);
        result = set_bits_u32(result, config.mutationRate, 21, 7);
        result = set_bits_u32(result, Number(config.useHoles), 28, 1);
    
        return result;
    }

    private static getPairs(): Float32Array {
        const result = wasm_packer_get_pairs();
        return new Float32Array(result.buffer, result.byteOffset, result.byteLength / Float32Array.BYTES_PER_ELEMENT);
    }

    private static getPlacementData(generatedNfp: Float32Array[]): Float32Array {
        // Serialize Float32Array[] into a flat array
        // Format: count (u32 as f32) + [size (u32 as f32) + data] for each item
        let totalSize = 1; // count
        for (const nfp of generatedNfp) {
            totalSize += 1 + nfp.length; // size + data
        }

        const buffer = new Float32Array(totalSize);
        let offset = 0;

        // Write count as f32 (reinterpreted from u32)
        buffer[offset] = new Float32Array(new Uint32Array([generatedNfp.length]).buffer)[0];
        offset += 1;

        // Write each NFP
        for (const nfp of generatedNfp) {
            buffer[offset] = new Float32Array(new Uint32Array([nfp.length]).buffer)[0];
            offset += 1;
            buffer.set(nfp, offset);
            offset += nfp.length;
        }

        const result = wasm_packer_get_placement_data(buffer);
        return new Float32Array(result.buffer, result.byteOffset, result.byteLength / Float32Array.BYTES_PER_ELEMENT);
    }

    private static getPlacemehntResult(placements: Float32Array[]): Uint8Array {
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

        return wasm_packer_get_placement_result(buffer);
    }
}
