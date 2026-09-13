/*
 * history.js — Cronologia delle build.
 *
 * Di default funziona SENZA alcuna configurazione: le build salvate
 * restano nel browser di chi le genera (usando localStorage), utile
 * per provare subito il sito.
 *
 * Per avere una Cronologia CONDIVISA con tutti i visitatori (il
 * carosello in cima al sito uguale per tutti), crea un progetto
 * Firebase gratuito, attiva Firestore e Storage, e incolla qui sotto
 * la configurazione: vedi README, sezione "Cronologia condivisa".
 */

(() => {
  const HISTORY_CONFIG = {
    firebaseConfig: null
    /* esempio, dopo aver creato il progetto su https://console.firebase.google.com :
    firebaseConfig: {
      apiKey: "AIzaSy...",
      authDomain: "tuo-progetto.firebaseapp.com",
      projectId: "tuo-progetto",
      storageBucket: "tuo-progetto.appspot.com",
      messagingSenderId: "1234567890",
      appId: "1:1234567890:web:abcdef"
    }
    */
  };

  const LOCAL_KEY = 'cmag_history_v1';
  const MAX_LOCAL_ENTRIES = 24;
  const MAX_ENTRIES_SHOWN = 24;
  const FIREBASE_SDK_VERSION = '10.13.0';

  let firebaseStatePromise = null;

  function slugify(base) {
    const clean = (base || 'mapart').toLowerCase().replace(/[^a-z0-9_-]+/g, '_').slice(0, 40);
    return `${clean}_${Date.now()}`;
  }

  async function getFirebase() {
    if (!HISTORY_CONFIG.firebaseConfig) return null;
    if (!firebaseStatePromise) {
      firebaseStatePromise = (async () => {
        const base = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}`;
        const [{ initializeApp }, firestoreMod, storageMod] = await Promise.all([
          import(`${base}/firebase-app.js`),
          import(`${base}/firebase-firestore.js`),
          import(`${base}/firebase-storage.js`)
        ]);
        const app = initializeApp(HISTORY_CONFIG.firebaseConfig);
        return {
          db: firestoreMod.getFirestore(app),
          storage: storageMod.getStorage(app),
          firestoreMod,
          storageMod
        };
      })().catch(err => {
        console.warn('Cronologia condivisa non disponibile, uso quella locale:', err);
        return null;
      });
    }
    return firebaseStatePromise;
  }

  function readLocalHistory() {
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]'); }
    catch { return []; }
  }

  function writeLocalHistory(entries) {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(entries.slice(0, MAX_LOCAL_ENTRIES))); }
    catch (err) { console.warn('Impossibile salvare la cronologia locale:', err); }
  }

  function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async function makeThumbnail(pngBlob, maxSize = 240) {
    const bitmap = await createImageBitmap(pngBlob);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(bitmap, 0, 0, w, h);
    return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  }

  /**
   * Salva una build. pngBlob/schemBlob sono i file già generati dal sito.
   * Se è configurato Firebase, carica i file in build/<slug>.png e
   * build-schematic/<slug>.schem e registra la voce condivisa;
   * altrimenti salva solo una miniatura in locale.
   */
  async function saveEntry({ pngBlob, schemBlob, nickname, baseName, mode, width, height }) {
    const slug = slugify(baseName);
    const cleanNickname = (nickname || '').trim().slice(0, 24);
    const thumbBlob = await makeThumbnail(pngBlob);

    const fb = await getFirebase();
    if (fb) {
      const { ref, uploadBytes, getDownloadURL } = fb.storageMod;
      const { collection, addDoc, serverTimestamp } = fb.firestoreMod;

      const imagePath = `build/${slug}.png`;
      const schemPath = `build-schematic/${slug}.schem`;
      const imageRef = ref(fb.storage, imagePath);
      const schemRef = ref(fb.storage, schemPath);

      await uploadBytes(imageRef, pngBlob);
      await uploadBytes(schemRef, schemBlob);
      const imageURL = await getDownloadURL(imageRef);
      const schemURL = await getDownloadURL(schemRef);

      await addDoc(collection(fb.db, 'builds'), {
        nickname: cleanNickname, mode, width, height,
        imageURL, schemURL, imagePath, schemPath,
        createdAt: serverTimestamp()
      });
      return { shared: true };
    }

    const thumbDataURL = await blobToDataURL(thumbBlob);
    const entries = readLocalHistory();
    entries.unshift({
      nickname: cleanNickname, mode, width, height,
      thumbDataURL,
      imagePath: `build/${slug}.png`, schemPath: `build-schematic/${slug}.schem`,
      createdAt: Date.now()
    });
    writeLocalHistory(entries);
    return { shared: false };
  }

  async function listEntries() {
    const fb = await getFirebase();
    if (fb) {
      const { collection, query, orderBy, limit, getDocs } = fb.firestoreMod;
      const q = query(collection(fb.db, 'builds'), orderBy('createdAt', 'desc'), limit(MAX_ENTRIES_SHOWN));
      const snap = await getDocs(q);
      return { shared: true, entries: snap.docs.map(d => d.data()) };
    }
    const entries = readLocalHistory().map(e => ({ ...e, imageURL: e.thumbDataURL }));
    return { shared: false, entries };
  }

  window.CMAGHistory = {
    saveEntry,
    listEntries,
    isSharedConfigured: () => !!HISTORY_CONFIG.firebaseConfig
  };
})();
