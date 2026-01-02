import { INode } from 'svgson';

import { IPoint } from '../types';
import BasicShapeBuilder from './basic-shape-builder';

/**
 * Converts SVG polygon/polyline elements to polygons.
 * 
 * Parses the points attribute and extracts coordinates directly
 * without any approximation since polygons are already linear.
 * 
 * @group Shape Builders
 */
export default class PolygonBuilder extends BasicShapeBuilder {
    /**
     * Extracts polygon points from the points attribute.
     * 
     * @returns Flat array of point coordinates
     */
    public getResult(): Float32Array {
        const points: IPoint[] = this.convertPointsToArray();
        const pointCount = points.length;
        let i: number = 0;

        for (i = 0; i < pointCount; ++i) {
            this.result.push(points[i]);
        }

        return super.getResult();
    }

    /**
     * Factory method for creating polygon builders.
     * 
     * @param element - SVG polygon or polyline element node
     * @param tolerance - Maximum deviation (unused for polygons)
     * @param svgTolerance - SVG-specific tolerance
     * @returns New PolygonBuilder instance
     */
    public static create(element: INode, tolerance: number, svgTolerance: number): BasicShapeBuilder {
        return new PolygonBuilder(element, tolerance, svgTolerance);
    }
}
