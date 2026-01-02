import BasePacker from './base-packer';
import PlacementWrapper from './placement-wrapper';

export default class PolygonPacker extends BasePacker {
    public nest(): PlacementWrapper {
        return this.wasmNesting.nest();
    }
}
