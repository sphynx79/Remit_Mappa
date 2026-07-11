---
name: mithril
description: >-
  Competenza esperta su Mithril.js 2.3.6 (SPA hyperscript ~10KB, virtual DOM,
  auto-redraw, routing e XHR inclusi). Consulta SEMPRE questa skill, anche per task
  semplici, quando scrivi, leggi, revisioni o debuggi codice Mithril: m()/vnode
  hyperscript, componenti POJO/closure/class, m.mount/m.render/m.redraw,
  m.route/m.route.Link/RouteResolver e routing SPA, m.request e data layer XHR,
  m.trust, lifecycle (oninit/oncreate/onupdate/onbeforeremove/onremove), keys nelle
  liste, mithril/stream, setup JSX/Babel, testing ospec/mithril-query. Attivala
  ANCHE senza la parola "Mithril" se il contesto lo implica: file con import m from
  "mithril" o uso di m(...), review/modifica componente, routing SPA con #!/,
  "perché la UI non si aggiorna / quando serve m.redraw", input che perdono stato
  nelle liste (keys), componenti che perdono lo stato dopo un redraw, animazioni di
  entrata/uscita. NON usarla per React, Vue, Svelte, Angular, RxJS, axios, web
  component nativi o l'hyperscript di altri pacchetti: è specifica di Mithril.js.
---

# Mithril.js 2.3.6

Mithril.js è un framework SPA compatto (~10KB gzip) costruito su tre idee:
**hyperscript** (`m()` descrive il DOM come plain object JS, niente JSX
obbligatorio), un **virtual DOM** con diffing efficiente, e l'**auto-redraw**
che ridisegna dopo eventi/XHR/cambio rotta. A differenza di React, è "batterie
incluse": routing (`m.route`) e XHR (`m.request`) sono nel core, quindi
niente Redux, React Router o axios. L'architettura idiomatica è una sola e
documentata: `models/` (data layer) + `views/` (componenti) + un punto di
mount/route.

Questa skill organizza la conoscenza in **reference dedicati** (progressive
disclosure): SKILL.md dà il modello mentale, il cheatsheet e le regole; per i
dettagli operativi su un task specifico apri il file reference corrispondente
(tabella sotto). Tutte le API qui sono accurate per **Mithril 2.3.6** e usano
sintassi hyperscript `m()`.

## Mental model

Come ragiona un esperto di Mithril:

- **`m()` produce vnode, non DOM.** `m("div", attrs, children)` ritorna un plain
  object immutabile (un *vnode*). Diventa DOM solo quando lo passi a
  `m.render` / `m.mount` / `m.route`. I vnode sono **immutabili per contratto**:
  non mutarli, non riusarli, non crearli fuori dalla view (il diff salta i vnode
  `===` al precedente → la UI non si aggiorna).
- **vnodes → diff → patch.** A ogni redraw Mithril costruisce un nuovo albero di
  vnode, lo diffa contro il precedente e tocca il DOM reale **solo dove serve**
  (preservando focus, valori input, scroll). Le **key** collegano l'identità di
  un'entità al suo sottoalbero quando una lista viene riordinata/filtrata.
- **Auto-redraw ≠ reattività su setState.** Mithril NON ridisegna quando muti lo
  stato. Ridisegna come *side effect del completamento* di: (1) un event handler
  dichiarato in un view Mithril (`onclick`, `oninput`…), (2) una `m.request`, (3)
  un cambio rotta. Tutto il resto (`setTimeout`, `setInterval`,
  `requestAnimationFrame`, Promise raw, WebSocket, callback di librerie terze)
  richiede **`m.redraw()` manuale**. L'auto-redraw esiste solo se hai
  bootstrappato con `m.mount` o `m.route` (non con `m.render` puro).
- **Componenti = oggetti con `view`.** Nessuna classe base, nessuna
  registrazione. Tre forme: POJO (`{view}`), **closure** (funzione che ritorna
  `{view}`, stato nelle variabili della closure — la forma raccomandata: niente
  `this`, niente `.bind`), class (`view()` sul prototype). Lo stato locale è una
  comodità, non un sistema reattivo.
- **Stato fuori dai componenti.** Dati di dominio condivisi → model singleton
  (un modulo esportato con stato + metodi). Componenti "dumb" che leggono e
  dispatchano. Mutazione **diretta/in-place** (`push`, `splice`, assegnazione):
  il diffing è sul vnode tree, non sui riferimenti → niente immutabilità
  obbligatoria.
