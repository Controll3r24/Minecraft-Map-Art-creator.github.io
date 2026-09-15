(() => {
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("fileInput");
  const dropzoneEmpty = document.getElementById("dropzoneEmpty");
  const dropzoneLoaded = document.getElementById("dropzoneLoaded");
  const dropzoneFileName = document.getElementById("dropzoneFileName");
  const cropField = document.getElementById("cropField");
  const cropCanvas = document.getElementById("cropCanvas");
  const cropModeSelect = document.getElementById("cropMode");
  const zoomRow = document.getElementById("zoomRow");
  const cropZoom = document.getElementById("cropZoom");
  const cropResetBtn = document.getElementById("cropResetBtn");
  const miniPreviewCanvas = document.getElementById("miniPreviewCanvas");
  const modeButtons = [ ...document.querySelectorAll(".mode-btn") ];
  const sizePreset = document.getElementById("sizePreset");
  const customSize = document.getElementById("customSize");
  const customW = document.getElementById("customW");
  const customH = document.getElementById("customH");
  const generateBtn = document.getElementById("generateBtn");
  const downloadBtn = document.getElementById("downloadBtn");
  const downloadSchemBtn = document.getElementById("downloadSchemBtn");
  const previewCanvas = document.getElementById("previewCanvas");
  const placeholderText = document.getElementById("placeholderText");
  const statsEl = document.getElementById("stats");
  const statBlocks = document.getElementById("statBlocks");
  const statUnique = document.getElementById("statUnique");
  const statSize = document.getElementById("statSize");
  const materialsPanel = document.getElementById("materialsPanel");
  const materialsList = document.getElementById("materialsList");
  const historyTrack = document.getElementById("historyTrack");
  const historyEmpty = document.getElementById("historyEmpty");
  const heroStats = document.getElementById("heroStats");
  const statBuildsCount = document.getElementById("statBuildsCount");
  const statVisitsCount = document.getElementById("statVisitsCount");
  const heroStatsScope = document.getElementById("heroStatsScope");
  const nicknameModalBackdrop = document.getElementById("nicknameModalBackdrop");
  const nicknameInput = document.getElementById("nicknameInput");
  const modalSaveBtn = document.getElementById("modalSaveBtn");
  const modalSkipBtn = document.getElementById("modalSkipBtn");
  let currentImage = null;
  let currentFileBaseName = "mapart";
  let currentMode = "creativa";
  let result = null;
  const cropState = {
    mode: "cover",
    cx: 0,
    cy: 0,
    zoom: 1
  };
  let dragging = false;
  let dragStart = null;
  const HISTORY_PROMPT_ENABLED = false;
  dropzone.addEventListener("click", () => fileInput.click());
  dropzone.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInput.click();
    }
  });
  dropzone.setAttribute("tabindex", "0");
  [ "dragover", "dragenter" ].forEach(evt => dropzone.addEventListener(evt, e => {
    e.preventDefault();
    dropzone.classList.add("drag-over");
  }));
  [ "dragleave", "drop" ].forEach(evt => dropzone.addEventListener(evt, e => {
    e.preventDefault();
    dropzone.classList.remove("drag-over");
  }));
  dropzone.addEventListener("drop", e => {
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) loadFile(file);
  });
  fileInput.addEventListener("change", () => {
    if (fileInput.files[0]) loadFile(fileInput.files[0]);
  });
  function loadFile(file) {
    if (!file.type.startsWith("image/")) return;
    currentFileBaseName = file.name.replace(/\.[^.]+$/, "").replace(/[^a-z0-9_-]+/gi, "_") || "mapart";
    const reader = new FileReader;
    reader.onload = () => {
      const img = new Image;
      img.onload = () => {
        currentImage = img;
        dropzoneEmpty.hidden = true;
        dropzoneLoaded.hidden = false;
        dropzoneFileName.textContent = file.name;
        cropField.hidden = false;
        generateBtn.disabled = false;
        resetResult();
        resetCropToDefault();
        drawCropper();
        scheduleMiniPreview();
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }
  function getTargetAspect() {
    const {w: w, h: h} = getTargetSize();
    return w / h;
  }
  function computeCoverBox(imgW, imgH, aspect) {
    let boxW, boxH;
    if (imgW / imgH > aspect) {
      boxH = imgH;
      boxW = imgH * aspect;
    } else {
      boxW = imgW;
      boxH = imgW / aspect;
    }
    return {
      boxW: boxW,
      boxH: boxH
    };
  }
  function clampCropCenter(cx, cy, boxW, boxH, imgW, imgH) {
    const minCx = boxW / 2, maxCx = imgW - boxW / 2;
    const minCy = boxH / 2, maxCy = imgH - boxH / 2;
    return {
      cx: Math.min(Math.max(cx, minCx), maxCx),
      cy: Math.min(Math.max(cy, minCy), maxCy)
    };
  }
  function currentCropRect() {
    const aspect = getTargetAspect();
    const {boxW: coverW, boxH: coverH} = computeCoverBox(currentImage.naturalWidth, currentImage.naturalHeight, aspect);
    const boxW = coverW / cropState.zoom;
    const boxH = coverH / cropState.zoom;
    const center = clampCropCenter(cropState.cx, cropState.cy, boxW, boxH, currentImage.naturalWidth, currentImage.naturalHeight);
    cropState.cx = center.cx;
    cropState.cy = center.cy;
    return {
      x: center.cx - boxW / 2,
      y: center.cy - boxH / 2,
      w: boxW,
      h: boxH
    };
  }
  function resetCropToDefault() {
    if (!currentImage) return;
    cropState.cx = currentImage.naturalWidth / 2;
    cropState.cy = currentImage.naturalHeight / 2;
    cropState.zoom = 1;
    cropZoom.value = "1";
  }
  cropModeSelect.addEventListener("change", () => {
    cropState.mode = cropModeSelect.value;
    const interactive = cropState.mode === "cover";
    zoomRow.hidden = !interactive;
    cropCanvas.style.cursor = interactive ? "grab" : "default";
    drawCropper();
    scheduleMiniPreview();
  });
  cropZoom.addEventListener("input", () => {
    cropState.zoom = parseFloat(cropZoom.value) || 1;
    drawCropper();
    scheduleMiniPreview();
  });
  cropResetBtn.addEventListener("click", () => {
    resetCropToDefault();
    drawCropper();
    scheduleMiniPreview();
  });
  function onTargetSizeChanged() {
    if (!currentImage) return;
    resetCropToDefault();
    drawCropper();
    scheduleMiniPreview();
  }
  cropCanvas.addEventListener("pointerdown", e => {
    if (cropState.mode !== "cover") return;
    dragging = true;
    dragStart = {
      x: e.clientX,
      y: e.clientY,
      cx: cropState.cx,
      cy: cropState.cy
    };
    cropCanvas.setPointerCapture(e.pointerId);
  });
  cropCanvas.addEventListener("pointermove", e => {
    if (!dragging || !currentImage) return;
    const displayScale = getCropDisplayScale();
    const dx = (e.clientX - dragStart.x) / displayScale;
    const dy = (e.clientY - dragStart.y) / displayScale;
    cropState.cx = dragStart.cx - dx;
    cropState.cy = dragStart.cy - dy;
    drawCropper();
    scheduleMiniPreview();
  });
  [ "pointerup", "pointercancel", "pointerleave" ].forEach(evt => cropCanvas.addEventListener(evt, () => {
    dragging = false;
  }));
  function getCropDisplayScale() {
    if (!currentImage) return 1;
    return Math.min(cropCanvas.width / currentImage.naturalWidth, cropCanvas.height / currentImage.naturalHeight);
  }
  function drawCropper() {
    if (!currentImage) return;
    const ctx = cropCanvas.getContext("2d");
    const scale = getCropDisplayScale();
    const dispW = currentImage.naturalWidth * scale;
    const dispH = currentImage.naturalHeight * scale;
    const dx = (cropCanvas.width - dispW) / 2;
    const dy = (cropCanvas.height - dispH) / 2;
    ctx.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, cropCanvas.width, cropCanvas.height);
    ctx.drawImage(currentImage, dx, dy, dispW, dispH);
    if (cropState.mode !== "cover") return;
    const rect = currentCropRect();
    const rx = dx + rect.x * scale;
    const ry = dy + rect.y * scale;
    const rw = rect.w * scale;
    const rh = rect.h * scale;
    ctx.fillStyle = "rgba(10,10,11,0.65)";
    ctx.fillRect(0, 0, cropCanvas.width, cropCanvas.height);
    ctx.save();
    ctx.beginPath();
    ctx.rect(rx, ry, rw, rh);
    ctx.clip();
    ctx.drawImage(currentImage, dx, dy, dispW, dispH);
    ctx.restore();
    ctx.strokeStyle = "#4fd1c5";
    ctx.lineWidth = 2;
    ctx.strokeRect(rx, ry, rw, rh);
  }
  function paintSourceRegion(ctx, width, height) {
    ctx.clearRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    if (cropState.mode === "stretch") {
      ctx.drawImage(currentImage, 0, 0, width, height);
      return;
    }
    if (cropState.mode === "contain") {
      const scale = Math.min(width / currentImage.naturalWidth, height / currentImage.naturalHeight);
      const drawW = currentImage.naturalWidth * scale;
      const drawH = currentImage.naturalHeight * scale;
      const offX = (width - drawW) / 2;
      const offY = (height - drawH) / 2;
      ctx.drawImage(currentImage, 0, 0, currentImage.naturalWidth, currentImage.naturalHeight, offX, offY, drawW, drawH);
      return;
    }
    const rect = currentCropRect();
    ctx.drawImage(currentImage, rect.x, rect.y, rect.w, rect.h, 0, 0, width, height);
  }
  modeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      modeButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentMode = btn.dataset.mode;
      scheduleMiniPreview();
    });
  });
  sizePreset.addEventListener("change", () => {
    customSize.hidden = sizePreset.value !== "custom";
    onTargetSizeChanged();
  });
  customW.addEventListener("change", onTargetSizeChanged);
  customH.addEventListener("change", onTargetSizeChanged);
  function getTargetSize() {
    if (sizePreset.value === "custom") {
      const w = Math.max(8, Math.min(512, parseInt(customW.value, 10) || 128));
      const h = Math.max(8, Math.min(512, parseInt(customH.value, 10) || 128));
      return {
        w: w,
        h: h
      };
    }
    const s = parseInt(sizePreset.value, 10);
    return {
      w: s,
      h: s
    };
  }
  function colorDistance(r1, g1, b1, r2, g2, b2) {
    const rMean = (r1 + r2) / 2;
    const dr = r1 - r2, dg = g1 - g2, db = b1 - b2;
    return (2 + rMean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rMean) / 256) * db * db;
  }
  function findClosestBlock(r, g, b, palette) {
    let best = palette[0];
    let bestDist = Infinity;
    for (const block of palette) {
      const d = colorDistance(r, g, b, block.rgb.r, block.rgb.g, block.rgb.b);
      if (d < bestDist) {
        bestDist = d;
        best = block;
      }
    }
    return best;
  }
  function convertToBlocks(width, height, palette) {
    const off = document.createElement("canvas");
    off.width = width;
    off.height = height;
    const ctx = off.getContext("2d", {
      willReadFrequently: true
    });
    paintSourceRegion(ctx, width, height);
    const {data: data} = ctx.getImageData(0, 0, width, height);
    const grid = new Array(width * height);
    const counts = new Map;
    for (let i = 0; i < width * height; i++) {
      const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2], a = data[i * 4 + 3];
      if (a < 32) {
        grid[i] = null;
        continue;
      }
      const block = findClosestBlock(r, g, b, palette);
      grid[i] = block;
      counts.set(block.id, (counts.get(block.id) || 0) + 1);
    }
    return {
      width: width,
      height: height,
      grid: grid,
      counts: counts
    };
  }
  function paletteForMode(mode) {
    return mode === "survival" ? BLOCK_PALETTE.filter(b => b.survival) : BLOCK_PALETTE;
  }
  let miniPreviewTimer = null;
  function scheduleMiniPreview() {
    if (!currentImage) return;
    clearTimeout(miniPreviewTimer);
    miniPreviewTimer = setTimeout(renderMiniPreview, 120);
  }
  function renderMiniPreview() {
    const {w: w, h: h} = getTargetSize();
    const cap = 56;
    const scale = Math.min(1, cap / Math.max(w, h));
    const miniW = Math.max(4, Math.round(w * scale));
    const miniH = Math.max(4, Math.round(h * scale));
    const miniResult = convertToBlocks(miniW, miniH, paletteForMode(currentMode));
    const displayScale = Math.max(2, Math.floor(180 / Math.max(miniW, miniH)));
    miniPreviewCanvas.width = miniW * displayScale;
    miniPreviewCanvas.height = miniH * displayScale;
    const ctx = miniPreviewCanvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    for (let y = 0; y < miniH; y++) {
      for (let x = 0; x < miniW; x++) {
        const block = miniResult.grid[y * miniW + x];
        if (!block) continue;
        ctx.fillStyle = block.hex;
        ctx.fillRect(x * displayScale, y * displayScale, displayScale, displayScale);
      }
    }
  }
  generateBtn.addEventListener("click", () => {
    if (!currentImage) return;
    const {w: w, h: h} = getTargetSize();
    result = convertToBlocks(w, h, paletteForMode(currentMode));
    renderPreview(result);
    renderStats(result);
    renderMaterials(result, paletteForMode(currentMode));
    downloadBtn.disabled = false;
    downloadSchemBtn.disabled = false;
  });
  function renderPreview({width: width, height: height, grid: grid}) {
    const maxDisplay = 560;
    const scale = Math.max(1, Math.floor(maxDisplay / Math.max(width, height)));
    previewCanvas.width = width * scale;
    previewCanvas.height = height * scale;
    const ctx = previewCanvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const block = grid[y * width + x];
        if (!block) continue;
        ctx.fillStyle = block.hex;
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
    previewCanvas.style.display = "block";
    placeholderText.hidden = true;
  }
  function renderStats({width: width, height: height, grid: grid, counts: counts}) {
    const total = grid.filter(Boolean).length;
    statBlocks.textContent = total.toLocaleString("it-IT");
    statUnique.textContent = counts.size.toLocaleString("it-IT");
    statSize.textContent = `${width}×${height}`;
    statsEl.hidden = false;
  }
  function renderMaterials({counts: counts}, palette) {
    const byId = new Map(palette.map(b => [ b.id, b ]));
    const sorted = [ ...counts.entries() ].sort((a, b) => b[1] - a[1]);
    materialsList.innerHTML = "";
    for (const [id, count] of sorted) {
      const block = byId.get(id);
      const row = document.createElement("div");
      row.className = "material-row";
      row.innerHTML = `\n        <span class="material-swatch">${blockCubeSVG(block.hex)}</span>\n        <span class="material-name"></span>\n        <span class="material-count"></span>\n      `;
      row.querySelector(".material-name").textContent = block.name;
      row.querySelector(".material-count").textContent = count.toLocaleString("it-IT");
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
    previewCanvas.style.display = "none";
    placeholderText.hidden = false;
  }
  function askToSaveHistory() {
    return new Promise(resolve => {
      nicknameInput.value = "";
      nicknameModalBackdrop.hidden = false;
      nicknameInput.focus();
      function cleanup(choice) {
        nicknameModalBackdrop.hidden = true;
        modalSaveBtn.removeEventListener("click", onSave);
        modalSkipBtn.removeEventListener("click", onSkip);
        resolve(choice);
      }
      function onSave() {
        cleanup({
          save: true,
          nickname: nicknameInput.value
        });
      }
      function onSkip() {
        cleanup({
          save: false
        });
      }
      modalSaveBtn.addEventListener("click", onSave);
      modalSkipBtn.addEventListener("click", onSkip);
    });
  }
  async function maybeSaveToHistory(choice, pngBlob, schemBlob) {
    if (!choice.save || !window.CMAGHistory) return;
    try {
      await CMAGHistory.saveEntry({
        pngBlob: pngBlob,
        schemBlob: schemBlob,
        nickname: choice.nickname,
        baseName: currentFileBaseName,
        mode: currentMode,
        width: result.width,
        height: result.height
      });
      await refreshHistoryCarousel();
    } catch (err) {
      console.warn("Salvataggio nella cronologia non riuscito:", err);
    }
  }
  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
  downloadSchemBtn.addEventListener("click", async () => {
    if (!result) return;
    const schemBlob = SchemWriter.buildSchematicBlob(result);
    if (HISTORY_PROMPT_ENABLED) {
      const choice = await askToSaveHistory();
      if (choice.save) {
        const pngBlob = await new Promise(resolve => previewCanvas.toBlob(resolve, "image/png"));
        await maybeSaveToHistory(choice, pngBlob, schemBlob);
      }
    }
    triggerDownload(schemBlob, `${currentFileBaseName}_${currentMode}.schem`);
    if (window.CMAGHistory) {
      CMAGHistory.recordBuild().then(refreshStatsBar);
    }
  });
  downloadBtn.addEventListener("click", async () => {
    if (!result) return;
    const choice = HISTORY_PROMPT_ENABLED ? await askToSaveHistory() : {
      save: false
    };
    downloadBtn.disabled = true;
    downloadBtn.textContent = "Preparazione…";
    try {
      const zip = new JSZip;
      const {width: width, height: height, grid: grid} = result;
      const slugBase = `${currentFileBaseName}_${currentMode}`;
      const schemBlob = SchemWriter.buildSchematicBlob(result);
      const pngBlob = await new Promise(resolve => previewCanvas.toBlob(resolve, "image/png"));
      zip.folder("build").file(`${slugBase}.png`, pngBlob);
      zip.folder("build-schematic").file(`${slugBase}.schem`, schemBlob);
      let csv = "x,z,block_id\n";
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const block = grid[y * width + x];
          if (block) csv += `${x},${y},minecraft:${block.id}\n`;
        }
      }
      zip.file("lista_blocchi.csv", csv);
      zip.file("materiali.txt", buildMaterialsText(result));
      const dataFolder = zip.folder("datapack_costruzione");
      dataFolder.file("pack.mcmeta", JSON.stringify({
        pack: {
          pack_format: 48,
          description: "Controller Map Art Generator - costruzione generata da foto"
        }
      }, null, 2));
      dataFolder.folder("data").folder("mapart").folder("functions").file("costruisci.mcfunction", buildMcFunction(result));
      zip.file("LEGGIMI.txt", buildReadme(result, currentMode));
      if (HISTORY_PROMPT_ENABLED) await maybeSaveToHistory(choice, pngBlob, schemBlob);
      const blob = await zip.generateAsync({
        type: "blob"
      });
      triggerDownload(blob, `${slugBase}.zip`);
      if (window.CMAGHistory) {
        CMAGHistory.recordBuild().then(refreshStatsBar);
      }
    } finally {
      downloadBtn.disabled = false;
      downloadBtn.textContent = "Scarica pacchetto .zip completo";
    }
  });
  function buildMaterialsText({counts: counts, width: width, height: height, grid: grid}) {
    const byId = new Map(BLOCK_PALETTE.map(b => [ b.id, b ]));
    const sorted = [ ...counts.entries() ].sort((a, b) => b[1] - a[1]);
    const total = grid.filter(Boolean).length;
    let text = `CONTROLLER MAP ART GENERATOR — lista materiali\n`;
    text += `Dimensione: ${width}×${height}  ·  Blocchi totali: ${total}  ·  Tipi diversi: ${counts.size}\n`;
    text += "=".repeat(50) + "\n\n";
    for (const [id, count] of sorted) {
      const block = byId.get(id);
      text += `${String(count).padStart(6, " ")}×  ${block.name}  (minecraft:${id})\n`;
    }
    return text;
  }
  function buildMcFunction({width: width, height: height, grid: grid}) {
    let out = "";
    out += "# Generato da Controller Map Art Generator\n";
    out += "# Posizionati nell'angolo in basso a sinistra della costruzione e lancia:\n";
    out += "#   /function mapart:costruisci\n\n";
    for (let z = 0; z < height; z++) {
      let x = 0;
      while (x < width) {
        const block = grid[z * width + x];
        if (!block) {
          x++;
          continue;
        }
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
    out += "\nsay Controller Map Art Generator: costruzione completata!\n";
    return out;
  }
  function buildReadme({width: width, height: height}, mode) {
    return `CONTROLLER MAP ART GENERATOR — pacchetto di costruzione\n========================================\n\nModalità: ${mode === "survival" ? "Survival (blocchi facili da ottenere)" : "Creativa (palette completa)"}\nDimensione: ${width}×${height} blocchi\n\nContenuto del pacchetto\n------------------------\n- build/*.png                immagine della costruzione, un pixel per blocco\n- build-schematic/*.schem    importabile direttamente in WorldEdit o Litematica\n- lista_blocchi.csv          coordinata x,z e blocco per ogni cella\n- materiali.txt              quanti blocchi di ogni tipo servono\n- datapack_costruzione/      alternativa allo .schem: costruisce tutto con un comando\n\nCome usare il file .schem (consigliato)\n-----------------------------------------\n1. Copia il file .schem (dentro build-schematic/) nella cartella\n   "schematics" di WorldEdit oppure nella cartella di Litematica.\n2. In gioco, con WorldEdit: //schem load <nome_file> poi //paste\n   Con Litematica: apri il menu schematiche e carica il file, poi\n   posiziona l'anteprima e piazza i blocchi.\n\nCome costruire con il datapack (alternativa senza mod/plugin)\n----------------------------------------------------------------\n1. Copia la cartella "datapack_costruzione" in: <salvataggio>/datapacks/\n2. Nel gioco esegui: /reload\n3. Posizionati nell'angolo in basso a sinistra della costruzione.\n4. Esegui: /function mapart:costruisci\n\nNota: la costruzione viene generata come una singola immagine piatta\n(un blocco di spessore, come una mappa art da appendere a un muro).\n\nNota legale: questo strumento non è un prodotto ufficiale Mojang o\nMicrosoft e non è collegato al team di Minecraft. I colori dei blocchi\nsono approssimazioni usate solo per il riconoscimento cromatico.\n`;
  }
  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c]));
  }
  async function refreshHistoryCarousel() {
    if (!window.CMAGHistory) return;
    let shared = false, entries = [];
    try {
      ({shared: shared, entries: entries} = await CMAGHistory.listEntries());
    } catch (err) {
      console.warn("Impossibile caricare la cronologia:", err);
      return;
    }
    if (!entries.length) {
      historyTrack.innerHTML = "";
      historyTrack.classList.remove("scrolling");
      historyTrack.appendChild(historyEmpty);
      historyEmpty.hidden = false;
      historyEmpty.textContent = shared ? "Ancora nessuna build salvata: carica una foto e sii il primo a comparire qui." : "Ancora nessuna build salvata in questo browser: carica una foto per iniziare.";
      return;
    }
    const cardsHtml = entries.map(entry => {
      const src = entry.imageURL || entry.thumbDataURL || "";
      const nick = (entry.nickname || "").trim();
      return `\n        <div class="history-card">\n          <img src="${src}" alt="${nick ? "Build di " + escapeHtml(nick) : "Build senza nickname"}" loading="lazy">\n          ${nick ? `<span class="history-nick">${escapeHtml(nick)}</span>` : ""}\n        </div>`;
    }).join("");
    historyTrack.innerHTML = entries.length > 2 ? cardsHtml + cardsHtml : cardsHtml;
    historyTrack.classList.toggle("scrolling", entries.length > 2);
    historyTrack.style.animationDuration = `${Math.max(18, entries.length * 4)}s`;
  }
  async function refreshStatsBar() {
    if (!window.CMAGHistory) return;
    try {
      const {views: views, builds: builds, shared: shared} = await CMAGHistory.getStats();
      statVisitsCount.textContent = views.toLocaleString("it-IT");
      statBuildsCount.textContent = builds.toLocaleString("it-IT");
      heroStatsScope.textContent = shared ? "" : "(solo questo browser)";
      heroStats.hidden = false;
    } catch (err) {
      console.warn("Statistiche non disponibili:", err);
    }
  }
  async function initStats() {
    if (!window.CMAGHistory) return;
    await CMAGHistory.recordVisit();
    await refreshStatsBar();
  }
  initStats();
  refreshHistoryCarousel();
})();
