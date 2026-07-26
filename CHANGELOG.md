## 1.9.1 (2026-07-26)
### Fixed
-  Task mise: il Ctrl-C ferma il processo e restituisce il prompt; i task girano in bash invece del `cmd /c` di Windows, che restava in attesa della risposta a "Terminare il processo batch (S/N)?" e bloccava il terminale  ( 2026-07-26 ) [ sphynx79]
-  Task mise dei database: percorsi dei dati corretti dopo lo spostamento delle cartelle in E:/Sviluppo/Ampere, prima puntavano a un percorso inesistente  ( 2026-07-26 ) [ sphynx79]
### Security
-  Client: aggiornate svgo 4.0.2, fast-uri 3.1.4 e brace-expansion 5.0.8, tre vulnerabilita' di gravita' alta su dipendenze transitive (script eseguibili non rimossi, host confusion, denial of service)  ( 2026-07-26 ) [ sphynx79]
### Added
-  Task mise `console` (alias `c` e `pry`): REPL con l'applicazione caricata, ambiente selezionabile con RACK_ENV  ( 2026-07-26 ) [ sphynx79]
-  Configurazione MongoDB per ambiente in server/config/mongod_prod.yaml e mongod_dev.yaml: journal esplicito, tuning WiredTiger e log su file in server/log  ( 2026-07-26 ) [ sphynx79]
### Updated
-  Task mise: database e server partono in foreground, i server con i log a video e i database su file; percorsi ed eseguibili di MongoDB da variabili d'ambiente sovrascrivibili senza modificare il mise.toml  ( 2026-07-26 ) [ sphynx79]
-  Client: dipendenze aggiornate, webpack 5.108.4, eslint 10.7.0, webpack-dev-server 6.0.0 (major verificato: nessuna opzione rimossa era in uso)  ( 2026-07-26 ) [ sphynx79]
### Removed
-  Rakefile (root e server/) e gem rake: avvii, suite, lint e console sono ora task mise, nessuna gem del progetto dipendeva da rake  ( 2026-07-26 ) [ sphynx79]
-  Script script/avvia_db.sh: i due mongod si avviano direttamente dai task mise  ( 2026-07-26 ) [ sphynx79]



