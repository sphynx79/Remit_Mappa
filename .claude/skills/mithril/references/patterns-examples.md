# Mithril.js 2.3.6 — Pattern applicativi e architettura

Riferimento per sviluppatore esperto. Tutto estratto dai sorgenti ufficiali: `docs/simple-application.md`, `docs/framework-comparison.md`, `examples/todomvc/todomvc.js`, `examples/threaditjs/app.js`. Nessuna API inventata.

## Indice

- [1. Filosofia architetturale](#1-filosofia-architetturale)
- [2. Organizzazione dei file (models / views / index)](#2-organizzazione-dei-file-models--views--index)
- [3. Pattern Model Singleton](#3-pattern-model-singleton)
- [4. Data layer con m.request](#4-data-layer-con-mrequest)
- [5. Esempio CRUD completo (simple-application)](#5-esempio-crud-completo-simple-application)
- [6. Routing, RouteResolver e Layout](#6-routing-routeresolver-e-layout)
- [7. Componenti: stato locale vs stato globale](#7-componenti-stato-locale-vs-stato-globale)
- [8. Pattern TodoMVC: state + dispatch (flux-like)](#8-pattern-todomvc-state--dispatch-flux-like)
- [9. Pattern ThreaditJS: model funzionale a variabili libere](#9-pattern-threaditjs-model-funzionale-a-variabili-libere)
- [10. Gestione stato senza Redux](#10-gestione-stato-senza-redux)
- [11. Confronto mentale con React / Vue / Angular](#11-confronto-mentale-con-react--vue--angular)
- [Checklist esperto](#checklist-esperto)

---

## 1. Filosofia architetturale

Mithril.js è **pragmatico e "batteries included"**: routing (`m.route`), XHR (`m.request`) e rendering (`m`, `m.mount`, `m.redraw`) sono nel core (~10kb gzip). Non serve Redux, non serve React Router, non serve axios. L'idioma è:

- **Componenti** per la UI (oggetti con un metodo `view`).
- **Data layer / model** separato dalla UI, spesso un semplice oggetto module-level.
- **Flow control nativo JS** nelle view (`.map`, ternari, `&&`), niente template DSL.

> Differenza chiave con React: in React tipicamente assembli una stack (router + state mgmt + XHR) da librerie terze, con architetture che variano da progetto a progetto. In Mithril l'architettura idiomatica è una sola e documentata: `models/` + `views/` + un punto di mount/route. Segui KISS e YAGNI — è raccomandazione esplicita della doc.

---

## 2. Organizzazione dei file (models / views / index)

Struttura idiomatica dalla `simple-application`:

```
index.html          // entry HTML, carica bin/app.js (bundle)
src/
  index.js          // mount / route, assembla i componenti
  models/
    User.js         // data layer (singleton)
  views/
    UserList.js     // componente
    UserForm.js     // componente
    Layout.js       // componente di layout (children)
```

Entry HTML minimale:

```html
<!doctype html>
<html>
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<title>My Application</title>
		<link href="styles.css" rel="stylesheet" />
	</head>
	<body>
		<script src="bin/app.js"></script>
	</body>
</html>
```

Entry JS (`src/index.js`) — solo wiring, niente logica di business:

```javascript
// src/index.js
var m = require("mithril")
var UserList = require("./views/UserList")
var UserForm = require("./views/UserForm")
var Layout  = require("./views/Layout")

m.route(document.body, "/list", {
	"/list": {
		render: function() { return m(Layout, m(UserList)) }
	},
	"/edit/:id": {
		render: function(vnode) { return m(Layout, m(UserForm, vnode.attrs)) }
	},
})
```

> I sorgenti usano CommonJS (`require`/`module.exports`). Con un bundler moderno puoi usare `import`/`export` ES; la semantica è identica. Le view usano **hyperscript `m()`**, non JSX (JSX è opzionale e richiede Babel).

---

## 3. Pattern Model Singleton

Il pattern centrale per il data layer: un **oggetto module-level esportato**, con proprietà di stato e metodi che le mutano. Non è una classe, non è instanziato — è un singleton condiviso da tutte le view che lo importano.

```javascript
// src/models/User.js
var m = require("mithril")

var User = {
	list: [],        // stato: collezione
	current: {},     // stato: entità selezionata
	loadList: function() { /* ... */ },
	load: function(id) { /* ... */ },
	save: function() { /* ... */ },
}

module.exports = User
```

Caratteristiche del pattern:

- Lo stato vive sul model, **non** sul componente. Le view leggono `User.list` / `User.current` direttamente.
- I metodi mutano lo stato per **assegnazione diretta** (`User.list = result.data`). Mithril fa redraw automatico al completamento dell'XHR — vedi §4.
- Più componenti condividono lo stesso singleton: nessun prop-drilling, nessun context provider.

> Gotcha: poiché `current` è un singleton condiviso, navigare tra due `/edit/:id` diversi riusa lo stesso `User.current`. Finché l'XHR di `load(id)` non risolve, la form mostra ancora i dati del record precedente. È accettabile per app semplici; per evitarlo, resetta `User.current = {}` all'inizio di `load()` o gestisci uno stato di loading.

---

## 4. Data layer con m.request

Firma usata nei sorgenti:

```javascript
m.request({
	method: "GET" | "POST" | "PUT" | "DELETE" | ...,   // HTTP method (default "GET")
	url: "https://.../api/users/:id",                  // stringa, supporta :param interpolati da params
	body: User.current,        // payload (oggetto) per POST/PUT — NB: in 2.3.x è `body`
	withCredentials: true,     // invia cookie cross-origin
	// params: {...}           // querystring (GET) o interpolazione :param nell'url
})
// -> ritorna una Promise che risolve con il body JSON già parsato
```

> Attenzione versione: la `simple-application` usa `body:` (corretto per 2.x più recenti). Gli esempi `threaditjs` usano `data:` — `data` era l'alias storico. Per **2.3.6 usa `body`** per il payload. `params` rimane per querystring/interpolazione URL.

Pattern model + XHR (estratto reale, completo):

```javascript
// src/models/User.js
var m = require("mithril")

var User = {
	list: [],
	loadList: function() {
		return m.request({
			method: "GET",
			url: "https://mithril-rem.fly.dev/api/users",
			withCredentials: true,
		})
		.then(function(result) {
			User.list = result.data   // mutazione diretta dello stato singleton
		})
	},

	current: {},
	load: function(id) {
		return m.request({
			method: "GET",
			url: "https://mithril-rem.fly.dev/api/users/" + id,
			withCredentials: true,
		})
		.then(function(result) {
			User.current = result
		})
	},

	save: function() {
		return m.request({
			method: "PUT",
			url: "https://mithril-rem.fly.dev/api/users/" + User.current.id,
			body: User.current,
			withCredentials: true,
		})
	},
}

module.exports = User
```

Due idiomi da esperto:

1. **`return` la Promise sempre.** Permette al chiamante di concatenare `.then`/`.catch` e di aspettare la fine (es. redirect dopo `save`). È buona pratica esplicita nella doc.
2. **Redraw automatico.** `m.request` integra con il sistema di redraw: quando la Promise si risolve, Mithril rifà il rendering automaticamente. Per questo basta assegnare `User.list = ...` nel `.then` e la view si aggiorna — **non chiami `m.redraw()` manualmente** dentro un `.then` di `m.request`.

> Gotcha: il redraw automatico vale per callback "agganciate" al ciclo di Mithril (event handler nelle view, `.then` di `m.request`). Dentro `setTimeout`, `Promise` native non-mithril, WebSocket, o callback di librerie esterne, **devi** chiamare `m.redraw()` manualmente.

---

## 5. Esempio CRUD completo (simple-application)

### 5.1 View di lista (read) + navigazione

```javascript
// src/views/UserList.js
var m = require("mithril")
var User = require("../models/User")

module.exports = {
	oninit: User.loadList,   // NB: riferimento, NON User.loadList()
	view: function() {
		return m(".user-list", User.list.map(function(user) {
			return m(m.route.Link, {
				class: "user-list-item",
				href: "/edit/" + user.id,
			}, user.firstName + " " + user.lastName)
		}))
	}
}
```

> Gotcha critico (errore #1 dei neofiti): `oninit: User.loadList` passa il **riferimento**; Mithril lo invoca al mount del componente. `oninit: User.loadList()` lo **chiama subito**, al momento della valutazione del modulo — l'XHR parte prima (anche se il componente non monta mai) e non si ri-esegue se il componente viene ricreato navigando avanti/indietro. Stessa logica vale per qualunque lifecycle hook.

### 5.2 View di form (update) con route param + two-way binding manuale

```javascript
// src/views/UserForm.js
var m = require("mithril")
var User = require("../models/User")

module.exports = {
	oninit: function(vnode) { User.load(vnode.attrs.id) },  // :id -> vnode.attrs.id
	view: function() {
		return m("form", {
			onsubmit: function(e) {
				e.preventDefault()    // impedisce il submit nativo / reload pagina
				User.save()
			}
		}, [
			m("label.label", "First name"),
			m("input.input[type=text][placeholder=First name]", {
				oninput: function(e) { User.current.firstName = e.target.value },
				value: User.current.firstName,
			}),
			m("label.label", "Last name"),
			m("input.input[placeholder=Last name]", {
				oninput: function(e) { User.current.lastName = e.target.value },
				value: User.current.lastName,
			}),
			m("button.button[type=submit]", "Save"),
		])
	}
}
```

Punti chiave:

- Il **route param** `:id` arriva come `vnode.attrs.id` (sempre **stringa**, es. `/edit/1` → `"1"`).
- Il **two-way binding è manuale ed esplicito**: `value:` legge dallo stato, `oninput:` riscrive lo stato. Mithril non ha `v-model`/binding bidirezionale magico — è una scelta di design (flusso unidirezionale visibile).
- `e.preventDefault()` nel `onsubmit` è obbligatorio per SPA, altrimenti il browser ricarica.

> Gotcha attributi-in-selettore: `m("input.input[type=text][placeholder=First name]")` mette type/placeholder nel selettore CSS. Funziona, ma attributi dinamici (come `value`, `oninput`) vanno nell'**oggetto attrs** (secondo argomento). Mescolare i due stili è normale e idiomatico in Mithril.

---

## 6. Routing, RouteResolver e Layout

### 6.1 Routing base

```javascript
m.route(document.body, "/list", {       // (root, defaultRoute, routes)
	"/list": UserList,                   // valore = componente
	"/edit/:id": UserForm,               // :id = route param -> vnode.attrs.id
})
```

- 1° arg: elemento DOM root. 2° arg: route di default (fallback se URL non matcha). 3° arg: mappa route→componente/resolver.
- Prefisso di default: hashbang `#!` (es. `#!/list`). Configurabile via `m.route.prefix`.

### 6.2 m.route.Link per link interni

```javascript
m(m.route.Link, { href: "/edit/" + user.id, class: "user-list-item" }, "Edit")
```

`m.route.Link` è un componente del core che genera un `<a>` e intercetta il click per cambiare route **senza reload**. Usalo sempre per la navigazione interna; non scrivere `m("a", {href})` a mano.

### 6.3 RouteResolver + Layout (children)

Per UI globale (menu, chrome) si usa un **RouteResolver** (oggetto con metodo `render`) che wrappa il componente di pagina in un `Layout`:

```javascript
// src/views/Layout.js
var m = require("mithril")

module.exports = {
	view: function(vnode) {
		return m("main.layout", [
			m("nav.menu", [
				m(m.route.Link, {href: "/list"}, "Users")
			]),
			m("section", vnode.children)   // slot per i figli passati a m(Layout, ...)
		])
	}
}
```

```javascript
// src/index.js — route con RouteResolver
m.route(document.body, "/list", {
	"/list": {
		render: function() { return m(Layout, m(UserList)) }
	},
	"/edit/:id": {
		render: function(vnode) { return m(Layout, m(UserForm, vnode.attrs)) }
	},
})
```

- `m(Layout, m(UserList))` → `UserList` diventa l'unico child di `Layout`, leggibile in `Layout` come `vnode.children`.
- Nel resolver, `vnode.attrs` contiene i route param: per `/edit/1`, `vnode.attrs = {id: "1"}`, quindi `m(UserForm, vnode.attrs)` ≡ `m(UserForm, {id: "1"})` ≡ JSX `<UserForm id={vnode.attrs.id} />`.

> RouteResolver supporta anche `onmatch` (non usato nei sorgenti qui, ma è il punto per auth/redirect/lazy-load prima del render). Qui copriamo solo `render` perché è ciò che gli esempi mostrano.

---

## 7. Componenti: stato locale vs stato globale

Un componente Mithril è **un oggetto con `view`** (opzionalmente lifecycle hook). Esistono due posti dove tenere lo stato:

**Stato globale → sul model singleton** (UserList/UserForm leggono `User.*`). Usato per dati di dominio condivisi.

**Stato locale → su `vnode.state`** (per-istanza, effimero, UI-only). Esempio reale da ThreaditJS — il form di reply tiene `replying` e `newComment` per-istanza:

```javascript
var Reply = {
	view: function(vnode) {
		return vnode.state.replying
			? m("form", {onsubmit: function() { return submitComment(vnode) }}, [
				m("textarea", {
					value: vnode.state.newComment,
					oninput: function(e) { vnode.state.newComment = e.target.value },
				}),
				m("input", {type: "submit", value: "Reply!"}),
				m(".preview", m.trust(T.previewComment(vnode.state.newComment))),
			])
			: m("a", {onclick: function() { return showReplying(vnode) }}, "Reply!")
	}
}

function showReplying(vnode) {
	vnode.state.replying = true
	vnode.state.newComment = ""
	return false
}
```

> Regola pratica da esperto: **dati di dominio / condivisi → model singleton; stato UI effimero e per-istanza (aperto/chiuso, draft di input, hover) → `vnode.state`.** Mescolare i due è il design idiomatico, non un anti-pattern.

> Gotcha `m.trust`: `m.trust(string)` rende HTML grezzo senza escaping (come `dangerouslySetInnerHTML`). ThreaditJS lo usa per il testo dei commenti/preview. È un vettore XSS se il contenuto non è fidato — usalo solo su contenuto sanitizzato.

---

## 8. Pattern TodoMVC: state + dispatch (flux-like)

TodoMVC implementa un **mini-flux senza Redux**: un singolo oggetto `state` che è insieme store e set di "action", con un `dispatch` che invoca l'action e persiste.

```javascript
// model
var state = {
	dispatch: function(action, args) {
		state[action].apply(state, args || [])     // invoca state[action](...args)
		requestAnimationFrame(function() {
			localStorage["todos-mithril"] = JSON.stringify(state.todos)  // side-effect persist
		})
	},

	todos: JSON.parse(localStorage["todos-mithril"] || "[]"),
	editing: null,
	filter: "",
	remaining: 0,
	todosByStatus: [],

	createTodo: function(title) {
		state.todos.push({title: title.trim(), completed: false})
	},
	setStatuses: function(completed) {
		for (var i = 0; i < state.todos.length; i++) state.todos[i].completed = completed
	},
	setStatus: function(todo, completed) { todo.completed = completed },
	destroy: function(todo) {
		var index = state.todos.indexOf(todo)
		if (index > -1) state.todos.splice(index, 1)
	},
	clear: function() {
		for (var i = 0; i < state.todos.length; i++) {
			if (state.todos[i].completed) state.destroy(state.todos[i--])
		}
	},
	edit: function(todo) { state.editing = todo },
	update: function(title) {
		if (state.editing != null) {
			state.editing.title = title.trim()
			if (state.editing.title === "") state.destroy(state.editing)
			state.editing = null
		}
	},
	reset: function() { state.editing = null },

	// derived state ricalcolato a ogni render (vedi sotto)
	computed: function(vnode) {
		state.showing = vnode.attrs.status || ""
		state.remaining = state.todos.filter(function(todo) { return !todo.completed }).length
		state.todosByStatus = state.todos.filter(function(todo) {
			switch (state.showing) {
				case "": return true
				case "active": return !todo.completed
				case "completed": return todo.completed
			}
		})
	}
}
```

La view dispatcha action per **nome stringa**:

```javascript
var Todos = {
	add: function(e) {
		if (e.keyCode === 13 && e.target.value) {
			state.dispatch("createTodo", [e.target.value])
			e.target.value = ""
		}
	},
	oninit: state.computed,           // calcola derived state al mount
	onbeforeupdate: state.computed,   // ricalcola PRIMA di ogni update -> sempre coerente
	view: function(vnode) {
		var ui = vnode.state
		return [ /* ... usa state.todosByStatus, state.remaining, state.showing ... */ ]
	}
}

m.route(document.getElementById("todoapp"), "/", {
	"/": Todos,
	"/:status": Todos,    // stessa view, lo status filtra via vnode.attrs.status
})
```

Idiomi notevoli:

- **Derived state via `computed` agganciato a `oninit` + `onbeforeupdate`.** Invece di memoizzare, ricalcola `remaining` e `todosByStatus` prima di ogni redraw. `onbeforeupdate` viene eseguito appena prima del diff, garantendo che la view legga sempre derivazioni fresche. Equivalente concettuale ai computed di Vue / selector di Redux, ma a costo zero in API.
- **`dispatch(action, args)` + `apply`** dà un punto unico per i side-effect (qui: persistenza in `localStorage`). È flux-like: action → mutazione → effetto, senza reducer immutabili.
- **Persistenza in `requestAnimationFrame`** evita di scrivere su `localStorage` ad ogni micro-mutazione sincrona, batchando alla fine del frame.
- **Routing per filtro**: la stessa view è mappata su `"/"` e `"/:status"`; il filtro è puro stato d'URL letto da `vnode.attrs.status`.

> Gotcha: la mutazione è **diretta e mutabile** (`push`, `splice`, assegnazione). Mithril fa il diffing del vnode tree, non confronta riferimenti dello stato come Redux/React. Quindi mutare in place è idiomatico e va bene — non serve immutabilità per il rilevamento dei cambiamenti.

---

## 9. Pattern ThreaditJS: model funzionale a variabili libere

ThreaditJS mostra un'alternativa più "spartana": niente oggetto `state`, ma **variabili module-level libere** + funzioni che le mutano. Adatto ad app piccole.

```javascript
// API layer separato
var api = {
	home:       function()       { return m.request({method: "GET",  url: T.apiUrl + "/threads/"}) },
	thread:     function(id)     { return m.request({method: "GET",  url: T.apiUrl + "/comments/" + id}).then(T.transformResponse) },
	newThread:  function(text)   { return m.request({method: "POST", url: T.apiUrl + "/threads/create",  data: {text: text}}) },
	newComment: function(text, id){ return m.request({method: "POST", url: T.apiUrl + "/comments/create", data: {text: text, parent: id}}) },
};

// stato come variabili libere
var threads = [], current = null, loaded = false, error = false, notFound = false

function loadThreads() {
	loaded = false
	api.home().then(function(response) {
		document.title = "ThreaditJS: Mithril.js | Home"
		threads = response.data
		loaded = true
	}, function() {
		loaded = error = true        // secondo arg di then = error handler
	})
}

function loadThread(id) {
	loaded = false; notFound = false
	api.thread(id).then(function(response) {
		loaded = true; current = response
	}, function(response) {
		loaded = true
		if (response.status === 404) notFound = true   // distingue 404 da altri errori
		else error = true
	})
}
```

View che consuma lo stato con flow control nativo (ternari concatenati come "switch" di rendering):

```javascript
var Home = {
	oninit: loadThreads,
	view: function() {
		return [
			m(Header),
			m(".main", [
				loaded === false ? m("h2", "Loading") :
				error             ? m("h2", "Error! Try refreshing.") :
				notFound          ? m("h2", "Not found! Don't try refreshing!") : [
					threads.map(function(thread) {
						return [
							m("p", [ m(m.route.Link, {href: "/thread/" + thread.id}, m.trust(T.trimTitle(thread.text))) ]),
							m("p.comment_count", thread.comment_count + " comment(s)"),
							m("hr"),
						]
					}),
					m(NewThread),
				]
			])
		]
	}
}
```

Componente ricorsivo (albero di commenti) — pattern notevole:

```javascript
var ThreadNode = {
	view: function(vnode) {
		return m(".comment", [
			m("p", m.trust(vnode.attrs.node.text)),
			m(".reply", m(Reply, vnode.attrs)),
			m(".children", [
				vnode.attrs.node.children.map(function(child) {
					return m(ThreadNode, {node: child})   // ricorsione su se stesso
				})
			])
		])
	}
}
```

Note:

- **`oninit`/`onremove` per lifecycle di dati**: `Thread` usa `oninit: loadThread(vnode.attrs.id)` per caricare e `onremove: unloadThread` per resettare `current = null` quando si lascia la pagina.
- **`m.request(...).then(onSuccess, onError)`**: il secondo argomento è l'error handler della Promise; usato per distinguere `response.status === 404`.
- **Errori loaded/error/notFound come flag booleani** invece di una macchina a stati: pragmatico per app piccole, ma diventa fragile man mano che crescono i casi (preferisci un singolo campo `status` enum).

> Differenza di scala: il pattern a variabili libere (ThreaditJS) è il più semplice ma inquina lo scope del modulo e rende difficile testare/isolare. Il pattern oggetto `state`/`dispatch` (TodoMVC) o il singleton `User` namespacing-ato (simple-app) scalano meglio. Scegli in base alla dimensione dell'app.

---

## 10. Gestione stato senza Redux

Mithril non impone uno state manager. I tre pattern idiomatici visti, in ordine di scala:

| Pattern | Dove | Quando |
|---|---|---|
| Variabili libere module-level + funzioni | ThreaditJS | app/prototipi piccoli |
| Oggetto `state` con action + `dispatch` (flux-like) | TodoMVC | app medie, vuoi un punto unico per side-effect |
| Model singleton namespaced (`User.list`, `User.load`) | simple-application | app strutturate, più domini (`User`, `Order`, ...) |

Principi comuni a tutti:

1. **Stato fuori dai componenti**, in moduli model. I componenti restano "dumb": leggono e dispatchano.
2. **Mutazione diretta** (no immutabilità obbligatoria): il diffing è sul vnode tree, non sui riferimenti.
3. **Redraw automatico** dopo event handler e `m.request`. `m.redraw()` manuale solo fuori dal ciclo Mithril (timer, promise esterne, eventi di rete).
4. **Derived state** calcolato on-demand (`.filter`/`.map` nella view) o in un hook `computed` agganciato a `oninit`/`onbeforeupdate` (TodoMVC).

> Flux-like con stream: Mithril fornisce il modulo opzionale **`mithril/stream`** (`m.stream`) per pipeline reattive (valori osservabili, `.map`, `stream.merge`, `stream.scan`) — l'analogo "flux con stream". Non è usato in questi esempi sorgente, quindi non ne documento qui l'API per non inventare firme; sappi che esiste come alternativa first-party a Redux per flussi reattivi.

---

## 11. Confronto mentale con React / Vue / Angular

Mappatura concettuale per chi viene da altri framework (dalla `framework-comparison`):

**vs React** — molto simili: entrambi virtual DOM, lifecycle, riconciliazione key-based, componenti, JS come flow control nelle view.
- Mithril include **routing + XHR + redraw** nel core; React è solo view → in React assembli router/state/XHR da librerie terze.
- `m.redraw()` ≈ `setState`/scheduler, ma è globale e automatico dopo gli handler.
- `vnode.state` ≈ state d'istanza; non c'è hook `useState` — lo stato locale è una property sul vnode.
- `m.trust` ≈ `dangerouslySetInnerHTML`.
- Niente `shouldComponentUpdate` come default; per skippare l'update usi `onbeforeupdate` (ritorna `false` per saltare il diff).
- Idiomatic Mithril gira in **ES5 puro senza build step**; idiomatic React richiede Babel/JSX.

**vs Vue** — entrambi virtual DOM + lifecycle + componenti.
- Vue ha template DSL, direttive (`v-if`, `v-for`), reattività monkeypatch e `v-model` bidirezionale. Mithril **non** ha niente di tutto questo: flow control con `.map`/ternari, binding two-way **manuale** (`value` + `oninput`).
- Computed di Vue ≈ il pattern `computed` su `onbeforeupdate` di TodoMVC, ma senza API dedicata.
- Vue offre molti-modi-per-fare-una-cosa; Mithril è opinionato (un solo idioma).

**vs Angular** — molto diversi.
- Angular ha direttive, parser/compiler di template, DI, TypeScript-first, molti concetti (modules, services, pipes). Mithril: view sono **plain JS**, niente template engine, niente DI.
- `ng-if`/`ngIf` (direttiva + compiler) ≈ un semplice ternario JS in Mithril.
- Curva di apprendimento di Mithril nettamente più piatta; superficie API minima.

> Take-away architetturale: se vieni da React, il modello mentale trasferisce quasi 1:1 (componenti + virtual DOM), ma **smetti di cercare Redux/Context/Router esterni** — usa model singleton + `m.route`/`m.request`. Se vieni da Vue/Angular, **disimpara i template e le direttive**: in Mithril la view è JavaScript e basta.

---

## Checklist esperto

1. **Separa model da view**: stato di dominio in `src/models/*` (singleton esportato), UI in `src/views/*`. `index.js` fa solo wiring (`m.route`/`m.mount`).
2. **Hook = riferimento, mai chiamata**: `oninit: User.loadList` ✅ — `oninit: User.loadList()` ❌ (esegue subito, non al mount, e non si ripete sulle ricreazioni).
3. **`return` sempre la Promise** da `m.request` e dai metodi del model, così puoi concatenare e fare redirect dopo `save`.
4. **Non chiamare `m.redraw()`** dopo `m.request`/event handler (è automatico). Chiamalo **solo** in `setTimeout`, promise esterne, WebSocket, callback di lib terze.
5. **Two-way binding esplicito**: `value:` legge lo stato, `oninput:` lo riscrive. In `onsubmit` chiama `e.preventDefault()` o il browser ricarica.
6. **Scegli il pattern di stato per scala**: variabili libere (proto) → oggetto `state`+`dispatch` (medio, side-effect centralizzati) → model singleton namespaced (strutturato). Muta in place: il diffing è sul vnode tree, non serve immutabilità.
7. **Derived state**: ricalcola nella view con `.filter`/`.map`, o aggancia un `computed` a `oninit` + `onbeforeupdate` (pattern TodoMVC) per averlo sempre fresco prima del diff.
8. **Navigazione interna solo con `m(m.route.Link, {href})`**; usa **RouteResolver** (`{render}`/`onmatch`) per layout condivisi e auth. Tratta `m.trust` come `dangerouslySetInnerHTML`: solo su contenuto sanitizzato.
