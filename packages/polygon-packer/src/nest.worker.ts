import WasmNesting from "./wasm-nesting";

const wasmNesting = new WasmNesting();

self.onmessage = (event: MessageEvent<ArrayBuffer>) => {
    if (wasmNesting.isInitialized) {
        const buffer = wasmNesting.calculate_wasm(new Uint8Array(event.data)).buffer as ArrayBuffer;
        //@ts-ignore
        self.postMessage(buffer, [buffer]);
    } else {
        wasmNesting.init(event.data).then(() => self.postMessage(''));
    }
};
