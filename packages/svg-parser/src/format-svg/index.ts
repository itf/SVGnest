import { INode, parseSync } from 'svgson';
import { parseSVG, makeAbsolute, CommandMadeAbsolute, Command } from 'svg-path-parser';

import Matrix from './matrix';
import TRANSFORM_BUILDERS from './transform-builders';
import { MATRIX_OPERATIONS, SVG_TAG, PATH_COMMAND } from '../types';
import PathBuilder from './transform-builders/path-builder';

const ALLOWED_TAGS: SVG_TAG[] = [
    SVG_TAG.SVG,
    SVG_TAG.CIRCLE,
    SVG_TAG.ELLIPSE,
    SVG_TAG.PATH,
    SVG_TAG.POLYGON,
    SVG_TAG.POLYLINE,
    SVG_TAG.RECT,
    SVG_TAG.LINE
];

const TRANSFORM_TAGS: SVG_TAG[] = [SVG_TAG.G, SVG_TAG.SVG, SVG_TAG.DEFS, SVG_TAG.CLIP_PATH];

/**
 * Splits a compound SVG path into multiple separate paths.
 * 
 * Paths with multiple M (moveto) commands are split into individual path elements.
 * Recursively processes all children in the tree.
 * 
 * @param element - SVG node to split
 * @returns Array of split path nodes
 */
function splitPath(element: INode): INode[] {
    // only operate on original DOM tree, ignore any children that are added. Avoid infinite loops
    const children: INode[] = element.children;
    const childCount: number = children.length;
    let i = 0;
    const resultChildren: INode[] = [];
    let splitted: INode[] = null;

    for (i = 0; i < childCount; ++i) {
        splitted = splitPath(children[i]);
        resultChildren.push(...splitted);
    }

    element.children = resultChildren;

    if ((element.name as SVG_TAG) !== SVG_TAG.PATH) {
        return [element];
    }

    const definition: string = element.attributes.d;
    const rawSegments: Command[] = parseSVG(definition);
    const segments: CommandMadeAbsolute[] = makeAbsolute(rawSegments);
    const segmentCount: number = segments.length;
    let segment: CommandMadeAbsolute = null;
    let multiPath: boolean = false;

    for (i = segmentCount - 1; i >= 0; --i) {
        segment = segments[i];

        if (i > 0 && segment.code === PATH_COMMAND.M) {
            multiPath = true;
            break;
        }
    }

    if (!multiPath) {
        return [element]; // only 1 M command, no need to split
    }

    const totalPathes: CommandMadeAbsolute[][] = [];
    let path: CommandMadeAbsolute[] = null;

    for (i = 0; i < segmentCount; ++i) {
        segment = segments[i];

        if (segment.code === PATH_COMMAND.M) {
            path = [];
            totalPathes.push(path);
        }

        path.push(segment);
    }

    return totalPathes.map(definitions => ({
        ...element,
        children: [] as INode[],
        attributes: {
            ...element.attributes,
            d: PathBuilder.generateDFromPathSegments(definitions)
        }
    }));
}

/**
 * Flattens the SVG node hierarchy by bringing all child elements to the top level.
 * 
 * @param root - Root SVG node
 * @param element - Current element being processed (defaults to root)
 */
function flatten(root: INode, element: INode = root): void {
    const nodeCount: number = element.children.length;
    let i: number = 0;
    const isSvg: boolean = (element.name as SVG_TAG) === SVG_TAG.SVG;

    for (i = 0; i < nodeCount; ++i) {
        flatten(element.children[i], root);

        if (isSvg) {
            continue;
        }

        root.children.push(element.children[i]);
    }

    if (!isSvg) {
        element.children.length = 0;
    }
}

/**
 * Removes elements with tag names not in the allowed list.
 * 
 * Filters out text, g, and other non-shape elements.
 * 
 * @param element - Element to filter
 */
function filterNodes(element: INode): void {
    element.children = element.children.filter((child: INode) => {
        const allowed = ALLOWED_TAGS.indexOf(child.name as SVG_TAG) !== -1;

        if (allowed) {
            filterNodes(child);
        }

        return allowed;
    });
}

