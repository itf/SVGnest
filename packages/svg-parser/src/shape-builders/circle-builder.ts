import { INode } from 'svgson';

import BasicShapeBuilder from './basic-shape-builder';

/**
 * Converts SVG circle elements to polygons.
 * 
 * Approximates circles using regular polygons with enough segments
 * to satisfy the tolerance requirement.
 * 
 * @group Shape Builders
 */
export default class CircleBuilder extends BasicShapeBuilder {
    /**
     * Converts circle to polygon with calculated segment count.
     * 
     * Segment count is determined by the formula that ensures maximum
     * deviation from the true circle is less than tolerance.
     * 
     * @returns Flat array of point coordinates around the circle
     */
    public getResult(): Float32Array {
        const radius: number = this.getFloatAtrribute('r');
        const cx: number = this.getFloatAtrribute('cx');
        const cy: number = this.getFloatAtrribute('cy');
        // num is the smallest number of segments required to approximate the circle to the given tolerance
        const diameter: number = 2 * Math.PI;
        const num: number = Math.max(Math.ceil(diameter / Math.acos(1 - this.tolerance / radius)), 3);
        const step: number = diameter / num;
        let i: number = 0;
        let theta: number = 0;

        for (i = 0; i < num; ++i) {
            theta = i * step;
            this.result.push({
                x: radius * Math.cos(theta) + cx,
                y: radius * Math.sin(theta) + cy
            });
        }

        return super.getResult();
    }

    /**
     * Factory method for creating circle builders.
     * 
     * @param element - SVG circle element node
     * @param tolerance - Maximum deviation from true circle
     * @param svgTolerance - SVG-specific tolerance
     * @returns New CircleBuilder instance
     */
    public static create(element: INode, tolerance: number, svgTolerance: number): BasicShapeBuilder {
        return new CircleBuilder(element, tolerance, svgTolerance);
    }
}
