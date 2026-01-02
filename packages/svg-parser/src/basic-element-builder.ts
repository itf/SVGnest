import { INode } from 'svgson';

import { IPoint } from './types';

/**
 * Base class for building geometric shapes from SVG elements.
 * 
 * Provides common utilities for parsing attributes and converting
 * point data from SVG elements.
 * 
 * @abstract
 * @group Core
 */
export default class BasicElementBuilder {
    #element: INode;

    /**
     * Creates a new element builder.
     * 
     * @param element - SVG element node to build from
     * @protected
     */
    protected constructor(element: INode) {
        this.#element = element;
    }

    /**
     * Gets a numeric attribute value from the element.
     * 
     * @param key - Attribute name
     * @returns Parsed float value, or 0 if not found/invalid
     * @protected
     */
    protected getFloatAtrribute(key: string): number {
        return parseFloat(this.#element.attributes[key]) || 0;
    }

    /**
     * Converts SVG points attribute string to array of point objects.
     * 
     * Parses space/comma-separated coordinate pairs into IPoint objects.
     * 
     * @returns Array of parsed points
     * @protected
     */
    protected convertPointsToArray(): IPoint[] {
        const pointsString: string = this.element.attributes.points;
        // Split the string by whitespace and newlines
        const pointsArray: string[] = pointsString.split(/[\s,]+/);
        const points: IPoint[] = [];
        const cordCount: number = pointsArray.length;
        let i: number = 0;
        let x: number = 0;
        let y: number = 0;

        // Iterate over the array two items at a time
        for (i = 0; i < cordCount; i = i + 2) {
            x = parseFloat(pointsArray[i]);
            y = parseFloat(pointsArray[i + 1]);

            if (!isNaN(x) && !isNaN(y)) {
                points.push({ x, y });
            }
        }

        return points;
    }

    /**
     * Gets the SVG element node.
     * 
     * @returns The SVG element
     * @protected
     */
    protected get element(): INode {
        return this.#element;
    }
}
