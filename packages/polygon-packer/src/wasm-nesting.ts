import { MemSeg } from "./types";

export default class WasmNesting {
    #wasm: any;

    #heap: unknown[];

    #heapNext: number;

    #textDecoder: TextDecoder;

    #vecLen: number;

    #memSegs: MemSeg[];

    #isInitialized: boolean = false;

    constructor() {
        this.#heap = new Array(128).fill(undefined);

        this.#heap.push(undefined, null, true, false);

        this.#heapNext = this.#heap.length;

        this.#textDecoder =
            typeof TextDecoder !== 'undefined'
                ? new TextDecoder('utf-8', { ignoreBOM: true, fatal: true })
                : ({
                    decode: () => {
                        throw Error('TextDecoder not available');
                    }
                } as unknown as TextDecoder);

        this.#memSegs = new Array<MemSeg>(3).fill(null);
        this.#vecLen = 0;
    }

    public async init(bytes: ArrayBuffer): Promise<any> {
        if (this.#wasm !== undefined) {
            return;
        }

        const imports = this.getImports();

        const module = await WebAssembly.compile(bytes);
        const instance = await WebAssembly.instantiate(module, imports);

        this.#wasm = instance.exports;
        this.#memSegs.fill(null);

        this.#isInitialized = true;
    }

    public set_bits_u32(source: number, value: number, index: number, bit_count: number): number {
        const ret = this.#wasm.set_bits_u32(source, value, index, bit_count);
        return ret >>> 0;
    }

