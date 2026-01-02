import { INode, stringify } from 'svgson';

import formatSVG from './format-svg';
import { FlattenedData, NestConfig, SVG_TAG, PlacementWrapper } from './types';
import { convertElement } from './helpers';
import SHAPE_BUILDERS from './shape-builders';

/**
 * Parser for SVG elements and conversion to polygon data for nesting.
 * 
 * Handles parsing SVG strings, extracting shapes, converting them to polygons,
 * and applying placement results back to SVG format.
 * 
 * @group Core
 * @example
 * ```typescript
 * const parser = new SVGParser();
 * parser.init(svgString);
 * parser.setBin(containerElement);
 * const polygons = parser.getPolygons(config);
 * // After packing...
 * const resultSvg = parser.applyPlacement(placementWrapper);
 * ```
 */
export default class SVGParser {
    #svgRoot: INode = null;

    #bin: INode = null;

    #binPolygon: Float32Array = null;

    #parts: INode[] = null;

    /**
     * Initializes the parser with an SVG string.
     * 
     * Parses and formats the SVG, making it ready for polygon extraction.
     * 
     * @param svgString - Raw SVG markup to parse
     */
    public init(svgString: string): void {
        this.#svgRoot = formatSVG(svgString);
    }

    /**
     * Extracts polygons from SVG elements for nesting.
     * 
     * Converts all SVG shapes (except the bin) into Float32Array polygon representations
     * suitable for the nesting algorithm.
     * 
     * @param configuration - Nesting configuration including curve tolerance
     * @returns Array of polygons as Float32Arrays
     */
    public getPolygons(configuration: NestConfig): Float32Array[] {
        const { curveTolerance } = configuration;
        this.#parts = this.#svgRoot.children.filter(node => node.attributes.guid !== this.#bin.attributes.guid);
        this.#binPolygon = this.clearPolygon(this.#bin, curveTolerance);

        const nodeCount = this.#parts.length;
        const result: Float32Array[] = [];
        let i: number = 0;

        for (i = 0; i < nodeCount; ++i) {
            result.push(this.clearPolygon(this.#parts[i], curveTolerance));
        }

        return result;
    }

    /**
     * Sets the container (bin) element for nesting.
     * 
     * The bin defines the boundary within which parts will be nested.
     * 
     * @param element - SVG element to use as the nesting container
     */
    public setBin(element: SVGElement): void {
        this.#bin = convertElement(element);
    }

    /**
     * Gets the root SVG element's attributes.
     * 
     * @returns Object containing SVG attributes (viewBox, width, height, etc.)
     */
    public get svgAttributes(): { [key: string]: string } {
        return this.#svgRoot.attributes;
    }

    private clearPolygon(element: INode, tolerance: number): Float32Array {
        const tagName: SVG_TAG = element.name as SVG_TAG;

        return SHAPE_BUILDERS.has(tagName)
            ? SHAPE_BUILDERS.get(tagName).create(element, tolerance, SVGParser.SVG_TOLERANCE).getResult()
            : new Float32Array(0);
    }

    /**
     * Applies nesting results to generate output SVG.
     * 
     * Transforms the original SVG elements according to the placement results,
     * including position, rotation, and hole handling.
     * 
     * @param placementWrapper - Wrapper containing placement results from the nesting algorithm
     * @returns SVG string with parts positioned according to nesting results
     */
    public applyPlacement(placementWrapper: PlacementWrapper): string {
        const sources = placementWrapper.sources;
        const clone: INode[] = [];
        const partCount: number = this.#parts.length;
        const svgList: INode[] = [];
        let i: number = 0;
        let j: number = 0;
        let k: number = 0;
        let source = 0;
        let newSvg: INode = null;
        let binClone: INode = null;
        let partGroup: INode = null;
        let flattened: FlattenedData = null;
        let c: INode = null;

        for (i = 0; i < partCount; ++i) {
            clone.push(JSON.parse(JSON.stringify(this.#parts[i])) as INode);
        }

        for (i = 0; i < placementWrapper.placementCount; ++i) {
            binClone = JSON.parse(JSON.stringify(this.#bin)) as INode;
            binClone.attributes.id = 'exportRoot';
            binClone.attributes.transform = `translate(${-placementWrapper.boundsX} ${-placementWrapper.boundsY})`;

            newSvg = {
                name: 'svg',
                type: 'element',
                value: '',
                attributes: {
                    viewBox: `0 0 ${placementWrapper.boundsWidth} ${placementWrapper.boundsHeight}`,
                    width: `${placementWrapper.boundsWidth}px`,
                    height: `${placementWrapper.boundsHeight}px`
                },
                children: [binClone]
            };

            placementWrapper.bindPlacement(i);

            for (j = 0; j < placementWrapper.size; ++j) {
                source = placementWrapper.bindData(j);

                partGroup = {
                    name: 'g',
                    type: 'element',
                    value: '',
                    // the original path could have transforms and stuff on it, so apply our transforms on a group
                    attributes: {
                        transform: `translate(${placementWrapper.x} ${placementWrapper.y}) rotate(${placementWrapper.rotation})`,
                        id: 'exportContent'
                    },
                    children: [clone[source]]
                };

                flattened = placementWrapper.flattnedChildren;

                if (flattened !== null) {
                    for (k = 0; k < flattened.sources.length; ++k) {
                        c = clone[flattened.sources[k]];
                        // add class to indicate hole
                        if (
                            flattened.holes.includes(flattened.sources[k]) &&
                            (!c.attributes.class || c.attributes.class.indexOf('hole') < 0)
                        ) {
                            c.attributes.class = `${c.attributes.class} hole`;
                        }
                        partGroup.children.push(c);
                    }
                }

                newSvg.children.push(partGroup);
            }

            svgList.push(newSvg);
        }

        const resultSvg: INode = svgList.length === 1 ? svgList[0] : { ...newSvg, children: svgList };

        return stringify(resultSvg);
    }

    /**
     * Gets the current SVG as a string.
     * 
     * @returns Stringified SVG representation
     */
    public get svgString(): string {
        return stringify(this.#svgRoot);
    }

    /**
     * Gets the bin polygon as a Float32Array.
     * 
     * @returns Polygon representation of the bin/container
     */
    public get binPolygon(): Float32Array {
        return this.#binPolygon;
    }

    private static SVG_TOLERANCE: number = 0.005; // fudge factor for browser inaccuracy in SVG unit handling
}
