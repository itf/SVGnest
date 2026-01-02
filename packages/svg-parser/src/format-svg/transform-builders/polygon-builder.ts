import { INode } from 'svgson';

import Matrix from '../matrix';
import { IPoint } from '../../types';
import BasicTransformBuilder from './basic-transform-builder';

/**
 * Applies transformations to SVG polygon and polyline elements.
 * 
 * Transforms all points in the polygon/polyline according to the transformation matrix.
 * 
 * @group Transform Builders
 */
export default class PolygonBuilder extends BasicTransformBuilder {
    /**
     * Applies transformation to all polygon points.
     * 
     * Transforms each point in the points attribute and reconstructs
     * the points string.
     * 
     * @returns Transformed element node
     */
    public getResult(): INode {
        const points: IPoint[] = this.convertPointsToArray();
        const pointCount = points.length;
        let transformedPoly: string = '';
        let i: number = 0;
        let point: IPoint = null;
        let transformed: IPoint = null;

        for (i = 0; i < pointCount; ++i) {
            point = points[i];
            transformed = this.transform.calc(point.x, point.y);
            transformedPoly = `${transformedPoly}${transformed.x},${transformed.y} `;
        }

        this.element.attributes.points = transformedPoly;
        delete this.element.attributes.transform;

        return super.getResult();
    }

    public static create(element: INode, transform: Matrix): BasicTransformBuilder {
        return new PolygonBuilder(element, transform);
    }
}