/**
 * Parses an SVG transform attribute string into a Matrix object.
 * 
 * Handles matrix, translate, scale, rotate, skewX, and skewY operations.
 * 
 * @param transformString - SVG transform attribute value
 * @returns Matrix representing the combined transformations
 */
function transformParse(transformString: string = ''): Matrix {
    if (!transformString) {
        return new Matrix();
    }

    const cmdSplit: RegExp = /\s*(matrix|translate|scale|rotate|skewX|skewY)\s*\(\s*(.+?)\s*\)[\s,]*/;
    const paramsSplit: RegExp = /[\s,]+/;

    // Split value into ['', 'translate', '10 50', '', 'scale', '2', '', 'rotate',  '-45', '']
    const { matrix } = transformString.split(cmdSplit).reduce(
        (result, item) => {
            // Skip empty elements
            if (item) {
                // remember operation
                if (Matrix.AVAILABLE_OPERATIONS.includes(item as MATRIX_OPERATIONS)) {
                    result.command = item as MATRIX_OPERATIONS;
                } else {
                    // If params count is not correct - ignore command
                    result.matrix.execute(
                        result.command,
                        item.split(paramsSplit).map(i => Number(i) || 0)
                    );
                }
            }

            return result;
        },
        { matrix: new Matrix(), command: MATRIX_OPERATIONS.NONE }
    );

    return matrix;
}

/**
 * Recursively applies transformations to an SVG element and its children.
 * 
 * Transforms are applied cumulatively down the tree hierarchy.
 * 
 * @param element - Element to transform
 * @param globalTransform - Accumulated transform string from ancestors
 */
function applyTransform(element: INode, globalTransform: string = ''): void {
    const transformAttribute: string = element.attributes.transform;
    const transformString: string = transformAttribute ? globalTransform + transformAttribute : globalTransform;
    const transform: Matrix = transformParse(transformString);
    const tagName: SVG_TAG = element.name as SVG_TAG;

    if (TRANSFORM_TAGS.includes(tagName)) {
        delete element.attributes.transform;
        const children: INode[] = element.children;
        const childCount: number = children.length;
        let i: number = 0;
        let child: INode = null;

        for (i = 0; i < childCount; ++i) {
            child = children[i];

            if (child.name) {
                // skip text nodes
                applyTransform(child, transformString);
            }
        }
    } else if (transform && !transform.isIdentity && TRANSFORM_BUILDERS.has(tagName)) {
        // decompose affine matrix to rotate, scale components (translate is just the 3rd column)
        const builder = TRANSFORM_BUILDERS.get(tagName);

        builder.create(element, transform).getResult();
    }
}

/**
 * Formats and normalizes an SVG string for polygon extraction.
 * 
 * Performs the following operations:
 * - Parses SVG string
 * - Applies all transformations
 * - Flattens element hierarchy
 * - Filters out non-shape elements
 * - Splits compound paths
 * - Assigns unique GUIDs to elements
 * 
 * @param svgString - Raw SVG markup
 * @returns Formatted SVG node tree
 * @throws Error if SVG cannot be parsed or has no children
 */
export default function formatSVG(svgString: string): INode {
    let svg: INode = null;

    try {
        svg = parseSync(svgString);
    } catch {
        throw new Error('Failed to parse SVG string');
    }

    if ((svg.name as SVG_TAG) !== SVG_TAG.SVG) {
        const nodeCount: number = svg.children.length;
        let i: number = 0;
        let child: INode = null;

        for (i = 0; i < nodeCount; ++i) {
            // svg document may start with comments or text nodes
            child = svg.children[i];

            if ((child.name as SVG_TAG) === SVG_TAG.SVG) {
                svg = child;
                break;
            }
        }
    }

    if (svg === null) {
        throw new Error('SVG has no children');
    }

    // apply any transformations, so that all path positions etc will be in the same coordinate space
    applyTransform(svg);
    // remove any g elements and bring all elements to the top level
    flatten(svg);
    // remove any non-contour elements like text
    filterNodes(svg);
    // split any compound paths into individual path elements
    splitPath(svg);

    svg.children.forEach((child, index) => {
        child.attributes.guid = index.toString();
    });

    return svg;
}