## 1.9.0 (2026-07-18)
### Fixed
-  Server: JSON valido ("[]") sui report in cache con date senza dati, prima usciva "[,,,,]" non parsabile [HIGH-001]  ( 2026-07-18 ) [ sphynx79]
-  Server: 200 con FeatureCollection vuota su remits centrali con data valida senza dati, prima 404 fuorviante [MED-001]  ( 2026-07-18 ) [ sphynx79]
-  Server: 403 sulle date impossibili che superavano la regex (es. 31-02-2018), prima 500 [LOW-001]  ( 2026-07-18 ) [ sphynx79]
-  Server: cache Remit/Report thread-safe su Concurrent::Map, un solo fetch per key sotto richieste concorrenti [HIGH-006]  ( 2026-07-18 ) [ sphynx79]
-  Server: rake console riparata (require di config/boot inesistente) [HIGH-003]  ( 2026-07-17 ) [ sphynx79]
-  Server: boot indipendente dalla directory di lancio (path VERSION e Gemfile ancorati al file) [LOW-002]  ( 2026-07-18 ) [ sphynx79]
-  Server: Logging#info con blocco logga a livello INFO, prima delegava a debug e il messaggio andava perso [LOW-003]  ( 2026-07-18 ) [ sphynx79]
-  Client: guardia anti-race sul cambio data rapido, mappa/tabelle/grafici mostrano sempre l'ultima data selezionata [HIGH-005]  ( 2026-07-17 ) [ sphynx79]
-  Client: protocollo derivato dalla porta anche in produzione (confronto su stringhe, prima non matchava mai) [LOW-010]  ( 2026-07-18 ) [ sphynx79]
-  Procfile: avvio server con bundle exec puma, rackup non esiste piu con Rack 3 [HIGH-002]  ( 2026-07-17 ) [ sphynx79]
### Updated
-  Server: warm-up cache per-miss (prima partiva una sola volta per tipo) e solo per date entro 30 giorni da oggi [MED-005][MED-004]  ( 2026-07-18 ) [ sphynx79]
-  Server: boot robusto Mapbox, messaggi chiari per MAPBOX_API_TOKEN mancante e dataset non scaricabili [MED-006]  ( 2026-07-18 ) [ sphynx79]
-  Client: 4 richieste report deterministiche per cambio data, atomi + react al posto di derive con side effect [MED-002]  ( 2026-07-18 ) [ sphynx79]
-  Client: teardown completo dei componenti (onremove con destroy/release e stop dei reactor via until) [MED-003]  ( 2026-07-18 ) [ sphynx79]
-  Client: echarts 6 con import modulari, vendor bundle da 1.71 a 1.29 MiB [MED-011]  ( 2026-07-18 ) [ sphynx79]
-  Client: deduplicati i componenti filtro, wrapper eliminati e select unificata parametrizzata (-533 righe) [MED-013]  ( 2026-07-18 ) [ sphynx79]
-  Repo: chiavi/certificati TLS e server/package-lock.json spurio fuori dal tracking git [MED-012][LOW-007]  ( 2026-07-18 ) [ sphynx79]
-  Tooling: config RuboCop riparata per RuboCop 1.88 [MED-010]; typo e flag NEXT morto rimossi [LOW-005]; log client gated su produzione [LOW-006]  ( 2026-07-18 ) [ sphynx79]
-  Prod: config launcher unificate e parametriche su hostname (puma_prod.rb, gen_cert.sh, server.bat senza Ruby 2.5), verificate sull'host ENWS27719997 con stack completo Puma SSL + Caddy [MED-009][HIGH-004]  ( 2026-07-18 ) [ sphynx79]
-  Server: cache inizializzate al load della classe (prima 500 nei primi secondi dopo il boot) e un solo warm-up pendente alla volta per tipo (prima i range grandi a cache fredda saturavano il pool Mongo)  ( 2026-07-18 ) [ sphynx79]
-  Server: wait_queue_timeout del pool Mongo 3s -> 30s; messaggi di warm-up visibili (avvio, durata, eventuale fallimento prima inghiottito dalla Promise)  ( 2026-07-18 ) [ sphynx79]
-  Prod: output di Caddy su server/log/caddy.log e chiusura automatica di Caddy allo stop di Puma (after_stopped)  ( 2026-07-18 ) [ sphynx79]
### Added
-  Suite di test server RSpec + rack-test (60 spec: caratterizzazione API, unit su modelli/helper/logging, cache e concorrenza) con coverage 88% e soglia minima; task rake spec/rubocop  ( 2026-07-18 ) [ sphynx79]
-  Task rake server_dev/server_prod (root e server/): avvio in foreground con Ctrl-C pulito, Puma in-process; Rakefile con bootstrap Bundler, bundle exec non piu necessario  ( 2026-07-18 ) [ sphynx79]
-  Task mise di avvio in background (setsid nohup, log su file) con server-stop: la catena mise/cmd su Windows resta appesa dopo il Ctrl-C dei task foreground  ( 2026-07-18 ) [ sphynx79]
-  Task mise di progetto (bundle-prod, server dev/prod, test, coverage, lint, db-test) con script di copia bundle e avvio produzione  ( 2026-07-18 ) [ sphynx79]
-  README con istruzioni di avvio sviluppo (mongod di test, puma, webpack dev server, spec)  ( 2026-07-18 ) [ sphynx79]



## 1.8.2 (2026-07-11)
### Updated
-  Server: raise al posto di exit! su errore DB con risposta 503 "Database non disponibile", il server si riprende da solo quando il DB torna raggiungibile  ( 2026-07-11 ) [ sphynx79]
-  Server: regex validazione date ancorata (rifiuta stringhe con testo iniettato) e tetto di 366 giorni sul range dei report  ( 2026-07-11 ) [ sphynx79]
-  Client: corretto typo protocolo => protocollo in app.js, datapicker.js, sidebar.js  ( 2026-07-11 ) [ sphynx79]
### Fixed
-  Tabelle senza limite di altezza in produzione: selettore .tabulator-tableholder minuscolo (tabulator v6), il camelCase funzionava solo in dev per il quirks mode  ( 2026-07-11 ) [ sphynx79]
-  Doctype del template dev allineato a <!DOCTYPE html>: dev e produzione ora renderizzano entrambi in standards mode  ( 2026-07-11 ) [ sphynx79]
### Added
-  Tabelle: altezza massima a 260px e scrollbar verticale in stile overlay, visibile solo al passaggio del mouse, colonne sempre allineate all'header  ( 2026-07-11 ) [ sphynx79]