- **Niente template DSL.** Il flow control nelle view è JavaScript puro: `.map`
  per le liste, ternari/`&&` per i condizionali. Mai `if`/`for` come statement
  nel corpo che assembla l'albero.

## Quando consultare quale reference

Apri il file reference SOLO quando il task lo richiede; usa questa tabella come
indice di routing.

> **Prima di scrivere o rivedere codice Mithril, scorri [references/gotchas-top.md](references/gotchas-top.md):** è il digest prioritario delle trappole a più alto impatto (inoltro attrs senza `m.censor`, key posizionali, `onbeforeremove` senza `return`, auto-redraw fuori dal ciclo). Sono gli errori che si fanno più spesso anche conoscendo il framework.

| Task / esigenza | Reference |
|---|---|
| **Trappole a più alto impatto** (digest prioritario, da scorrere sempre): `m.censor`, keys, exit animation, auto-redraw, risposte stale | [references/gotchas-top.md](references/gotchas-top.md) |
| Scrivere `m()`, selettori CSS, attrs vs property, `style`, eventi, children/splat, `m.fragment`, `m.trust`, struttura e tipi di vnode | [references/hyperscript-vnodes.md](references/hyperscript-vnodes.md) |
| Definire componenti (POJO / closure / class), passare attrs e children, gestire stato locale, `m.censor`, fat-component e anti-pattern | [references/components.md](references/components.md) |
| Lifecycle hook (`oninit`/`oncreate`/`onupdate`/`onbeforeupdate`/`onbeforeremove`/`onremove`), ordine di esecuzione, recycling, e tutto sulle **keys** (restrizioni, liste, ricreazione) | [references/lifecycle-keys.md](references/lifecycle-keys.md) |
| Capire `m.mount` vs `m.render`, il sistema di auto-redraw (cosa lo triggera/non lo triggera), `m.redraw`/`m.redraw.sync`, headless mount, `m.censor` | [references/rendering-redraw.md](references/rendering-redraw.md) |
| Routing SPA: `m.route`, `m.route.prefix`/`set`/`get`/`param`/`Link`/`SKIP`, RouteResolver (`onmatch`/`render`), path params, redirect/preload/lazy-load, `m.parsePathname`/`buildPathname`/`parseQueryString`/`buildQueryString` | [references/routing.md](references/routing.md) |
| Chiamate XHR con `m.request` (opzioni, pipeline `extract`/`deserialize`/`type`, errori `code`/`response`, `background`, FormData, abort via `config`), `m.jsonp`, integrare librerie esterne via lifecycle | [references/request.md](references/request.md) |
| Stato reattivo con `mithril/stream`: `stream()`, `.map`, `combine`/`merge`/`lift`/`scan`/`scanMerge`, `SKIP`, `.end`, stati pending/active/ended, atomicità | [references/streams.md](references/streams.md) |
| Setup JSX (Babel/TypeScript/esbuild, pragma `m` + fragment `"["`), installazione (CDN/npm/ESM/bundler), pattern ES6, scelta JSX vs hyperscript | [references/jsx-tooling.md](references/jsx-tooling.md) |
| Testing (ospec + `mithril-query` + jsdom, setup globals) e animazioni (enter CSS, exit con `onbeforeremove`+Promise, `requestAnimationFrame`, performance) | [references/testing-animation.md](references/testing-animation.md) |
| Architettura applicativa: organizzazione `models/`/`views/`, model singleton, data layer, CRUD completo, pattern flux-like (TodoMVC), confronto React/Vue/Angular | [references/patterns-examples.md](references/patterns-examples.md) |
| Best practice e architettura avanzata (linee guida trasversali) | [references/best-practices.md](references/best-practices.md) |
| App complete e funzionanti da studiare come riferimento idiomatico | `examples/todomvc.js` (CRUD + routing + flux-like), `examples/threaditjs.js` (RouteResolver + data layer + m.request), `examples/svg-clock.html` (SVG + redraw) |

## API essenziali

Cheatsheet compatto. Per i dettagli (firme complete, opzioni, edge case) rimanda
ai reference linkati nella tabella.

