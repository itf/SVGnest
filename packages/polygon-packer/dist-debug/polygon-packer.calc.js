/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol */


function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __classPrivateFieldGet(receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}

function __classPrivateFieldSet(receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

/**
 * Internal recursive function to deserialize source items from binary data.
 * @param view - DataView of the binary data
 * @param offset - Current byte offset in the view
 * @param count - Number of items to deserialize
 * @returns Deserialized children and next offset position
 * @internal
 */
function deserializeSourceItemsInternal(view, offset, count) {
    const children = [];
    let currentOffset = offset;
    for (let i = 0; i < count; ++i) {
        // Read source (u16)
        const source = view.getUint16(currentOffset, true);
        currentOffset += Uint16Array.BYTES_PER_ELEMENT;
        // Read children count (u16)
        const childrenCount = view.getUint16(currentOffset, true);
        currentOffset += Uint16Array.BYTES_PER_ELEMENT;
        // Recursively deserialize children
        const childrenResult = deserializeSourceItemsInternal(view, currentOffset, childrenCount);
        children.push({
            source,
            children: childrenResult.children
        });
        currentOffset = childrenResult.nextOffset;
    }
    return { children, nextOffset: currentOffset };
}
/**
 * Deserializes source items from binary data.
 *
 * Converts packed binary representation of polygon tree structure
 * into a JavaScript object hierarchy.
 *
 * @param data - Binary data containing serialized source items
 * @returns Array of deserialized source items with nested children
 */
function deserializeSourceItems(data) {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    // Read items count
    const count = view.getUint16(0, true);
    // Deserialize items
    const result = deserializeSourceItemsInternal(view, Uint16Array.BYTES_PER_ELEMENT, count);
    return result.children;
}
/**
 * Flattens a tree structure of polygons into separate arrays of sources and holes.
 *
 * Traverses the polygon tree recursively, alternating between treating nodes
 * as sources and holes based on nesting depth.
 *
 * @param nodes - Array of source items to flatten
 * @param hole - Whether current level represents holes
 * @param result - Accumulator object for flattened data
 * @returns Flattened data with separate source and hole arrays
 */
function flattenTree(nodes, hole, result = { sources: [], holes: [] }) {
    const nodeCount = nodes.length;
    let node;
    let children;
    for (let i = 0; i < nodeCount; ++i) {
        node = nodes[i];
        if (hole) {
            result.holes.push(node.source);
        }
        children = node.children;
        result.sources.push(node.source);
        if (children && children.length > 0) {
            flattenTree(children, !hole, result);
        }
    }
    return result;
}
/**
 * Calculates byte offset for an element in a Float32Array.
 * @param array - The Float32Array
 * @param index - Element index
 * @returns Byte offset of the element
 * @internal
 */
function getByteOffset(array, index) {
    return (array.byteOffset >>> 0) + index * Float32Array.BYTES_PER_ELEMENT;
}
function readUint32FromF32(array, index) {
    const byteOffset = getByteOffset(array, index);
    const view = new DataView(array.buffer);
    return view.getUint32(byteOffset, true);
}
/**
 * Joins multiple Float32Arrays into a single array with size prefixes.
 *
 * Each array is prefixed with its size encoded as a u32 in little-endian format.
 * This allows the arrays to be split later using {@link splitFloat32Arrays}.
 *
 * @param arrays - Array of Float32Arrays to join
 * @returns Single Float32Array containing all arrays with size prefixes
 * @see {@link splitFloat32Arrays}
 */
function joinFloat32Arrays(arrays) {
    // Build a flat buffer where each array is prefixed by its size encoded as u32 bits (little-endian)
    const totalFloats = arrays.reduce((sum, a) => sum + a.length, 0);
    /**
     * Reads a 32-bit unsigned integer from a Float32Array at the specified index.
     *
     * Interprets the bit pattern of a float as an unsigned integer.
     * Useful for reading metadata encoded in float arrays.
     *
     * @param array - Float32Array containing the data
     * @param index - Index of the element to read
     * @returns The value interpreted as a 32-bit unsigned integer
     */
    const totalElements = totalFloats + arrays.length; // sizes + floats
    const buffer = new ArrayBuffer(totalElements * Float32Array.BYTES_PER_ELEMENT);
    arrays.reduce((acc, a) => {
        // write size as u32 bits (little-endian)
        acc.dv.setUint32(acc.byteOffset * Uint32Array.BYTES_PER_ELEMENT, a.length >>> 0, true);
        acc.byteOffset += 1;
        // write float words
        acc.f32view.set(a, acc.byteOffset);
        acc.byteOffset += a.length;
        return acc;
    }, { dv: new DataView(buffer), f32view: new Float32Array(buffer), byteOffset: 0 });
    return new Float32Array(buffer);
}
/**
 * Merges multiple ArrayBuffers into a single Float32Array.
 *
 * Efficiently concatenates ArrayBuffers by pre-allocating the exact size needed
 * and using typed array set operations for fast copying.
 *
 * @param arrays - Array of ArrayBuffers to merge
 * @returns Float32Array containing all merged data
 */
function mergeFloat32Arrays(arrays) {
    const total = arrays.reduce((sum, arr) => sum + arr.byteLength / Float32Array.BYTES_PER_ELEMENT, 0);
    return arrays.reduce((acc, arr) => {
        const view = new Float32Array(arr);
        acc.result.set(view, acc.offset);
        acc.offset += view.length;
        return acc;
    }, { result: new Float32Array(total), offset: 0 }).result;
}
function splitFloat32Arrays(flat) {
    /**
     * Splits a joined Float32Array back into individual arrays.
     *
     * Reads size prefixes and extracts the original arrays that were
     * joined using {@link joinFloat32Arrays}.
     *
     * @param flat - Joined Float32Array with size prefixes
     * @returns Array of separate Float32Arrays
     * @see {@link joinFloat32Arrays}
     */
    const result = [];
    const view = new DataView(flat.buffer, flat.byteOffset, flat.byteLength);
    let byteOffset = 0;
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

var _PlacementWrapper_buffer, _PlacementWrapper_view, _PlacementWrapper_placement, _PlacementWrapper_memSeg, _PlacementWrapper_offset, _PlacementWrapper_size, _PlacementWrapper_pointData, _PlacementWrapper_pointOffset, _PlacementWrapper_placementCount, _PlacementWrapper_angleSplit, _PlacementWrapper_sources, _PlacementWrapper_sourceMap;
/**
 * Wrapper for accessing polygon placement results from packed binary data.
 *
 * Provides a high-level interface to read placement information including
 * polygon positions, rotations, bounds, and hierarchy from the binary buffer
 * returned by the WASM packing algorithm.
 *
 * @example
 * ```typescript
 * const wrapper = new PlacementWrapper(resultBuffer);
 * console.log(`Placed ${wrapper.numPlacedParts}/${wrapper.numParts} parts`);
 *
 * for (let i = 0; i < wrapper.placementCount; i++) {
 *   wrapper.bindPlacement(i);
 *   for (let j = 0; j < wrapper.size; j++) {
 *     const sourceId = wrapper.bindData(j);
 *     console.log(`Part ${sourceId} at (${wrapper.x}, ${wrapper.y}) rotation ${wrapper.rotation}°`);
 *   }
 * }
 * ```
 */
class PlacementWrapper {
    constructor(buffer) {
        _PlacementWrapper_buffer.set(this, void 0);
        _PlacementWrapper_view.set(this, void 0);
        _PlacementWrapper_placement.set(this, void 0);
        _PlacementWrapper_memSeg.set(this, void 0);
        _PlacementWrapper_offset.set(this, void 0);
        _PlacementWrapper_size.set(this, void 0);
        _PlacementWrapper_pointData.set(this, void 0);
        _PlacementWrapper_pointOffset.set(this, void 0);
        _PlacementWrapper_placementCount.set(this, void 0);
        _PlacementWrapper_angleSplit.set(this, void 0);
        _PlacementWrapper_sources.set(this, void 0);
        _PlacementWrapper_sourceMap.set(this, void 0);
        __classPrivateFieldSet(this, _PlacementWrapper_buffer, buffer, "f");
        __classPrivateFieldSet(this, _PlacementWrapper_view, new DataView(__classPrivateFieldGet(this, _PlacementWrapper_buffer, "f")), "f");
        __classPrivateFieldSet(this, _PlacementWrapper_memSeg, this.placementsData, "f");
        __classPrivateFieldSet(this, _PlacementWrapper_angleSplit, this.angleSplit, "f");
        __classPrivateFieldSet(this, _PlacementWrapper_placementCount, __classPrivateFieldGet(this, _PlacementWrapper_memSeg, "f")[1], "f");
        __classPrivateFieldSet(this, _PlacementWrapper_memSeg, __classPrivateFieldGet(this, _PlacementWrapper_memSeg, "f"), "f");
        __classPrivateFieldSet(this, _PlacementWrapper_sources, this.sources, "f");
        __classPrivateFieldSet(this, _PlacementWrapper_sourceMap, new Map(__classPrivateFieldGet(this, _PlacementWrapper_sources, "f").flatMap(s => [
            [s.source, s],
            ...s.children.map(c => [c.source, c])
        ])), "f");
        __classPrivateFieldSet(this, _PlacementWrapper_placement, 0, "f");
        __classPrivateFieldSet(this, _PlacementWrapper_offset, 0, "f");
        __classPrivateFieldSet(this, _PlacementWrapper_size, 0, "f");
        __classPrivateFieldSet(this, _PlacementWrapper_pointData, 0, "f");
        __classPrivateFieldSet(this, _PlacementWrapper_pointOffset, 0, "f");
    }
    /**
     * Binds to a specific placement in the results to access its data.
     *
     * Must be called before accessing placement-specific properties like
     * {@link offset}, {@link size}, or {@link bindData}.
     *
     * @param index - Zero-based placement index (0 to {@link placementCount} - 1)
     */
    bindPlacement(index) {
        __classPrivateFieldSet(this, _PlacementWrapper_placement, readUint32FromF32(__classPrivateFieldGet(this, _PlacementWrapper_memSeg, "f"), 2 + index), "f");
        __classPrivateFieldSet(this, _PlacementWrapper_offset, __classPrivateFieldGet(this, _PlacementWrapper_placement, "f") >>> 16, "f");
        __classPrivateFieldSet(this, _PlacementWrapper_size, __classPrivateFieldGet(this, _PlacementWrapper_placement, "f") & ((1 << 16) - 1), "f");
    }
    /**
     * Binds to a specific polygon within the current placement.
     *
     * After calling, properties like {@link id}, {@link rotation}, {@link x}, {@link y},
     * and {@link flattnedChildren} reflect data for this specific polygon.
     *
     * @param index - Zero-based polygon index within the current placement (0 to {@link size} - 1)
     * @returns The source ID of the bound polygon
     */
    bindData(index) {
        var _a;
        __classPrivateFieldSet(this, _PlacementWrapper_pointData, readUint32FromF32(__classPrivateFieldGet(this, _PlacementWrapper_memSeg, "f"), __classPrivateFieldGet(this, _PlacementWrapper_offset, "f") + index), "f");
        __classPrivateFieldSet(this, _PlacementWrapper_pointOffset, __classPrivateFieldGet(this, _PlacementWrapper_offset, "f") + __classPrivateFieldGet(this, _PlacementWrapper_size, "f") + (index << 1), "f");
        return ((_a = __classPrivateFieldGet(this, _PlacementWrapper_sourceMap, "f").get(this.id)) !== null && _a !== void 0 ? _a : __classPrivateFieldGet(this, _PlacementWrapper_sources, "f")[0]).source;
    }
    /**
     * Gets the flattened children (holes) of the currently bound polygon.
     *
     * Returns a flattened representation of nested polygon children,
     * useful for rendering holes within a parent polygon.
     *
     * @returns Flattened children data, or `null` if the polygon has no children
     */
    get flattnedChildren() {
        const source = __classPrivateFieldGet(this, _PlacementWrapper_sourceMap, "f").get(this.id);
        return source && source.children.length ? flattenTree(source.children, true) : null;
    }
    /**
     * Gets the total number of placements in the result.
     * @returns Number of placements
     */
    get placementCount() {
        return __classPrivateFieldGet(this, _PlacementWrapper_placementCount, "f");
    }
    /**
     * Gets the offset of the currently bound placement in the data array.
     * @returns Placement offset
     * @internal
     */
    get offset() {
        return __classPrivateFieldGet(this, _PlacementWrapper_offset, "f");
    }
    /**
     * Gets the number of polygons in the currently bound placement.
     * @returns Number of polygons in current placement
     */
    get size() {
        return __classPrivateFieldGet(this, _PlacementWrapper_size, "f");
    }
    /**
     * Gets the polygon ID of the currently bound polygon.
     * @returns Polygon ID
     */
    get id() {
        return __classPrivateFieldGet(this, _PlacementWrapper_pointData, "f") >>> 16;
    }
    /**
     * Gets the rotation angle in degrees of the currently bound polygon.
     * @returns Rotation angle (0-360 degrees)
     */
    get rotation() {
        return Math.round(((__classPrivateFieldGet(this, _PlacementWrapper_pointData, "f") & ((1 << 16) - 1)) * 360) / __classPrivateFieldGet(this, _PlacementWrapper_angleSplit, "f"));
    }
    /**
     * Gets the X coordinate of the currently bound polygon.
     * @returns X position
     */
    get x() {
        return __classPrivateFieldGet(this, _PlacementWrapper_memSeg, "f")[__classPrivateFieldGet(this, _PlacementWrapper_pointOffset, "f")];
    }
    /**
     * Gets the Y coordinate of the currently bound polygon.
     * @returns Y position
     */
    get y() {
        return __classPrivateFieldGet(this, _PlacementWrapper_memSeg, "f")[__classPrivateFieldGet(this, _PlacementWrapper_pointOffset, "f") + 1];
    }
    /**
     * Gets the percentage of polygons successfully placed (0-1).
     * @returns Placement success rate
     */
    get placePercentage() {
        return __classPrivateFieldGet(this, _PlacementWrapper_view, "f").getFloat32(0, true);
    }
    /**
     * Gets the number of parts that were successfully placed.
     * @returns Number of placed parts
     */
    get numPlacedParts() {
        return __classPrivateFieldGet(this, _PlacementWrapper_view, "f").getUint16(4, true);
    }
    /**
     * Gets the total number of parts that were attempted to be placed.
     * @returns Total number of parts
     */
    get numParts() {
        return __classPrivateFieldGet(this, _PlacementWrapper_view, "f").getUint16(6, true);
    }
    /**
     * Gets the angle quantization value used for rotation calculations.
     * @returns Angle split value
     * @internal
     */
    get angleSplit() {
        return __classPrivateFieldGet(this, _PlacementWrapper_view, "f").getUint8(8);
    }
    /**
     * Checks if the packing algorithm produced a valid result.
     * @returns `true` if results are available, `false` otherwise
     */
    get hasResult() {
        return __classPrivateFieldGet(this, _PlacementWrapper_view, "f").getUint8(9) === 1;
    }
    /**
     * Gets the X coordinate of the bounding box for all placed polygons.
     * @returns Bounding box X position
     */
    get boundsX() {
        return __classPrivateFieldGet(this, _PlacementWrapper_view, "f").getFloat32(10, true);
    }
    /**
     * Gets the Y coordinate of the bounding box for all placed polygons.
     * @returns Bounding box Y position
     */
    get boundsY() {
        return __classPrivateFieldGet(this, _PlacementWrapper_view, "f").getFloat32(14, true);
    }
    /**
     * Gets the width of the bounding box for all placed polygons.
     * @returns Bounding box width
     */
    get boundsWidth() {
        return __classPrivateFieldGet(this, _PlacementWrapper_view, "f").getFloat32(18, true);
    }
    /**
     * Gets the height of the bounding box for all placed polygons.
     * @returns Bounding box height
     */
    get boundsHeight() {
        return __classPrivateFieldGet(this, _PlacementWrapper_view, "f").getFloat32(22, true);
    }
    /**
     * Gets the hierarchical source polygon tree.
     *
     * Deserializes the polygon hierarchy from the binary buffer,
     * including parent-child relationships for holes.
     *
     * @returns Array of source items with nested children
     */
    get sources() {
        // Buffer structure:
        // 0-4: placePercentage (f32)
        // 4-6: numPlacedParts (u16)
        // 6-8: numParts (u16)
        // 8-9: angleSplit (u8)
        // 9-10: hasResult (u8)
        // 10-14: boundsX (f32)
        // 14-18: boundsY (f32)
        // 18-22: boundsWidth (f32)
        // 22-26: boundsHeight (f32)
        // 26-30: sourcesSize (u32)
        // 30-34: placementsDataSize (u32)
        // 34+: serialized sources
        const sourcesSize = __classPrivateFieldGet(this, _PlacementWrapper_view, "f").getUint32(26, true);
        if (sourcesSize === 0) {
            return [];
        }
        // Sources segment starts at offset 34
        const sourcesData = new Uint8Array(__classPrivateFieldGet(this, _PlacementWrapper_buffer, "f"), 34, sourcesSize);
        return deserializeSourceItems(sourcesData);
    }
    /**
     * Gets the raw placements data as a Float32Array.
     *
     * Contains encoded placement information including positions,
     * rotations, and polygon IDs.
     *
     * @returns Float32Array view of placements data
     * @internal
     */
    get placementsData() {
        // Buffer structure:
        // 26-30: sourcesSize (u32)
        // 30-34: placementsDataSize (u32)
        // 34+sourcesSize: placements data
        const sourcesSize = __classPrivateFieldGet(this, _PlacementWrapper_view, "f").getUint32(26, true);
        const placementsDataSize = __classPrivateFieldGet(this, _PlacementWrapper_view, "f").getUint32(30, true);
        if (placementsDataSize === 0) {
            return new Float32Array(0);
        }
        // Placements data starts after sources segment
        const placementsOffset = 34 + sourcesSize;
        // Create Float32Array view of the placements data
        return new Float32Array(__classPrivateFieldGet(this, _PlacementWrapper_buffer, "f"), placementsOffset, placementsDataSize / Float32Array.BYTES_PER_ELEMENT);
    }
}
_PlacementWrapper_buffer = new WeakMap(), _PlacementWrapper_view = new WeakMap(), _PlacementWrapper_placement = new WeakMap(), _PlacementWrapper_memSeg = new WeakMap(), _PlacementWrapper_offset = new WeakMap(), _PlacementWrapper_size = new WeakMap(), _PlacementWrapper_pointData = new WeakMap(), _PlacementWrapper_pointOffset = new WeakMap(), _PlacementWrapper_placementCount = new WeakMap(), _PlacementWrapper_angleSplit = new WeakMap(), _PlacementWrapper_sources = new WeakMap(), _PlacementWrapper_sourceMap = new WeakMap();

var _WasmNesting_instances, _WasmNesting_wasm, _WasmNesting_heap, _WasmNesting_heapNext, _WasmNesting_textDecoder, _WasmNesting_vecLen, _WasmNesting_memSegs, _WasmNesting_isInitialized, _WasmNesting_addHeapObject, _WasmNesting_handleError, _WasmNesting_getMem, _WasmNesting_passMem, _WasmNesting_getString, _WasmNesting_checkObject, _WasmNesting_getObject, _WasmNesting_dropObject, _WasmNesting_takeObject, _WasmNesting_isLikeNone, _WasmNesting_addGlobalObject, _WasmNesting_getImports, _WasmNesting_serializeConfig;
const MEM_SEG_TYPES = [Uint8Array, Uint16Array, Float32Array];
class WasmNesting {
    constructor() {
        _WasmNesting_instances.add(this);
        _WasmNesting_wasm.set(this, void 0);
        _WasmNesting_heap.set(this, void 0);
        _WasmNesting_heapNext.set(this, void 0);
        _WasmNesting_textDecoder.set(this, void 0);
        _WasmNesting_vecLen.set(this, void 0);
        _WasmNesting_memSegs.set(this, void 0);
        _WasmNesting_isInitialized.set(this, false);
        __classPrivateFieldSet(this, _WasmNesting_heap, new Array(128).fill(undefined), "f");
        __classPrivateFieldGet(this, _WasmNesting_heap, "f").push(undefined, null, true, false);
        __classPrivateFieldSet(this, _WasmNesting_heapNext, __classPrivateFieldGet(this, _WasmNesting_heap, "f").length, "f");
        __classPrivateFieldSet(this, _WasmNesting_textDecoder, typeof TextDecoder !== 'undefined'
            ? new TextDecoder('utf-8', { ignoreBOM: true, fatal: true })
            : {
                decode: () => {
                    throw Error('TextDecoder not available');
                }
            }, "f");
        __classPrivateFieldSet(this, _WasmNesting_memSegs, new Array(3).fill(null), "f");
        __classPrivateFieldSet(this, _WasmNesting_vecLen, 0, "f");
    }
    initBuffer(bytes) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const imports = __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_getImports).call(this);
            const module = yield WebAssembly.compile(bytes);
            const instance = yield WebAssembly.instantiate(module, imports);
            __classPrivateFieldSet(this, _WasmNesting_wasm, instance.exports, "f");
            (_b = (_a = __classPrivateFieldGet(this, _WasmNesting_wasm, "f")).__wbindgen_start) === null || _b === void 0 ? void 0 : _b.call(_a);
            __classPrivateFieldGet(this, _WasmNesting_memSegs, "f").fill(null);
            __classPrivateFieldSet(this, _WasmNesting_isInitialized, true, "f");
        });
    }
    setBits(source, value, index, bit_count) {
        const ret = __classPrivateFieldGet(this, _WasmNesting_wasm, "f").set_bits_u32(source, value, index, bit_count);
        return ret >>> 0;
    }
    calculate(buffer) {
        const ptr0 = __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_passMem).call(this, buffer, __classPrivateFieldGet(this, _WasmNesting_wasm, "f").__wbindgen_export_2);
        const ret = __classPrivateFieldGet(this, _WasmNesting_wasm, "f").calculate_chunk_wasm(ptr0, __classPrivateFieldGet(this, _WasmNesting_vecLen, "f"));
        return __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_takeObject).call(this, ret);
    }
    init(configuration, polygons) {
        const polygon_data = joinFloat32Arrays(polygons);
        const config = __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_serializeConfig).call(this, configuration);
        const ptr0 = __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_passMem).call(this, polygon_data, __classPrivateFieldGet(this, _WasmNesting_wasm, "f").__wbindgen_export_2);
        const len0 = __classPrivateFieldGet(this, _WasmNesting_vecLen, "f");
        __classPrivateFieldGet(this, _WasmNesting_wasm, "f").wasm_packer_init(config, ptr0, len0);
    }
    nest() {
        const ret = __classPrivateFieldGet(this, _WasmNesting_wasm, "f").wasm_nest();
        const result = __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_takeObject).call(this, ret);
        if (result.length < 34) {
            return null;
        }
        return new PlacementWrapper(result.buffer);
    }
    getPairs(chunkSize) {
        const ret = __classPrivateFieldGet(this, _WasmNesting_wasm, "f").wasm_packer_get_pairs(chunkSize >>> 0);
        const result = __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_takeObject).call(this, ret);
        return splitFloat32Arrays(result);
    }
    getPlacementData(generatedNfp) {
        const generated_nfp = mergeFloat32Arrays(generatedNfp);
        const ptr0 = __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_passMem).call(this, generated_nfp, __classPrivateFieldGet(this, _WasmNesting_wasm, "f").__wbindgen_export_2);
        const len0 = __classPrivateFieldGet(this, _WasmNesting_vecLen, "f");
        const ret = __classPrivateFieldGet(this, _WasmNesting_wasm, "f").wasm_packer_get_placement_data(ptr0, len0);
        return __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_takeObject).call(this, ret);
    }
    getPlacementResult(placements) {
        const placements_f32 = mergeFloat32Arrays(placements);
        const ptr0 = __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_passMem).call(this, placements_f32, __classPrivateFieldGet(this, _WasmNesting_wasm, "f").__wbindgen_export_2);
        const len0 = __classPrivateFieldGet(this, _WasmNesting_vecLen, "f");
        const ret = __classPrivateFieldGet(this, _WasmNesting_wasm, "f").wasm_packer_get_placement_result(ptr0, len0);
        const result = __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_takeObject).call(this, ret);
        return new PlacementWrapper(result.buffer);
    }
    stop() {
        __classPrivateFieldGet(this, _WasmNesting_wasm, "f").wasm_packer_stop();
    }
    get isInitialized() {
        return __classPrivateFieldGet(this, _WasmNesting_isInitialized, "f");
    }
}
_WasmNesting_wasm = new WeakMap(), _WasmNesting_heap = new WeakMap(), _WasmNesting_heapNext = new WeakMap(), _WasmNesting_textDecoder = new WeakMap(), _WasmNesting_vecLen = new WeakMap(), _WasmNesting_memSegs = new WeakMap(), _WasmNesting_isInitialized = new WeakMap(), _WasmNesting_instances = new WeakSet(), _WasmNesting_addHeapObject = function _WasmNesting_addHeapObject(obj) {
    if (__classPrivateFieldGet(this, _WasmNesting_heapNext, "f") === __classPrivateFieldGet(this, _WasmNesting_heap, "f").length) {
        __classPrivateFieldGet(this, _WasmNesting_heap, "f").push(__classPrivateFieldGet(this, _WasmNesting_heap, "f").length + 1);
    }
    const idx = __classPrivateFieldGet(this, _WasmNesting_heapNext, "f");
    __classPrivateFieldSet(this, _WasmNesting_heapNext, __classPrivateFieldGet(this, _WasmNesting_heap, "f")[idx], "f");
    __classPrivateFieldGet(this, _WasmNesting_heap, "f")[idx] = obj;
    return idx;
}, _WasmNesting_handleError = function _WasmNesting_handleError(f, args) {
    try {
        return f.apply(this, args);
    }
    catch (e) {
        __classPrivateFieldGet(this, _WasmNesting_wasm, "f").__wbindgen_export_0(__classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_addHeapObject).call(this, e));
    }
}, _WasmNesting_getMem = function _WasmNesting_getMem(index) {
    if (index > 2) {
        throw new Error('Unsupported memory segment index');
    }
    if (__classPrivateFieldGet(this, _WasmNesting_memSegs, "f")[index] === null || __classPrivateFieldGet(this, _WasmNesting_memSegs, "f")[index].byteLength === 0) {
        const ArrayType = MEM_SEG_TYPES[index];
        __classPrivateFieldGet(this, _WasmNesting_memSegs, "f")[index] = new ArrayType(__classPrivateFieldGet(this, _WasmNesting_wasm, "f").memory.buffer);
    }
    return __classPrivateFieldGet(this, _WasmNesting_memSegs, "f")[index];
}, _WasmNesting_passMem = function _WasmNesting_passMem(arg, malloc) {
    const bytes = arg.BYTES_PER_ELEMENT;
    const ptr = malloc(arg.length * bytes, bytes) >>> 0;
    const memory = __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_getMem).call(this, bytes >> 1);
    memory.set(arg, ptr / bytes);
    __classPrivateFieldSet(this, _WasmNesting_vecLen, arg.length, "f");
    return ptr;
}, _WasmNesting_getString = function _WasmNesting_getString(ptr, len) {
    ptr = ptr >>> 0;
    return __classPrivateFieldGet(this, _WasmNesting_textDecoder, "f").decode(__classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_getMem).call(this, 0).subarray(ptr, ptr + len));
}, _WasmNesting_checkObject = function _WasmNesting_checkObject(idx, type) {
    return typeof __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_getObject).call(this, idx) === type;
}, _WasmNesting_getObject = function _WasmNesting_getObject(idx) {
    return __classPrivateFieldGet(this, _WasmNesting_heap, "f")[idx];
}, _WasmNesting_dropObject = function _WasmNesting_dropObject(idx) {
    if (idx < 132) {
        return;
    }
    __classPrivateFieldGet(this, _WasmNesting_heap, "f")[idx] = __classPrivateFieldGet(this, _WasmNesting_heapNext, "f");
    __classPrivateFieldSet(this, _WasmNesting_heapNext, idx, "f");
}, _WasmNesting_takeObject = function _WasmNesting_takeObject(idx) {
    const ret = __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_getObject).call(this, idx);
    __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_dropObject).call(this, idx);
    return ret;
}, _WasmNesting_isLikeNone = function _WasmNesting_isLikeNone(x) {
    return x === undefined || x === null;
}, _WasmNesting_addGlobalObject = function _WasmNesting_addGlobalObject(data) {
    const formattedData = typeof data === 'undefined' ? null : data;
    return __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_isLikeNone).call(this, formattedData) ? 0 : __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_addHeapObject).call(this, formattedData);
}, _WasmNesting_getImports = function _WasmNesting_getImports() {
    return {
        wbg: {
            __wbg_buffer_609cc3eee51ed158: (arg0) => {
                const ret = __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_getObject).call(this, arg0).buffer;
                return __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_addHeapObject).call(this, ret);
            },
            __wbg_call_672a4d21634d4a24: (...args) => __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_handleError).call(this, (arg0, arg1) => {
                const ret = __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_getObject).call(this, arg0).call(__classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_getObject).call(this, arg1));
                return __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_addHeapObject).call(this, ret);
            }, args),
            __wbg_call_7cccdd69e0791ae2: (...args) => {
                return __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_handleError).call(this, (arg0, arg1, arg2) => {
                    const ret = __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_getObject).call(this, arg0).call(__classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_getObject).call(this, arg1), __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_getObject).call(this, arg2));
                    return __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_addHeapObject).call(this, ret);
                }, args);
            },
            __wbg_crypto_574e78ad8b13b65f: (arg0) => {
                const ret = __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_getObject).call(this, arg0).crypto;
                return __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_addHeapObject).call(this, ret);
            },
            __wbg_getRandomValues_b8f5dbd5f3995a9e: (...args) => __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_handleError).call(this, (arg0, arg1) => {
                __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_getObject).call(this, arg0).getRandomValues(__classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_getObject).call(this, arg1));
            }, args),
            __wbg_length_3b4f022188ae8db6: (arg0) => __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_getObject).call(this, arg0).length,
            __wbg_length_a446193dc22c12f8: (arg0) => __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_getObject).call(this, arg0).length,
            __wbg_msCrypto_a61aeb35a24c1329: (arg0) => {
                const ret = __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_getObject).call(this, arg0).msCrypto;
                return __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_addHeapObject).call(this, ret);
            },
            __wbg_new_a12002a7f91c75be: (arg0) => {
                const ret = new Uint8Array(__classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_getObject).call(this, arg0));
                return __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_addHeapObject).call(this, ret);
            },
            __wbg_newnoargs_105ed471475aaf50: (arg0, arg1) => {
                const ret = new Function(__classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_getString).call(this, arg0, arg1));
                return __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_addHeapObject).call(this, ret);
            },
            __wbg_newwithbyteoffsetandlength_d97e637ebe145a9a: (arg0, arg1, arg2) => {
                const ret = new Uint8Array(__classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_getObject).call(this, arg0), arg1 >>> 0, arg2 >>> 0);
                return __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_addHeapObject).call(this, ret);
            },
            __wbg_newwithbyteoffsetandlength_e6b7e69acd4c7354: (arg0, arg1, arg2) => {
                const ret = new Float32Array(__classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_getObject).call(this, arg0), arg1 >>> 0, arg2 >>> 0);
                return __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_addHeapObject).call(this, ret);
            },
            __wbg_newwithlength_5a5efe313cfd59f1: (arg0) => __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_addHeapObject).call(this, new Float32Array(arg0 >>> 0)),
            __wbg_newwithlength_a381634e90c276d4: (arg0) => __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_addHeapObject).call(this, new Uint8Array(arg0 >>> 0)),
            __wbg_node_905d3e251edff8a2: (arg0) => {
                const ret = __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_getObject).call(this, arg0).node;
                return __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_addHeapObject).call(this, ret);
            },
            __wbg_process_dc0fbacc7c1c06f7: (arg0) => {
                const ret = __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_getObject).call(this, arg0).process;
                return __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_addHeapObject).call(this, ret);
            },
            __wbg_randomFillSync_ac0988aba3254290: (...args) => __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_handleError).call(this, (arg0, arg1) => {
                __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_getObject).call(this, arg0).randomFillSync(__classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_takeObject).call(this, arg1));
            }, args),
            __wbg_require_60cc747a6bc5215a: (...args) => {
                return __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_handleError).call(this, () => {
                    const ret = module.require;
                    return __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_addHeapObject).call(this, ret);
                }, args);
            },
            __wbg_set_10bad9bee0e9c58b: (arg0, arg1, arg2) => {
                __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_getObject).call(this, arg0).set(__classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_getObject).call(this, arg1), arg2 >>> 0);
            },
            __wbg_set_65595bdd868b3009: (arg0, arg1, arg2) => {
                __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_getObject).call(this, arg0).set(__classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_getObject).call(this, arg1), arg2 >>> 0);
            },
            __wbg_static_accessor_GLOBAL_88a902d13a557d07: () => __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_addGlobalObject).call(this, global),
            __wbg_static_accessor_GLOBAL_THIS_56578be7e9f832b0: () => __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_addGlobalObject).call(this, globalThis),
            __wbg_static_accessor_SELF_37c5d418e4bf5819: () => __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_addGlobalObject).call(this, self),
            __wbg_static_accessor_WINDOW_5de37043a91a9c40: () => __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_addGlobalObject).call(this, window),
            __wbg_subarray_aa9065fa9dc5df96: (arg0, arg1, arg2) => {
                const ret = __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_getObject).call(this, arg0).subarray(arg1 >>> 0, arg2 >>> 0);
                return __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_addHeapObject).call(this, ret);
            },
            __wbg_versions_c01dfd4722a88165: (arg0) => {
                const ret = __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_getObject).call(this, arg0).versions;
                return __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_addHeapObject).call(this, ret);
            },
            __wbindgen_is_function: (arg0) => __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_checkObject).call(this, arg0, 'function'),
            __wbindgen_is_object: (arg0) => __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_checkObject).call(this, arg0, 'object') && __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_getObject).call(this, arg0) !== null,
            __wbindgen_is_string: (arg0) => __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_checkObject).call(this, arg0, 'string'),
            __wbindgen_is_undefined: (arg0) => __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_checkObject).call(this, arg0, 'undefined'),
            __wbindgen_memory: () => __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_addHeapObject).call(this, __classPrivateFieldGet(this, _WasmNesting_wasm, "f").memory),
            __wbindgen_object_clone_ref: (arg0) => {
                const ret = __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_getObject).call(this, arg0);
                return __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_addHeapObject).call(this, ret);
            },
            __wbindgen_object_drop_ref: (arg0) => {
                __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_takeObject).call(this, arg0);
            },
            __wbindgen_string_new: (arg0, arg1) => {
                const ret = __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_getString).call(this, arg0, arg1);
                return __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_addHeapObject).call(this, ret);
            },
            __wbindgen_throw: (arg0, arg1) => {
                throw new Error(__classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_getString).call(this, arg0, arg1));
            },
            // console_error_panic_hook imports
            __wbg_new_8a6f238a6ece86ea: () => {
                return __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_addHeapObject).call(this, new Error());
            },
            __wbg_stack_0ed75d68575b0f3c: (arg0, arg1) => {
                var _a;
                const stack = (_a = __classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_getObject).call(this, arg1).stack) !== null && _a !== void 0 ? _a : '';
                const encoded = new TextEncoder().encode(stack);
                const malloc = __classPrivateFieldGet(this, _WasmNesting_wasm, "f").__wbindgen_export_2;
                const ptr = malloc(encoded.length, 1) >>> 0;
                new Uint8Array(__classPrivateFieldGet(this, _WasmNesting_wasm, "f").memory.buffer).set(encoded, ptr);
                const view = new DataView(__classPrivateFieldGet(this, _WasmNesting_wasm, "f").memory.buffer);
                view.setInt32(arg0, ptr, true);
                view.setInt32(arg0 + 4, encoded.length, true);
            },
            __wbg_error_7534b8e9a36f1ab4: (arg0, arg1) => {
                console.error(__classPrivateFieldGet(this, _WasmNesting_instances, "m", _WasmNesting_getString).call(this, arg0, arg1));
            }
        }
    };
}, _WasmNesting_serializeConfig = function _WasmNesting_serializeConfig(config) {
    let result = 0;
    // Кодуємо значення в число
    result = this.setBits(result, config.curveTolerance * 10, 0, 4);
    result = this.setBits(result, config.spacing, 4, 5);
    result = this.setBits(result, config.rotations, 9, 5);
    result = this.setBits(result, config.populationSize, 14, 7);
    result = this.setBits(result, config.mutationRate, 21, 7);
    result = this.setBits(result, Number(config.useHoles), 28, 1);
    return result;
};

const wasmNesting = new WasmNesting();
self.onmessage = ({ data }) => {
    if (wasmNesting.isInitialized) {
        const buffer = wasmNesting.calculate(new Float32Array(data)).buffer;
        //@ts-ignore
        self.postMessage(buffer, [buffer]);
    }
    else {
        wasmNesting.initBuffer(data).then(() => self.postMessage(''));
    }
};
//# sourceMappingURL=polygon-packer.calc.js.map