## 1.8.1 (2026-07-11)
### Updated
-  Grafici: larghezza adattiva al pannello, centratura con containLabel, bottone download allineato a destra, rimossa label asse X, resize con ResizeObserver e dispose corretto  ( 2026-07-11 ) [ sphynx79]
-  Tabelle: colonne ore allineate ai valori con CSS grid, testo celle centrato, prima colonna a sinistra, filtri header compatti, casing uniforme e frecce ordinamento ridotte, font header 0.74rem  ( 2026-07-11 ) [ sphynx79]
-  Sidebar e burger: piu spazio tra grafici e scrollbar (verticale e orizzontale), bottone chiusura sidebar ridotto  ( 2026-07-11 ) [ sphynx79]
-  webpack dev server: soppresso overlay per il warning benigno "ResizeObserver loop"  ( 2026-07-11 ) [ sphynx79]
-  jsconfig: disabilitato checkJs, restano path alias e IntelliSense  ( 2026-07-11 ) [ sphynx79]
### Added
-  Skill Claude "mithril" e plugin trinity abilitato  ( 2026-07-11 ) [ sphynx79]



## 1.8.0 (2026-07-03)
### Updated
-  Migrato client a webpack 5.108 su Node 24.16 (webpack-cli 7, webpack-dev-server 5.2, webpack-merge 6)  ( 2026-07-03 ) [ sphynx79]
-  Sostituito node-sass (morto su Node 24) con dart-sass 1.101 + sass-loader 17, css-loader 7, postcss 8, autoprefixer 10  ( 2026-07-03 ) [ sphynx79]
-  Sostituiti plugin webpack defunti: extract-css-chunks => mini-css-extract-plugin, optimize-css-assets+cssnano => css-minimizer, file-loader => asset modules, clean-webpack-plugin => output.clean  ( 2026-07-03 ) [ sphynx79]
-  Aggiornato lato client tabulator-tables 4.9 => 6.5 (TabulatorFull, rowClick a evento, columnDefaults, normalizeHeight per riga ore)  ( 2026-07-03 ) [ sphynx79]
-  Aggiornato lato client echarts 4.9 => 6.1 (rimossi wrapper normal:, barBorder* => border*)  ( 2026-07-03 ) [ sphynx79]
-  Aggiornato lato client nouislider 13 => 15.8, mithril => 2.3.8, dayjs => 1.11.21  ( 2026-07-03 ) [ sphynx79]
-  Aggiornato mapbox-gl da CDN a 3.25.0 (dev era fermo a 1.1.1)  ( 2026-07-03 ) [ sphynx79]
-  Aggiornato eslint 5 => 10 con flat config e prettier 1 => 3 (arrowParens avoid per stile esistente)  ( 2026-07-03 ) [ sphynx79]
-  carbon-components fermo a 9.91.5: copia SCSS personalizzata basata su v9, la v11 cambia tutti i class name  ( 2026-07-03 ) [ sphynx79]
-  Fix SCSS per dart-sass: sintassi @supports, stringa multilinea nel carbon custom, path relativi al file  ( 2026-07-03 ) [ sphynx79]
-  Rimosso peso morto dal build: babel (regola disattivata da anni), core-js, regenerator-runtime, mopt, eslint-loader, style-loader, webpack.watch.js, yarn.lock  ( 2026-07-03 ) [ sphynx79]
-  Rigenerato bundle di produzione in server/public  ( 2026-07-03 ) [ sphynx79]



