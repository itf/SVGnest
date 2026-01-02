import { INode } from 'svgson';
import Matrix from '../matrix';
import BasicElementBuilder from '../../basic-element-builder';

/**
 * Base class for applying transformations to SVG elements.
 * 
 * Decomposes affine transformation matrices into rotate and scale components,
 * then applies them to specific SVG element types.
 * 
 * @group Transform Builders
 * @abstract
 */
export default class BasicTransformBuilder extends BasicElementBuilder {
    #transform: Matrix;

    #scale: number;

    #rotate: number;

    #id: string;

    #className: string;

    /**
     * @param element - SVG element to transform
     * @param transform - Transformation matrix to apply
     */
    protected constructor(element: INode, transform: Matrix) {
        super(element);
        // decompose affine matrix to rotate, scale components (translate is just the 3rd column)
        const transforms: number[] = transform.toArray();
        const atan: number = Math.atan2(transforms[1], transforms[3]) * 180;
        this.#transform = transform;
        this.#scale = Math.sqrt(transforms[0] * transforms[0] + transforms[2] * transforms[2]);
        this.#rotate = atan / Math.PI;
        this.#id = element.attributes.id;
        this.#className = element.attributes.class;
    }
    protected getFloatAtrribute(key: string): number {
        return parseFloat(this.element.attributes[key]) || 0;
    }

    /**
     * Gets the transformation matrix.
     * @returns Transformation matrix
     */
    protected get transform(): Matrix {
        return this.#transform;
    }

    /**
     * Gets the scale component of the transformation.
     * @returns Scale factor
     */
    protected get scale(): number {
        return this.#scale;
    }

    /**
     * Gets the rotation component of the transformation in radians.
     * @returns Rotation angle
     */
    protected get rotate(): number {
        return this.#rotate;
    }

    /**
     * Finalizes the transformed element.
     * 
     * Preserves ID and class attributes, removes transform attribute.
     * 
     * @returns Transformed element node
     */
    public getResult(): INode {
        if (this.#id) {
            this.element.attributes.id = this.#id;
        }

        if (this.#className) {
            this.element.attributes.class = this.#className;
        }

        delete this.element.attributes.transform;

        return this.element;
    }

    public static create(element: INode, transform: Matrix): BasicTransformBuilder {
        return new BasicTransformBuilder(element, transform);
    }
}
