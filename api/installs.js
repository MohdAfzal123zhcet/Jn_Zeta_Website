// POST /api/installs -> counts one install. The EviLock app calls this once, the first time it
// is opened, and remembers inside the app that it has done so. Nothing identifying is sent.
// GET  /api/installs -> { downloads, installs }
import { counterHandler, KEYS } from "./_counter.js";

export default counterHandler(KEYS.installs);