## 1.7.0 (2026-07-03)
### Updated
-  Aggiornato server a Ruby 4.0.1  ( 2026-07-03 ) [ sphynx79]
-  Aggiornato gemme server all'ultima versione: puma 8.0.2, rack 3.2.6, roda 3.105, oj 3.17.3, parallel 2.1, childprocess 5.1, rake 13.4.2  ( 2026-07-03 ) [ sphynx79]
-  Driver mongo fermo a 2.23.1: la 2.24 richiede MongoDB server >= 4.2 (in uso 4.0.x)  ( 2026-07-03 ) [ sphynx79]
-  Riattivate gemme di sviluppo (pry, byebug, rspec, rubocop, ...), esclusa pry-state incompatibile con pry moderno  ( 2026-07-03 ) [ sphynx79]
-  Patch Settingslogic per psych >= 4 e header di risposta in minuscolo per Rack 3  ( 2026-07-03 ) [ sphynx79]
-  Token Mapbox rimosso dal repository: letto dalla variabile d'ambiente MAPBOX_API_TOKEN via ERB  ( 2026-07-03 ) [ sphynx79]
-  Migrazione ai nuovi host ENWS26975477/ENWS27719997 (certificati, Caddyfile, config puma)  ( 2026-07-03 ) [ sphynx79]
-  Aggiornato lato client a mithril@2.0.3 e mapbox, rigenerato bundle produzione  ( 2026-07-03 ) [ sphynx79]
### Added
-  Aggiunte gemme logger e fiddle, non piu default gem in Ruby 4  ( 2026-07-03 ) [ sphynx79]
-  Configurazione tooling: mise, LSP, CLAUDE.md  ( 2026-07-03 ) [ sphynx79]



## 1.6.15 (2019-06-16)
### Updated
-  Aggiornato lato client css-loader 2.1.1 => 3.0.0  ( 2019-06-16 ) [ sphynx79]
-  Aggiornato lato client compression-webpack-plugin 2.0.0 => 3.0.0  ( 2019-06-16 ) [ sphynx79]
-  Aggiornato lato client file-loader 3.0.2 => 4.0.0  ( 2019-06-16 ) [ sphynx79]
-  Aggiornato lato client eslint-config-prettier 4.3.0 => 5.0.0  ( 2019-06-16 ) [ sphynx79]
-  Aggiornato lato client autoprefixer 9.5.1 => 9.6.0  ( 2019-06-16 ) [ sphynx79]
-  Aggiornato lato client flatpickr 4.5.7 => 4.6.1  ( 2019-06-16 ) [ sphynx79]
-  Aggiornato lato client  prettier  1.17.1 => 1.18.2  ( 2019-06-16 ) [ sphynx79]
-  Aggiornato lato client  webpack-dev-server 3.5.1  => 3.7.1  ( 2019-06-16 ) [ sphynx79]
-  Aggiornato lato client postcss  7.0.16 => 7.0.17  ( 2019-06-16 ) [ sphynx79]
-  updaye lato client webpack  1.17.1 =>  1.18.2  ( 2019-06-16 ) [ sphynx79]
-  Update lato client core-js 3.1.3  =>  3.1.4  ( 2019-06-16 ) [ sphynx79]



## 1.6.14 (2019-06-01)
### Updated
-  Aggiornato alcune gemme lato server  ( 2019-06-01 ) [ sphynx79]
-  Aggiornato lato client terser-webpack-plugin@1.3.0  ( 2019-06-01 ) [ sphynx79]
-  Aggiornato lato client clean-webpack-plugin@3.0.0  ( 2019-06-01 ) [ sphynx79]
-  Aggiornato lato client mini-css-extract-plugin@0.7.0  ( 2019-06-01 ) [ sphynx79]
-  Aggiornato lato client extract-css-chunks-webpack-plugin@4.5.2  ( 2019-06-01 ) [ sphynx79]
-  Aggiornato lato client mobius1-selectr@2.4.12  ( 2019-06-01 ) [ sphynx79]
-  Aggiornato lato client nodemon@1.19.1  ( 2019-06-01 ) [ sphynx79]
-  Aggiornato webpack-dev-server@3.5.1  ( 2019-06-01 ) [ sphynx79]
-  Aggiornato lato client core-js  ( 2019-06-01 ) [ sphynx79]
-  Aggiornato mithril versione mithril@2.0.0-rc.6  ( 2019-06-01 ) [ sphynx79]



## 1.6.13 (2019-05-24)


## 1.6.12 (2019-05-23)
### Updated
-  Aggiornato lato client extract-css-chunks-webpack-plugin  ( 2019-05-23 ) [ sphynx79]
-  Aggiornato webpack  ( 2019-05-23 ) [ sphynx79]
-   Aggiornato mapbox alla versione 1.0.0 che ha un nuovo piano prezzi  ( 2019-05-23 ) [ sphynx79]

### updated
-  Aggiornato lato client babel  ( 2019-05-23 ) [ sphynx79]



