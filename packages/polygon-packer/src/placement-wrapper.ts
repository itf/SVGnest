import { deserializeSourceItems, flattenTree, readUint32FromF32 } from './helpers';
import { IPlacementWrapper, SourceItem, FlattenedData, usize, u8, u32, u16, f32 } from './types';

export default class PlacementWrapper implements IPlacementWrapper {
    #buffer: ArrayBuffer;

    #view: DataView;

    #placement: number;

    #memSeg: Float32Array;

    #offset: usize;

    #size: usize;

    #pointData: u32;

    #pointOffset: usize;

    #placementCount: u32;

    #angleSplit: u8;

    #sources: SourceItem[];

    constructor(buffer: ArrayBuffer) {
        this.#buffer = buffer;
        this.#view = new DataView(this.#buffer);
        this.#memSeg = this.placementsData;
        this.#angleSplit = this.angleSplit;
        this.#placementCount = this.#memSeg[1];
        this.#memSeg = this.#memSeg;
        this.#sources = this.sources;
        this.#placement = 0;
        this.#offset = 0;
        this.#size = 0;
        this.#pointData = 0;
        this.#pointOffset = 0;
    }

    public bindPlacement(index: usize): void {
        this.#placement = readUint32FromF32(this.#memSeg, 2 + index);
        this.#offset = this.#placement >>> 16;
        this.#size = this.#placement & ((1 << 16) - 1);
    }

    public bindData(index: usize): u32 {
        this.#pointData = readUint32FromF32(this.#memSeg, this.#offset + index);
        this.#pointOffset = this.#offset + this.#size + (index << 1);

        return this.#sources[this.id].source;
    }

    public get flattnedChildren(): FlattenedData | null {
        const source = this.#sources[this.id];

        return source.children.length ? flattenTree(source.children, true) : null;
    }

    public get placementCount(): usize {
        return this.#placementCount;
    }

    public get offset(): usize {
        return this.#offset;
    }

    public get size(): usize {
        return this.#size;
    }

    public get id(): u16 {
        return this.#pointData >>> 16;
    }

    public get rotation(): u16 {
        return Math.round(((this.#pointData & ((1 << 16) - 1)) * 360) / this.#angleSplit);
    }

    public get x(): f32 {
        return this.#memSeg[this.#pointOffset];
    }

    public get y(): f32 {
        return this.#memSeg[this.#pointOffset + 1];
    }

    get placePercentage(): f32 {
        return this.#view.getFloat32(0, true);
    }

    get numPlacedParts(): u16 {
        return this.#view.getUint16(4, true);
    }

    get numParts(): u16 {
        return this.#view.getUint16(6, true);
    }

    get angleSplit(): u8 {
        return this.#view.getUint8(8);
    }

    get hasResult(): boolean {
        return this.#view.getUint8(9) === 1;
    }

    get boundsX(): f32 {
        return this.#view.getFloat32(10, true);
    }

    get boundsY(): f32 {
        return this.#view.getFloat32(14, true);
    }

    get boundsWidth(): f32 {
        return this.#view.getFloat32(18, true);
    }

    get boundsHeight(): f32 {
        return this.#view.getFloat32(22, true);
    }

    get sources(): SourceItem[] {
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

        const sourcesSize = this.#view.getUint32(26, true);

        if (sourcesSize === 0) {
            return [];
        }

        // Sources segment starts at offset 34
        const sourcesData = new Uint8Array(this.#buffer, 34, sourcesSize);

        return deserializeSourceItems(sourcesData);
    }

    get placementsData(): Float32Array {
        // Buffer structure:
        // 26-30: sourcesSize (u32)
        // 30-34: placementsDataSize (u32)
        // 34+sourcesSize: placements data

        const sourcesSize = this.#view.getUint32(26, true);
        const placementsDataSize = this.#view.getUint32(30, true);

        if (placementsDataSize === 0) {
            return new Float32Array(0);
        }

        // Placements data starts after sources segment
        const placementsOffset = 34 + sourcesSize;

        // Create Float32Array view of the placements data
        return new Float32Array(this.#buffer, placementsOffset, placementsDataSize / Float32Array.BYTES_PER_ELEMENT);
    }
}