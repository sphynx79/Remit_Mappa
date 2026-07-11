# Mithril.js 2.3.6 — Lifecycle Methods e Keys

Riferimento esperto su lifecycle hooks (`oninit`, `oncreate`, `onupdate`, `onbeforeupdate`, `onbeforeremove`, `onremove`) e sul magic attribute `key`. Tutto il contenuto è estratto da `docs/lifecycle-methods.md` e `docs/keys.md`. Sintassi hyperscript `m()`.

## Indice

- [Concetti base sui lifecycle](#concetti-base-sui-lifecycle)
- [Il ciclo di vita di un elemento DOM](#il-ciclo-di-vita-di-un-elemento-dom)
- [oninit](#oninit)
- [oncreate](#oncreate)
- [onupdate](#onupdate)
- [onbeforeupdate](#onbeforeupdate)
- [onbeforeremove](#onbeforeremove)
- [onremove](#onremove)
- [Ordine di esecuzione degli hook](#ordine-di-esecuzione-degli-hook)
- [Animazioni di uscita con onbeforeremove + Promise](#animazioni-di-uscita-con-onbeforeremove--promise)
- [Anti-pattern sui lifecycle](#anti-pattern-sui-lifecycle)
- [Keys: cosa sono](#keys-cosa-sono)
- [Restrizioni sulle key](#restrizioni-sulle-key)
- [Collegare model data a liste di view](#collegare-model-data-a-liste-di-view)
- [Animazioni glitch-free con le key](#animazioni-glitch-free-con-le-key)
- [Reinizializzare una view con single-child keyed fragment](#reinizializzare-una-view-con-single-child-keyed-fragment)
- [Gotchas sulle key](#gotchas-sulle-key)
- [Checklist esperto](#checklist-esperto)

---

## Concetti base sui lifecycle

[Components](components.md) e [virtual DOM nodes](vnodes.md) possono avere lifecycle methods (detti *hooks*), chiamati in vari momenti della vita di un elemento DOM.

Gli hook possono essere dichiarati **sul componente** o **sul vnode che usa il componente** (via attrs):

```javascript
// Hook dichiarato sul componente
var ComponentWithHook = {
	oninit: function(vnode) {
		console.log("initialize component")
	},
	view: function() {
		return "hello"
	}
}

// Hook dichiarato sul vnode (via attrs)
function initializeVnode() {
	console.log("initialize vnode")
}

m(ComponentWithHook, {oninit: initializeVnode})
```

Regole generali, valide per **tutti** gli hook:

- Il **primo argomento è sempre il `vnode`**. `firstHook(vnode)`.
- `this` è bound a `vnode.state`.
- **Gli hook scattano SOLO come side effect di una chiamata a [`m.render()`](render.md)** (e quindi di `m.mount`/`m.route`/`m.redraw`). Non scattano se modifichi il DOM fuori da Mithril.

> Gotcha — entrambi gli hook scattano: se dichiari lo stesso hook sia sul componente sia via attrs nel vnode che lo istanzia, vengono invocati entrambi. Non si sovrascrivono. Diverso da React, dove un solo lifecycle "vince".

---

## Il ciclo di vita di un elemento DOM

Un elemento DOM viene tipicamente creato e appeso al documento. Può poi avere attributi o figli aggiornati a seguito di un evento + cambio dati, oppure essere rimosso.

**DOM recycling**: dopo la rimozione, un elemento può restare temporaneamente in un memory pool e venire riusato in un update successivo, per evitare il costo di ricrearlo.

> Gotcha critico sul recycling: **un vnode che ha `oncreate`, `onupdate`, `onbeforeremove` o `onremove` NON viene mai riciclato.** Solo i vnode "puri" finiscono nel pool. `oninit`, invece, **viene chiamato anche quando un elemento è riciclato** (mentre `oncreate`/`onupdate` no). Questo influenza performance e assunzioni sullo stato.

---

## oninit

Firma: `oninit(vnode)`

- Chiamato **prima** che il vnode sia toccato dal motore virtual DOM.
- Garantito **prima** dell'attach del DOM element al documento.
- Garantito sui **parent prima dei children**.
- NON offre garanzie sull'esistenza di DOM element di antenati o discendenti. **Non accedere mai a `vnode.dom` da `oninit`.**
- NON viene chiamato sugli update. **Viene** chiamato se l'elemento è riciclato.
- `this === vnode.state`.

Uso tipico: inizializzare lo stato del componente in base a `vnode.attrs` o `vnode.children`.

```javascript
function ComponentWithState() {
	var initialData
	return {
		oninit: function(vnode) {
			initialData = vnode.attrs.data
		},
		view: function(vnode) {
			return [
				// dato al momento dell'inizializzazione:
				m("div", "Initial: " + initialData),
				// dato corrente:
				m("div", "Current: " + vnode.attrs.data)
			]
		}
	}
}

m(ComponentWithState, {data: "Hello"})
```

> Gotcha — niente mutazioni sincrone del model qui: `oninit` non dà garanzie sullo stato degli altri elementi, quindi cambi al model fatti sincronicamente da `oninit` potrebbero non riflettersi in tutte le parti della UI fino al ciclo di render successivo.

---

## oncreate

Firma: `oncreate(vnode)`

- Chiamato **dopo** che il DOM element è creato e attaccato al documento.
- Garantito a **fine ciclo di render** → è sicuro leggere valori di layout: `vnode.dom.offsetHeight`, `vnode.dom.getBoundingClientRect()`.
- NON viene chiamato sugli update.
- I vnode con `oncreate` **non vengono riciclati**.
- `this === vnode.state`.

Uso tipico: leggere valori di layout (che potrebbero forzare un repaint), avviare animazioni, inizializzare librerie terze che richiedono un riferimento al DOM.

```javascript
var HeightReporter = {
	oncreate: function(vnode) {
		console.log("Initialized with height of: ", vnode.dom.offsetHeight)
	},
	view: function() {}
}

m(HeightReporter, {data: "Hello"})
```

> Gotcha — come per `oninit`, non mutare il model sincronicamente: girando a fine ciclo, i cambi non si riflettono in UI fino al render successivo.

---

## onupdate

Firma: `onupdate(vnode)`

- Chiamato **dopo** che il DOM element è stato aggiornato, mentre è attaccato al documento.
- Garantito a fine ciclo di render → sicuro leggere `offsetHeight`, `getBoundingClientRect()`, ecc.
- Chiamato **solo se l'elemento esisteva nel ciclo precedente**. NON sulla creazione, NON sul recycling.
- I vnode con `onupdate` **non vengono riciclati**.

Uso tipico: leggere layout values dopo update; aggiornare stato di librerie terze dopo cambio dati.

```javascript
function RedrawReporter() {
	var count = 0
	return {
		onupdate: function() {
			console.log("Redraws so far: ", ++count)
		},
		view: function() {}
	}
}

m(RedrawReporter, {data: "Hello"})
```

> Gotcha — `oncreate` e `onupdate` sono mutuamente esclusivi nello stesso ciclo per un dato vnode: alla prima comparsa scatta `oncreate`, dai cicli successivi scatta `onupdate`. Se ti serve "alla creazione E ad ogni update" devi dichiarare entrambi.

---

## onbeforeupdate

Firma: `onbeforeupdate(vnode, old)`

- Chiamato **prima** che il vnode venga diffato in un update. Riceve come secondo argomento `old`, il vnode del ciclo precedente.
- **Se ritorna `false`, Mithril impedisce il diff sul vnode e di conseguenza sui suoi figli.**
- Da solo NON impedisce la generazione di un sottoalbero virtual DOM, a meno che il sottoalbero non sia incapsulato in un componente.
- `this === vnode.state`.

Uso: ridurre il lag negli update quando c'è un albero DOM molto grande. È puramente un'ottimizzazione.

```javascript
var BigList = {
	onbeforeupdate: function(vnode, old) {
		// salta il diff se il riferimento ai dati non è cambiato
		return vnode.attrs.items !== old.attrs.items
	},
	view: function(vnode) {
		return m("ul", vnode.attrs.items.map(function(it) {
			return m("li", it.label)
		}))
	}
}
```

> Gotcha — "skip diff" non significa "skip view": se il sottoalbero non è in un componente, la view che lo genera gira comunque; risparmi solo il patch del DOM. Per saltare anche la generazione del virtual DOM, incapsula in un componente.

> Gotcha — affidarsi all'identità di oggetto (`===`) per gli short-circuit è fragile: se muti gli oggetti in-place invece di sostituirli, `onbeforeupdate` ritornerà `false` e la UI resterà stantia. Bug difficilissimi da diagnosticare.

---

## onbeforeremove

Firma: `onbeforeremove(vnode)`

- Chiamato **prima** che il DOM element sia staccato dal documento.
- **Se ritorna una Promise, Mithril stacca l'elemento solo dopo che la Promise si è risolta.** È il meccanismo per le animazioni di uscita.
- Chiamato **solo sull'elemento che perde il proprio `parentNode`**, NON sui suoi figli.
- I vnode con `onbeforeremove` **non vengono riciclati**.
- `this === vnode.state`.

```javascript
var Fader = {
	onbeforeremove: function(vnode) {
		vnode.dom.classList.add("fade-out")
		return new Promise(function(resolve) {
			setTimeout(resolve, 1000)
		})
	},
	view: function() {
		return m("div", "Bye")
	}
}
```

> Gotcha — granularità: `onbeforeremove` scatta solo sul nodo radice del sottoalbero rimosso. Se vuoi animare in uscita i figli, mettili sotto un unico nodo che ha l'hook, oppure gestisci l'animazione dal nodo padre — non aspettarti che ogni figlio riceva il proprio `onbeforeremove`.

---

## onremove

Firma: `onremove(vnode)`

- Chiamato **prima** che il DOM element sia rimosso dal documento.
- Se è definito anche `onbeforeremove`, `onremove` gira **dopo** che la Promise ritornata da `onbeforeremove` si è completata.
- A differenza di `onbeforeremove`, **viene chiamato su qualunque elemento rimosso**, sia che venga staccato direttamente sia che sia figlio di un nodo staccato.
- I vnode con `onremove` **non vengono riciclati**.
- `this === vnode.state`.

Uso tipico: pulizia (clear timeout/interval, unsubscribe, distruggere widget di librerie terze).

```javascript
function Timer() {
	var timeout = setTimeout(function() {
		console.log("timed out")
	}, 1000)

	return {
		onremove: function() {
			clearTimeout(timeout)
		},
		view: function() {}
	}
}
```

> Gotcha — differenza chiave `onbeforeremove` vs `onremove`: il primo scatta **solo** sulla radice del sottoalbero rimosso; il secondo su **ogni** nodo rimosso (radice + tutti i discendenti). Per la cleanup ricorsiva (timer, listener) usa `onremove`, non `onbeforeremove`.

---

## Ordine di esecuzione degli hook

Ricostruito dalle garanzie documentate:

**Creazione (mount):**
1. `oninit` — parent prima dei children, prima dell'attach al DOM, `vnode.dom` non disponibile.
2. (Mithril crea e attacca gli elementi)
3. `oncreate` — a fine ciclo di render, `vnode.dom` disponibile e layout leggibile.

**Update:**
1. `onbeforeupdate(vnode, old)` — prima del diff; `false` salta il diff del nodo e dei suoi figli.
2. (diff/patch)
3. `onupdate` — a fine ciclo, solo se il nodo esisteva nel ciclo precedente.

**Rimozione:**
1. `onbeforeremove(vnode)` — solo sulla radice del sottoalbero; se ritorna Promise, l'attesa blocca il detach.
2. `onremove(vnode)` — su ogni nodo rimosso; se c'era `onbeforeremove`, dopo la risoluzione della Promise.
3. (detach effettivo dal documento)

> Nota: `oninit` viene rieseguito sul recycling; `oncreate`/`onupdate` no. I nodi con qualsiasi hook tranne `oninit` non vengono mai riciclati.

---

## Animazioni di uscita con onbeforeremove + Promise

Pattern canonico: aggiungi una classe CSS che innesca la transizione, ritorna una Promise che si risolve quando la transizione è finita. Mithril tiene l'elemento nel DOM finché la Promise non risolve.

```javascript
var SlideOut = {
	onbeforeremove: function(vnode) {
		vnode.dom.classList.add("slide-out")
		return new Promise(function(resolve) {
			// risolvi alla fine reale della transizione, non con un timeout fisso
			vnode.dom.addEventListener("animationend", resolve)
		})
	},
	view: function() {
		return m(".item", "contenuto")
	}
}
```

> Gotcha — la Promise è bloccante per il detach: se non si risolve mai, l'elemento resta nel DOM per sempre. Garantisci sempre una via di risoluzione (es. fallback con timeout oltre a `animationend`).

> Gotcha — per animare l'uscita di **una lista** di elementi, ognuno deve essere un nodo con il proprio `onbeforeremove` e, di norma, una **key**: senza key Mithril non sa quale elemento è stato realmente rimosso e l'animazione può "saltare" sull'elemento sbagliato (vedi sezione key/animazioni).

---

## Anti-pattern sui lifecycle

Dalla doc, `onbeforeupdate` va usato **solo come ultima risorsa** per saltare il diff, mai a scopo preventivo:

- Non ottimizzare "just-in-case". Più codice = più costo di manutenzione, e i bug legati a `onbeforeupdate` sono particolarmente subdoli quando ci si affida all'identità di oggetto.
- I problemi di performance risolvibili con `onbeforeupdate` si riducono quasi sempre a **un singolo array grande** (la classica tabella da 5000 righe, in larghezza o in profondità densa).
- Prima valuta una soluzione di design (es. ricerca/paginazione invece di mostrare 5000 righe).
- Se proprio devi, applica `onbeforeupdate` sul **nodo padre dell'array più grande** e rimisura. Nella maggioranza dei casi basta un singolo check.
- Più `onbeforeupdate` sparsi sono un *code smell* che indica problemi di prioritizzazione nel design.

---

## Keys: cosa sono

Le key rappresentano **identità tracciate**. Si aggiungono a vnode di tipo **element, component e fragment** tramite il magic attribute `key`:

```javascript
m(".user", {key: user.id}, [/* ... */])
```

Servono in tre scenari:

1. **Model/stateful data renderizzati in liste** — per tenere lo stato locale legato al sottoalbero giusto.
2. **Animazioni CSS indipendenti su nodi adiacenti** rimovibili singolarmente — per evitare che l'animazione "salti" su un altro nodo.
3. **Reinizializzare un sottoalbero on-demand** — aggiungi una key e cambiala per forzare la reinizializzazione al redraw.

---

## Restrizioni sulle key

**Regola fondamentale (vale per tutti i fragment):** i figli di un fragment devono essere **o tutti keyed o tutti unkeyed**. Niente key parziali.

Le key esistono solo su vnode che supportano attributi: **element, component, fragment**. I "buchi" (`null`, `undefined`, boolean, stringhe) NON possono avere attributi → non possono essere keyed → non possono stare in un keyed fragment.

```javascript
// NON valido (mix keyed/unkeyed)
;[m(".foo", {key: 1}), null]
;["foo", m(".bar", {key: 2})]

// Valido
;[m(".foo", {key: 1}), m(".bar", {key: 2})]   // tutti keyed
;[m(".foo"), null]                              // tutti unkeyed
```

Se violi la regola, Mithril lancia un errore esplicativo.

---

## Collegare model data a liste di view

Quando renderizzi liste di entità con stato e identità (TODO, post, commenti…), devi dare a Mithril l'informazione per tracciarle. Mithril conosce **solo i vnode**, nient'altro.

Esempio: lista di post e di commenti senza key.

```javascript
// In Feed — SENZA key (problematico)
m(".post-list", posts.map(function(post) {
	return m(Post, {post: post})
}))

// In Post — SENZA key (problematico)
m(".comment-list", comments.map(function(comment) {
	return m(Comment, {comment: comment})
}))
```

Perché si rompe: Mithril patcha i fragment **unkeyed** in modo iterativo, posizione per posizione. Rimuovendo un elemento in mezzo (es. nascondi un post), il diff diventa:

- Prima: `A, B, C, D, E`
- Patched: `A, B, C -> D, D -> E, E -> (removed)`

Siccome il componente resta lo stesso (`Comment`/`Post`), cambiano **solo gli attributi** e il nodo non viene rimpiazzato → lo stato interno (testo in fase di scrittura, comments lazy-loaded) finisce sull'entità sbagliata.

Fix: aggiungi una `key` computata sull'identità dell'entità.

```javascript
// In Feed — CON key
m(".post-list", posts.map(function(post) {
	return m(Post, {key: post.id, post: post})
}))

// In Post — CON key
m(".comment-list", comments.map(function(comment) {
	return m(Comment, {key: comment.id, comment: comment})
}))
```

> Gotcha — la key va sul vnode che la `map` produce direttamente (il figlio del fragment generato da `.map(...)`), non più in profondità. Vedi "Wrapping keyed elements".

---

## Animazioni glitch-free con le key

Se animi box/elementi che possono essere rimossi individualmente, senza key l'animazione resta legata alla **posizione** invece che all'**entità**. Aggiungendo una key unica per box, lo stato visivo segue il box giusto.

```javascript
function Boxes() {
	var boxes = []
	var nextKey = 0

	function add() {
		var key = nextKey
		nextKey++
		boxes.push({key: key, color: getColor()})
	}

	function remove(box) {
		var index = boxes.indexOf(box)
		boxes.splice(index, 1)
	}

	return {
		view: function() {
			return [
				m("button", {onclick: add}, "Add box, click box to remove"),
				m(".container", boxes.map(function(box, i) {
					return m(".box",
						{
							key: box.key,           // key unica e stabile per box
							"data-color": box.color,
							onclick: function() { remove(box) }
						},
						m(".stretch")
					)
				}))
			]
		}
	}
}
```

> Gotcha — la key deve essere **stabile e unica per entità**, generata una volta alla creazione del box (qui un counter `nextKey` incrementale), non l'indice `i` della map. Usare l'indice come key vanifica lo scopo: dopo una rimozione gli indici si rimescolano.

---

## Reinizializzare una view con single-child keyed fragment

Con le route resolver `render` (vedi [route.md](route.md#routeresolverrender)) l'albero viene mantenuto tra route che condividono lo stesso pattern. Passando da `/person/1` a `/person/2`, l'albero resta `m(Layout, m(Person, {id: ...}))`: il componente `Person` **non** si reinizializza, quindi non rifà la fetch.

Fix: aggiungi una `key` derivata dall'id sul vnode `Person`. Quando la key cambia, Mithril reinizializza il componente.

```javascript
m.route(rootElem, "/", {
	"/": Home,
	"/person/:id": {
		render: function() {
			return m(Layout,
				// array (single-child keyed fragment) per poter aggiungere
				// altri elementi in futuro. Ricorda: un fragment deve avere
				// figli o tutti keyed o tutti unkeyed.
				[m(Person, {id: m.route.param("id"), key: m.route.param("id")})]
			)
		}
	}
})
```

Un **single-child keyed fragment** è semplicemente un array con un solo figlio keyed: `[m("div", {key: foo})]`. È il modo corretto per avere un singolo elemento keyed isolato.

---

## Gotchas sulle key

### Wrapping keyed elements (la key sul figlio sbagliato)

Questi due snippet NON sono equivalenti:

```javascript
// SBAGLIATO — la key è sul componente interno, ma il fragment di map(...) è unkeyed
users.map(function(user) {
	return m(".wrapper", [
		m(User, {user: user, key: user.id})
	])
})

// CORRETTO — la key è sul .wrapper, cioè sul figlio diretto del fragment di map(...)
users.map(function(user) {
	return m(".wrapper", {key: user.id}, [
		m(User, {user: user})
	])
})
```

Nel primo caso il fragment esterno generato da `map(...)` è del tutto unkeyed; conseguenze: richieste extra ad ogni cambio lista, input interni che perdono stato. La key va **sul vnode che è figlio diretto del fragment**.

### Putting keys inside the component (key dentro la view del componente)

```javascript
// EVITA — la key sulla fragment interna NON si applica al componente nel suo insieme
function Person(vnode) {
	var personId = vnode.attrs.id
	return {
		view: function() {
			return m.fragment({key: personId},
				// la view del componente
			)
		}
	}
}
```

Non funziona: la key si applica alla view, non al componente → non si reinizializza/refetcha nulla. Metti la key **sul vnode che usa il componente**, non dentro il componente.

```javascript
// PREFERISCI
return [m(Person, {id: m.route.param("id"), key: m.route.param("id")})]
```

### Keying elements unnecessarily (key statiche / superflue)

```javascript
// THROWS — .header ha key, .body e .footer no → key parziali nello stesso fragment
m(".page",
	m(".header", {key: "header"}),
	m(".body"),
	m(".footer")
)
```

La soluzione qui **non** è aggiungere key agli altri, è **rimuovere** la key da `.header`. Le key servono solo quando ogni entry ha uno stato associato che Mithril non traccia (model, componente o DOM). Inoltre: **evita le key statiche, sono sempre superflue.** Se non stai *computando* la `key`, probabilmente stai sbagliando.

### Mixing key types (`1` vs `"1"`)

Le key sono lette come **nomi di proprietà di oggetto**: `1` e `"1"` sono identici. Mescolare tipi porta a duplicati e comportamenti imprevisti.

```javascript
// EVITA
var things = [
	{id: "1", name: "Book"},
	{id: 1, name: "Cup"}
]

// Se proprio devi convivere con id eterogenei, prefissa col tipo
things.map(function(thing) {
	return m(".thing", {key: (typeof thing.id) + ":" + thing.id} /* ... */)
})
```

### Hiding keyed elements with holes (null al posto del nodo)

I buchi (`null`, `undefined`, boolean) sono vnode **unkeyed**, quindi questo mescola keyed/unkeyed e si rompe:

```javascript
// EVITA
things.map(function(thing) {
	return shouldShowThing(thing)
		? m(Thing, {key: thing.id, thing: thing})
		: null
})

// PREFERISCI — filtra PRIMA della map
things
	.filter(function(thing) { return shouldShowThing(thing) })
	.map(function(thing) {
		return m(Thing, {key: thing.id, thing: thing})
	})
```

### Duplicate keys

Le key di un fragment **devono essere uniche**. Mithril usa un oggetto vuoto per mappare key→indici: con key duplicate non è chiaro dove si sia spostato un elemento → patch errati su update, specie se la lista cambia.

```javascript
// EVITA — id "1" duplicato
var things = [
	{id: "1", name: "Book"},
	{id: "1", name: "Cup"}
]
```

### Using objects for keys

Le key sono trattate come property keys. Passare oggetti come key non fa ciò che pensi:

```javascript
// EVITA
things.map(function(thing) {
	return m(Thing, {key: thing, thing: thing})
})
```

Se l'oggetto ha un `toString`, viene chiamato e dipendi dal suo output; altrimenti tutto stringifica a `"[object Object]"` → problema di key duplicate. Usa sempre un valore primitivo localmente unico.

---

## Checklist esperto

1. **`vnode` è sempre il primo arg e `this === vnode.state`** in ogni hook; gli hook scattano solo via `m.render`/redraw, mai per modifiche DOM esterne a Mithril.
2. **Non leggere `vnode.dom` in `oninit`**; usa `oncreate`/`onupdate` per layout reads (`offsetHeight`, `getBoundingClientRect`), che girano a fine ciclo.
3. **Cleanup in `onremove`** (scatta su ogni nodo rimosso), non in `onbeforeremove` (solo sulla radice del sottoalbero). `onbeforeremove` serve per le **animazioni di uscita** ritornando una Promise — garantiscine sempre la risoluzione, altrimenti il nodo resta nel DOM.
4. **Ricorda il recycling**: solo i vnode senza hook (tranne `oninit`) vengono riciclati; `oninit` rigira sul recycle, `oncreate`/`onupdate` no.
5. **`onbeforeupdate` è l'ultima risorsa**: usalo solo sul padre dell'array grande quando hai un problema di performance reale; non affidarti a mutazioni in-place per i suoi check `===`.
6. **In un fragment, o tutte le key o nessuna** — niente key parziali, niente `null`/stringhe accanto a nodi keyed; filtra la lista *prima* della `map`.
7. **La key va sul figlio diretto del fragment** prodotto da `map(...)` (es. sul `.wrapper`, o sul vnode `m(Component, {key})`), mai dentro la view del componente.
8. **Key computate, uniche, stabili, di tipo coerente**: usa l'identità dell'entità (es. `id`) o un counter dedicato; mai indici di posizione, mai key statiche, mai oggetti, mai mix `1`/`"1"`.