```javascript
// m() — costruisce un vnode (hyperscript). Statico nel selettore, dinamico in attrs.
m("div.class#id[type=text]", {title: "t", onclick: fn}, ["child", m("span", x)])

// m.mount — monta un COMPONENTE (nudo) e attiva l'auto-redraw
m.mount(document.body, Counter)        // sostituisci: m.mount(el, Other); smonta: m.mount(el, null)

// m.render — basso livello, vuole un VNODE (m(Component)), nessun auto-redraw
m.render(document.body, m(MyComponent))

// m.route — SPA routing (una sola chiamata per app): (root, defaultRoute, routes)
m.route.prefix = "#!"                   // impostalo PRIMA di m.route
m.route(document.body, "/list", {
  "/list": UserList,                    // valore = componente o RouteResolver
  "/edit/:id": UserForm,                // :id -> vnode.attrs.id (sempre String)
})
m.route.set("/edit/:id", {id: 1})       // naviga (no prefix); redraw asincrono
m.route.get()                           // ultimo path risolto
m.route.param("id")                     // parametro della rotta corrente
m(m.route.Link, {href: "/list"}, "Users")  // link interno (no reload). Disabilita con disabled:true

// m.request — XHR; ritorna una Promise, NON i dati. Redraw automatico al completamento.
m.request({method: "PUT", url: "/api/users/:id", params: {id: 1}, body: data})
  .then(function(res) { Store.user = res })   // niente m.redraw() qui: è automatico
  .catch(function(e) { /* e.code, e.response */ })

// m.redraw — necessario SOLO fuori dal ciclo Mithril (timer, websocket, lib terze)
setInterval(function() { state.t = Date.now(); m.redraw() }, 1000)

// m.trust — HTML grezzo non escapato (come dangerouslySetInnerHTML). Solo su contenuto sanitizzato.
m("div", m.trust("<em>safe</em>"))

// mithril/stream — modulo separato (import a parte). Stream = funzione getter/setter reattiva.
var stream = require("mithril/stream")
var title = stream(""), slug = title.map(function(v){ return v.toLowerCase() })
title("Hello")                          // slug() === "hello"; aggiorna gli stream dipendenti
```

## Regole d'oro

1. **Lo stato locale per-istanza va nelle variabili della closure**, non in
   property dell'oggetto POJO (condivise via prototipo tra le istanze) né in
   `this` (rotto nelle funzioni annidate ES5). Default = **closure component**.
2. **Non confondere `m.mount` e `m.render`**: `m.mount(el, Component)` vuole il
   componente nudo e attiva l'auto-redraw; `m.render(el, m(Component))` vuole un
   vnode e non ridisegna da solo. `m.redraw()` funziona solo con `m.mount`/`m.route`.
3. **Capisci cosa triggera l'auto-redraw**: event handler del view, `m.request`,
   cambio rotta. Per `setTimeout`/`setInterval`/`rAF`/Promise raw/WebSocket/lib
   terze chiama **`m.redraw()` manualmente**. Mutare lo stato da solo non ridisegna mai.
4. **Mai chiamare `m.redraw()` (o `m.redraw.sync()`) dentro `view()` o un
   lifecycle method**: `m.redraw.sync()` è vietato lì (undefined behavior); usa
   `m.redraw()` async solo se devi ri-renderizzare dopo una misura DOM in `oncreate`.
5. **Mai mutare o riusare un vnode** già renderizzato, né crearne fuori dalla
   view: sono immutabili e confrontati per `===` (il diff li salta → UI stantia).
   Per saltare un diff intenzionalmente usa `onbeforeupdate`, non il riciclo.
