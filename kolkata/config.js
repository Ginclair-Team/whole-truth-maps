/* Kolkata: what the shared engine and app need to know. Load before shared/engine.js. */
(function (root) {
  const PK = (root.PK = root.PK || {});
  PK.city_cfg = { id: 'kolkata', name: 'Kolkata', lang: 'bn', intro: [18, 36] };   // intro = the cell the opening shot starts on
  PK.theme = {};                                                                   // the engine's defaults are Kolkata's palette
  if (typeof module !== 'undefined') module.exports = PK;
})(typeof window !== 'undefined' ? window : globalThis);
