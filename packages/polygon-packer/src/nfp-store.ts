import { nfp_generate_pair, nfp_generate_placement_data } from 'wasm-nesting';
import { NFPCache, i32, u16, u32, u8, usize, f32 } from './types';
import PolygonNode from './polygon-node';

export default class NFPStore {
    #nfpCache: NFPCache = new Map<u32, Float32Array>();

    #nfpPairs: Float32Array[] = [];

    #sources: i32[] = [];

    #angleSplit: u8 = 0;

    #configCompressed: u32 = 0;

    static #instance: NFPStore;

    private constructor() { }

    public static get instance(): NFPStore {
        if (!NFPStore.#instance) {
            NFPStore.#instance = new NFPStore();
        }

        return NFPStore.#instance;
    }

    public init(nodes: PolygonNode[], sources: i32[], rotations: u16[]): void {
        for (let i = 0; i < sources.length; ++i) {
            const node = nodes[sources[i]];
            node.rotation = rotations[i];
        }
    }

    public update(nfps: Float32Array[]): void {
        const nfpCount: usize = nfps.length;

        if (nfpCount !== 0) {
            let view: DataView;

            for (let i = 0; i < nfpCount; ++i) {
                view = new DataView(nfps[i].buffer);

                if (nfps[i].byteLength > Float64Array.BYTES_PER_ELEMENT << 1) {
                    // a null nfp means the nfp could not be generated, either because the parts simply don't
                    // fit or an error in the nfp algo
                    this.#nfpCache.set(view.getUint32(0, true), nfps[i]);
                }
            }
        }
    }

    private updateCache(node1: PolygonNode, node2: PolygonNode, inside: boolean, newCache: NFPCache): void {
        const key: u32 = PolygonNode.generateNFPCacheKey(this.#angleSplit, inside, node1, node2);

        if (!this.#nfpCache.has(key)) {
            const pairData = NFPStore.generatePair(key, node1, node2, this.#configCompressed);

            this.#nfpPairs.push(pairData);
        } else {
            newCache.set(key, this.#nfpCache.get(key));
        }
    }

    public clean(): void {
        this.#nfpCache.clear();
        this.#nfpPairs = [];
        this.#sources = [];
        this.#phenotypeSource = 0;
        this.#angleSplit = 0;
        this.#configCompressed = 0;
    }

    public getPlacementData(inputNodes: PolygonNode[], area: f32): Float32Array {
        const inputNodesArray = this.#sources.map(source => inputNodes[source]);

        return NFPStore.generatePlacementData(this.nfpBuffer, this.#configCompressed, inputNodesArray, area);
    }

    public get nfpBuffer(): Float32Array {
        return NFPStore.serializeMapToBuffer(this.#nfpCache);
    }


    public static generatePair(key: u32, node1: PolygonNode, node2: PolygonNode, config: u32): Float32Array {
        const nodes = [node1, node2];
        const serialized = PolygonNode.serialize(nodes);
        const nodesUint8 = new Float32Array(serialized);

        return nfp_generate_pair(key, config, nodesUint8);
    }

    public static generatePlacementData(nfpBuffer: Float32Array, config: u32, inputNodes: PolygonNode[], area: f32): Float32Array {
        const serialized = PolygonNode.serialize(inputNodes);
        const nodesFloat32 = new Float32Array(serialized);

        return nfp_generate_placement_data(nfpBuffer, config, nodesFloat32, area);
    }

    public static serializeMapToBuffer(map: NFPCache): Float32Array {
        // Calculate total size in f32 elements: 2 per entry (key + length) + data
        const totalSize: number = Array.from(map.values()).reduce(
            (acc, buffer) => acc + 2 + buffer.length,
            0
        );
        const resultBuffer = new Float32Array(totalSize);
        const view: DataView = new DataView(resultBuffer.buffer);
        const entries = Array.from(map.entries());
        let offset: number = 0;

        for (const [key, buffer] of entries) {
            // Write key as u32 reinterpreted as f32
            view.setUint32(offset * 4, key);
            offset += 1;

            // Write length as u32 reinterpreted as f32
            view.setUint32(offset * 4, buffer.byteLength);
            offset += 1;

            // Copy Float32Array data directly
            resultBuffer.set(buffer, offset);
            offset += buffer.length;
        }

        return resultBuffer;
    }
}