    public calculate_wasm(buffer: Float32Array): Float32Array {
        const ptr0 = this.passMem(buffer, this.#wasm.__wbindgen_export_1);
        const ret = this.#wasm.calculate_wasm(ptr0, this.#vecLen);

        return this.takeObject(ret) as Float32Array;
    }

    public calculate_chunk_wasm(buffer: Float32Array): Float32Array {
        const ptr0 = this.passMem(buffer, this.#wasm.__wbindgen_export_1);
        const ret = this.#wasm.calculate_chunk_wasm(ptr0, this.#vecLen);

        return this.takeObject(ret) as Float32Array;
    }

    public wasm_packer_init(configuration: number, polygon_data: Float32Array, sizes: Uint16Array): void {
        const ptr0 = this.passMem(polygon_data, this.#wasm.__wbindgen_export_1);
        const len0 = this.#vecLen;
        const ptr1 = this.passMem(sizes, this.#wasm.__wbindgen_export_1);
        const len1 = this.#vecLen;
        this.#wasm.wasm_packer_init(configuration, ptr0, len0, ptr1, len1);
    }

    public wasm_packer_get_pairs(chunkSize: number): Float32Array {
        const ret = this.#wasm.wasm_packer_get_pairs(chunkSize >>> 0);
        return this.takeObject(ret) as Float32Array;
    }

    public wasm_packer_get_placement_data(generated_nfp: Float32Array): Float32Array {
        const ptr0 = this.passMem(generated_nfp, this.#wasm.__wbindgen_export_1);
        const len0 = this.#vecLen;
        const ret = this.#wasm.wasm_packer_get_placement_data(ptr0, len0);
        return this.takeObject(ret) as Float32Array;
    }

    public wasm_packer_get_placement_result(placements: Float32Array): Uint8Array {
        const ptr0 = this.passMem(placements, this.#wasm.__wbindgen_export_1);
        const len0 = this.#vecLen;
        const ret = this.#wasm.wasm_packer_get_placement_result(ptr0, len0);
        return this.takeObject(ret) as Uint8Array;
    }

    public wasm_packer_stop(): void {
        this.#wasm.wasm_packer_stop();
    }

    public get isInitialized(): boolean {
        return this.#isInitialized;
    }

    private addHeapObject(obj: unknown): number {
        if (this.#heapNext === this.#heap.length) {
            this.#heap.push(this.#heap.length + 1);
        }
        const idx = this.#heapNext;
        this.#heapNext = this.#heap[idx] as number;

        this.#heap[idx] = obj;
        return idx;
    }

    private handleError(f: (...args: any[]) => any, args: unknown[]): any {
        try {
            return f.apply(this, args);
        } catch (e) {
            this.#wasm.__wbindgen_export_0(this.addHeapObject(e));
        }
    }

    private getMem(index: number): MemSeg {
        if (index > 2) {
            throw new Error('Unsupported memory segment index');
        }

        if (this.#memSegs[index] === null || this.#memSegs[index].byteLength === 0) {
            const ArrayType = WasmNesting.MemSegTypes[index];

            this.#memSegs[index] = new ArrayType(this.#wasm.memory.buffer);
        }

        return this.#memSegs[index];
    }

    private passMem(arg: MemSeg, malloc: (size: number, align: number) => number): number {
        const bytes = arg.BYTES_PER_ELEMENT;
        const ptr = malloc(arg.length * bytes, bytes) >>> 0;

        const memory: MemSeg = this.getMem(bytes >> 1);

        memory.set(arg, ptr / bytes);

        this.#vecLen = arg.length;

        return ptr;
    }

    private getStringFromWasm0(ptr: number, len: number): string {
        ptr = ptr >>> 0;
        return this.#textDecoder.decode(this.getMem(0).subarray(ptr, ptr + len));
    }

    private checkObject(idx: number, type: string): boolean {
        return typeof this.getObject(idx) === type;
    }

    private getObject<T = number>(idx: number): T {
        return this.#heap[idx] as T;
    }

    private dropObject(idx: number): void {
        if (idx < 132) {
            return;
        }

        this.#heap[idx] = this.#heapNext;
        this.#heapNext = idx;
    }

    private takeObject(idx: number): unknown {
        const ret = this.getObject(idx);
        this.dropObject(idx);

        return ret;
    }

    private isLikeNone(x: unknown): boolean {
        return x === undefined || x === null;
    }

    private addGlobalObject<T>(data: T): number {
        const formattedData = typeof data === 'undefined' ? null : data as T;

        return this.isLikeNone(formattedData) ? 0 : this.addHeapObject(formattedData);
    }

    private getImports() {
        return {
            wbg: {
                __wbg_buffer_609cc3eee51ed158: (arg0: number): number => {
                    const ret = this.getObject<Uint8Array>(arg0).buffer;

                    return this.addHeapObject(ret);
                },
                __wbg_call_672a4d21634d4a24: (...args: unknown[]): number =>
                    this.handleError((arg0: number, arg1: number): number => {
                        const ret = this.getObject<Function>(arg0).call(this.getObject(arg1));

                        return this.addHeapObject(ret);
                    }, args),
                __wbg_call_7cccdd69e0791ae2: (...args: unknown[]): number => {
                    return this.handleError((arg0: number, arg1: number, arg2: number): number => {
                        const ret = this.getObject<Function>(arg0).call(this.getObject(arg1), this.getObject(arg2));

                        return this.addHeapObject(ret);
                    }, args);
                },
                __wbg_crypto_574e78ad8b13b65f: (arg0: number): number => {
                    const ret = this.getObject<Window>(arg0).crypto;
                    return this.addHeapObject(ret);
                },
                __wbg_getRandomValues_b8f5dbd5f3995a9e: (...args: unknown[]) =>
                    this.handleError((arg0: number, arg1: number) => {
                        this.getObject<Crypto>(arg0).getRandomValues(this.getObject<ArrayBufferView>(arg1));
                    }, args),
                __wbg_length_3b4f022188ae8db6: (arg0: number): number => this.getObject<Uint8Array>(arg0).length,
                __wbg_length_a446193dc22c12f8: (arg0: number): number => this.getObject<Uint8Array>(arg0).length,
                __wbg_msCrypto_a61aeb35a24c1329: (arg0: number): number => {
                    const ret = this.getObject<Window>(arg0).msCrypto;
                    return this.addHeapObject(ret);
                },
                __wbg_new_a12002a7f91c75be: (arg0: number): number => {
                    const ret = new Uint8Array(this.getObject<ArrayLike<number>>(arg0));
                    return this.addHeapObject(ret);
                },
                __wbg_newnoargs_105ed471475aaf50: (arg0: number, arg1: number): number => {
                    const ret = new Function(this.getStringFromWasm0(arg0, arg1));
                    return this.addHeapObject(ret);
                },
                __wbg_newwithbyteoffsetandlength_d97e637ebe145a9a: (arg0: number, arg1: number, arg2: number) => {
                    const ret = new Uint8Array(this.getObject<ArrayBuffer>(arg0), arg1 >>> 0, arg2 >>> 0);
                    return this.addHeapObject(ret);
                },
                __wbg_newwithbyteoffsetandlength_e6b7e69acd4c7354: (arg0: number, arg1: number, arg2: number) => {
                    const ret = new Float32Array(this.getObject<ArrayBuffer>(arg0), arg1 >>> 0, arg2 >>> 0);
                    return this.addHeapObject(ret);
                },
                __wbg_newwithlength_5a5efe313cfd59f1: (arg0: number) =>
                    this.addHeapObject(new Float32Array(arg0 >>> 0)),
                __wbg_newwithlength_a381634e90c276d4: (arg0: number) =>
                    this.addHeapObject(new Uint8Array(arg0 >>> 0)),
                __wbg_node_905d3e251edff8a2: (arg0: number) => {
                    const ret = this.getObject<NodeJS.ProcessVersions>(arg0).node;
                    return this.addHeapObject(ret);
                },
                __wbg_process_dc0fbacc7c1c06f7: (arg0: number) => {
                    const ret = this.getObject<typeof globalThis>(arg0).process;
                    return this.addHeapObject(ret);
                },
                __wbg_randomFillSync_ac0988aba3254290: (...args: unknown[]) => this.handleError((arg0: number, arg1: number): void => {
                    this.getObject<Sign>(arg0).randomFillSync(this.takeObject(arg1));
                }, args),
                __wbg_require_60cc747a6bc5215a: (...args: unknown[]) => {
                    return this.handleError((): number => {
                        const ret = module.require;
                        return this.addHeapObject(ret);
                    }, args);
                },
                __wbg_set_10bad9bee0e9c58b: (arg0: number, arg1: number, arg2: number) => {
                    this.getObject<Uint8Array>(arg0).set(this.getObject<ArrayLike<number>>(arg1), arg2 >>> 0);
                },
                __wbg_set_65595bdd868b3009: (arg0: number, arg1: number, arg2: number) => {
                    this.getObject<Uint8Array>(arg0).set(this.getObject<ArrayLike<number>>(arg1), arg2 >>> 0);
                },
                __wbg_static_accessor_GLOBAL_88a902d13a557d07: (): number => this.addGlobalObject(global),
                __wbg_static_accessor_GLOBAL_THIS_56578be7e9f832b0: (): number => this.addGlobalObject(globalThis),
                __wbg_static_accessor_SELF_37c5d418e4bf5819: (): number => this.addGlobalObject(self),
                __wbg_static_accessor_WINDOW_5de37043a91a9c40: (): number => this.addGlobalObject(window),
                __wbg_subarray_aa9065fa9dc5df96: (arg0: number, arg1: number, arg2: number): number => {
                    const ret = this.getObject<Uint8Array>(arg0).subarray(arg1 >>> 0, arg2 >>> 0);
                    return this.addHeapObject(ret);
                },
                __wbg_versions_c01dfd4722a88165: (arg0: number) => {
                    const ret = this.getObject<{ versions: number }>(arg0).versions;
                    return this.addHeapObject(ret);
                },
                __wbindgen_is_function: (arg0: number) => this.checkObject(arg0, 'function'),
                __wbindgen_is_object: (arg0: number): boolean =>
                    this.checkObject(arg0, 'object') && this.getObject(arg0) !== null,
                __wbindgen_is_string: (arg0: number): boolean => this.checkObject(arg0, 'string'),
                __wbindgen_is_undefined: (arg0: number): boolean => this.checkObject(arg0, 'undefined'),
                __wbindgen_memory: () => this.addHeapObject(this.#wasm.memory),
                __wbindgen_object_clone_ref: (arg0: number) => {
                    const ret = this.getObject(arg0);
                    return this.addHeapObject(ret);
                },
                __wbindgen_object_drop_ref: (arg0: number): void => {
                    this.takeObject(arg0);
                },
                __wbindgen_string_new: (arg0: number, arg1: number): number => {
                    const ret = this.getStringFromWasm0(arg0, arg1);
                    return this.addHeapObject(ret);
                },
                __wbindgen_throw: (arg0: number, arg1: number): never => {
                    throw new Error(this.getStringFromWasm0(arg0, arg1));
                }
            }
        };
    }

    private static MemSegTypes = [Uint8Array, Uint16Array, Float32Array];
}
