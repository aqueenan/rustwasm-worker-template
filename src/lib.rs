use cfg_if::cfg_if;
use js_sys::Uint8Array;
use wasm_bindgen::prelude::*;

cfg_if! {
    // When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
    // allocator.
    if #[cfg(feature = "wee_alloc")] {
        extern crate wee_alloc;
        #[global_allocator]
        static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;
    }
}

include!(concat!(env!("OUT_DIR"), "/public.rs"));

#[wasm_bindgen]
pub fn lookup(name: &str) -> Option<Uint8Array> {
    let path = ["public", &name].concat();
    let bytes = PUBLIC.get(&path).ok()?;
    Some(Uint8Array::from(bytes.as_ref()))
}