6. **`key` solo tra sibling dello stesso array**, e o tutti keyed o tutti
   unkeyed (mai mix, niente `null`/stringhe accanto a nodi keyed → errore). La
   key è **computata, unica, stabile, di tipo coerente** (l'`id` dell'entità,
   mai l'indice di `.map`, mai una key statica). Filtra la lista *prima* della map.
7. **Two-way binding è manuale**: `value:` legge lo stato, `oninput:`/`onchange:`
   lo riscrive. Nessun `v-model`. In `onsubmit` chiama `e.preventDefault()` o il
   browser ricarica la pagina.
8. **`m.trust` mai su input utente non sanitizzato** (XSS). Sanitizza con
   whitelist + parser HTML reale, non regex. Per entità usa il carattere unicode,
   non `m.trust("&trade;")`. Ricorda che `<script>` iniettato via innerHTML non gira.
9. **Hook = riferimento, mai chiamata**: `oninit: Model.load` ✅; `oninit:
   Model.load()` ❌ (esegue subito alla valutazione del modulo, non al mount).
10. **`return` sempre la Promise** da `m.request` e dai metodi del model, così il
    chiamante può concatenare `.then`/`.catch` (es. redirect dopo `save`).
11. **Inoltrando attrs a un figlio** (`m("div", vnode.attrs, ...)`) passa per
    `m.censor(vnode.attrs)`: altrimenti i lifecycle girano due volte e la `key`
    finisce fuori posto.
12. **Statico nel selettore, dinamico in `attrs`**; `style` come **oggetto** (diff
    regola-per-regola) non stringa; ricorda che `class` selettore+attrs fa
    **merge**, ogni altro attributo in `attrs` **sovrascrive** il selettore.

## Errori comuni

- **"Muto lo stato ma la UI non si aggiorna."** Sei fuori dal ciclo Mithril
  (timer/Promise raw/websocket/callback di lib). Aggiungi `m.redraw()`. Vedi
  [rendering-redraw.md](references/rendering-redraw.md).
  ```javascript
  // ❌ socket.on("msg", m => { state.list.push(m) })
  // ✅ socket.on("msg", m => { state.list.push(m); m.redraw() })
  ```

- **`m.request` ritorna una Promise, non i dati.**
  ```javascript
  // ❌ var users = m.request("/api/users"); console.log(users) // è una Promise
  // ✅ m.request("/api/users").then(function(users){ /* usa users */ })
  ```

- **Componente definito o istanziato fuori dalla view** → ricreato da zero o diff
  saltato (UI mai aggiornata).
  ```javascript
  // ❌ var node = m(Counter); m.mount(root, {view:()=>[m("h1","app"), node]})
  // ✅ m.mount(root, {view:()=>[m("h1","app"), m(Counter)]})
  ```

- **Hook chiamato invece che referenziato.**
  ```javascript
  // ❌ oninit: User.loadList()   // gira subito, non al mount, non si ripete
  // ✅ oninit: User.loadList
  ```

- **Key = indice della map** (o key statica) → lo stato segue la posizione, non
  l'entità: input che perdono valore, animazioni che "saltano".
  ```javascript
  // ❌ items.map((it, i) => m(Row, {key: i, item: it}))
  // ✅ items.map(it => m(Row, {key: it.id, item: it}))
  ```

- **Mix keyed/unkeyed con un buco condizionale** → Mithril lancia errore.
  ```javascript
  // ❌ things.map(t => cond(t) ? m(T, {key:t.id}) : null)
  // ✅ things.filter(cond).map(t => m(T, {key:t.id}))
  ```

- **`key` del model che filtra negli attrs del componente** (es. un colore
  `key:"red"`) → Mithril la interpreta come key di reconciliation.
  ```javascript
  // ❌ users.map(u => m(UserComponent, u))           // se u ha una property key/lifecycle
  // ✅ users.map(u => m(UserComponent, {key: u.id, model: u}))
  ```

- **Inoltro di `vnode.attrs` grezzo** dal wrapper al figlio → lifecycle doppi,
  key fuori posto. Usa `m.censor`.
  ```javascript
  // ❌ m(".modal", vnode.attrs, children)
  // ✅ m(".modal", m.censor(vnode.attrs), children)
  ```

- **`onbeforeremove` aspettato sui figli interni** → scatta SOLO sull'elemento
  che perde il `parentNode`. Per l'exit animation attacca l'hook in alto
  nell'albero e ritorna una Promise risolta su `animationend`/`transitionend`
  (altrimenti l'elemento non viene mai rimosso). Per la cleanup ricorsiva
  (timer/listener) usa `onremove`. Vedi [testing-animation.md](references/testing-animation.md).

- **`preventDefault` per bloccare un `m.route.Link`** → non funziona. Usa
  `disabled: true`. E in `m.route.set`/`Link` non scrivere mai il prefix (`#!`).

- **Prefix impostato dopo `m.route(...)`** → ignorato. `m.route.prefix` va sempre
  prima della chiamata `m.route`.

- **`import m from "mithril"` con bare specifier in ESM nativo browser** →
  fallisce: serve un bundler (esbuild/Webpack/Vite) o un import map. In JSX,
  ricorda pragma `m` + fragment `"["`, altrimenti i fragment si rompono in
  silenzio. Vedi [jsx-tooling.md](references/jsx-tooling.md).
