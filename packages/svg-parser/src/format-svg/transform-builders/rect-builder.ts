import { INode } from 'svgson';

import Matrix from '../matrix';
import { IPoint, SVG_TAG } from '../../types';
import BasicTransformBuilder from './basic-transform-builder';

/**
 * Applies transformations to SVG rect elements.
 * 
 * Converts rectangles to polygon elements by transforming all four corners,
 * allowing arbitrary rotations and skews.
 * 
 * @group Transform Builders
 */
export default class RectBuilder extends BasicTransformBuilder {
    /**
     * Converts rect to polygon and applies transformation.
     * 
     * Transforms all four corners of the rectangle and converts
     * the element to a polygon with the transformed points.
     * 
     * @returns Transformed polygon element (originally a rect)
     */
    public getResult(): INode {
        const x: number = this.getFloatAtrribute('x');
        const y: number = this.getFloatAtrribute('y');
        const width: number = this.getFloatAtrribute('width');
        const height: number = this.getFloatAtrribute('height');
        const points: IPoint[] = [
            { x, y },
            { x: x + width, y },
            { x: x + width, y: y + height },
            { x, y: y + height }
        ];

        const pointCount: number = points.length;
        let point: IPoint = null;
        let transformed: IPoint = null;
        let i: number = 0;
        let transformedPoly: string = '';

        for (i = 0; i < pointCount; ++i) {
            point = points[i];
            transformed = this.transform.calc(point.x, point.y);
            transformedPoly = `${transformedPoly}${transformed.x},${transformed.y} `;
        }

        this.element.name = SVG_TAG.POLYGON;
        this.element.attributes.points = transformedPoly;

        return super.getResult();
    }

    public static create(element: INode, transform: Matrix): BasicTransformBuilder {
        return new RectBuilder(element, transform);
    }
}
