use crate::{nest_config::NestConfig, nesting::polygon_node::PolygonNode};
use std::cell::RefCell;
use std::collections::HashMap;

// Thread type constants
const THREAD_TYPE_PLACEMENT: u32 = 1;
const THREAD_TYPE_PAIR: u32 = 0;

pub struct NFPStore {
    nfp_cache: HashMap<u32, Vec<f32>>,
    nfp_pairs: Vec<Vec<f32>>,
    sources: Vec<i32>,
    rotations: Vec<u16>,
    phenotype_source: u16,
    angle_split: u8,
    config_compressed: u32,
}

// Singleton instance using thread_local
thread_local! {
    static INSTANCE: RefCell<NFPStore> = RefCell::new(NFPStore::new());
}

impl NFPStore {
    fn new() -> Self {
        NFPStore {
            nfp_cache: HashMap::new(),
            nfp_pairs: Vec::new(),
            sources: Vec::new(),
            rotations: Vec::new(),
            phenotype_source: 0,
            angle_split: 0,
            config_compressed: 0,
        }
    }

    /// Access the singleton instance
    pub fn with_instance<F, R>(f: F) -> R
    where
        F: FnOnce(&mut NFPStore) -> R,
    {
        INSTANCE.with(|instance| f(&mut instance.borrow_mut()))
    }

    pub fn init(
        &mut self,
        nodes: &[PolygonNode],
        bin_node: &PolygonNode,
        config: &NestConfig,
        phenotype_source: u16,
        sources: &[i32],
        rotations: &[u16],
    ) {
        self.config_compressed = config.serialize();
        self.phenotype_source = phenotype_source;
        self.sources = sources.to_vec();
        self.rotations = rotations.to_vec();
        self.angle_split = config.rotations;
        self.nfp_pairs.clear();

        let mut new_cache: HashMap<u32, Vec<f32>> = HashMap::new();

        for i in 0..self.sources.len() {
            let mut node = nodes[self.sources[i] as usize].clone();
            node.rotation = self.rotations[i] as f32;

            self.update_cache(bin_node, &node, true, &mut new_cache);

            for j in 0..i {
                let node_j = &nodes[sources[j] as usize];
                self.update_cache(node_j, &node, false, &mut new_cache);
            }
        }

        // Only keep cache for one cycle
        self.nfp_cache = new_cache;
    }

    pub fn update(&mut self, nfps: Vec<Vec<f32>>) {
        let nfp_count = nfps.len();

        if nfp_count != 0 {
            for nfp in nfps {
                if nfp.len() > 4 {
                    // 4 = 2 * f32 elements (2 floats for header minimum)
                    // A null nfp means the nfp could not be generated
                    // Extract key from first f32 (reinterpreted as u32) in little-endian to match TypeScript
                    let key = nfp[0].to_bits();
                    self.nfp_cache.insert(key, nfp);
                }
            }
        }
    }

    fn update_cache(
        &mut self,
        node1: &PolygonNode,
        node2: &PolygonNode,
        inside: bool,
        new_cache: &mut HashMap<u32, Vec<f32>>,
    ) {
        let key =
            PolygonNode::generate_nfp_cache_key(self.angle_split as u32, inside, node1, node2);

        if !self.nfp_cache.contains_key(&key) {
            let nodes = [node1.clone(), node2.clone()];
            let f32_buffer = Self::generate_pair(key, &nodes, self.config_compressed);
            self.nfp_pairs.push(f32_buffer);
        } else {
            if let Some(cached) = self.nfp_cache.get(&key) {
                new_cache.insert(key, cached.clone());
            }
        }
    }

    pub fn clean(&mut self) {
        self.nfp_cache.clear();
        self.nfp_pairs.clear();
        self.sources.clear();
        self.rotations.clear();
        self.phenotype_source = 0;
        self.angle_split = 0;
        self.config_compressed = 0;
    }

    pub fn get_placement_data(&self, input_nodes: &[PolygonNode], area: f32) -> Vec<f32> {
        let nfp_buffer_f32 = Self::serialize_map_to_f32(&self.nfp_cache);
        let mut nodes: Vec<PolygonNode> = Vec::new();

        for i in 0..self.sources.len() {
            let mut node = input_nodes[self.sources[i] as usize].clone();
            node.rotation = self.rotations[i] as f32;

            nodes.push(node);
        }

        Self::generate_placement_data(&nfp_buffer_f32, self.config_compressed, &nodes, area)
    }

