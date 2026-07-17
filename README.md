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

## Test e lint

```
cd server
bundle exec rspec                        # suite (serve il mongod di test attivo)
RUN_COVERAGE_REPORT=1 bundle exec rspec  # con coverage (report in coverage/, soglia minima 88%)
bundle exec rake                         # alias di rspec
bundle exec rubocop                      # lint Ruby

cd client
./node_modules/.bin/eslint src           # lint JS
npm run build                            # bundle di produzione (output in client/dist)
```

Console di sviluppo del server: `cd server && bundle exec rake console` (Pry).
