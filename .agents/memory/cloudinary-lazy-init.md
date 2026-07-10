---
name: Cloudinary/third-party SDK init should be lazy in route modules
description: Avoid throwing at module load time when configuring optional third-party SDKs (e.g. Cloudinary) in an Express route file.
---

Configure third-party SDKs (Cloudinary, etc.) lazily inside the function that uses them, not at module top-level.

**Why:** If a route file throws when its module is imported (e.g. missing env vars), and that router is registered unconditionally in the main route index, importing it can crash the entire Express app at boot — taking down unrelated routes too. Caught during code review of the QuizBox admin-posts/Cloudinary feature.

**How to apply:** Guard config with an `ensureConfigured()`-style function called only when an upload/API call actually happens, and return a clear error (e.g. 503) from the route handler instead of crashing the process.
