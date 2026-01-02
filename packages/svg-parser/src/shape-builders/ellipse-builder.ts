import { INode } from 'svgson';

import BasicShapeBuilder from './basic-shape-builder';

/**
 * Converts SVG ellipse elements to polygons.
 * 
 * Approximates ellipses using regular polygons with segment count
 * based on the larger radius to satisfy tolerance.
 * 
 * @group Shape Builders
 */
export default class EllipseBuilder extends BasicShapeBuilder {
    /**
     * Converts ellipse to polygon with calculated segment count.
     * 
     * Uses the larger of the two radii to determine segment count,
     * ensuring tolerance is satisfied for the entire ellipse.
     * 
     * @returns Flat array of point coordinates around the ellipse
     */
    public getResult(): Float32Array {
        const rx: number = this.getFloatAtrribute('rx');
        const ry: number = this.getFloatAtrribute('ry');
        const cx: number = this.getFloatAtrribute('cx');
        const cy: number = this.getFloatAtrribute('cy');
        const maxRadius: number = Math.max(rx, ry);
        const diameter = 2 * Math.PI;
        const num: number = Math.max(Math.ceil(diameter / Math.acos(1 - this.tolerance / maxRadius)), 3);
        const step: number = diameter / num;
        let i: number = 0;
        let theta: number = 0;

        for (i = 0; i < num; ++i) {
            theta = i * step;

            this.result.push({
                x: rx * Math.cos(theta) + cx,
                y: ry * Math.sin(theta) + cy
            });
        }

        return super.getResult();
    }

    /**
     * Factory method for creating ellipse builders.
     * 
     * @param element - SVG ellipse element node
     * @param tolerance - Maximum deviation from true ellipse
     * @param svgTolerance - SVG-specific tolerance
     * @returns New EllipseBuilder instance
     */
    public static create(element: INode, tolerance: number, svgTolerance: number): BasicShapeBuilder {
        return new EllipseBuilder(element, tolerance, svgTolerance);
    }
}
