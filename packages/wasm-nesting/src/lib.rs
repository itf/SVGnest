use wasm_bindgen::prelude::*;
use web_sys::js_sys::{Float32Array, Uint8Array};

pub mod clipper;
pub mod clipper_wrapper;
pub mod constants;
pub mod genetic_algorithm;
pub mod geometry;
pub mod nest_config;
pub mod nesting;
pub mod utils;
pub mod wasm_packer;

use crate::utils::bit_ops::*;

#[wasm_bindgen]
pub fn set_bits_u32(source: u32, value: u16, index: u8, bit_count: u8) -> u32 {
    set_bits(source, value, index, bit_count)
}

/// WASM wrapper for calculate function
///
/// Main calculation function that routes to either pair_data or place_paths
/// based on the thread type in the buffer.
///
/// Port of TypeScript calculate function from worker-flow/index.ts
///
/// Arguments:
/// - buffer: Uint8Array where first 4 bytes (u32 big-endian) indicate thread type
///   - 0 = PAIR (calls pair_data)
///   - 1 = PLACEMENT (calls place_paths)
///
/// Returns: Float32Array containing result from either pair_data or place_paths
#[wasm_bindgen]
pub fn calculate_wasm(buffer: &[f32]) -> Float32Array {
    let result = crate::nesting::calculate::calculate(buffer);
    let out = Float32Array::new_with_length(result.len() as u32);
    out.copy_from(&result);
    out
}

// WasmPacker WASM wrappers

#[wasm_bindgen]
pub fn wasm_packer_init(configuration: u32, polygon_data: &[f32], sizes: &[u16]) {
    use crate::wasm_packer::WasmPacker;

    WasmPacker::with_instance(|packer| {
        packer.init(configuration, polygon_data, sizes);
    });
}

#[wasm_bindgen]
pub fn wasm_packer_get_pairs() -> Float32Array {
    use crate::wasm_packer::WasmPacker;

    let result = WasmPacker::with_instance(|packer| packer.get_pairs());

    let out = Float32Array::new_with_length(result.len() as u32);
    out.copy_from(&result);
    out
}

#[wasm_bindgen]
pub fn wasm_packer_get_placement_data(generated_nfp: &[f32], sizes: &[u16]) -> Float32Array {
    use crate::wasm_packer::WasmPacker;

    // Parse the flat f32 array into Vec<Vec<f32>> using explicit sizes array
    let mut nfp_vec: Vec<Vec<f32>> = Vec::with_capacity(sizes.len());
    let mut offset = 0usize;

    for &s in sizes {
        let size = s as usize;
        if offset + size > generated_nfp.len() {
            // Defensive: stop if sizes do not match data length
            break;
        }
        let nfp = generated_nfp[offset..offset + size].to_vec();
        offset += size;
        nfp_vec.push(nfp);
    }

    let result = WasmPacker::with_instance(|packer| packer.get_placement_data(nfp_vec));

    let out = Float32Array::new_with_length(result.len() as u32);
    out.copy_from(&result);
    out
}

#[wasm_bindgen]
pub fn wasm_packer_get_placement_result(placements: &[f32]) -> Uint8Array {
    use crate::wasm_packer::WasmPacker;

    // Parse the flat f32 array into Vec<Vec<f32>>
    // Format: count (u32 as f32) + [size (u32 as f32) + data] for each item
    let mut placements_vec: Vec<Vec<f32>> = Vec::new();
    let count = placements[0].to_bits() as usize;
    let mut offset = 1;

    for _ in 0..count {
        let size = placements[offset].to_bits() as usize;
        offset += 1;
        let placement = placements[offset..offset + size].to_vec();
        offset += size;
        placements_vec.push(placement);
    }

    let result = WasmPacker::with_instance(|packer| packer.get_placement_result(placements_vec));

    let out = Uint8Array::new_with_length(result.len() as u32);
    out.copy_from(&result);
    out
}

#[wasm_bindgen]
pub fn wasm_packer_stop() {
    use crate::wasm_packer::WasmPacker;

    WasmPacker::with_instance(|packer| {
        packer.stop();
    });
}

#[wasm_bindgen]
pub fn wasm_packer_pair_count() -> usize {
    use crate::wasm_packer::WasmPacker;

    WasmPacker::with_instance(|packer| packer.pair_count())
}
