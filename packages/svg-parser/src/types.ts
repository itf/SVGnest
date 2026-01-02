/**
 * SVG path command types.
 * Includes both uppercase (absolute) and lowercase (relative) commands.
 */
export enum PATH_COMMAND {
    M = 'M',
    L = 'L',
    H = 'H',
    V = 'V',
    C = 'C',
    S = 'S',
    Q = 'Q',
    T = 'T',
    A = 'A',
    Z = 'Z',
    m = 'm',
    l = 'l',
    h = 'h',
    v = 'v',
    c = 'c',
    s = 's',
    q = 'q',
    t = 't',
    a = 'a',
    z = 'z'
}

/**
 * Supported SVG element tag names.
 */
export enum SVG_TAG {
    LINE = 'line',
    CIRCLE = 'circle',
    ELLIPSE = 'ellipse',
    PATH = 'path',
    POLYGON = 'polygon',
    POLYLINE = 'polyline',
    RECT = 'rect',
    G = 'g',
    SVG = 'svg',
    DEFS = 'defs',
    CLIP_PATH = 'clipPath'
}

/**
 * Represents a 2D point.
 */
export interface IPoint {
    /** X coordinate */
    x: number;
    /** Y coordinate */
    y: number;
}

/**
 * Union type for SVG property values.
 */
export type SVGProperty = number | string;

/**
 * Keys for accessing SVG segment properties.
 */
export enum SEGMENT_KEYS {
    X = 'x',
    Y = 'y',
    X1 = 'x1',
    Y1 = 'y1',
    X2 = 'x2',
    Y2 = 'y2'
}

/**
 * SVG transformation operation types.
 */
export enum MATRIX_OPERATIONS {
    MATRIX = 'matrix',
    SCALE = 'scale',
    ROTATE = 'rotate',
    TRANSLATE = 'translate',
    SKEW_X = 'skewX',
    SKEW_Y = 'skewY',
    NONE = ''
}

/**
 * Configuration for the nesting algorithm.
 */
export type NestConfig = {
    /** Tolerance for curve approximation */
    /** Tolerance for curve approximation */
    curveTolerance: number;
    /** Spacing between parts */
    spacing: number;
    /** Number of rotation angles to try */
    rotations: number;
    /** Genetic algorithm population size */
    populationSize: number;
    /** Mutation rate for genetic algorithm */
    mutationRate: number;
    /** Whether to use holes in polygons */
    useHoles: boolean;
};

/**
 * Flattened polygon tree structure.
 */
export type FlattenedData = {
    /** Source polygon indices */
    sources: number[];
    /** Hole polygon indices */
    holes: number[]
};

/**
 * Hierarchical polygon structure with nested children.
 */
export type SourceItem = {
    /** Source polygon index */
    source: number;
    /** Nested child polygons (holes) */
    children: SourceItem[];
}

/**
 * Interface for accessing placement results from the nesting algorithm.
 */
export type PlacementWrapper = {
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
    readonly placementCount: number;
    readonly offset: number;
    readonly size: number;
    readonly id: number;
    readonly rotation: number;
    readonly x: number;
    readonly y: number;
    readonly flattnedChildren: FlattenedData | null

    bindPlacement(index: number): void;
    bindData(index: number): number;
}
