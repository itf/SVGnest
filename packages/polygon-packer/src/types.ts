export type NestConfig = {
    curveTolerance: number;
    spacing: number;
    rotations: number;
    populationSize: number;
    mutationRate: number;
    useHoles: boolean;
};

export enum THREAD_TYPE {
    PLACEMENT = 1,
    PAIR = 0
}

export type NFPCache = Map<number, Float32Array>;

export type SourceItem = {
    source: u16;
    children: SourceItem[];
} 
export interface IPlacementWrapper {
    readonly placePercentage: number; 
    readonly numPlacedParts: number; 
    readonly numParts: number;
    readonly boundsX: number;
    readonly boundsY: number;
    readonly boundsWidth: number;
    readonly boundsHeight: number;
    readonly angleSplit: number;
    readonly hasResult: boolean;
    readonly sources: SourceItem[];
    readonly placementsData: Float32Array;
}

export type DisplayCallback = (placementWrapper: IPlacementWrapper) => void;

export type FlattenedData = { sources: number[]; holes: number[] };

export type f32 = number;

export type u32 = number;

export type i32 = number;

export type u16 = number;

export type usize = number;

export type isize = number;

export type u8 = number;