## 1.6.11 (2019-05-17)
### Updated
-  Aggiornato versione ruby (2.6.3-p62) + aggiornato alcuni pacchetti lato client  ( 2019-05-17 ) [ sphynx79]

### Fixed
-  Quando lo usavo in Tunisia e dove usare un proxy non funzionava, per cui per mapbox ho dovuto mettere OpenSSL::SSL::VERIFY_NONE  ( 2019-05-17 ) [ sphynx79]



## 1.6.10 (2019-04-30)
### Updated
-  Aggiornato lato client la libreria tabulator-tables  ( 2019-04-30 ) [ sphynx79]



## 1.6.9 (2019-04-29)
### Updated
-  Aggiornato lato client dayjs e @babel/core @babel/preset-env  ( 2019-04-29 ) [ sphynx79]

### Changed
-  Aggiornato lato client libreria tabulator-tables  ( 2019-04-29 ) [ sphynx79]
-  Aggiornato echarts  ( 2019-04-26 ) [ sphynx79]



## 1.6.8 (2019-04-25)
### Changed
-  Aggiornato alcuni pacchetti sul client  ( 2019-04-25 ) [ sphynx79]
-  Aggiornato alcuni pacchetti sul client  ( 2019-04-25 ) [ sphynx79]
-  Aggiornato alcune gemme ruby lato server  ( 2019-04-25 ) [ sphynx79]
-  Aggiornato a mapbox-gl@0.50.0  ( 2019-04-25 ) [ sphynx79]



## 1.6.7 (2019-04-21)
### Fixed
-  Sistamato problema di mithril quando lo importo globalmente  ( 2019-04-21 ) [ sphynx79]



## 1.6.6 (2019-04-21)


## 1.6.5 (2019-03-17)
### Fixed
-  sistema problema altezza tabelle che usciva dalla sidebar  ( 2019-03-17 ) [ sphynx79]



## 1.6.4 (2019-03-13)
### Changed
-  Aggiornato varie librerie  ( 2019-03-13 ) [ sphynx79]



## 1.6.3 (2019-01-21)


## 1.6.2 (2019-01-19)
### Added
-  Implementato cache probabilistica  ( 2019-01-19 ) [ sphynx79]



## 1.6.1 (2018-12-29)
### Changed
-  Messo la dashboard dei grafici nella sidebar  ( 2018-12-13 ) [ sphynx79]

### Added
-  Aggiunto supporto alle tabelle orarie anche per le linee  ( 2018-11-29 ) [ sphynx79]
-  Aggiunto il supporto per le remit orarie nella tabella centrali  ( 2018-11-22 ) [ sphynx79]



## 1.6.0 (2018-11-05)
### Changed
-  Creato meccanismo di cache per report e per le remit, e sistemato problema UTC localtime  ( 2018-11-05 ) [ sphynx79]



## 1.5.1 (2018-10-17)


## 1.5.0 (2018-10-05)


## 1.4.4 (2018-09-14)


## 1.4.3 (2018-09-14)


## 1.4.2 (2018-09-11)


## 1.4.1 (2018-08-26)


## 1.4.0 (2018-08-22)
### Changed
-  cambiato struttura e logica del Db per migliorare performance sulla creazione dei report  ( 2018-08-21 ) [ sphynx79]
-  Utilizzo roda al posto si Sinatra come framework  ( 2018-06-27 ) [ sphynx79]

### Added
-  Creato i report per le remit delle centrali  ( 2018-07-22 ) [ sphynx79]



## 1.3.8 (2018-06-25)


## 1.3.7 (2018-06-13)
### Added
-  Aggiunto dashboard per i grafici e creato api lato server per report remit lungo termine  ( 2018-06-13 ) [ sphynx79]
-  Aggiunto effetto blur per le finestre  ( 2018-06-08 ) [ sphynx79]



## 1.3.6 (2018-06-04)
### Changed
-  Ottimizzato performance delle animazioni  ( 2018-05-31 ) [ sphynx79]



## 1.3.5 (2018-05-28)
### Added
-  Aggiunto controllo per reset zoom level  ( 2018-05-28 ) [ sphynx79]
-  Aggiunto valore di remit nella tabella delle centrali  ( 2018-05-28 ) [ sphynx79]



## 1.3.4 (2018-05-27)
### Added
-  Aggiunto filtro per selezionare abilitazione mercato MSD  ( 2018-05-27 ) [ sphynx79]



