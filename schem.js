/*
 * schem.js — scrive file .schem (Sponge Schematic v2) direttamente nel
 * browser: un piccolo writer NBT big-endian, compresso con gzip tramite
 * pako. Il risultato è importabile in WorldEdit ( //schem load ) o in
 * Litematica, esattamente come un file generato da mcschematic in Python.
 */

(() => {
  const TAG = {
    End: 0, Byte: 1, Short: 2, Int: 3, Long: 4, Float: 5, Double: 6,
    ByteArray: 7, String: 8, List: 9, Compound: 10, IntArray: 11, LongArray: 12
  };

  class ByteWriter {
    constructor() { this.chunks = []; this.length = 0; }
    _push(arr) { this.chunks.push(arr); this.length += arr.length; }
    writeByte(v) { this._push(Uint8Array.of(v & 0xFF)); }
    writeShort(v) {
      const b = new Uint8Array(2);
      new DataView(b.buffer).setInt16(0, v, false);
      this._push(b);
    }
    writeInt(v) {
      const b = new Uint8Array(4);
      new DataView(b.buffer).setInt32(0, v, false);
      this._push(b);
    }
    writeUTF(str) {
      const bytes = new TextEncoder().encode(str);
      this.writeShort(bytes.length);
      this._push(bytes);
    }
    writeRaw(uint8arr) { this._push(uint8arr); }
    toUint8Array() {
      const out = new Uint8Array(this.length);
      let offset = 0;
      for (const c of this.chunks) { out.set(c, offset); offset += c.length; }
      return out;
    }
  }

  function tagHeader(w, type, name) { w.writeByte(type); w.writeUTF(name); }
  function writeIntTag(w, name, value) { tagHeader(w, TAG.Int, name); w.writeInt(value); }
  function writeShortTag(w, name, value) { tagHeader(w, TAG.Short, name); w.writeShort(value); }

  function writeIntArrayTag(w, name, arr) {
    tagHeader(w, TAG.IntArray, name);
    w.writeInt(arr.length);
    for (const v of arr) w.writeInt(v);
  }

  function writeByteArrayTag(w, name, bytes) {
    tagHeader(w, TAG.ByteArray, name);
    w.writeInt(bytes.length);
    w.writeRaw(bytes);
  }

  function writeEmptyListTag(w, name, elementType) {
    tagHeader(w, TAG.List, name);
    w.writeByte(elementType);
    w.writeInt(0);
  }

  function writePaletteTag(w, name, paletteMap) {
    tagHeader(w, TAG.Compound, name);
    for (const [blockId, index] of paletteMap.entries()) {
      writeIntTag(w, blockId, index);
    }
    w.writeByte(TAG.End);
  }

  // VarInt "protocol style": 7 bit per byte, bit più significativo come
  // flag di continuazione — è il formato richiesto da BlockData.
  function encodeVarInt(value, out) {
    let v = value >>> 0;
    while (true) {
      if ((v & ~0x7F) === 0) { out.push(v); return; }
      out.push((v & 0x7F) | 0x80);
      v >>>= 7;
    }
  }

  /**
   * result: { width, height, grid } — grid è un array width*height,
   * ogni cella è { id: 'white_wool', ... } oppure null (aria/trasparente).
   * La griglia è già in ordine riga per riga (z esterno, x interno),
   * che corrisponde esattamente all'ordine richiesto da BlockData
   * quando Height (asse Y) vale 1.
   */
  function buildSchematicBytes({ width, height: rows, grid }, { dataVersion = 3465 } = {}) {
    const paletteMap = new Map();
    if (grid.some(c => !c)) paletteMap.set('minecraft:air', 0);

    const blockDataBytes = [];
    for (let i = 0; i < grid.length; i++) {
      const cell = grid[i];
      const fullId = cell ? `minecraft:${cell.id}` : 'minecraft:air';
      if (!paletteMap.has(fullId)) paletteMap.set(fullId, paletteMap.size);
      encodeVarInt(paletteMap.get(fullId), blockDataBytes);
    }

    const w = new ByteWriter();
    tagHeader(w, TAG.Compound, ''); // tag radice senza nome

    writeIntTag(w, 'Version', 2);
    writeIntTag(w, 'DataVersion', dataVersion);
    writeShortTag(w, 'Width', width);
    writeShortTag(w, 'Height', 1);
    writeShortTag(w, 'Length', rows);
    writeIntArrayTag(w, 'Offset', [0, 0, 0]);
    writeIntTag(w, 'PaletteMax', paletteMap.size);
    writePaletteTag(w, 'Palette', paletteMap);
    writeByteArrayTag(w, 'BlockData', Uint8Array.from(blockDataBytes));
    writeEmptyListTag(w, 'BlockEntities', TAG.Compound);

    w.writeByte(TAG.End); // chiude il compound radice
    return w.toUint8Array();
  }

  function buildSchematicBlob(result, options) {
    const nbtBytes = buildSchematicBytes(result, options);
    const gzipped = pako.gzip(nbtBytes);
    return new Blob([gzipped], { type: 'application/octet-stream' });
  }

  window.SchemWriter = { buildSchematicBlob };
})();
