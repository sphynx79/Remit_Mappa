# Remit Mappa

Mappa interattiva delle indisponibilità REMIT (centrali e linee di trasmissione):
backend Ruby (Roda + Puma, MongoDB in sola lettura) in `server/`, frontend
JavaScript (Mithril + mapbox-gl + echarts + Tabulator) in `client/`.

## Avvio sviluppo

Prerequisiti: runtime gestiti da mise (`ruby 4.0.1`, `node lts` — vedi `mise.toml`),
MongoDB 4.0.x come server dati.

1. **Variabile d'ambiente** (obbligatoria per il boot del server):

   ```
   setx MAPBOX_API_TOKEN "<token pk.>"    # poi riaprire la shell
   ```

2. **Database di test** (snapshot locale, mai il DB di produzione):

   ```
   mongod --dbpath E:\Desktop\Ampere\DB_test\data --port 27030 --bind_ip 127.0.0.1 --nojournal
   ```

   Arresto SOLO pulito (il DB è senza journal): `mongo --port 27030 admin --eval "db.shutdownServer()"`

3. **Backend** (API su http://localhost:9292):

   ```
   cd server
   bundle install
   bundle exec puma --port 9292
   ```

4. **Frontend** (dev server con hot reload su http://localhost:9001):

   ```
   cd client
   npm install
   npm run start
   ```

## Task mise

Definiti nel `mise.toml` di root (`mise tasks` per l'elenco). Tutto gira in
**foreground**: i server con i log a video, i due MongoDB con i log su file
(`server/log/`). Il **Ctrl-C** ferma il processo e restituisce il prompt: i task
girano in bash invece che nel `cmd /c` di default di Windows, che dopo il Ctrl-C
chiedeva "Terminare il processo batch (S/N)?" e bloccava il terminale. Per
l'avvio detached di Puma resta lo script `bash script/avvia_server.sh dev|prod`:

```
mise run console        # REPL con l'app caricata (alias: mise run c, mise run pry)
mise run db-test        # MongoDB di test su :27030 (log: server/log/mongod_dev.log)
mise run db-prod        # MongoDB di PRODUZIONE su :27018 (log: server/log/mongod_prod.log)
mise run server-dev     # API server dev su :9292 (foreground, log a video)
mise run server-prod    # stack produzione, Puma SSL + Caddy (foreground, log a video)
mise run server-stop    # ferma Puma (dev/prod) e Caddy
mise run client-dev     # webpack dev server su :9001 (foreground)
mise run test           # suite RSpec
mise run coverage       # suite con report coverage (soglia 88%)
mise run lint           # rubocop + eslint
mise run bundle-prod    # build di produzione + copia in server/public
mise run db-test-stop   # arresto pulito del MongoDB di test
mise run db-prod-stop   # arresto pulito del MongoDB di produzione
```

Percorsi ed eseguibili di MongoDB sono nella sezione `[env]` del `mise.toml`
(`MONGODB_AMPERE_PATH`, `MONGODB_AMPERE_DEVELOPMENT_PATH`, `MONGOD_EXE`,
`MONGO_EXE`): i valori sono i default di questo host e si sovrascrivono con una
variabile d'ambiente o un `mise.local.toml` personale, senza toccare il file.
La configurazione dei due database (journal, tuning di WiredTiger, file di log)
sta invece in `server/config/mongod_prod.yaml` e `server/config/mongod_dev.yaml`.

## Test e lint

```
cd server
bundle exec rspec                        # suite (serve il mongod di test attivo)
RUN_COVERAGE_REPORT=1 bundle exec rspec  # con coverage (report in coverage/, soglia minima 88%)
bundle exec rubocop                      # lint Ruby

cd client
./node_modules/.bin/eslint src           # lint JS
npm run build                            # bundle di produzione (output in client/dist)
```

Console di sviluppo del server: `mise run console` (Pry con l'app caricata; per la
produzione `RACK_ENV=production mise run console`).
