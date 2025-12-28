import {
    wasm_packer_init,
    wasm_packer_get_pairs,
    wasm_packer_get_placement_data,
    wasm_packer_get_placement_result,
    wasm_packer_stop,
    wasm_packer_pair_count
} from 'wasm-nesting';

export default class WasmPackerWasm {
    static #instance: WasmPackerWasm;

    private constructor() { }

    public static get instance(): WasmPackerWasm {
        if (!WasmPackerWasm.#instance) {
            WasmPackerWasm.#instance = new WasmPackerWasm();
        }

        return WasmPackerWasm.#instance;
    }

    public init(
        configuration: number,
        polygonData: Float32Array,
        sizes: Uint16Array,
    ): void {
        wasm_packer_init(configuration, polygonData, sizes);
    }

    public getPairs(): Float32Array {
        const result = wasm_packer_get_pairs();
        return new Float32Array(result.buffer, result.byteOffset, result.byteLength / Float32Array.BYTES_PER_ELEMENT);
    }

    public getPlacementData(generatedNfp: Float32Array[]): Float32Array {
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

    public getPlacemehntResult(placements: Float32Array[]): Uint8Array {
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

    public stop(): void {
        wasm_packer_stop();
    }

    public get pairCount(): number {
        return wasm_packer_pair_count();
    }
}
