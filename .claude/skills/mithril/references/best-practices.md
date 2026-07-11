# Mithril.js 2.3.6 — Best Practice e Architettura (livello senior)

Guida architetturale per applicazioni reali. Presuppone già letti gli altri reference (`components.md`, `lifecycle-keys.md`, `rendering-redraw.md`, `patterns-examples.md`, `streams.md`): qui non si ripetono le basi, ma si compongono in decisioni d'architettura, pattern di scala e trappole di produzione. Sintassi hyperscript `m()`, nessuna API inventata: solo `m`, `m.mount`, `m.render`, `m.route`, `m.route.Link/set/get/param/prefix/SKIP`, RouteResolver `onmatch`/`render`, `m.request`, `m.redraw`/`m.redraw.sync`, `m.censor`, `m.trust`, `m.fragment`, `mithril/stream`.

## Indice

- [1. Architettura di progetto](#1-architettura-di-progetto)
- [2. Gestione dello stato](#2-gestione-dello-stato)
- [3. Performance](#3-performance)
- [4. Pattern componenti](#4-pattern-componenti)
- [5. Routing avanzato](#5-routing-avanzato)
- [6. Data fetching](#6-data-fetching)
- [7. Testing](#7-testing)
- [8. Gotcha da produzione](#8-gotcha-da-produzione)
- [9. Migrazione mentale da React/Vue](#9-migrazione-mentale-da-reactvue)
- [Checklist pre-release](#checklist-pre-release)

---

## 1. Architettura di progetto

L'architettura idiomatica Mithril separa nettamente **data-layer** (model) e **view** (componenti). Una struttura che scala per app multi-dominio:

```
src/
  index.js              // bootstrap: m.route / m.mount. Solo wiring.
  config.js             // costanti (apiUrl, route prefix, feature flags)
  models/               // data-layer: singleton per dominio
    User.js
    Auth.js
    Order.js
  lib/                  // util trasversali (request wrapper, formatters)
    request.js          // wrapper su m.request con baseUrl/error handling
  components/           // componenti riusabili e "stupidi" (presentational)
    Button.js
    Modal.js
    Spinner.js
  pages/                // componenti-pagina, uno per route (container)
    UserListPage.js
    UserEditPage.js
  views/
    Layout.js           // chrome condiviso (nav, header, footer)
```

Distinzione operativa fra le tre cartelle di UI:

- **`components/`** — pezzi riusabili senza conoscenza del dominio. Ricevono tutto via `attrs`/`children`. Nessun import di model.
- **`pages/`** — un componente per rotta; orchestra model + components, fa il data-fetching in `oninit`. È il "container".
- **`views/Layout.js`** — il guscio applicativo che riceve la pagina come `children`.

**Bootstrap (`index.js`) — solo wiring, zero logica di business:**

```javascript
var m = require("mithril")
var Layout = require("./views/Layout")
var UserListPage = require("./pages/UserListPage")
var UserEditPage = require("./pages/UserEditPage")

m.route.prefix = "#!"   // default; usa "" + server config per URL puliti

m.route(document.body, "/users", {
    "/users":      { render: function()  { return m(Layout, m(UserListPage)) } },
    "/users/:id":  { render: function(v) { return m(Layout, m(UserEditPage, v.attrs)) } },
})
```

**Regola del data-layer:** un model **non importa mai un componente** e **non chiama mai `m.redraw()` se l'unica fonte di update è `m.request`** (il redraw è automatico). Il model espone stato + metodi che ritornano Promise; la view decide solo *quando* invocarli. Questa asimmetria di dipendenze (view → model, mai model → view) è ciò che mantiene il data-layer testabile in isolamento.

---

## 2. Gestione dello stato

### Closure component come default

Lo stato **UI effimero e per-istanza** (aperto/chiuso, draft di input, indice attivo) vive nelle variabili della closure. Niente `this`, niente `.bind`, isolamento per istanza garantito:

```javascript
function Accordion() {
    var openIndex = -1                    // stato per-istanza
    function toggle(i) { openIndex = openIndex === i ? -1 : i }

    return {
        view: function(vnode) {
            return m(".accordion", vnode.attrs.sections.map(function(s, i) {
                return m(".section", [
                    m(".head", {onclick: function() { toggle(i) }}, s.title),
                    openIndex === i ? m(".body", s.content) : null,
                ])
            }))
        },
    }
}
```

### Single source of truth senza Redux

Il **model singleton** è la SSOT per i dati di dominio. È un oggetto module-level, condiviso da tutte le view che lo importano: niente prop-drilling, niente context provider, niente reducer immutabili. Il diffing avviene sul vnode tree, quindi **la mutazione in-place è idiomatica** — Mithril non confronta riferimenti di stato come React/Redux.

```javascript
// models/Cart.js
var m = require("mithril")

var Cart = {
    items: [],                                  // SSOT
    total: function() {
        return Cart.items.reduce(function(s, it) { return s + it.price * it.qty }, 0)
    },
    add: function(product) {
        var existing = Cart.items.find(function(it) { return it.id === product.id })
        if (existing) existing.qty++            // mutazione in-place: OK
        else Cart.items.push({id: product.id, price: product.price, qty: 1})
    },
    remove: function(id) {
        var i = Cart.items.findIndex(function(it) { return it.id === id })
        if (i > -1) Cart.items.splice(i, 1)     // splice in-place: OK
    },
    load: function() {
        return m.request({method: "GET", url: "/api/cart"})
            .then(function(data) { Cart.items = data.items })   // redraw automatico
    },
}

module.exports = Cart
```

Il **derived state** (`total()`) è una funzione ricalcolata a ogni accesso nella view: niente memoizzazione, niente selector. Costa zero in API e non si desincronizza mai.

### Quando usare `mithril/stream`

Il singleton mutabile copre il 90% dei casi. Passa a `mithril/stream` **solo** quando hai catene di valori derivati che ricalcoleresti inutilmente a ogni redraw, o un grafo di dipendenze a diamante dove l'aggiornamento atomico evita glitch:

```javascript
var stream = require("mithril/stream")

function SearchBox() {
    var query = stream("")
    // slug/normalizzazione ricalcolata SOLO quando query cambia, non a ogni redraw
    var normalized = query.map(function(q) { return q.trim().toLowerCase() })

    return {
        view: function() {
            return m("input", {
                value: query(),
                oninput: function(e) { query(e.target.value) },   // redraw via event handler
            })
        },
    }
}
```

Ricorda: lo stream **non** innesca il rendering; il redraw qui arriva dall'event handler. Aggiornando uno stream da un timer/websocket serve `m.redraw()` esplicito. Non introdurre stream "per principio": è complessità in più rispetto a una variabile e una funzione.

---

## 3. Performance

### Capire diff e auto-redraw prima di ottimizzare

Mithril diffa l'intero vnode tree a ogni redraw, ma **modifica il DOM solo dove serve** e tocca solo i nodi cambiati. Il costo è la *generazione* del virtual DOM (le tue `view()` che girano), non il patch. Quindi la prima leva di performance è **ridurre i redraw inutili**, non micro-ottimizzare il diff.

### Evitare redraw inutili

**`e.redraw = false`** negli handler ad alta frequenza che non cambiano la UI:

```javascript
m("div", {
    onmousemove: function(e) {
        trackPointer(e.clientX, e.clientY)   // logging/analytics
        e.redraw = false                      // nessun redraw per ogni mousemove
    },
})
```

**`background: true`** per richieste che non devono ridisegnare (polling, prefetch, telemetria):

```javascript
m.request({method: "GET", url: "/api/heartbeat", background: true})
    .then(function(data) { Health.last = data })   // nessun redraw automatico
```

**`m.censor`** quando inoltri attrs: previene doppi lifecycle (doppi analytics hit) e `key` fuori posto, non un costo di redraw diretto ma un side-effect costoso (vedi §4).

### `onbeforeupdate` per saltare update costosi — ultima risorsa

`onbeforeupdate` che ritorna `false` salta il diff del sottoalbero. Usalo **solo** sul nodo padre dell'array più grande e **solo** dopo aver misurato un problema reale:

```javascript
var BigTable = {
    onbeforeupdate: function(vnode, old) {
        // salta il diff se il riferimento alla lista non è cambiato
        return vnode.attrs.rows !== old.attrs.rows
    },
    view: function(vnode) {
        return m("table", vnode.attrs.rows.map(function(r) {
            return m("tr", {key: r.id}, m("td", r.label))
        }))
    },
}
```

> Trappola: questo short-circuit dipende dall'identità (`!==`). Se altrove muti `rows` **in-place** invece di sostituirlo, `onbeforeupdate` ritorna `false` e la tabella resta stantia. Qui — e solo qui — serve sostituire l'array (`rows = rows.concat(...)`) anziché `push`. È l'unica eccezione alla regola "muta in-place".

### Keys corrette e componenti stabili

- **Key computate sull'identità** (`r.id`), mai indici, mai statiche, su liste con stato/identità: senza key lo stato interno finisce sulla riga sbagliata dopo un'inserzione/rimozione.
- **Non ricreare componenti**: definisci il componente staticamente (module-level) e chiamalo dentro `view` con `m(Comp, attrs)`. Definirlo dentro `view` lo ricrea da zero a ogni redraw (identità per `===`); istanziarlo fuori da `view` fa saltare il diff.

```javascript
// AVOID: factory nel render -> ricreazione a ogni redraw
view: function() { return m({view: function() { return m("div", "x") }}) }

// PREFER: componente statico, dati via attrs
var Cell = {view: function(v) { return m("div", v.attrs.value) }}
view: function() { return m(Cell, {value: "x"}) }
```

### Design prima dell'ottimizzazione

Più `onbeforeupdate` sparsi sono un *code smell*. Il problema "tabella da 5000 righe" si risolve quasi sempre con paginazione/virtualizzazione/ricerca, non con hook di skip. Ottimizza solo ciò che hai misurato.

---

## 4. Pattern componenti

### Container / Presentational

I **presentational** (in `components/`) sono puri: ricevono tutto via `attrs`, non importano model, non fanno fetch. I **container** (in `pages/`) collegano model e presentational.

```javascript
// components/UserCard.js — presentational, riusabile, zero dominio
var UserCard = {
    view: function(vnode) {
        return m(".card", [
            m("h3", vnode.attrs.name),
            m("button", {onclick: vnode.attrs.onEdit}, "Edit"),   // callback iniettata
        ])
    },
}

// pages/UserListPage.js — container: model + presentational
var m = require("mithril")
var User = require("../models/User")
var UserCard = require("../components/UserCard")

module.exports = {
    oninit: User.loadList,
    view: function() {
        return m(".list", User.list.map(function(u) {
            return m(UserCard, {
                key: u.id,
                name: u.firstName + " " + u.lastName,
                onEdit: function() { m.route.set("/users/" + u.id) },
            })
        }))
    },
}
```

### Higher-order component in Mithril

Un HOC è una funzione che riceve un componente e ne ritorna uno arricchito. Idiomatico per cross-cutting concern (auth-gate, loading wrapper). `m.censor` quando si inoltrano gli attrs al componente avvolto:

```javascript
// lib/withSpinner.js — HOC: mostra spinner finché attrs.loading è true
var m = require("mithril")
var Spinner = require("../components/Spinner")

module.exports = function withSpinner(Component) {
    return {
        view: function(vnode) {
            if (vnode.attrs.loading) return m(Spinner)
            return m(Component, m.censor(vnode.attrs, ["loading"]), vnode.children)
        },
    }
}

// uso
var UserListWithSpinner = withSpinner(UserListPage)
m(UserListWithSpinner, {loading: User.list.length === 0})
```

### Componenti riusabili con `attrs` e slot pattern via `children`

I `children` sono lo "slot" di Mithril: contenuto uniforme proiettato in una posizione. Gli `attrs` nominali sono per "slot multipli con ruolo".

```javascript
// Modal con slot via children + censor sugli attrs inoltrati al wrapper DOM
var Modal = {
    view: function(vnode) {
        return m(".modal-backdrop", {onclick: vnode.attrs.onClose}, [
            // censor: evita di propagare lifecycle/key del consumatore al .modal
            m(".modal", m.censor(vnode.attrs, ["onClose"]), [
                m(".modal-body", vnode.children),   // slot
            ]),
        ])
    },
}

m(Modal, {onClose: close}, [
    m("h2", "Conferma"),
    m("p", "Sei sicuro?"),
])
```

> Regola d'oro del passthrough: **ogni `m(el, vnode.attrs, ...)` deve passare per `m.censor`**. Inoltrare `vnode.attrs` grezzo è il difetto silenzioso più comune dei componenti di layout: lifecycle eseguiti due volte e `key` iniettata su un fragment misto (errore a runtime).

---

## 5. Routing avanzato

### RouteResolver: `onmatch` + `render`

Un RouteResolver è un oggetto `{onmatch, render}`. `onmatch` gira **prima** del render e decide *quale* componente montare; può ritornare un componente, una `Promise` di componente (lazy loading), oppure `m.route.SKIP` per cedere il match alla rotta successiva. `render` avvolge il risultato (tipicamente nel Layout).

### Auth guard

```javascript
var Auth = require("./models/Auth")

var requireAuth = {
    onmatch: function(args, requestedPath) {
        if (!Auth.isLoggedIn()) {
            m.route.set("/login", null, {replace: true})   // redirect, niente history entry
            return new Promise(function() {})               // pending: blocca il render
        }
        return Dashboard                                    // autorizzato
    },
    render: function(vnode) {
        return m(Layout, vnode)   // vnode = il componente risolto da onmatch
    },
}

m.route(document.body, "/login", {
    "/login": LoginPage,
    "/dashboard": requireAuth,
})
```

> `onmatch` viene chiamato a ogni navigazione verso quella rotta, ma `render` solo se il vnode prodotto da `onmatch` cambia tipo: tra `/users/1` e `/users/2` (stesso resolver) il componente **non si reinizializza** e non rifà la fetch. Fix: `key` derivata dal param (vedi sotto).

### Lazy loading via Promise

```javascript
var lazyReports = {
    onmatch: function() {
        // dynamic import: il chunk Reports è caricato solo al primo match
        return import("./pages/ReportsPage.js").then(function(mod) { return mod.default })
    },
    render: function(vnode) { return m(Layout, vnode) },
}
```

`m.route` mostra l'ultima view finché la Promise non risolve: il routing assorbe l'attesa senza schermata bianca.

### `m.route.SKIP` per rotte condizionali

```javascript
m.route(document.body, "/", {
    "/files/:file": {
        onmatch: function(args) {
            // se non è un file valido, cedi il match alla rotta più generica sotto
            return isValidFile(args.file) ? FileView : m.route.SKIP
        },
    },
    "/:404...": NotFound,   // catch-all
})
```

### Layout condiviso, 404, query params

```javascript
m.route(document.body, "/", {
    "/":            { render: function() { return m(Layout, m(Home)) } },
    "/search":      { render: function() {
        // query param: m.route.param("q") legge ?q=...
        return m(Layout, m(SearchPage, {q: m.route.param("q") || ""}))
    } },
    "/users/:id":   { render: function() {
        var id = m.route.param("id")
        // key derivata dal param -> reinizializza Person passando da /users/1 a /users/2
        return m(Layout, [m(UserEditPage, {id: id, key: id})])
    } },
    "/:404...":     { render: function() { return m(Layout, m(NotFound)) } },   // catch-all 404
})
```

- `m.route.param("id")` legge un parametro di rotta **o** una query string (entrambi confluiscono in `attrs`); senza argomento ritorna l'intera mappa.
- `"/:404..."` con `...` è il pattern catch-all (cattura il path residuo) → pagina 404.
- Il `[m(Comp, {key})]` è un **single-child keyed fragment**: l'unico modo corretto per forzare la reinizializzazione di un singolo componente al cambio di key.

---

## 6. Data fetching

### Caricamento in `oninit`, return della Promise

Il fetch va in `oninit` del componente-pagina, con `oninit: Model.method` (riferimento, **mai** chiamata). Il metodo del model **ritorna sempre la Promise**, così il chiamante può concatenare (es. redirect dopo `save`):

```javascript
// models/User.js
var User = {
    list: [], current: null,
    loading: false, error: null,

    loadList: function() {
        if (User.loading) return Promise.resolve()   // evita richieste duplicate concorrenti
        User.loading = true; User.error = null
        return m.request({method: "GET", url: "/api/users"})
            .then(function(data) { User.list = data })
            .catch(function(e)  { User.error = e.message })
            .finally(function()  { User.loading = false })   // redraw automatico ad ogni then
    },

    save: function() {
        return m.request({method: "PUT", url: "/api/users/" + User.current.id, body: User.current})
    },
}

// pages/UserListPage.js
module.exports = {
    oninit: User.loadList,
    view: function() {
        if (User.loading) return m(Spinner)
        if (User.error)   return m(".error", User.error)
        return m(".list", User.list.map(function(u) { return m("div", {key: u.id}, u.firstName) }))
    },
}
```

### Loading / error states e cache nel model

Modella `loading`/`error` come stato del model (qui flag; per casi complessi un singolo campo `status` enum: `"idle"|"loading"|"ready"|"error"`). La **cache** vive nel model: se `User.list` è già popolata, puoi saltare il refetch.

```javascript
loadList: function(force) {
    if (!force && User.list.length) return Promise.resolve()   // cache hit
    return m.request({method: "GET", url: "/api/users"}).then(function(d) { User.list = d })
},
```

### Evitare richieste duplicate e concatenare

- **Dedup concorrente**: il guard `if (User.loading) return Promise.resolve()` impedisce due fetch in volo.
- **Concatenazione**: poiché i metodi ritornano la Promise, il chiamante orchestra senza che il model conosca la UI:

```javascript
onsubmit: function(e) {
    e.preventDefault()
    User.save().then(function() { m.route.set("/users") })   // redirect dopo save
}
```

> Non chiamare `m.redraw()` dentro un `.then` di `m.request`: è ridondante (il redraw è automatico). Serve solo nei `.then` di Promise **raw** (`fetch`), nei timer e nelle callback di librerie esterne.

---

## 7. Testing

Stack idiomatico: **ospec** (test runner di Mithril, zero-config) + **mithril-query** (renderizza un componente in un albero ispezionabile senza DOM reale).

### Testare un model in isolamento

Il model è JS puro con dipendenza solo da `m.request`: mockala (es. con `o.spy` o sostituendo `m.request`) e verifica le transizioni di stato.

```javascript
var o = require("ospec")
var User = require("../src/models/User")

o.spec("User model", function() {
    o("loadList popola list e gestisce loading", function() {
        // arrange: stub di m.request che risolve con dati finti
        // act
        return User.loadList().then(function() {
            // assert
            o(User.loading).equals(false)
            o(User.list.length > 0).equals(true)
        })
    })
})
```

### Testare un componente con mithril-query

```javascript
var o = require("ospec")
var mq = require("mithril-query")
var UserCard = require("../src/components/UserCard")

o.spec("UserCard", function() {
    o("rende il nome e invoca onEdit al click", function() {
        var clicked = false
        var out = mq(UserCard, {name: "Ada Lovelace", onEdit: function() { clicked = true }})

        o(out.contains("Ada Lovelace")).equals(true)   // render corretto
        out.click("button")                            // simula evento (triggera il redraw interno)
        o(clicked).equals(true)                        // callback invocata
    })
})
```

**Cosa testare**: per i **model**, le transizioni di stato (loading→ready→error), la dedup, la mutazione corretta della collezione. Per i **componenti presentational**, che rendano gli `attrs` e invochino le callback agli eventi. Per i **container**, l'integrazione model↔view (di solito basta testarne i pezzi separatamente). Non testare il diffing di Mithril: è il framework, non il tuo codice.

---

## 8. Gotcha da produzione

**Auto-redraw che non scatta.** L'auto-redraw avviene **solo** dopo: event handler dichiarati nei `view` Mithril, completamento di `m.request`, cambio di rotta. **Non** scatta in `setTimeout`/`setInterval`/`requestAnimationFrame`, Promise raw (`fetch`), callback di websocket o di librerie terze. Lì chiama `m.redraw()`:

```javascript
var socket = new WebSocket(url)
socket.onmessage = function(ev) {
    Feed.messages.push(JSON.parse(ev.data))
    m.redraw()                                   // obbligatorio: WS non è gestito da Mithril
}
```

**Stato condiviso tra istanze con POJO component.** Una proprietà definita sull'oggetto POJO è sul *prototipo*: oggetti/array mutati lì sono condivisi tra **tutte** le istanze. Usa closure component, oppure inizializza lo stato per-istanza in `oninit` su `vnode.state`:

```javascript
// BUG: tutte le istanze condividono lo stesso array `items`
var Buggy = { items: [], view: function() { /* ... */ } }

// FIX: closure -> array per-istanza
function Fixed() { var items = []; return { view: function() { /* ... */ } } }
```

**Memory leak con listener globali.** Ogni `addEventListener` su `window`/`document` (o subscription esterna) aggiunto in `oncreate`/closure **deve** essere rimosso in `onremove`. `onremove` scatta su ogni nodo rimosso:

```javascript
function Resizer() {
    function onResize() { Layout.width = window.innerWidth; m.redraw() }
    window.addEventListener("resize", onResize)
    return {
        view: function() { /* ... */ },
        onremove: function() { window.removeEventListener("resize", onResize) },   // niente leak
    }
}
```

Stesso principio per `setInterval` (clear in `onremove`), stream a vita limitata (`pos.end(true)`), e widget di librerie terze (`.destroy()`). E ricorda: se rimuovi il nodo root dal DOM manualmente, chiama `m.mount(root, null)` prima, o lo stato interno di Mithril resta agganciato.

**`m.trust` e XSS.** `m.trust(html)` è l'equivalente di `dangerouslySetInnerHTML`: rende HTML grezzo senza escaping. È un vettore XSS diretto. Usalo **solo** su contenuto sanitizzato server-side o generato internamente, **mai** su input utente non filtrato:

```javascript
m(".comment", m.trust(sanitize(comment.html)))   // sanitize obbligatorio se la fonte è untrusted
```

**Redraw durante la view.** Non chiamare `m.redraw()` (né `m.redraw.sync()`) dentro `view()` o dentro un lifecycle in modo che rientri nel render: `m.redraw.sync()` nel `view`/lifecycle è esplicitamente vietato (lancia errore). Se devi ridisegnare dopo una misura del DOM in `oncreate`, usa `m.redraw()` (asincrono):

```javascript
oncreate: function(vnode) {
    this.height = vnode.dom.offsetHeight
    m.redraw()   // async: la seconda passata mostra l'altezza reale. MAI m.redraw.sync() qui.
}
```

---

## 9. Migrazione mentale da React/Vue

Tabella di corrispondenza dei concetti. Importante: in Mithril **mutare lo stato non innesca un re-render** — il redraw è guidato dal *completamento di certe funzioni* (event handler, `m.request`, route change), non da una mutazione osservata.

| React / Vue | Mithril 2.3.6 | Note |
|---|---|---|
| `useState` | variabile nella **closure** del componente | nessun setter reattivo; muti e basta |
| `setState(x)` (triggera render) | mutazione + (se fuori dal ciclo Mithril) `m.redraw()` | dentro un event handler il redraw è automatico |
| `useEffect(fn, [])` (mount) | `oninit` (pre-DOM) / `oncreate` (post-DOM) | `oncreate` per misure di layout / lib DOM |
| `useEffect(fn, [deps])` | `onupdate` + confronto manuale in `onbeforeupdate` | nessuna dependency array automatica |
| cleanup di `useEffect` (return) | `onremove` | rimuovi listener/timer/subscription qui |
| `useMemo` / `computed` (Vue) | funzione nella view, o `mithril/stream` `.map` | derived state ricalcolato on-demand |
| `Context` / provider | **model singleton** importato | niente provider, niente prop-drilling |
| Redux store + reducer | model singleton con metodi + mutazione in-place | il diffing è sul vnode tree, non sui riferimenti |
| `useRef` (DOM) | `vnode.dom` in `oncreate`/`onupdate` | mai `vnode.dom` in `oninit` |
| React Router `<Route>` | `m.route(root, default, {...})` | routing nel core |
| `<Link to>` | `m(m.route.Link, {href})` | intercetta il click, niente reload |
| `useParams()` / `useSearchParams()` | `m.route.param("id")` | rotta e query confluiscono entrambe |
| `navigate("/x")` | `m.route.set("/x")` | redraw asincrono dopo il cambio rotta |
| `key` (liste) | `key` (identico) | computata sull'identità, mai indice/statica |
| `dangerouslySetInnerHTML` | `m.trust(html)` | stesso rischio XSS |
| `React.memo` / `shouldComponentUpdate` | `onbeforeupdate` → `false` salta il diff | ultima risorsa, dipende da `!==` |
| `<>...</>` fragment | array o `m.fragment(attrs, children)` | `m.fragment` quando serve una `key` sul fragment |
| `props` | `vnode.attrs` | `children` per il contenuto proiettato |
| `props.children` / slot | `vnode.children` | slot uniforme; attrs nominali per slot con ruolo |
| spread `{...props}` | `m.censor(vnode.attrs, [extra])` | mai inoltrare `attrs` grezzo (lifecycle doppi, key) |

Take-away: chi viene da **React** trasferisce il modello componenti+vDOM quasi 1:1 ma deve **smettere di cercare Redux/Context/Router esterni** e ricordare che non c'è re-render automatico su mutazione. Chi viene da **Vue** deve **disimparare template e direttive** (`v-if`/`v-for`/`v-model`): la view è JavaScript (`.map`, ternari) e il two-way binding è manuale (`value` + `oninput`).

---

## Checklist pre-release

1. **Separazione netta model/view**: nessun model importa un componente; le pagine fanno fetch in `oninit` con `oninit: Model.method` (riferimento, mai `Model.method()`).
2. **Tutti i metodi del model ritornano la Promise** di `m.request`, così i chiamanti concatenano (redirect dopo save) e i test possono attenderli.
3. **`m.redraw()` presente in ogni callback fuori dal ciclo Mithril** (timer, `fetch` raw, websocket, lib terze) e **assente** dentro i `.then` di `m.request`/event handler (ridondante).
4. **Nessuno stato mutabile condiviso su POJO component**: stato per-istanza nelle closure o in `oninit` su `vnode.state`; verificato che due istanze non si calpestino.
5. **Ogni listener globale / timer / subscription / widget terzo è smontato in `onremove`**; se rimuovi il root dal DOM a mano, `m.mount(root, null)` prima.
6. **Key computate sull'identità** su tutte le liste con stato (mai indici, mai statiche, tipi coerenti, niente `null` accanto a nodi keyed: filtra prima della `map`).
7. **Ogni passthrough di attrs passa per `m.censor`** (`m(el, m.censor(vnode.attrs, [custom]), ...)`); nessun `vnode.attrs` grezzo inoltrato.
8. **`m.trust` solo su contenuto sanitizzato**; nessun input utente non filtrato passa per `m.trust`.
9. **Navigazione interna solo via `m(m.route.Link, {href})`** o `m.route.set`; nessun `m("a", {href})` che ricarica la pagina; `e.preventDefault()` in ogni `onsubmit`.
10. **Auth guard + 404 coperti**: rotte protette via RouteResolver `onmatch` con redirect; catch-all `"/:404..."` presente.
11. **`onbeforeupdate` solo dove misurato** un problema (un padre per l'array grande); se usato, l'array è sostituito (`!==`) non mutato in-place.
12. **`m.redraw.sync()` assente** da view e lifecycle (vietato); presente solo nell'eventuale caso di playback video iOS dentro un event handler utente.
