/* script.js — logica dell'app Bloccami. Tutto avviene lato client. */

(() => {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const dropzoneEmpty = document.getElementById('dropzoneEmpty');
  const thumbPreview = document.getElementById('thumbPreview');

  const modeButtons = [...document.querySelectorAll('.mode-btn')];
  const sizePreset = document.getElementById('sizePreset');
  const customSize = document.getElementById('customSize');
  const customW = document.getElementById('customW');
  const customH = document.getElementById('customH');

  const generateBtn = document.getElementById('generateBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const downloadSchemBtn = document.getElementById('downloadSchemBtn');

  const previewCanvas = document.getElementById('previewCanvas');
  const placeholderText = document.getElementById('placeholderText');
  const statsEl = document.getElementById('stats');
  const statBlocks = document.getElementById('statBlocks');
  const statUnique = document.getElementById('statUnique');
  const statSize = document.getElementById('statSize');

  const materialsPanel = document.getElementById('materialsPanel');
  const materialsList = document.getElementById('materialsList');

  let currentImage = null;
  let currentFileBaseName = 'mapart';
  let currentMode = 'creativa';
  let result = null; // { width, height, grid: string[], counts: Map }

  // ---------- Caricamento immagine ----------

  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
  });
  dropzone.setAttribute('tabindex', '0');

  ['dragover', 'dragenter'].forEach(evt =>
    dropzone.addEventListener(evt, e => { e.preventDefault(); dropzone.classList.add('drag-over'); })
  );
  ['dragleave', 'drop'].forEach(evt =>
    dropzone.addEventListener(evt, e => { e.preventDefault(); dropzone.classList.remove('drag-over'); })
  );
  dropzone.addEventListener('drop', e => {
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) loadFile(file);
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) loadFile(fileInput.files[0]);
  });

  function loadFile(file) {
    if (!file.type.startsWith('image/')) return;
    currentFileBaseName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-z0-9_-]+/gi, '_') || 'mapart';

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        currentImage = img;
        thumbPreview.src = reader.result;
        thumbPreview.hidden = false;
        dropzoneEmpty.hidden = true;
        generateBtn.disabled = false;
        resetResult();
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  // ---------- Modalità ----------

  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      modeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMode = btn.dataset.mode;
    });
  });

  // ---------- Dimensione ----------

  sizePreset.addEventListener('change', () => {
    customSize.hidden = sizePreset.value !== 'custom';
  });

  function getTargetSize() {
    if (sizePreset.value === 'custom') {
      const w = Math.max(8, Math.min(512, parseInt(customW.value, 10) || 128));
      const h = Math.max(8, Math.min(512, parseInt(customH.value, 10) || 128));
      return { w, h };
    }
    const s = parseInt(sizePreset.value, 10);
    return { w: s, h: s };
  }

  // ---------- Generazione ----------

  generateBtn.addEventListener('click', () => {
    if (!currentImage) return;
    const { w, h } = getTargetSize();
    const palette = currentMode === 'survival'
      ? BLOCK_PALETTE.filter(b => b.survival)
      : BLOCK_PALETTE;

    result = convertImageToBlocks(currentImage, w, h, palette);
    renderPreview(result);
    renderStats(result);
    renderMaterials(result, palette);
    downloadBtn.disabled = false;
    downloadSchemBtn.disabled = false;
  });

  function colorDistance(r1, g1, b1, r2, g2, b2) {
    // Formula "redmean": approssima meglio la percezione umana del colore
    // rispetto alla semplice distanza euclidea.
    const rMean = (r1 + r2) / 2;
    const dr = r1 - r2, dg = g1 - g2, db = b1 - b2;
    return (2 + rMean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rMean) / 256) * db * db;
  }

  function findClosestBlock(r, g, b, palette) {
    let best = palette[0];
    let bestDist = Infinity;
    for (const block of palette) {
      const d = colorDistance(r, g, b, block.rgb.r, block.rgb.g, block.rgb.b);
      if (d < bestDist) { bestDist = d; best = block; }
    }
    return best;
  }

  function convertImageToBlocks(img, width, height, palette) {
    const off = document.createElement('canvas');
    off.width = width;
    off.height = height;
    const ctx = off.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    const { data } = ctx.getImageData(0, 0, width, height);
    const grid = new Array(width * height);
    const counts = new Map();

    for (let i = 0; i < width * height; i++) {
      const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2], a = data[i * 4 + 3];
      if (a < 32) { grid[i] = null; continue; }
      const block = findClosestBlock(r, g, b, palette);
      grid[i] = block;
      counts.set(block.id, (counts.get(block.id) || 0) + 1);
    }

    return { width, height, grid, counts };
  }

  // ---------- Rendering anteprima ----------

  function renderPreview({ width, height, grid }) {
    const maxDisplay = 560;
    const scale = Math.max(1, Math.floor(maxDisplay / Math.max(width, height)));

    previewCanvas.width = width * scale;
    previewCanvas.height = height * scale;
    const ctx = previewCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const block = grid[y * width + x];
        ctx.fillStyle = block ? block.hex : 'rgba(0,0,0,0)';
        if (block) ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }

    previewCanvas.style.display = 'block';
    placeholderText.hidden = true;
  }

  function renderStats({ width, height, grid, counts }) {
    const total = grid.filter(Boolean).length;
    statBlocks.textContent = total.toLocaleString('it-IT');
    statUnique.textContent = counts.size.toLocaleString('it-IT');
    statSize.textContent = `${width}×${height}`;
    statsEl.hidden = false;
  }

  function renderMaterials({ counts }, palette) {
    const byId = new Map(palette.map(b => [b.id, b]));
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);

    materialsList.innerHTML = '';
    for (const [id, count] of sorted) {
      const block = byId.get(id);
      const row = document.createElement('div');
      row.className = 'material-row';
      row.innerHTML = `
        <span class="material-swatch" style="background:${block.hex}"></span>
        <span class="material-name">${block.name}</span>
        <span class="material-count">${count.toLocaleString('it-IT')}</span>
      `;
      materialsList.appendChild(row);
    }
    materialsPanel.hidden = false;
  }

  function resetResult() {
    result = null;
    downloadBtn.disabled = true;
    downloadSchemBtn.disabled = true;
    statsEl.hidden = true;
    materialsPanel.hidden = true;
    previewCanvas.style.display = 'none';
    placeholderText.hidden = false;
  }

  // ---------- Esportazione .schem diretta ----------

  downloadSchemBtn.addEventListener('click', () => {
    if (!result) return;
    triggerDownload(
      SchemWriter.buildSchematicBlob(result),
      `${currentFileBaseName}_${currentMode}.schem`
    );
  });

  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // ---------- Esportazione pacchetto .zip completo ----------

  downloadBtn.addEventListener('click', async () => {
    if (!result) return;
    downloadBtn.disabled = true;
    downloadBtn.textContent = 'Preparazione…';

    try {
      const zip = new JSZip();
      const { width, height, grid } = result;

      // costruzione.schem — importabile direttamente in WorldEdit/Litematica
      zip.file(`${currentFileBaseName}_${currentMode}.schem`, SchemWriter.buildSchematicBlob(result));

      // anteprima.png
      const pngBlob = await new Promise(resolve => previewCanvas.toBlob(resolve, 'image/png'));
      zip.file('anteprima.png', pngBlob);

      // lista_blocchi.csv
      let csv = 'x,z,block_id\n';
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const block = grid[y * width + x];
          if (block) csv += `${x},${y},minecraft:${block.id}\n`;
        }
      }
      zip.file('lista_blocchi.csv', csv);

      // materiali.txt
      zip.file('materiali.txt', buildMaterialsText(result));

      // datapack con la funzione di costruzione (alternativa allo .schem)
      const dataFolder = zip.folder('datapack_costruzione');
      dataFolder.file('pack.mcmeta', JSON.stringify({
        pack: { pack_format: 48, description: 'Controller Map Art Generator - costruzione generata da foto' }
      }, null, 2));
      dataFolder.folder('data').folder('mapart').folder('functions')
        .file('costruisci.mcfunction', buildMcFunction(result));

      // LEGGIMI.txt
      zip.file('LEGGIMI.txt', buildReadme(result, currentMode));

      const blob = await zip.generateAsync({ type: 'blob' });
      triggerDownload(blob, `${currentFileBaseName}_${currentMode}.zip`);
    } finally {
      downloadBtn.disabled = false;
      downloadBtn.textContent = 'Scarica pacchetto .zip completo';
    }
  });

  function buildMaterialsText({ counts, width, height, grid }) {
    const byId = new Map(BLOCK_PALETTE.map(b => [b.id, b]));
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const total = grid.filter(Boolean).length;

    let text = `CONTROLLER MAP ART GENERATOR — lista materiali\n`;
    text += `Dimensione: ${width}×${height}  ·  Blocchi totali: ${total}  ·  Tipi diversi: ${counts.size}\n`;
    text += '='.repeat(50) + '\n\n';
    for (const [id, count] of sorted) {
      const block = byId.get(id);
      text += `${String(count).padStart(6, ' ')}×  ${block.name}  (minecraft:${id})\n`;
    }
    return text;
  }

  function buildMcFunction({ width, height, grid }) {
    let out = '';
    out += '# Generato da Controller Map Art Generator\n';
    out += '# Posizionati nell\'angolo in basso a sinistra della costruzione e lancia:\n';
    out += '#   /function mapart:costruisci\n\n';

    for (let z = 0; z < height; z++) {
      let x = 0;
      while (x < width) {
        const block = grid[z * width + x];
        if (!block) { x++; continue; }
        let runEnd = x;
        while (runEnd + 1 < width && grid[z * width + runEnd + 1] && grid[z * width + runEnd + 1].id === block.id) {
          runEnd++;
        }
        if (runEnd > x) {
          out += `fill ~${x} ~0 ~${z} ~${runEnd} ~0 ~${z} minecraft:${block.id}\n`;
        } else {
          out += `setblock ~${x} ~0 ~${z} minecraft:${block.id}\n`;
        }
        x = runEnd + 1;
      }
    }
    out += '\nsay Controller Map Art Generator: costruzione completata!\n';
    return out;
  }

  function buildReadme({ width, height }, mode) {
    return `CONTROLLER MAP ART GENERATOR — pacchetto di costruzione
========================================

Modalità: ${mode === 'survival' ? 'Survival (blocchi facili da ottenere)' : 'Creativa (palette completa)'}
Dimensione: ${width}×${height} blocchi

Contenuto del pacchetto
------------------------
- *.schem                importabile direttamente in WorldEdit o Litematica
- anteprima.png           immagine della costruzione, un pixel per blocco
- lista_blocchi.csv       coordinata x,z e blocco per ogni cella
- materiali.txt           quanti blocchi di ogni tipo servono
- datapack_costruzione/   alternativa allo .schem: costruisce tutto con un comando

Come usare il file .schem (consigliato)
-----------------------------------------
1. Copia il file .schem nella cartella "schematics" di WorldEdit
   (<salvataggio>/../config/worldedit/schematics/, oppure la cartella
   che usa il tuo client/plugin) oppure nella cartella di Litematica.
2. In gioco, con WorldEdit: //schem load <nome_file> poi //paste
   Con Litematica: apri il menu schematiche e carica il file, poi
   posiziona l'anteprima e piazza i blocchi.

Come costruire con il datapack (alternativa senza mod/plugin)
----------------------------------------------------------------
1. Copia la cartella "datapack_costruzione" in:
   <salvataggio>/datapacks/
2. Nel gioco esegui: /reload
3. Posizionati nel punto in cui vuoi l'angolo in basso a sinistra della
   costruzione (il blocco in coordinata 0,0), alla stessa altezza in cui
   vuoi che appaia il primo strato.
4. Esegui: /function mapart:costruisci
5. Attendi il completamento: i blocchi vengono piazzati riga per riga.

Nota: la costruzione viene generata come una singola immagine piatta
(un blocco di spessore, come una mappa art da appendere a un muro).

Nota legale: questo strumento non è un prodotto ufficiale Mojang o
Microsoft e non è collegato al team di Minecraft. I colori dei blocchi
sono approssimazioni usate solo per il riconoscimento cromatico.
`;
  }
})();
