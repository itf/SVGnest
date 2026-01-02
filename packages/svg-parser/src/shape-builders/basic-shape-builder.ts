import { INode } from 'svgson';

import BasicElementBuilder from '../basic-element-builder';
import { IPoint } from '../types';

/**
 * Builder for converting SVG shapes to polygon point arrays.
 * 
 * Extends BasicElementBuilder to provide shape-specific conversion logic,
 * handling curve approximation and coordinate normalization.
 * 
 * @group Shape Builders
 */
export default class BasicShapeBuilder extends BasicElementBuilder {
    #tolerance: number;

    #svgTolerance: number;

    #result: IPoint[];

    /**
     * @param element - SVG element to convert
     * @param tolerance - Curve approximation tolerance
     * @param svgTolerance - Tolerance for comparing SVG coordinates
     */
    protected constructor(element: INode, tolerance: number, svgTolerance: number) {
        super(element);
        this.#tolerance = tolerance;
        this.#svgTolerance = svgTolerance;
        this.#result = [];
    }

    /**
     * Gets the current result points array.
     * @returns Array of points
     */
    protected get result(): IPoint[] {
        return this.#result;
    }

    /**
     * Gets the curve approximation tolerance.
     * @returns Tolerance value
     */
    protected get tolerance(): number {
        return this.#tolerance;
    }

    /**
     * Adds multiple points to the result array.
     * 
     * @param points - Array of points to insert
     */
    protected insertPoints(points: IPoint[]): void {
        const pointCount: number = points.length;
        let i: number = 0;

        for (i = 0; i < pointCount; ++i) {
            this.result.push(points[i]);
        }
    }

    /**
     * Converts the accumulated points to a Float32Array.
     * 
     * Removes duplicate closing points and flattens the point array
     * into a single Float32Array with alternating x,y coordinates.
     * 
     * @returns Float32Array of polygon coordinates
     */
    public getResult(): Float32Array {
        let pointCount: number = this.#result.length;

        while (
            pointCount > 0 &&
            BasicShapeBuilder.almostEqual(this.#result[0].x, this.#result[pointCount - 1].x, this.#svgTolerance) &&
            BasicShapeBuilder.almostEqual(this.#result[0].y, this.#result[pointCount - 1].y, this.#svgTolerance)
        ) {
            this.#result.pop();
            --pointCount;
        }

        const result: Float32Array = new Float32Array(pointCount << 1);
        let i: number = 0;

        for (i = 0; i < pointCount; ++i) {
            result[i << 1] = this.#result[i].x;
            result[(i << 1) + 1] = this.#result[i].y;
        }

        return result;
    }

    private static almostEqual(a: number, b: number, tolerance: number): boolean {
        return Math.abs(a - b) < tolerance;
    }

    /**
     * Factory method to create a BasicShapeBuilder instance.
     * 
     * @param element - SVG element to convert
     * @param tolerance - Curve approximation tolerance
     * @param svgTolerance - Tolerance for comparing SVG coordinates
     * @returns New BasicShapeBuilder instance
     */
    public static create(element: INode, tolerance: number, svgTolerance: number): BasicShapeBuilder {
        return new BasicShapeBuilder(element, tolerance, svgTolerance);
    }
}
