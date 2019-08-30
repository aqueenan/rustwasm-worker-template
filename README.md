# 👷‍♀️🦀🕸️ `rustwasm-static-template`

A template for kick starting a Cloudflare-hosted static website project using
[`wasm-pack`](https://github.com/rustwasm/wasm-pack).

This template is designed for serving the gzipped contents of the public
folder from WebAssembly on Cloudflare's worker infrastructure to ensure
blazingly-fast cold and warm response times.

## 🔋 Batteries Included

* [`wasm-bindgen`](https://github.com/rustwasm/wasm-bindgen) for communicating
  between WebAssembly and JavaScript.
* [`console_error_panic_hook`](https://github.com/rustwasm/console_error_panic_hook)
  for logging panic messages to the developer console.
* [`wee_alloc`](https://github.com/rustwasm/wee_alloc), an allocator optimized
  for small code size.

## 🚴 Usage

### 🐑 Use `wrangler generate` to Clone this Template

[Learn more about `wrangler generate` here.](https://github.com/cloudflare/wrangler)

```
wrangler generate wasm-worker  https://github.com/aqueenan/rustwasm-static-template.git
cd wasm-worker
```

### 🛠️ Build with `wasm-pack build`

```
wasm-pack build
```

### 🔬 Test in Headless Browsers with `wasm-pack test`

```
wasm-pack test --headless --firefox
```
