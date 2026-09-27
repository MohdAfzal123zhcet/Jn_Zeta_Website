// GET  /api/downloads -> { downloads, installs }
// POST /api/downloads -> counts one download (the browser only sends this once, see app.js)
import { counterHandler, KEYS } from "./_counter.js";

export default counterHandler(KEYS.downloads);
