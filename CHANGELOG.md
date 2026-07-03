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


