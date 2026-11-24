/* Bengaluru: what the shared engine and app need to know. Load before shared/engine.js. */
(function (root) {
  const PK = (root.PK = root.PK || {});
  PK.city_cfg = { id: 'bengaluru', name: 'Bengaluru', lang: 'kn', intro: [36.5, 35] };
  PK.theme = {
    ground: {"pave":"#c3bbb0","paveD":"#b1a99f","paveL":"#d0c9be","grass":"#5f9e4e","grassD":"#4c8843","grassL":"#7ab75f","lawn":"#7fbd58","lawn2":"#73b04f","road":"#5d5b66","roadD":"#52505b","plaza":"#dcd6ca","plazaD":"#c9c2b4","water":"#5f9a8c","pond":"#4a8f93","pondD":"#3f7d84","pondL":"#8ec6c4","dirt":"#c9855c","dirtD":"#b9734b","red":"#c4704e","redD":"#b36242","dgrass":"#437a41","dgrassD":"#386a38","shadow":"#2c2a4e"},
    vehicles: {"emuG":"#2f5fa8","emuY":"#e9e4d4"},
    dusk: [0.56, -0.02, 18, 0.46, -0.05, 8, 0.5, 0.1, 44],
    duskSprite: [0.56, 24, 0.46, 12, 0.56, 44],
  };
  if (typeof module !== 'undefined') module.exports = PK;
})(typeof window !== 'undefined' ? window : globalThis);