    pub fn nfp_pairs(&self) -> &[Vec<f32>] {
        &self.nfp_pairs
    }

    pub fn nfp_pairs_count(&self) -> usize {
        self.nfp_pairs.len()
    }

    pub fn placement_count(&self) -> usize {
        self.sources.len()
    }

    pub fn phenotype_source(&self) -> u16 {
        self.phenotype_source
    }

    /// Get serialized NFP buffer from cache
    pub fn nfp_buffer(&self) -> Vec<f32> {
        Self::serialize_map_to_f32(&self.nfp_cache)
    }

    /// Generate pair data for NFP calculation
    ///
    /// Takes two nodes, rotates them, serializes with header
    pub fn generate_pair(key: u32, nodes: &[PolygonNode], config: u32) -> Vec<f32> {
        // Rotate the nodes
        let rotated_nodes = PolygonNode::rotate_nodes(nodes);

        // Serialize the nodes directly to f32 (no byte conversion needed)
        let serialized_f32 = PolygonNode::serialize_f32(&rotated_nodes, 0);

        // Create buffer with header + serialized nodes
        let mut f32_buffer = Vec::with_capacity(3 + serialized_f32.len());

        // Write header as f32 (reinterpreted from u32) in big-endian to match TypeScript DataView default
        f32_buffer.push(f32::from_bits(THREAD_TYPE_PAIR.swap_bytes()));
        f32_buffer.push(f32::from_bits(config.swap_bytes()));
        f32_buffer.push(f32::from_bits(key.swap_bytes()));

        // Append serialized f32 data directly
        f32_buffer.extend_from_slice(&serialized_f32);

        f32_buffer
    }

    /// Generate placement data for genetic algorithm
    ///
    /// Takes NFP cache buffer as f32, config, input nodes, and area
    /// Returns serialized buffer with header + NFP cache + rotated nodes as f32
    pub fn generate_placement_data(
        nfp_buffer_f32: &[f32],
        config: u32,
        input_nodes: &[PolygonNode],
        area: f32,
    ) -> Vec<f32> {
        let nodes = PolygonNode::rotate_nodes(input_nodes);

        // Serialize nodes as f32
        let nodes_f32 = PolygonNode::serialize_f32(&nodes, 0);

        // Calculate total size: 4 header f32 elements + NFP buffer + nodes
        let total_size = 4 + nfp_buffer_f32.len() + nodes_f32.len();
        let mut buffer = Vec::with_capacity(total_size);

        // Write header as f32 (reinterpreted from u32) in big-endian to match TypeScript DataView default
        buffer.push(f32::from_bits(THREAD_TYPE_PLACEMENT.swap_bytes()));
        buffer.push(f32::from_bits(config));
        buffer.push(f32::from_bits(area.to_bits()));
        // Write buffer size in bytes (not f32 count) to match PlaceContent::init expectations
        let buffer_size_bytes = (nfp_buffer_f32.len() * std::mem::size_of::<f32>()) as u32;
        buffer.push(f32::from_bits(buffer_size_bytes));

        // Append NFP cache buffer directly as f32
        buffer.extend_from_slice(nfp_buffer_f32);

        // Append serialized nodes as f32
        buffer.extend_from_slice(&nodes_f32);

        buffer
    }

    fn serialize_map_to_f32(map: &HashMap<u32, Vec<f32>>) -> Vec<f32> {
        // Calculate total size in f32 elements: 2 per entry (key + length) + data
        let total_size: usize = map
            .values()
            .map(|buffer| 2 + buffer.len()) // 2 f32 elements for key + length
            .sum();

        let mut result = Vec::with_capacity(total_size);

        // Sort keys to ensure consistent order
        let mut sorted_keys: Vec<&u32> = map.keys().collect();
        sorted_keys.sort();

        for key in sorted_keys {
            let buffer = &map[key];

            // Write key as f32 (reinterpreted from u32) in big-endian to match how keys are stored in cache
            result.push(f32::from_bits(*key));

            // Write length in bytes as f32 (reinterpreted from u32) in big-endian to match TypeScript DataView
            let length_bytes = (buffer.len() * std::mem::size_of::<f32>()) as u32;
            result.push(f32::from_bits(length_bytes));

            // Write buffer data directly as f32
            result.extend_from_slice(buffer);
        }

        result
    }
}
