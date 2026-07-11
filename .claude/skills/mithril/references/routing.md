# Mithril.js 2.3.6 — Routing e Path utilities

File di riferimento esperto per `m.route` e le utility di gestione path/querystring. Tutto estratto dai doc ufficiali Mithril 2.3.6. Sintassi hyperscript `m()`, non JSX (salvo dove esplicitamente indicato).

## Indice

- [1. m.route(root, defaultRoute, routes)](#1-mrouteroot-defaultroute-routes)
- [2. Routing strategies e m.route.prefix](#2-routing-strategies-e-mrouteprefix)
- [3. m.route.set](#3-mrouteset)
- [4. m.route.get](#4-mrouteget)
- [5. m.route.param](#5-mrouteparam)
- [6. m.route.Link](#6-mroutelink)
- [7. m.route.SKIP](#7-mrouteskip)
- [8. RouteResolver: onmatch e render](#8-routeresolver-onmatch-e-render)
- [9. Parametri di route e path templates](#9-parametri-di-route-e-path-templates)
- [10. Key parameter (ricreazione componente)](#10-key-parameter-ricreazione-componente)
- [11. History state](#11-history-state)
- [12. Pattern avanzati: layout, redirect, preload, lazy load](#12-pattern-avanzati-layout-redirect-preload-lazy-load)
- [13. Path utilities: buildPathname / parsePathname](#13-path-utilities-buildpathname--parsepathname)
- [14. Querystring utilities: buildQueryString / parseQueryString](#14-querystring-utilities-buildquerystring--parsequerystring)
- [15. Integrazione third-party (React/Vue) e teardown](#15-integrazione-third-party-reactvue-e-teardown)
- [Checklist esperto](#checklist-esperto)

---

## 1. m.route(root, defaultRoute, routes)

Monta una SPA con routing client-side. **Una sola chiamata `m.route` per applicazione.**

**Firma:** `m.route(root, defaultRoute, routes)` → ritorna `undefined`

| Argomento | Tipo | Required | Descrizione |
|---|---|---|---|
| `root` | `Element` | Sì | Nodo DOM padre del sottoalbero gestito dal router |
| `defaultRoute` | `String` | Sì | Rotta su cui ridirigere se l'URL corrente **non matcha** nessuna rotta. NON è la rotta iniziale: quella la determina la barra degli indirizzi |
| `routes` | `Object<String, Component\|RouteResolver>` | Sì | Chiavi = stringhe-rotta, valori = componenti o [RouteResolver](#8-routeresolver-onmatch-e-render) |

```javascript
var Home = { view: function() { return "Welcome" } }

m.route(document.body, "/home", {
    "/home": Home, // definisce https://localhost/#!/home
})
```

**Gotcha — `defaultRoute` non è l'initial route.** È solo il fallback quando l'URL corrente non matcha. Se apri l'app su `/#!/foo` e `/foo` non è dichiarata, vieni rediretto a `defaultRoute`. `defaultRoute` deve essere a sua volta una rotta valida/matchabile, altrimenti loop.

**Gotcha — `m.route` usa `m.mount` internamente.** Non è magia: condivide lo stesso meccanismo di mount/redraw. Vedi [sezione 15](#15-integrazione-third-party-reactvue-e-teardown) per il teardown.

---

## 2. Routing strategies e m.route.prefix

Il prefix è il frammento di URL che determina la strategia di routing sottostante. È una **proprietà semplice**: la leggi e la scrivi.

**Firma:** `m.route.prefix = prefix` (`String`)

| Prefix | Strategia | URL tipico | Note |
|---|---|---|---|
| `'#!'` (default) | Fragment identifier (hashbang) | `https://localhost/#!/page1` | Funziona anche senza `history.pushState` (fallback `onhashchange`). Hash puramente locale |
| `'?'` | Querystring | `https://localhost/?/page1` | Rilevabile server-side senza modifiche tipo `.htaccess` |
| `''` | Pathname | `https://localhost/page1` | URL più puliti, ma il server deve servire la SPA da **ogni** URL routabile |
| `'#'` | Hash senza bang | `https://localhost/#/page1` | |
| `'/my-app'` | Pathname su sottocartella | `https://localhost/my-app/page1` | App montata sotto un base path |

```javascript
m.route.prefix = ""        // pathname
m.route.prefix = "?"       // querystring
m.route.prefix = "#"       // hash senza bang
m.route.prefix = "/my-app" // pathname su URL non-root
```

**Gotcha — il prefix va impostato PRIMA di `m.route(...)`.** Una volta che il router è attivo, cambiarlo non riconfigura il routing già montato.

**Gotcha — `options.state` (vedi §3) viene ignorato in modalità hashchange.** Se il browser non supporta `pushState` e il router fa fallback su `onhashchange`, lo `state` non viene passato. Il prefix `'#!'`/`'#'` può finire in quel ramo.

---

## 3. m.route.set

Ridirige a una rotta che matcha, o a `defaultRoute` se nessuna matcha. **Triggera un redraw asincrono di tutti i mount point.**

**Firma:** `m.route.set(path, params, options)` → ritorna `undefined`

| Argomento | Tipo | Required | Descrizione |
|---|---|---|---|
| `path` | `String` | Sì | Il path name **senza prefix**. Può contenere parametri interpolati da `params` |
| `params` | `Object` | No | Valori interpolati negli slot del path; le chiavi non interpolate diventano querystring |
| `options.replace` | `Boolean` | No | `true` = sostituisce la history entry corrente; default `false` (nuova entry) |
| `options.state` | `Object` | No | Passato a `history.pushState`/`replaceState`. Disponibile in `history.state` e **merged nei routing parameters**. Ignorato in modalità hashchange |
| `options.title` | `String` | No | Title passato a `history.pushState`/`replaceState` |

```javascript
// Navigazione programmatica semplice
m.route.set("/page1")

// Con parametri interpolati: la rotta DEVE esistere
m.route(document.body, "/article/1", { "/article/:articleid": Article })
m.route.set("/article/:articleid", {articleid: 1}) // -> /article/1
```

**Gotcha — lascia SEMPRE fuori il prefix.** Né in `m.route.set` né in `m.route.Link` si scrive `#!`. Il router lo gestisce per te.

**Gotcha — il redraw è asincrono.** Dopo `m.route.set(...)` lo stato non è immediatamente riflesso nel DOM; il redraw è schedulato. `m.route.get()` può ancora ritornare il path precedente finché una rotta asincrona (`onmatch` che ritorna Promise) non si è risolta.

**Gotcha — params non interpolati finiscono in querystring.** `m.route.set("/x", {a: 1, b: 2})` con rotta `/x` produce `/x?a=1&b=2`. I parametri interpolati nel path vengono **omessi** dalla querystring (vedi §9 normalizzazione).

---

## 4. m.route.get

Ritorna l'ultimo **path completamente risolto**, senza prefix.

**Firma:** `path = m.route.get()` → `String`

```javascript
var current = m.route.get() // es. "/article/1"
```

**Gotcha — può differire dal path nella location bar.** Durante la risoluzione di una rotta asincrona (`onmatch` pendente, vedi §8/§12), `m.route.get()` ritorna ancora il path *precedente* mentre la barra mostra già il nuovo. Dentro `onmatch`, `requestedPath` è il nuovo path; `m.route.get()` è il vecchio.

**Path normalizzato:** Mithril non espone direttamente la rotta normalizzata corrente. Per ottenerla: `m.parsePathname(m.route.get()).path` (vedi §13).

---

## 5. m.route.param

Recupera un parametro dall'**ultima rotta completamente risolta**. Le fonti dei parametri sono:

- interpolazioni di rotta — rotta `/users/:id` risolta a `/users/1` → `id` = `"1"`
- querystring del router — path `/users?page=1` → `page` = `"1"`
- `history.state` — se `history.state` è `{foo: "bar"}` → `foo` = `"bar"`

**Firma:** `value = m.route.param(key)` → `String | Object`

| Argomento | Tipo | Required | Descrizione |
|---|---|---|---|
| `key` | `String` | No | Nome del parametro. **Se omesso, ritorna l'oggetto con tutte le chiavi** |

```javascript
var id = m.route.param("id")   // "1"
var all = m.route.param()      // {id: "1", page: "3", ...}
```

**Gotcha — dentro `onmatch` ritorna i parametri della rotta PRECEDENTE.** La nuova rotta non è ancora risolta. I parametri nuovi arrivano come primo argomento (`args`) di `onmatch`.

**Gotcha — i valori interpolati sono SEMPRE stringhe.** `:id` = `"1"`, non `1`. I valori da querystring invece passano per `parseQueryString` che fa boolean casting (`"true"` → `true`), vedi §14.

---

## 6. m.route.Link

Componente che produce link routati: genera (di default) `<a>` con `href` locale trasformato per tenere conto del [prefix](#2-routing-strategies-e-mrouteprefix).

**Firma:** `vnode = m(m.route.Link, attributes, children)` → `Vnode`

| Attributo | Tipo | Required | Descrizione |
|---|---|---|---|
| `attributes.href` | `String` | Sì | Rotta target (senza prefix) |
| `attributes.selector` | `String\|Object\|Function` | No | Selettore per `m`; default `"a"`. Qualsiasi selettore valido, anche non-`a` |
| `attributes.params` | `Object` | No | Come `params` in [`m.route.set`](#3-mrouteset) |
| `attributes.options` | `Object` | No | Come `options` in [`m.route.set`](#3-mrouteset) |
| `attributes.disabled` | `Boolean` | No | Disabilita routing e qualsiasi `onclick`; aggiunge `aria-disabled="true"`; su `a` rimuove l'`href` |
| `attributes` (altri) | `Object` | No | Inoltrati a `m` |
| `children` | `Array<Vnode>\|String\|Number\|Boolean` | No | Figli del link |

```javascript
m(m.route.Link, {href: "/foo"}, "foo")
// -> <a href="#!/foo">foo</a>  (con prefix default)

m(m.route.Link, {
    href: "/foo",
    selector: "button.large",
    disabled: true,
    params: {key: "value"},
    options: {replace: true},
}, "link name")
// -> <button disabled aria-disabled="true" class="large">link name</button>
```

**Gotcha — il comportamento di routing NON si previene con l'event handling API.** Non funziona `onclick: e => e.preventDefault()` per bloccare la navigazione. Usa **`disabled: true`**. (Differenza con React Router, dove intercetteresti l'evento.)

**Gotcha — `href` qui è il path interno senza prefix**, non l'URL finale. Mithril lo prefissa lui.

---

## 7. m.route.SKIP

Valore speciale ritornabile da [`onmatch`](#8-routeresolver-onmatch-e-render) per **saltare alla rotta successiva** che matcha. Abilita "typed routes" e "hidden routes".

```javascript
// Typed route: matcha /view/:id solo se :id è numerico, altrimenti prova /view/:name
m.route(document.body, "/", {
    "/view/:id": {
        onmatch: function(args) {
            if (!/^\d+$/.test(args.id)) return m.route.SKIP
            return ItemView
        },
    },
    "/view/:name": UserView,
})

// Hidden route: finge che la rotta non esista, cade su 404
m.route(document.body, "/", {
    "/user/:id": {
        onmatch: function(args) {
            return Model.checkViewable(args.id).then(function(viewable) {
                return viewable ? UserView : m.route.SKIP
            })
        },
    },
    "/:404...": PageNotFound,
})
```

**Gotcha — l'ordine delle chiavi conta** quando si usa `SKIP`: salta alla **prossima** rotta dichiarata che matcha il path. Se nessuna matcha dopo lo skip → `defaultRoute`.

---

## 8. RouteResolver: onmatch e render

Un **RouteResolver** è un oggetto **non-componente** con `onmatch` e/o `render` (almeno uno presente, entrambi opzionali). Non avendo natura di componente, **non ha lifecycle methods** (`oninit`/`oncreate`/...).

**Gotcha — detection componente vs resolver.** Se l'oggetto ha un metodo `view`, oppure è una `function`/`class`, viene trattato come **componente** anche se ha `onmatch`/`render`. Non mettere `view` su un RouteResolver.

Convenzione: i RouteResolver stanno nello stesso file della chiamata `m.route`; i componenti nei loro moduli.

```javascript
// Un componente Home è zucchero per questo resolver:
var routeResolver = {
    onmatch: function() { return Home },
    render: function(vnode) { return [vnode] },
}
```

### onmatch

Chiamato quando il router deve trovare un componente da renderizzare. **Una volta per cambio di path**, NON sui redraw successivi sullo stesso path. Posto ideale per auth, preload dati, redirect, analytics, code splitting.

**Firma:** `routeResolver.onmatch(args, requestedPath, route)`

| Argomento | Tipo | Descrizione |
|---|---|---|
| `args` | `Object` | I [routing parameters](#9-parametri-di-route-e-path-templates) della nuova rotta |
| `requestedPath` | `String` | Path richiesto, con valori interpolati, **senza prefix**. Durante `onmatch`, `m.route.get()` ritorna ancora il path precedente |
| `route` | `String` | Path richiesto **senza** i valori interpolati (la chiave-rotta, es. `/view/:id`) |
| **returns** | `Component \| Promise<Component> \| undefined` | Componente, o Promise che risolve a componente |

**Regole sul return:**
- Ritorna un componente (o Promise→componente) → diventa `vnode.tag` del vnode passato a `render`.
- Ritorna `undefined` (o `onmatch` omesso) → `vnode.tag` default `"div"`.
- Ritorna una Promise **rejected** → redirect a `defaultRoute`. Override possibile con `.catch` prima del return.
- Ritorna una Promise **che non risolve mai** → blocca la risoluzione della rotta (route cancellation/blocking).

```javascript
// Route blocking: cancella risoluzioni ridondanti
m.route(document.body, "/", {
    "/": {
        onmatch: function(args, requestedPath) {
            if (m.route.get() === requestedPath)
                return new Promise(function() {}) // mai risolta
        },
    },
})
```

### render

Chiamato a **ogni redraw** per la rotta che matcha (come `view` di un componente). Esiste per semplificare la composizione (layout) e per **evitare il replace dell'intero sottoalbero**.

**Firma:** `vnode = routeResolver.render(vnode)`

| Argomento | Tipo | Descrizione |
|---|---|---|
| `vnode` | `Object` | Vnode i cui `attrs` contengono i routing parameters. Se `onmatch` non ha fornito componente, `tag` = `"div"` |
| `vnode.attrs` | `Object` | Mappa dei valori dei parametri URL |
| **returns** | `Array<Vnode> \| Vnode` | I vnode da renderizzare |

Il `vnode` ricevuto è in pratica `m(Component, m.route.param())`. Se ometti `render`, il default è `[vnode]` (wrappato in fragment, così funziona il [key parameter](#10-key-parameter-ricreazione-componente)).

```javascript
m.route(document.body, "/", {
    "/": {
        onmatch: function(args, requestedPath, route) { return Home },
        render: function(vnode) { return vnode }, // equivalente a m(Home)
    }
})
```

**Gotcha — redraw su cambio rotta vs su stesso path.** `onmatch` gira **solo al cambio di path**; `render` gira a **ogni redraw**. Mettere logica costosa/effetti in `render` la riesegue continuamente. Preload e side-effect vanno in `onmatch`.

---

## 9. Parametri di route e path templates

I path template (condivisi con `m.request`) hanno due tipi di parametro:

- `:foo` — inietta `params.foo` nell'URL, **escapando** il valore (via `encodeURIComponent`).
- `:foo...` — inietta `params.foo` come **path raw**, senza escaping (variadico: può contenere `/`).

```javascript
// Parametro semplice -> vnode.attrs.id
var Edit = {
    view: function(vnode) {
        return m("h1", "Editing " + vnode.attrs.id)
    }
}
m.route(document.body, "/edit/1", { "/edit/:id": Edit })

// Multipli: /edit/:projectID/:userID -> attrs.projectID, attrs.userID

// Variadico: matcha path con slash
m.route(document.body, "/edit/pictures/image.jpg", {
    "/edit/:file...": Edit, // file = "pictures/image.jpg"
})
```

**404 isomorfico** — pattern raccomandato:

```javascript
m.route(document.body, "/", {
    "/": homeComponent,
    "/:404...": errorPageComponent, // cattura tutto
})
```

**Delimitatori e segmenti compositi.** I parametri possono essere delimitati da `/`, `-` o `.`. Permette segmenti dinamici flessibili:

```javascript
"/edit/:name.:ext"     // /edit/file.png -> {name: "file", ext: "png"}
"/:lang-:region/view"  // /en-US/view   -> {lang: "en", region: "US"}
```

**Gotcha — i parametri sono GREEDY.** Con rotta `"/edit/:name.:ext"`, `/edit/file.test.png` → `{name: "file.test", ext: "png"}` (non `{name:"file", ext:"test.png"}`). Con `"/route/:path.../view/:child..."`, `/route/foo/view/bar/view/baz` → `{path: "foo/view/bar", child: "baz"}`.

**Parameter normalization.** I parametri interpolati nel path name vengono **omessi** dalla querystring. `m.request({url: "/api/user/:userID/connections", params: {userID: 1, sort: "name-asc"}})` → `GET /api/user/1/connections?sort=name-asc` (niente `id=1` duplicato).

**Query params impliciti.** Non serve nominare i query param per accettarli. Si può matchare un valore esistente con `"/edit?type=image"`, ma **NON** usare `"/edit?type=:type"` — Mithril lo interpreterebbe come match letterale `m.route.param("type") === ":type"`. Per leggere query param usa `m.route.param("key")` o gli attrs del componente.

**Path normalization.** I path parsati hanno slash extra e parametri duplicati rimossi, e iniziano sempre con `/`. Nella deduplicazione: querystring ha precedenza sul path name, e i parametri verso la **fine** dell'URL vincono su quelli all'inizio.

**Path escaping.** Caratteri interpretati da Mithril (escapati automaticamente quando interpoli parametri via `encodeURIComponent`):

| Char | Encoded | Note |
|---|---|---|
| `:` | `%3A` | |
| `/` | `%2F` | solo nei path |
| `%` | `%25` | |
| `?` | `%3F` | solo nei path |
| `#` | `%23` | |

Devi preoccuparti dell'escaping solo se specifichi parametri **esplicitamente** nella stringa, es. `m.request("https://example.com/api/user/User%20Name/:field", {params: {field: ...}})`.

---

## 10. Key parameter (ricreazione componente)

Navigando da `/page/1` a `/page/2` sulla rotta `/page/:id`, il componente **non viene ricreato** (stesso componente → diff in-place): scatta `onupdate`, non `oninit`/`oncreate`.

Per forzare la ricreazione, combina parametrizzazione e [keys](#) usando il nome `key`:

```javascript
m.route(document.body, "/edit/1", {
    "/edit/:key": Edit, // il param diventa attrs.key -> keyed fragment
})
```

Il vnode root della rotta riceve `key`, e cambiando rotta il `key` cambia → il virtual DOM tratta vecchio e nuovo come entità diverse → ricreazione from scratch.

```javascript
// Ricreare il componente corrente on demand:
m.route.set(m.route.get(), {key: Date.now()})

// Idem senza inquinare l'URL (via history state):
m.route.set(m.route.get(), null, {state: {key: Date.now()}})
```

**Gotcha — `key` funziona solo per rotte-componente.** Con un RouteResolver devi usare manualmente un single-child keyed fragment passando `key: m.route.param("key")` dentro `render`:

```javascript
{
    render: function(vnode) {
        return [m(Component, {key: m.route.param("key"), ...vnode.attrs})]
    }
}
```

---

## 11. History state

Sfrutta `history.pushState` per "ricordare" stato non persistito (es. una form) quando l'utente naviga via e torna col tasto back.

```javascript
var state = {
    term: "",
    search: function() {
        // salva lo stato per questa rotta
        // equivalente a history.replaceState({term: state.term}, null, location.href)
        m.route.set(m.route.get(), null, {replace: true, state: {term: state.term}})
        location.href = "https://google.com/?q=" + state.term // naviga via
    }
}

var Form = {
    oninit: function(vnode) {
        // popolato da history.state se l'utente preme back
        state.term = vnode.attrs.term || ""
    },
    view: function() {
        return m("form", [
            m("input[placeholder='Search']", {
                oninput: function(e) { state.term = e.target.value },
                value: state.term
            }),
            m("button", {onclick: state.search}, "Search")
        ])
    }
}

m.route(document.body, "/", { "/": Form })
```

**Gotcha — lo `state` viene merged nei routing parameters.** Le chiavi di `history.state` diventano leggibili via `m.route.param(key)` e arrivano come `vnode.attrs`. Per questo `vnode.attrs.term` sopra funziona.

**Gotcha — ignorato in hashchange mode.** Se il browser non supporta `pushState` (fallback `onhashchange`), `options.state` non ha effetto.

---

## 12. Pattern avanzati: layout, redirect, preload, lazy load

### Wrapping di un layout (preservarlo tra rotte)

Usare un componente anonimo nel routes map **ricrea il layout da zero** a ogni cambio rotta (scattano `oninit`/`oncreate` del layout ogni volta):

```javascript
// example 1 — layout RICREATO ogni cambio rotta
m.route(document.body, "/", {
    "/":     { view: function() { return m(Layout, m(Home)) } },
    "/form": { view: function() { return m(Layout, m(Form)) } },
})
```

Per **diffare e preservare** il layout, usa un RouteResolver con `render` (il top-level `Layout` resta lo stesso componente → diff, non ricreazione):

```javascript
// example 2 — layout PRESERVATO (oninit/oncreate solo al primo cambio)
m.route(document.body, "/", {
    "/":     { render: function() { return m(Layout, m(Home)) } },
    "/form": { render: function() { return m(Layout, m(Form)) } },
})
```

**Gotcha chiave:** in example 1 i due `view` sono di fatto due componenti anonimi *diversi* → l'intero sottoalbero (Layout incluso) è ricreato. In example 2 `Layout` è il top-level in entrambe → solo `Home`↔`Form` viene ricreato. Stesso identico discorso quando usi componenti diretti senza resolver: **cambiando componente, l'intero sottoalbero viene rimpiazzato**.

### Redirection (in onmatch)

```javascript
m.route(document.body, "/secret", {
    "/secret": {
        onmatch: function() {
            if (!localStorage.getItem("auth-token")) m.route.set("/login")
            else return Home
        }
    },
    "/login": Login,
})
```

**Gotcha — `m.route.set` vs `history` API in `onmatch`.** `m.route.set()` cancella internamente la risoluzione della rotta matchata, quindi non serve altro. Se invece redirigi con la `history` API nativa, `onmatch` **deve ritornare una Promise che non risolve mai** per impedire la risoluzione della rotta corrente.

### Preloading dati (no flicker)

Caricare dati in `oninit` causa **doppio render** (la Promise di `oninit` è ignorata; il secondo render arriva dall'opzione `background` di `m.request`):

```javascript
// Doppio render: mostra "loading" poi i dati
"/user/list": {
    oninit: state.loadUsers, // ritorna Promise, ma è ignorata
    view: function() {
        return state.users.length > 0
            ? state.users.map(function(u) { return m("div", u.id) })
            : "loading"
    }
}
```

Con RouteResolver `onmatch` + `render`, il `render` gira **solo dopo** che la Promise si risolve → niente indicatore di loading:

```javascript
"/user/list": {
    onmatch: state.loadUsers, // render attende questa Promise
    render: function() {
        return state.users.map(function(u) { return m("div", u.id) })
    }
}
```

### Code splitting / lazy loading

`onmatch` può ritornare una Promise che risolve a un componente:

```javascript
m.route(document.body, "/", {
    "/": {
        onmatch: function() {
            return import('./Home.js') // dynamic import nativo
        },
    },
})
```

**Gotcha — `import()` risolve a un module namespace.** Il valore risolto deve essere il componente. Se esporti default, potresti dover fare `import('./Home.js').then(m => m.default)`. Il doc base mostra il caso in cui la Promise risolve direttamente a un componente.

---

## 13. Path utilities: buildPathname / parsePathname

### m.buildPathname

Costruisce un path name da un template e un oggetto parametri. È ciò che `m.route`/`m.request` usano internamente. Usa `buildQueryString` per la parte query.

**Firma:** `pathname = m.buildPathname(path, query)` → `String`

| Argomento | Tipo | Required | Descrizione |
|---|---|---|---|
| `path` | `String` | Sì | Template di path |
| `query` | `Object` | Sì | Mappa key-value da convertire (interpolata + querystring) |
| **returns** | `String` | | URL con querystring |

```javascript
m.buildPathname("/path/:id", {id: "user", a: "1", b: "2"})
// "/path/user?a=1&b=2"

m.buildPathname("/path/:id", {id: "user", a: 1, b: 2})
// "/path/user?a=1&b=2"  (numeri stringificati)
```

### m.parsePathname

Parsa un path (con eventuale querystring) in `{path, params}`. Usa `parseQueryString` per i query param.

**Firma:** `object = m.parsePathname(url)` → `{path: String, params: Object}`

| Argomento | Tipo | Required | Descrizione |
|---|---|---|---|
| `url` | `String` | Sì | URL/path da parsare |
| **returns** | `Object` | | `{path, params}` — `path` normalizzato, `params` parsati |

```javascript
m.parsePathname("/path/user?a=1&b=2")
// {path: "/path/user", params: {a: "1", b: "2"}}

m.parsePathname("/path/user?a=hello&b=world")
// {path: "/path/user", params: {a: "hello", b: "world"}}
```

**Gotcha — `parsePathname` NON è un parser URL generico.** Si applica solo a pathname (path assoluti senza schema/dominio). Per URL completi usa la classe globale `URL`.

**Uso pratico — ottenere la rotta normalizzata corrente** (che Mithril non espone direttamente):

```javascript
var normalized = m.parsePathname(m.route.get()).path
```

---

## 14. Querystring utilities: buildQueryString / parseQueryString

### m.buildQueryString

**Firma:** `querystring = m.buildQueryString(query)` → `String`

| Argomento | Tipo | Required | Descrizione |
|---|---|---|---|
| `query` | `Object` | Sì | Mappa key-value |
| **returns** | `String` | | Stringa querystring (senza `?` iniziale) |

```javascript
m.buildQueryString({a: "1", b: "2"})   // "a=1&b=2"
m.buildQueryString({a: 1, b: 2})       // "a=1&b=2"

// Strutture profonde (bracket notation, compatibile PHP/Rails/Express)
m.buildQueryString({a: ["hello", "world"]})
// "a[0]=hello&a[1]=world"
```

### m.parseQueryString

**Firma:** `object = m.parseQueryString(string)` → `Object`

| Argomento | Tipo | Required | Descrizione |
|---|---|---|---|
| `string` | `String` | Sì | Querystring |
| **returns** | `Object` | | Mappa key-value |

```javascript
m.parseQueryString("a=1&b=2")            // {a: "1", b: "2"}
m.parseQueryString("a=hello&b=world")    // {a: "hello", b: "world"}

// Casting booleano automatico
m.parseQueryString("a=true&b=false")     // {a: true, b: false}

// Tollera il punto interrogativo iniziale
m.parseQueryString("?a=hello&b=world")   // {a: "hello", b: "world"}

// Strutture profonde via bracket notation
m.parseQueryString("a[0]=hello&a[1]=world") // {a: ["hello", "world"]}
```

**Gotcha — boolean casting asimmetrico.** `parseQueryString` converte `"true"`/`"false"` in booleani per evitare bug di truthiness. Quindi un valore proveniente da query param può **non essere una stringa** (`m.route.param("a")` → `true`), mentre i valori interpolati dal path (`:id`) restano sempre stringhe. Tienilo presente nei confronti.

---

## 15. Integrazione third-party (React/Vue) e teardown

Regole: usa `m.route` **una sola volta**; non sono supportati mount point multipli. `m.route` usa `m.mount` internamente, quindi per rimuovere le subscription di routing fai `m.mount(root, null)` sullo stesso `root`.

```jsx
// React — JSX (eccezione: contesto React)
class Child extends React.Component {
    constructor(props) { super(props); this.root = React.createRef() }
    componentDidMount() {
        m.route(this.root, "/", { /* ... */ })
    }
    componentDidUnmount() {
        m.mount(this.root, null) // teardown
    }
    render() { return <div ref={this.root} /> }
}
```

```javascript
// Vue
Vue.component("my-child", {
    template: `<div ref="root"></div>`,
    mounted: function() {
        m.route(this.$refs.root, "/", { /* ... */ })
    },
    destroyed: function() {
        m.mount(this.$refs.root, null) // teardown
    },
})
```

**Gotcha — `m.mount(root, null)` è il vero teardown.** Non esiste un `m.route.destroy()`; smonti via `m.mount`.

---

## Checklist esperto

1. **Imposta `m.route.prefix` prima di `m.route(...)`**, mai dopo. Scegli la strategia (`#!` default, `''` pathname con server configurato, `'?'` querystring) in base ai vincoli server, non all'estetica.
2. **Mai includere il prefix** in `m.route.set`/`m.route.Link`; mai bloccare un `m.route.Link` con `preventDefault` — usa `disabled: true`.
3. **`onmatch` per side-effect/auth/preload/redirect** (gira una volta per path); **`render` per la composizione** (gira a ogni redraw — tienilo puro). Per redirect via `history` API nativa, ritorna una Promise che non risolve mai.
4. **Per ricreare un componente su cambio param** usa il nome `:key` su rotte-componente; su RouteResolver usa `[m(Component, {key: m.route.param("key")})]` manualmente.
5. **Per preservare un layout tra rotte** usa RouteResolver con `render` che ritorna lo stesso top-level component; sappi che cambiare componente diretto rimpiazza l'intero sottoalbero.
6. **Ricorda l'asimmetria dei tipi:** valori da `:param` interpolato = sempre `String`; valori da querystring = passati per `parseQueryString` con boolean casting (`"true"` → `true`).
7. **Dentro `onmatch`**, `m.route.get()` e `m.route.param()` riflettono ancora la rotta *precedente*; usa `args`/`requestedPath`/`route` per la rotta nuova.
8. **Per la rotta normalizzata corrente** (non esposta direttamente) usa `m.parsePathname(m.route.get()).path`; per URL completi usa la classe `URL`, non `m.parsePathname`.
