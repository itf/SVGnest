import { INode } from 'svgson';

import BasicShapeBuilder from './basic-shape-builder';

/**
 * Converts SVG rectangle elements to polygons.
 * 
 * Extracts x, y, width, and height attributes to create a four-point polygon.
 * 
 * @group Shape Builders
 */
export default class RectBuilder extends BasicShapeBuilder {
    /**
     * Converts rectangle to four corner points.
     * 
     * @returns Flat array of corner coordinates [x1, y1, x2, y2, x3, y3, x4, y4]
     */
    public getResult(): Float32Array {
        const x: number = this.getFloatAtrribute('x');
        const y: number = this.getFloatAtrribute('y');
        const width: number = this.getFloatAtrribute('width');
        const height: number = this.getFloatAtrribute('height');

        this.result.push({ x, y });
        this.result.push({ x: x + width, y });
        this.result.push({ x: x + width, y: y + height });
        this.result.push({ x, y: y + height });

        return super.getResult();
    }

    /**
     * Factory method for creating rectangle builders.
     * 
     * @param element - SVG rect element node
     * @param tolerance - Maximum deviation from true shape
     * @param svgTolerance - SVG-specific tolerance
     * @returns New RectBuilder instance
     */
    public static create(element: INode, tolerance: number, svgTolerance: number): BasicShapeBuilder {
        return new RectBuilder(element, tolerance, svgTolerance);
    }
}
