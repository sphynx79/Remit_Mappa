# Mithril.js 2.3.6 — `m.request` e XHR

Riferimento esperto per il modulo XHR di Mithril.js (`m.request` / `m.jsonp`) e per l'integrazione di librerie esterne via lifecycle. Estratto da `docs/request.md` e `docs/integrating-libs.md`.

## Indice

- [1. Panoramica e firma](#1-panoramica-e-firma)
- [2. Tabella completa delle opzioni](#2-tabella-completa-delle-opzioni)
- [3. Funzionamento interno e pipeline di risposta](#3-funzionamento-interno-e-pipeline-di-risposta)
- [4. Auto-redraw e `background`](#4-auto-redraw-e-background)
- [5. Interpolazione `:param` nell'URL e query string](#5-interpolazione-param-nellurl-e-query-string)
- [6. Gestione errori (`error.code` / `error.response`)](#6-gestione-errori-errorcode--errorresponse)
- [7. `extract`, `deserialize`, `serialize`, `type`](#7-extract-deserialize-serialize-type)
- [8. `config`: accesso al raw XHR (abort, progress, replace)](#8-config-accesso-al-raw-xhr-abort-progress-replace)
- [9. Upload di file con FormData](#9-upload-di-file-con-formdata)
- [10. Risposte non-JSON e header custom](#10-risposte-non-json-e-header-custom)
- [11. Casi limite: IPv6, `responseType`, `withCredentials`, `timeout`](#11-casi-limite-ipv6-responsetype-withcredentials-timeout)
- [12. `m.jsonp`](#12-mjsonp)
- [13. Integrazione librerie esterne via lifecycle](#13-integrazione-librerie-esterne-via-lifecycle)
- [14. Anti-pattern](#14-anti-pattern)
- [Checklist esperto](#checklist-esperto)

---

## 1. Panoramica e firma

`m.request` è un wrapper sottile attorno a `XMLHttpRequest` che ritorna una `Promise` e, di default, innesca un redraw al completamento della catena della promise.

Due firme valide:

```javascript
// Forma 1 — opzioni in un singolo oggetto (url dentro options)
promise = m.request(options)

// Forma 2 — url posizionale + options
promise = m.request(url, options)
```

La forma 2 è quasi equivalente a `m.request(Object.assign({url: url}, options))`, ma **non** dipende internamente dal global ES6 `Object.assign`. Se `options.url` è presente, **sovrascrive** l'`url` posizionale.

```javascript
m.request({
	method: "PUT",
	url: "/api/v1/users/:id",
	params: {id: 1},
	body: {name: "test"}
})
.then(function(result) {
	console.log(result)
})
```

Gotcha: `m.request` ritorna **una Promise, non i dati**. I dati arrivano solo dentro `.then()`. Vedi [§14](#14-anti-pattern).

---

## 2. Tabella completa delle opzioni

Firma: `promise = m.request(options)`

| Opzione | Tipo | Richiesta | Default | Descrizione |
|---|---|---|---|---|
| `method` | `String` | No | `"GET"` | Metodo HTTP: uno tra `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`. |
| `url` | `String` | Sì | — | Path a cui inviare la richiesta, eventualmente interpolato con `params`. |
| `params` | `Object` | No | — | Dati interpolati nell'URL e/o serializzati nella query string. |
| `body` | `Object` | No | — | Dati serializzati nel corpo della richiesta. |
| `async` | `Boolean` | No | `true` | Se la richiesta è asincrona. |
| `user` | `String` | No | `undefined` | Username per HTTP authorization. |
| `password` | `String` | No | `undefined` | Password per HTTP authorization. **Da evitare**: viaggia in chiaro sulla rete. |
| `withCredentials` | `Boolean` | No | `false` | Invia cookie a domini di terze parti (CORS con credenziali). |
| `timeout` | `Number` | No | `undefined` | Millisecondi prima della terminazione automatica della richiesta. |
| `responseType` | `String` | No | `"json"` se mancante, `""` se `extract` definito | Tipo atteso della risposta. Se `"json"`, esegue internamente `JSON.parse(responseText)`. |
| `config` | `xhr = Function(xhr)` | No | — | Espone l'`XMLHttpRequest` sottostante per configurazione low-level e sostituzione opzionale (ritornando un nuovo XHR). |
| `headers` | `Object` | No | — | Header da aggiungere prima dell'invio (applicati subito prima di `config`). |
| `type` | `any = Function(any)` | No | identity | Costruttore applicato a ciascun oggetto nella risposta (chiamato con `new`). |
| `serialize` | `string = Function(any)` | No | `JSON.stringify` (identity per `FormData`/`URLSearchParams`) | Serializzazione applicata a `body`. |
| `deserialize` | `any = Function(any)` | No | identity | Deserializzazione applicata a `xhr.response` o al `xhr.responseText` normalizzato. **Saltata se `extract` è definito.** |
| `extract` | `any = Function(xhr, options)` | No | vedi sotto | Hook su come leggere la risposta XHR. Di default ritorna `options.deserialize(parsedResponse)` e lancia eccezione su status di errore o risposta sintatticamente invalida. |
| `background` | `Boolean` | No | `false` | Se `false`, ridisegna i componenti montati al completamento. Se `true`, non ridisegna. |
| **returns** | `Promise` | — | — | Risolve con i dati di risposta dopo `extract` → `deserialize` → `type`. Rigetta su status di errore (a meno che `extract` sia custom). |

Firma alternativa: `promise = m.request(url, options)` — `url: String` (richiesto), `options: Object` (opzionale). `options.url` sovrascrive l'`url` posizionale.

Gotcha sui default impliciti: se definisci `extract`, `responseType` passa a `""` (non `"json"`) e `deserialize` viene **saltato** completamente. È coerente: con `extract` custom decidi tu come leggere il responso.

---

## 3. Funzionamento interno e pipeline di risposta

Per una risposta di successo, i dati passano attraverso questa pipeline prima di arrivare al `.then()`:

```
xhr → extract → deserialize → type → resolve(dati)
```

- **extract**: di default legge la risposta, lancia su errore, ritorna `deserialize(parsed)`. Se custom, `deserialize` è saltato e il valore ritornato resta as-is.
- **deserialize**: di default identity (perché il parsing JSON avviene già via `responseType: "json"`). Saltato se `extract` è custom.
- **type**: costruttore applicato a ogni oggetto della risposta (vedi [§7](#7-extract-deserialize-serialize-type)).

Di default Mithril assume risposta JSON e la parsa in oggetto/array JavaScript. Per `m.request(url)` minimale, questo rende il caso comune appropriatamente terso.

---

## 4. Auto-redraw e `background`

Una chiamata a `m.request` **innesca un redraw al completamento della catena della promise**. Questo è il meccanismo per cui aggiornare lo stato dentro `.then()` ridisegna automaticamente la UI senza chiamare `m.redraw()` manualmente.

```javascript
var Data = {
	todos: {
		list: [],
		fetch: function() {
			m.request({method: "GET", url: "/api/v1/todos"})
			.then(function(items) {
				Data.todos.list = items   // dopo questo .then, redraw automatico
			})
		}
	}
}

var Todos = {
	oninit: Data.todos.fetch,
	view: function() {
		return Data.todos.list.map(function(item) {
			return m("div", item.title)
		})
	}
}

m.route(document.body, "/", {"/": Todos})
```

Con `background: true` il redraw automatico **non** avviene:

```javascript
m.request({
	method: "GET",
	url: "/api/v1/ping",
	background: true       // nessun redraw automatico al completamento
})
.then(function() {
	// se serve aggiornare la UI, chiama m.redraw() esplicitamente
	m.redraw()
})
```

Gotcha: usa `background: true` per polling/telemetria/richieste che non devono toccare la UI, evitando redraw inutili (costo di performance). Se poi modifichi stato visibile, sei tu responsabile di chiamare `m.redraw()`.

Gotcha (differenza con React/Vue): in React faresti `setState` per triggerare il render; in Mithril il redraw è guidato dal completamento della promise di `m.request`, non da una mutazione di stato osservata. Eventi asincroni *fuori* dal ciclo Mithril (es. listener su `xhr.upload` — vedi [§8](#8-config-accesso-al-raw-xhr-abort-progress-replace)) richiedono `m.redraw()` manuale.

---

## 5. Interpolazione `:param` nell'URL e query string

I segmenti `:nome` nell'URL vengono popolati dai valori in `params`:

```javascript
m.request({
	method: "GET",
	url: "/api/v1/users/:id",
	params: {id: 123}
}).then(function(user) {
	console.log(user.id) // 123
})
// Richiesta effettiva: GET /api/v1/users/123
```

I valori di `params` **non** usati per interpolazione finiscono in query string. Le interpolazioni senza chiave corrispondente in `params` vengono **ignorate** (lasciate testuali):

```javascript
m.request({
	method: "GET",
	url: "/api/v1/users/foo:bar",   // :bar non ha match in params
	params: {id: 123}
})
// Richiesta effettiva: GET /api/v1/users/foo:bar?id=123
```

Gotcha: il rilevamento dei parametri è semplicistico. Un valore già consumato nell'interpolazione NON viene duplicato in query string; quelli non consumati sì. Vedi [§11](#11-casi-limite-ipv6-responsetype-withcredentials-timeout) per il problema con gli indirizzi IPv6.

---

## 6. Gestione errori (`error.code` / `error.response`)

Quando una richiesta non-`file:` ritorna uno status **diverso da 2xx o 304**, la promise rigetta con un `Error`. È un normale `Error` ma con proprietà extra:

- `error.message` — il testo grezzo della risposta (raw response text).
- `error.code` — lo status code numerico.
- `error.response` — la risposta parsata (passata per `extract` e `deserialize` come una risposta normale).

```javascript
m.request({method: "GET", url: "/api/v1/todos"})
.then(function(items) {
	Data.todos.list = items
})
.catch(function(e) {
	Data.todos.error = e.message     // testo grezzo della risposta
})
```

Pattern utili basati su `code` / `response`:

```javascript
// Sessione scaduta → riautentica e ritenta
.catch(function(error) {
	if (error.code === 401) return promptForAuth().then(retry)
	throw error
})

// Throttling con suggerimento di attesa dal server
.catch(function(error) {
	// es. il server ha risposto { "timeout": 1000 }
	setTimeout(retry, error.response.timeout)
})
```

Gotcha: fornire un `extract` **custom** sopprime il rigetto automatico su status di errore — l'eccezione avviene solo se il *tuo* `extract` lancia. Se vuoi gestire manualmente status non-2xx senza rigetto, usa `extract` (vedi [§7](#7-extract-deserialize-serialize-type)). Le richieste `file:` non rigettano su status (non hanno status HTTP significativo).

---

## 7. `extract`, `deserialize`, `serialize`, `type`

### `type` — cast a una classe/costruttore

`type` viene chiamato con `new type(data)` per **ogni oggetto** della risposta. Se la risposta è un array, viene applicato a ciascun elemento; se è un singolo oggetto, quell'oggetto è l'argomento `data`.

```javascript
function User(data) {
	this.name = data.firstName + " " + data.lastName
}

m.request({method: "GET", url: "/api/v1/users", type: User})
.then(function(users) {
	console.log(users[0].name) // istanza di User
})
```

### `deserialize` — parsing custom (risposte non-JSON)

Firma: `any = Function(any)`. Default identity. Applicato a `xhr.response`/`responseText` normalizzato. **Saltato se `extract` è custom.**

```javascript
m.request({
	method: "GET",
	url: "/files/data.csv",
	deserialize: parseCSV
}).then(function(data) { console.log(data) })

function parseCSV(data) {
	return data.split("\n").map(function(row) { return row.split(",") })
}
```

### `serialize` — serializzazione del `body`

Firma: `string = Function(any)`. Default `JSON.stringify`. Se `body` è istanza di `FormData` o `URLSearchParams`, il default diventa l'identity function (`function(value){return value}`), così il corpo non viene stringificato.

### `extract` — controllo totale sulla lettura della risposta

Firma: `any = Function(xhr, options)`. Riceve l'`XMLHttpRequest` completato (prima del passaggio alla catena della promise) e l'oggetto `options` originale. Definirlo:
- salta `deserialize`,
- imposta `responseType` di default a `""`,
- sopprime il rigetto automatico su status di errore (rigetta solo se *tu* lanci).

```javascript
m.request({
	method: "GET",
	url: "/api/v1/users",
	extract: function(xhr) {
		return {status: xhr.status, body: xhr.responseText}
	}
}).then(function(response) {
	console.log(response.status, response.body)
})
```

Gotcha: la promise può comunque finire in stato rejected se `extract` lancia un'eccezione (es. parsing fallito).

---

## 8. `config`: accesso al raw XHR (abort, progress, replace)

Firma: `xhr = Function(xhr)`. Espone l'`XMLHttpRequest` sottostante. Applicato **dopo** `headers`. Può restituire un nuovo XHR per sostituire quello di default.

### Abort (race condition in autocompleter/typeahead)

```javascript
var searchXHR = null
function search(query) {
	abortPreviousSearch()
	m.request({
		method: "GET",
		url: "/api/v1/users",
		params: {search: query},
		config: function(xhr) { searchXHR = xhr }
	})
}
function abortPreviousSearch() {
	if (searchXHR !== null) searchXHR.abort()
	searchXHR = null
}
```

### Monitoraggio progresso (upload lunghi)

```javascript
var progress = 0
m.request({
	method: "POST",
	url: "/api/v1/upload",
	body: body,
	config: function(xhr) {
		xhr.upload.addEventListener("progress", function(e) {
			progress = e.loaded / e.total
			m.redraw() // evento fuori dal ciclo Mithril → redraw manuale obbligatorio
		})
	}
})
```

Gotcha: gli eventi `progress` dell'XHR non sono gestiti dal virtual DOM di Mithril, quindi **devi** chiamare `m.redraw()` per riflettere il cambiamento nella UI. Questo è diverso dal redraw automatico al completamento di `m.request`.

---

## 9. Upload di file con FormData

Ottieni i `File` da `<input type="file">`, costruisci una `FormData`, usala come `body` con un metodo che ha corpo (`POST`/`PUT`/`PATCH`).

```javascript
m.render(document.body, [m("input[type=file]", {onchange: upload})])

function upload(e) {
	var file = e.target.files[0]
	var body = new FormData()
	body.append("myfile", file)

	m.request({method: "POST", url: "/api/v1/upload", body: body})
}
```

Upload multiplo (input con `multiple`):

```javascript
m.render(document.body, [m("input[type=file][multiple]", {onchange: upload})])

function upload(e) {
	var files = e.target.files
	var body = new FormData()
	for (var i = 0; i < files.length; i++) {
		body.append("file" + i, files[i])
	}
	m.request({method: "POST", url: "/api/v1/upload", body: body})
}
```

Note: con `FormData`, `serialize` di default è l'identity (nessun `JSON.stringify`) e il browser imposta automaticamente il `Content-Type` multipart con il boundary. **Non** impostare manualmente `Content-Type` in `headers` per FormData, romperebbe il boundary. L'upload multiplo in una sola richiesta è atomico (tutto o niente): per salvataggio parziale resiliente, una richiesta per file.

---

## 10. Risposte non-JSON e header custom

Di default Mithril prova a parsare la risposta come JSON. Per altri formati definisci `deserialize` (e tipicamente header coerenti):

```javascript
m.request({
	method: "GET",
	url: "/files/icon.svg",
	deserialize: function(value) { return value }
}).then(function(svg) {
	m.render(document.body, m.trust(svg))
})
```

Header custom per sovrascrivere il tipo di richiesta JSON di default:

```javascript
m.request({
	method: "GET",
	url: "/files/image.svg",
	headers: {
		"Content-Type": "image/svg+xml; charset=utf-8",
		"Accept": "image/svg, text/*"
	},
	deserialize: function(value) { return value }
})
```

Gotcha: con `responseType: "json"` (default) il valore arriva già parsato; per testo grezzo imposta un `deserialize` identity e, se necessario, header `Accept`/`Content-Type` espliciti.

---

## 11. Casi limite: IPv6, `responseType`, `withCredentials`, `timeout`

### IPv6 nell'URL

Il rilevamento dei `:param` confonde i segmenti di un indirizzo IPv6 con interpolazioni di path, causando un errore.

```javascript
// NON funziona — i ':' dell'IPv6 vengono interpretati come param
m.request("http://[2001:db8::990a:cd27:4d9e:79]:8080/some/path", { /* ... */ })

// Workaround — passa host:port come parametro
m.request("http://:host/some/path", {
	params: {host: "[2001:db8::990a:cd27:4d9e:79]:8080"}
})

// IPv4 funziona normalmente
m.request("http://192.0.2.15:8080/some/path", { /* ... */ })
```

### `responseType`

Valore del [`responseType`](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/responseType) dell'XHR. Default `"json"` (esegue `JSON.parse(responseText)` internamente) se `extract` non è definito; default `""` se `extract` è definito. Per binari usa es. `responseType: "blob"` o `"arraybuffer"` insieme a un `extract`/`deserialize` adeguato.

### `withCredentials`

`Boolean`, default `false`. Mettilo `true` per inviare cookie a domini di terze parti (richieste CORS cross-origin con credenziali). Richiede CORS lato server configurato di conseguenza.

### `timeout`

`Number` di millisecondi. Allo scadere, la richiesta viene terminata automaticamente (corrisponde a [`XMLHttpRequest.timeout`](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/timeout)). Default `undefined` (nessun timeout).

---

## 12. `m.jsonp`

> Nota di accuratezza: il file sorgente `docs/request.md` fornito documenta esclusivamente `m.request`. Non contiene la firma né le opzioni di `m.jsonp`. Per non inventare API, non vengono qui riportate opzioni di `m.jsonp` non presenti nei sorgenti letti. Consultare `docs/jsonp.md` per la specifica esatta (callback name, opzioni `callbackName`/`callbackKey`, ecc.) prima di usarlo.

Concetto generale: `m.jsonp` serve per richieste cross-origin in stile JSONP (via `<script>`), alternativa a `m.request` quando l'endpoint non supporta CORS. Le opzioni precise vanno verificate sul relativo documento sorgente.

---

## 13. Integrazione librerie esterne via lifecycle

Le librerie di terze parti (o codice vanilla che manipola il DOM) si integrano tramite i [lifecycle methods](lifecycle-methods.md) dei componenti, in particolare `oncreate` (init dopo che il DOM esiste) e `onremove` (cleanup). Vedi `docs/integrating-libs.md`.

### Pattern wrapper (closure component)

```javascript
/** Wrapper per noUiSlider */
function Slider() {
	var slider
	return {
		oncreate: function(vnode) {
			// il nodo DOM reale è in vnode.dom
			slider = noUiSlider.create(vnode.dom, {
				start: 0,
				range: {min: 0, max: 100}
			})
			slider.on('update', function(values) {
				vnode.attrs.onChange(values[0])
				m.redraw() // evento esterno → redraw manuale
			})
		},
		onremove: function() {
			slider.destroy() // cleanup obbligatorio
		},
		view: function() {
			return m('div') // contenitore vuoto gestito dalla lib esterna
		}
	}
}
```

### Pattern wrapper (POJO component) — FullCalendar

```javascript
var FullCalendar = {
	oncreate: function(vnode) {
		$(vnode.dom).fullCalendar({ /* opzioni e callback iniziali */ })
	},
	onremove: function(vnode) {
		$(vnode.dom).fullCalendar('destroy')
	},
	view: function() {
		return m('div')
	}
}

// Esporre il nodo DOM al parent via oncreate sull'istanza
function Demo() {
	var fullCalendarEl
	function next() { $(fullCalendarEl).fullCalendar('next') }
	function prev() { $(fullCalendarEl).fullCalendar('prev') }
	return {
		view: function() {
			return [
				m('h1', 'Calendar'),
				m(FullCalendar, {
					oncreate: function(vnode) { fullCalendarEl = vnode.dom }
				}),
				m('button', {onclick: prev}, 'Mithril.js Button -'),
				m('button', {onclick: next}, 'Mithril.js Button +')
			]
		}
	}
}
```

Gotcha:
- `view` deve ritornare un elemento contenitore **vuoto** (`m('div')`): Mithril non deve gestire il sottoalbero che la libreria esterna manipola, altrimenti i due diff entrano in conflitto.
- `oncreate` è il punto giusto per l'init perché `vnode.dom` è già nel documento. `oninit` è troppo presto (nessun DOM).
- Cleanup in `onremove` è obbligatorio per evitare memory leak (listener, istanze, timer della lib).
- Eventi/callback della lib esterna vivono fuori dal ciclo di redraw di Mithril → chiama `m.redraw()` quando cambiano dati che la UI Mithril deve riflettere.

---

## 14. Anti-pattern

### La Promise non sono i dati

`m.request` ritorna una `Promise`, non i dati. Non può ritornarli direttamente: una richiesta HTTP può richiedere tempo e bloccare l'app non è accettabile.

```javascript
// EVITARE
var users = m.request("/api/v1/users")
console.log(users) // è una Promise, non la lista

// PREFERIRE
m.request("/api/v1/users").then(function(users) {
	console.log(users)
})
```

### Non renderizzare HTML generato dal server

`m.request` si aspetta JSON. Evita di usare Mithril per renderizzare HTML dinamico generato lato server: Mithril è pensato per thick client con templating nel browser e UI in retained mode. Separa template (codice) e dati (JSON dal server).

---

## Checklist esperto

1. **Aggiorna lo stato dentro `.then()`** e lascia che il redraw automatico di `m.request` ridisegni la UI; usa `m.redraw()` manuale solo per eventi fuori dal ciclo (progress, callback di lib esterne).
2. **Imposta `background: true`** per polling/telemetria/richieste senza impatto UI, così eviti redraw inutili; ricordati il `m.redraw()` esplicito se poi tocchi stato visibile.
3. **Gestisci gli errori con `.catch`** sfruttando `error.code` (status) e `error.response` (corpo parsato) — es. `401` → riautentica, throttling → `setTimeout(retry, error.response.timeout)`.
4. **Usa `extract` solo quando serve** controllo totale: ricorda che salta `deserialize`, porta `responseType` a `""` e **sopprime** il rigetto automatico su status di errore (rigetta solo se lanci).
5. **Per FormData non impostare `Content-Type` manuale**: il browser genera il boundary multipart; `serialize` è già identity per `FormData`/`URLSearchParams`.
6. **Salva il riferimento XHR via `config`** per `abort()` nei typeahead/autocompleter ed evitare race condition con risposte fuori ordine.
7. **Per IPv6** passa `host:port` come `params`, mai inline nell'URL, per evitare il falso match dei `:param`.
8. **Integra le lib esterne** con `oncreate`/`onremove` su un contenitore vuoto (`m('div')`), facendo cleanup in `onremove` e chiamando `m.redraw()` sui loro eventi.
