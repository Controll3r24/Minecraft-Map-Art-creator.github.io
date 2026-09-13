# Controller Map Art Generator

Sito statico (HTML/CSS/JS puro, nessun server necessario) che trasforma
una foto in una mappa di blocchi di Minecraft. Scegli tra due modalità:

- **Creativa** — usa la palette completa (oltre 130 blocchi) per la
  massima fedeltà ai colori dell'immagine originale.
- **Survival** — usa solo i blocchi facili da procurarsi in grande
  quantità in sopravvivenza (lana, calcestruzzo, terracotta, legno,
  pietra, blocchi naturali...), escludendo quelli che richiedono molto
  grinding, il Nether/End o risorse rare.

Al termine puoi scaricare:

- un file **`.schem`** pronto da caricare direttamente in WorldEdit
  (`//schem load` + `//paste`) o Litematica — generato interamente nel
  browser con un writer NBT/gzip, nessun software esterno richiesto;
- oppure il **pacchetto `.zip` completo**, che oltre allo `.schem`
  contiene:
  - `anteprima.png` — l'immagine convertita, un pixel per blocco
  - `lista_blocchi.csv` — coordinate x/z e blocco per ogni cella
  - `materiali.txt` — quanti blocchi di ogni tipo servono
  - `datapack_costruzione/` — un'alternativa allo `.schem`: entra nel
    mondo, posizionati nel punto di partenza ed esegui
    `/function mapart:costruisci`
  - `LEGGIMI.txt` — istruzioni dettagliate

Tutta l'elaborazione avviene nel browser: nessuna immagine viene
caricata su un server.

## Struttura del progetto

```
index.html      pagina e markup
style.css       stile (estetica "a blocchi", bordi a rilievo)
blocks.js       palette dei blocchi Minecraft e colori medi
schem.js        writer NBT/gzip che genera i file .schem nel browser
script.js       logica dell'app: conversione, anteprima, export
strumenti/
  genera_schematic.py   script Python opzionale, stessa logica in
                         versione da riga di comando (usa mcschematic)
```

## Come pubblicarlo su GitHub Pages

1. Crea un repository su GitHub e carica tutti i file di questa cartella
   nella radice (o in una cartella `docs/`).
2. Vai su **Settings → Pages**, scegli il branch (es. `main`) e la
   cartella (`/root` o `/docs`).
3. Salva: dopo qualche minuto il sito sarà online all'indirizzo
   `https://<tuo-utente>.github.io/<nome-repo>/`.

Non serve nessuna build: è già un sito statico pronto all'uso.

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
