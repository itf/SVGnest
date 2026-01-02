import { INode } from 'svgson';

/**
 * Converts degrees to radians.
 * 
 * @param value - Angle in degrees
 * @returns Angle in radians
 */
export function degreesToRadians(value: number): number {
    return (value * Math.PI) / 180;
}

/**
 * Converts a DOM SVGElement to an INode object.
 * 
 * Recursively processes the element's attributes and children,
 * creating a serializable representation of the SVG structure.
 * 
 * @param element - SVG DOM element to convert
 * @returns INode representation of the element
 */
export function convertElement(element: SVGElement): INode {
    const result: INode = {
        name: element.tagName,
        type: 'element',
        value: '',
        attributes: {},
        children: []
    };
    const nodeCount: number = element.childNodes.length;
    const attributeCount: number = element.attributes.length;
    let i: number = 0;
    let attribute: Attr = null;

    // Set attributes
    for (i = 0; i < attributeCount; ++i) {
        attribute = element.attributes.item(i);
        result.attributes[attribute.name] = attribute.value;
    }

    // Set children
    for (i = 0; i < nodeCount; ++i) {
        result.children.push(convertElement(element.childNodes.item(i) as SVGElement));
    }

    return result;
}
