import Parallel from './parallel';
import { DisplayCallback, f32, NestConfig, u32, usize } from './types';
import BasePacker from './base-packer';
export default class PolygonPacker extends BasePacker {
    #isWorking: boolean = false;

    #progress: f32 = 0;

    #workerTimer: u32 = 0;

    #paralele: Parallel = new Parallel();

    #workersReady = false;

    #chunkSize: usize = 512;

    // progressCallback is called when progress is made
    // displayCallback is called when a new placement has been made
    public start(
        configuration: NestConfig,
        polygons: Float32Array[],
        binPolygon: Float32Array,
        progressCallback?: (progress: f32) => void,
        displayCallback?: DisplayCallback
    ): void {
        super.start(configuration, polygons, binPolygon);

        this.#isWorking = true;

        this.#launchWorkers(displayCallback);

        this.#workerTimer = setInterval(() => progressCallback(this.#progress), 100) as unknown as u32;
    }

    public stop(isClean: boolean): void {
        if (!this.#isWorking) {
            return;
        }

        this.#isWorking = false;

        if (this.#workerTimer) {
            clearInterval(this.#workerTimer);
            this.#workerTimer = 0;
        }

        this.#paralele.terminate();
        this.#setupWorkers();

        if (isClean) {
            super.stop(isClean);
        }
    }

    protected async initWasm() {
        await super.initWasm();
        this.#setupWorkers();
    }

    async #setupWorkers() {
        this.#workersReady = false;
        this.#paralele.start(
            new Array(this.#paralele.threadCount).fill(0).map(() => this.cloneWasmBuffer()),
            () => {
                this.#workersReady = true;
            },
            this.#onError
        );
    }

    #onSpawn = (_: number, progress: number): void => {
        this.#progress = progress;
    };

    #launchWorkers(displayCallback: DisplayCallback) {
        const serializedPairs = this.wasmNesting.getPairs(this.#chunkSize);
        const pairs = serializedPairs.map(pair => pair.buffer as ArrayBuffer);
        //console.log(pairs.map(p => p.byteLength));
        this.#paralele.start(
            pairs,
            (generatedNfp: ArrayBuffer[]) => this.#onPair(generatedNfp, displayCallback),
            this.#onError,
            this.#onSpawn
        );
    }

    #onError(error: ErrorEvent) {
        console.log(error);
    }

    #onPair(generatedNfp: ArrayBuffer[], displayCallback: DisplayCallback): void {
        const placementData = this.wasmNesting.getPlacementData(generatedNfp);

        this.#paralele.start(
            [placementData.buffer as ArrayBuffer],
            (placements: ArrayBuffer[]) => this.#onPlacement(placements, displayCallback),
            this.#onError
        );
    }

    #onPlacement(placements: ArrayBuffer[], displayCallback: DisplayCallback): void {
        if (placements.length === 0) {
            return;
        }

        if (this.#isWorking) {
            const placementWrapper = this.wasmNesting.getPlacementResult(placements);

            displayCallback(placementWrapper);
            this.#launchWorkers(displayCallback);
        }
    }
}
