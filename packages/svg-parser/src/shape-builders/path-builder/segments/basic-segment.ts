import { IPoint } from '../../../types';
import { IBasicSegmentData } from '../types';

/**
 * Base class for path segment linearization.
 * 
 * Converts curved path segments into sequences of straight line segments
 * using recursive subdivision. Each subclass implements specific subdivision
 * logic for different curve types (cubic, quadratic, arc).
 * 
 * @group Segment Builders
 */
export default class BasicSegment {
    #points: IPoint[];
    #tolerance: number;

    protected constructor({ point1, point2 }: IBasicSegmentData, tolerance: number) {
        this.#points = [point1, point2];
        this.#tolerance = tolerance;
    }

    protected get point1(): IPoint {
        return this.#points[0];
    }

    protected get point2(): IPoint {
        return this.#points[1];
    }

    protected get tolerance(): number {
        return this.#tolerance;
    }

    /**
     * Checks if the segment is flat enough to be approximated as a line.
     * 
     * @returns `true` if segment doesn't need further subdivision
     */
    protected get isFlat(): boolean {
        return false;
    }

    /**
     * Subdivides the segment into smaller segments.
     * 
     * @returns Array of subdivided segments
     */
    protected subdivide(): BasicSegment[] {
        return [];
    }

    /**
     * Exports a point from the segment.
     * 
     * @param index - Point index (0 or 1)
     * @returns Copy of the point
     */
    protected export(index: number): IPoint {
        const point = this.#points[index];

        return { x: point.x, y: point.y };
    }

    /**
     * Calculates the midpoint between two points.
     * 
     * @param point1 - First point
     * @param point2 - Second point
     * @returns Midpoint
     */
    protected static getMidPoint(point1: IPoint, point2: IPoint): IPoint {
        return {
            x: (point1.x + point2.x) * 0.5,
            y: (point1.y + point2.y) * 0.5
        };
    }

    /**
     * Recursively subdivides a curve segment into line segments.
     * 
     * Uses iterative subdivision instead of recursion to avoid stack overflow.
     * 
     * @param instance - Segment to linearize
     * @returns Array of points representing the linearized curve
     */
    protected static linearizeCurve(instance: BasicSegment): IPoint[] {
        const result: IPoint[] = []; // list of points to return
        const todo: BasicSegment[] = [instance]; // list of Beziers to divide
        let segment: BasicSegment;
        let divided: BasicSegment[];

        // recursion could stack overflow, loop instead

        while (todo.length > 0) {
            segment = todo[0];

            if (segment.isFlat) {
                // reached subdivision limit
                result.push(segment.export(1));
                todo.shift();
            } else {
                divided = segment.subdivide();
                todo.splice(0, 1, ...divided);
            }
        }

        return result;
    }

    /**
     * Linearizes a simple segment into points.
     * 
     * @param data - Segment endpoint data
     * @param tolerance - Maximum deviation from true curve
     * @returns Array of points representing the linearized segment
     */
    public static lineraize(data: IBasicSegmentData, tolerance: number): IPoint[] {
        return BasicSegment.linearizeCurve(new BasicSegment(data, tolerance));
    }
}