## 1.3.3 (2018-05-22)
### Added
-  Aggiunto filtro per le potenze  ( 2018-05-22 ) [ sphynx79]



## 1.3.2 (2018-05-17)
### Changed
-  Aggiornato mapbox e webpack  ( 2018-05-17 ) [ sphynx79]



## 1.3.1 (2018-05-16)
### Changed
-  Inserito in gemfile versioni delle librerie  ( 2018-05-16 ) [ sphynx79]



## 1.3.0 (2018-05-16)
### Added
-  Aggiunto supporto per le nuove remit delle centrali che si basano sul PIP  ( 2018-05-16 ) [ sphynx79]



## 1.2.3 (2018-05-05)
### Added
-  aggiunto filtro impianto  ( 2018-05-05 ) [ sphynx79]



## 1.2.2 (2018-05-02)
### Added
-  Aggiunto freccette per scorrere i giorni  ( 2018-05-02 ) [ sphynx79]



## 1.2.1 (2018-05-02)
### Added
-  La tabella remit centrali reagisce in base ai filtri selezionati  ( 2018-05-02 ) [ sphynx79]
-  Collegato filtri tecnologia ai filtri unita  ( 2018-05-01 ) [ sphynx79]

### Changed
-  Aggiornato libreria mapbox-gl  ( 2018-05-01 ) [ sphynx79]
-  Cambiato logica gestione filtri unita  ( 2018-04-30 ) [ sphynx79]



## 1.2.0 (2018-04-28)
### Fixed
-  Correto il problema in Mappa.exe dell'avvio del server  ( 2018-04-28 ) [ sphynx79]



## 1.1.9 (2018-04-23)
### Fixed
-  Sistemato problema visibilità sulla mappa filtro sottotipo  ( 2018-04-23 ) [ sphynx79]



## 1.1.8 (2018-04-23)
### Changed
-	Modificato le etichette delle centrali nella legenda ( 2018-04-23 ) [ sphynx79]

## 1.1.7 (2018-04-23)
### Changed
-  Cambiato gli header nelle tabelle delle remit  ( 2018-04-23 ) [ sphynx79]
-  Ottimizzato la query per le remit delle centrali  ( 2018-04-22 ) [ sphynx79]

### Added
-  Aggiunto filtro per sottotipo  ( 2018-04-23 ) [ sphynx79]



## 1.1.5 (2018-04-16)
### Added
-  Aggiunto file eseguibile per lanciare il server  ( 2018-04-16 ) [ sphynx79]



## 1.1.4 (2018-04-16)
### Changed
-  cambiato logica per la sidebar dei filtri  ( 2018-04-16 ) [ sphynx79]
-  Uso plugin simplebar per la scrollbar sulle tabelle  ( 2018-04-14 ) [ sphynx79]

### Added
-  Aggiunto in webpack watch mode che insieme a foreman posso usare in developmen sia hotreload di webpack all'indirizzo http://localhost:3000/ oppure direttamente sinatra all'indirizzo http://localhost:9292/ che punta alla cartella client/dist/..  ( 2018-04-14 ) [ sphynx79]



## 1.1.3 (2018-04-13)
### Added
-  Includo anche la cartella node_modules_custom in master  ( 2018-04-13 ) [ sphynx79]



## 1.1.2 (2018-04-13)
### Added
-  Aggiunto popup per informazioni sulla centrale  ( 2018-04-13 ) [ sphynx79]
-  Aggiunto scroll-bar tabelle + aggiornato webpack 4  ( 2018-04-07 ) [ sphynx79]
-  Aggiunto remit centrali sulla mappa  ( 2018-03-30 ) [ sphynx79]
-  Creato tabella per remit delle centrali  ( 2018-03-22 ) [ sphynx79]
-  Aggiunto api sul server per remit delle centrali  ( 2018-03-21 ) [ sphynx79]

### Changed
-  Restyle tables  ( 2018-03-18 ) [ sphynx79]



## 1.1.1 (2018-03-16)
### Changed
-  Usato prettier per formattare il codice  ( 2018-03-16 ) [ sphynx79]



## 1.1.0 (2018-03-04)
## Added
-	Creato le multi-select dinamiche per filtrare la company e le unita


## 1.0.0 (2018-02-18)
### Added
-  First Commit  ( 2018-02-18 ) [ sphynx79]


