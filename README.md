# Controller Map Art Generator

Sito statico (HTML/CSS/JS puro, nessun server necessario) che trasforma
una foto in una mappa di blocchi di Minecraft.

- **Creativa** o **Survival** — palette completa oppure solo blocchi
  facili da procurarsi in sopravvivenza.
- **Ritaglia e adatta** — dopo aver caricato la foto puoi scegliere tra
  "riempi e ritaglia" (con zoom/trascinamento), "adatta intera" (con
  margini) o "deforma", invece di ritrovarti sempre l'immagine
  schiacciata a forza nelle proporzioni scelte. Sotto lo strumento di
  ritaglio c'è un'anteprima a colori che si aggiorna dal vivo.
- **Cronologia** — un carosello in cima al sito mostra le build salvate
  dalla community, con il nickname di chi le ha create (se lo lascia).
- **Export** — un file `.schem` pronto per WorldEdit/Litematica
  (generato interamente nel browser), oppure il pacchetto `.zip`
  completo con `build/<nome>.png`, `build-schematic/<nome>.schem`,
  lista materiali, CSV e un datapack con i comandi di costruzione.

## Struttura del progetto

```
index.html      pagina e markup, meta tag per l'anteprima link
style.css       stile (estetica "a blocchi", bordi a rilievo, carosello, cropper)
blocks.js       palette dei blocchi Minecraft e colori medi
schem.js        writer NBT/gzip che genera i file .schem nel browser
history.js      Cronologia build (Firebase opzionale, fallback locale)
script.js       logica dell'app: ritaglio, conversione, anteprima, export
assets/
  social-preview.png   immagine mostrata quando condividi il link
strumenti/
  genera_schematic.py  script Python opzionale, versione da riga di comando
```

## Come pubblicarlo su GitHub Pages

1. Crea un repository su GitHub e carica tutti i file di questa cartella
   nella radice (o in una cartella `docs/`).
2. Vai su **Settings → Pages**, scegli il branch (es. `main`) e la
   cartella (`/root` o `/docs`).
3. Salva: dopo qualche minuto il sito sarà online all'indirizzo
   `https://<tuo-utente>.github.io/<nome-repo>/`.

Non serve nessuna build: è già un sito statico pronto all'uso.

## Anteprima link (Discord, WhatsApp, X, Facebook...)

Il sito ha già i meta tag Open Graph/Twitter necessari perché, quando
incolli il link su Discord o altrove, appaia una card con titolo,
descrizione e l'immagine in `assets/social-preview.png`.

Dopo aver pubblicato il sito:

1. Apri `index.html`.
2. Cerca `SITE_URL` (compare 3 volte, tutte vicine, in cima al file)
   e sostituiscilo con il tuo indirizzo reale, ad esempio
   `https://tuoutente.github.io/nome-repo`.
3. Ripubblica. Se Discord ti mostrava già una card vecchia/vuota per
   quel link, la cache si aggiorna da sola dopo un po', oppure puoi
   incollare il link con un carattere in più temporaneo per forzare
   una nuova anteprima.

Puoi rigenerare `assets/social-preview.png` con un altro programma di
grafica se vuoi personalizzarla: basta che resti circa 1200×630 px.

## Cronologia condivisa (opzionale)

Di serie la Cronologia funziona **senza configurazione**: le build
salvate restano nel browser di chi le genera (tramite `localStorage`),
utile per provare subito il sito in locale.

Per avere una Cronologia **condivisa con tutti i visitatori** (il
carosello in cima uguale per tutti, con le immagini davvero salvate in
`build/` e `build-schematic/`), serve un piccolo backend gratuito:

1. Crea un progetto su [Firebase Console](https://console.firebase.google.com)
   (gratuito, nessuna carta di credito richiesta per il piano Spark).
2. Attiva **Firestore Database** e **Storage** dal menu di sinistra.
3. In Storage e Firestore, imposta delle regole di sicurezza che
   permettano solo scritture "ragionevoli" dal sito pubblico, ad
   esempio (da adattare/rivedere secondo le tue esigenze):

   ```
   // Firestore
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /builds/{doc} {
         allow read: if true;
         allow create: if request.resource.data.nickname is string
           && request.resource.data.nickname.size() <= 24;
         allow update, delete: if false;
       }
     }
   }
   ```

   ```
   // Storage
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /build/{file} {
         allow read: if true;
         allow write: if request.resource.size < 5 * 1024 * 1024;
       }
       match /build-schematic/{file} {
         allow read: if true;
         allow write: if request.resource.size < 5 * 1024 * 1024;
       }
     }
   }
   ```

4. Nelle impostazioni del progetto Firebase, aggiungi una "Web app" e
   copia l'oggetto di configurazione che ti viene mostrato.
5. Apri `history.js`, trova `firebaseConfig: null` in cima al file e
   sostituiscilo con la tua configurazione, ad esempio:

   ```js
   firebaseConfig: {
     apiKey: "AIzaSy...",
     authDomain: "tuo-progetto.firebaseapp.com",
     projectId: "tuo-progetto",
     storageBucket: "tuo-progetto.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abcdef"
   }
   ```

6. Ripubblica il sito: da questo momento ogni "Salva e scarica" carica
   davvero l'immagine in `build/<nome>.png` e lo schematic in
   `build-schematic/<nome>.schem` dentro il tuo Storage, e il
   carosello li mostra a tutti i visitatori.

Le regole sopra sono un punto di partenza ragionevole per un progetto
amatoriale, non una garanzia di sicurezza assoluta: se il sito diventa
molto popolare, valuta di aggiungere limiti più stretti (rate limiting,
moderazione dei nickname, ecc.).

## Sviluppo in locale

Basta aprire `index.html` in un browser, oppure servirlo con un
piccolo server statico, ad esempio:

```
python3 -m http.server 8000
```

e visitare `http://localhost:8000`.

## Nota legale

Questo è un progetto amatoriale non ufficiale, non affiliato con
Mojang o Microsoft. "Minecraft" è un marchio registrato di Mojang
Synergies AB. I colori dei blocchi usati per il riconoscimento
cromatico sono approssimazioni, non asset ufficiali del gioco.
