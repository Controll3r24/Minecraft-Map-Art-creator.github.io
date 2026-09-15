(() => {
  const HISTORY_CONFIG = {
    firebaseConfig: null
  };
  const LOCAL_KEY = "cmag_history_v1";
  const LOCAL_VIEWS_KEY = "cmag_views_v1";
  const LOCAL_BUILDS_KEY = "cmag_builds_v1";
  const MAX_LOCAL_ENTRIES = 24;
  const MAX_ENTRIES_SHOWN = 24;
  const FIREBASE_SDK_VERSION = "10.13.0";
  let firebaseStatePromise = null;
  function slugify(base) {
    const clean = (base || "mapart").toLowerCase().replace(/[^a-z0-9_-]+/g, "_").slice(0, 40);
    return `${clean}_${Date.now()}`;
  }
  async function getFirebase() {
    if (!HISTORY_CONFIG.firebaseConfig) return null;
    if (!firebaseStatePromise) {
      firebaseStatePromise = (async () => {
        const base = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}`;
        const [{initializeApp: initializeApp}, firestoreMod, storageMod] = await Promise.all([ import(`${base}/firebase-app.js`), import(`${base}/firebase-firestore.js`), import(`${base}/firebase-storage.js`) ]);
        const app = initializeApp(HISTORY_CONFIG.firebaseConfig);
        return {
          db: firestoreMod.getFirestore(app),
          storage: storageMod.getStorage(app),
          firestoreMod: firestoreMod,
          storageMod: storageMod
        };
      })().catch(err => {
        console.warn("Cronologia condivisa non disponibile, uso quella locale:", err);
        return null;
      });
    }
    return firebaseStatePromise;
  }
  function readLocalHistory() {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
    } catch {
      return [];
    }
  }
  function writeLocalHistory(entries) {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(entries.slice(0, MAX_LOCAL_ENTRIES)));
    } catch (err) {
      console.warn("Impossibile salvare la cronologia locale:", err);
    }
  }
  function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader;
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
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(bitmap, 0, 0, w, h);
    return new Promise(resolve => canvas.toBlob(resolve, "image/png"));
  }
  async function saveEntry({pngBlob: pngBlob, schemBlob: schemBlob, nickname: nickname, baseName: baseName, mode: mode, width: width, height: height}) {
    const slug = slugify(baseName);
    const cleanNickname = (nickname || "").trim().slice(0, 24);
    const thumbBlob = await makeThumbnail(pngBlob);
    const fb = await getFirebase();
    if (fb) {
      const {ref: ref, uploadBytes: uploadBytes, getDownloadURL: getDownloadURL} = fb.storageMod;
      const {collection: collection, addDoc: addDoc, serverTimestamp: serverTimestamp} = fb.firestoreMod;
      const imagePath = `build/${slug}.png`;
      const schemPath = `build-schematic/${slug}.schem`;
      const imageRef = ref(fb.storage, imagePath);
      const schemRef = ref(fb.storage, schemPath);
      await uploadBytes(imageRef, pngBlob);
      await uploadBytes(schemRef, schemBlob);
      const imageURL = await getDownloadURL(imageRef);
      const schemURL = await getDownloadURL(schemRef);
      await addDoc(collection(fb.db, "builds"), {
        nickname: cleanNickname,
        mode: mode,
        width: width,
        height: height,
        imageURL: imageURL,
        schemURL: schemURL,
        imagePath: imagePath,
        schemPath: schemPath,
        createdAt: serverTimestamp()
      });
      return {
        shared: true
      };
    }
    const thumbDataURL = await blobToDataURL(thumbBlob);
    const entries = readLocalHistory();
    entries.unshift({
      nickname: cleanNickname,
      mode: mode,
      width: width,
      height: height,
      thumbDataURL: thumbDataURL,
      imagePath: `build/${slug}.png`,
      schemPath: `build-schematic/${slug}.schem`,
      createdAt: Date.now()
    });
    writeLocalHistory(entries);
    return {
      shared: false
    };
  }
  async function listEntries() {
    const fb = await getFirebase();
    if (fb) {
      const {collection: collection, query: query, orderBy: orderBy, limit: limit, getDocs: getDocs} = fb.firestoreMod;
      const q = query(collection(fb.db, "builds"), orderBy("createdAt", "desc"), limit(MAX_ENTRIES_SHOWN));
      const snap = await getDocs(q);
      return {
        shared: true,
        entries: snap.docs.map(d => d.data())
      };
    }
    const entries = readLocalHistory().map(e => ({
      ...e,
      imageURL: e.thumbDataURL
    }));
    return {
      shared: false,
      entries: entries
    };
  }
  window.CMAGHistory = {
    saveEntry: saveEntry,
    listEntries: listEntries,
    isSharedConfigured: () => !!HISTORY_CONFIG.firebaseConfig,
    async recordVisit() {
      const fb = await getFirebase();
      if (fb) {
        try {
          const {doc: doc, setDoc: setDoc, increment: increment} = fb.firestoreMod;
          await setDoc(doc(fb.db, "meta", "stats"), {
            views: increment(1)
          }, {
            merge: true
          });
        } catch (err) {
          console.warn("Conteggio visite condiviso non disponibile:", err);
        }
      } else {
        const n = parseInt(localStorage.getItem(LOCAL_VIEWS_KEY) || "0", 10) + 1;
        try {
          localStorage.setItem(LOCAL_VIEWS_KEY, String(n));
        } catch {}
      }
    },
    async recordBuild() {
      const fb = await getFirebase();
      if (fb) {
        try {
          const {doc: doc, setDoc: setDoc, increment: increment} = fb.firestoreMod;
          await setDoc(doc(fb.db, "meta", "stats"), {
            builds: increment(1)
          }, {
            merge: true
          });
        } catch (err) {
          console.warn("Conteggio build condiviso non disponibile:", err);
        }
      } else {
        const n = parseInt(localStorage.getItem(LOCAL_BUILDS_KEY) || "0", 10) + 1;
        try {
          localStorage.setItem(LOCAL_BUILDS_KEY, String(n));
        } catch {}
      }
    },
    async getStats() {
      const fb = await getFirebase();
      if (fb) {
        try {
          const {doc: doc, getDoc: getDoc} = fb.firestoreMod;
          const snap = await getDoc(doc(fb.db, "meta", "stats"));
          const data = snap.exists() ? snap.data() : {};
          return {
            shared: true,
            views: data.views || 0,
            builds: data.builds || 0
          };
        } catch (err) {
          console.warn("Statistiche condivise non disponibili:", err);
        }
      }
      return {
        shared: false,
        views: parseInt(localStorage.getItem(LOCAL_VIEWS_KEY) || "0", 10),
        builds: parseInt(localStorage.getItem(LOCAL_BUILDS_KEY) || "0", 10)
      };
    }
  };
})();
