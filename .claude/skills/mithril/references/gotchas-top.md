# Mithril.js 2.3.6 — Top gotcha verificati sul campo

Digest prioritario delle trappole a **più alto impatto**: quelle che un buon sviluppatore (o un LLM capace) sbaglia più spesso quando NON ha sotto mano gli idiomi Mithril. L'ordine riflette quanto sono facili da mancare, non quanto sono "difficili". Per ogni voce: sintomo → codice sbagliato → codice giusto → perché. Il link finale rimanda alla sezione di dettaglio.

Se leggi un solo file di gotcha, leggi questo. Per la teoria completa segui i rimandi.

## Indice

- [1. Inoltro di vnode.attrs senza m.censor](#1-inoltro-di-vnodeattrs-senza-mcensor)
- [2. key = id stabile, mai l'indice della map](#2-key--id-stabile-mai-lindice-della-map)
- [3. onbeforeremove deve RITORNARE una Promise](#3-onbeforeremove-deve-ritornare-una-promise)
- [4. L'auto-redraw non scatta fuori dal ciclo Mithril](#4-lauto-redraw-non-scatta-fuori-dal-ciclo-mithril)
- [5. Risposte stale nelle ricerche con debounce](#5-risposte-stale-nelle-ricerche-con-debounce)
- [6. Classici a colpo sicuro](#6-classici-a-colpo-sicuro)

---

## 1. Inoltro di vnode.attrs senza m.censor

**La trappola più dimenticata.** Un componente wrapper che inoltra gli attributi ricevuti all'elemento radice deve filtrarli con `m.censor`, altrimenti `key` e **tutti** i lifecycle hook del wrapper "filtrano" sul figlio.

**Sintomo:** i lifecycle del wrapper vengono eseguiti **due volte** (sia `oninit`, sia `oncreate`, sia `onupdate`, sia `onbeforeremove`/`onremove`), e se il wrapper è dentro un fragment la `key` ricevuta finisce sul nodo sbagliato → errore di chiavi miste o reconciliation errata.

```javascript
// SBAGLIATO — inoltro grezzo
var Card = {
	view: function(vnode) {
		return m(".card", vnode.attrs, [    // key + lifecycle passano oltre
			m("h3.card__title", "Titolo"),
			vnode.children,
		])
	}
}
```

```javascript
// GIUSTO — m.censor rimuove key/lifecycle/tag prima dell'inoltro
var Card = {
	view: function(vnode) {
		return m(".card", m.censor(vnode.attrs), [
			m("h3.card__title", "Titolo"),
			vnode.children,
		])
	}
}
// ora m(Card, {key: item.id, class: "highlight", onclick: fn}, children) funziona:
// class/onclick/data-* arrivano al div, mentre key e i lifecycle restano sul componente.
```

**Perché:** `m.censor(attrs)` ritorna una copia degli attrs **senza** le reserved key (`key`, `oninit`, `oncreate`, `onupdate`, `onbeforeupdate`, `onbeforeremove`, `onremove`). Senza censura, quelle proprietà vengono interpretate una seconda volta sull'elemento figlio. → Dettaglio: [components.md §7.2](components.md), [rendering-redraw.md](rendering-redraw.md) (sezione `m.censor`).

---

## 2. key = id stabile, mai l'indice della map

**Sintomo:** dopo un riordino, un filtro o una rimozione in mezzo alla lista, lo stato del DOM "salta" sull'elemento sbagliato: un input perde il focus/valore, una checkbox si sposta, un'animazione di uscita parte sul nodo errato.

```javascript
// SBAGLIATO — key posizionale
items.map(function(it, i) { return m(Row, {key: i, item: it}) })

// SBAGLIATO — buco condizionale dentro lista keyed (mix keyed/unkeyed → errore)
items.map(function(it) { return it.visible ? m(Row, {key: it.id}) : null })
```

```javascript
// GIUSTO — key = identità stabile dell'entità, e filtra PRIMA della map
items
	.filter(function(it) { return it.visible })
	.map(function(it) { return m(Row, {key: it.id, item: it}) })

// liste miste (es. pinned sopra): separa con due filter().map(), niente null in mezzo
[].concat(
	items.filter(function(it){ return it.pinned }).map(function(it){ return m(Row, {key: it.id, item: it, pinned: true}) }),
	items.filter(function(it){ return !it.pinned }).map(function(it){ return m(Row, {key: it.id, item: it}) })
)
```

**Perché:** la `key` lega l'identità dell'entità al suo sottoalbero. Con l'indice, dopo uno `splice` gli indici si rimescolano e Mithril riusa il DOM dell'entità sbagliata. La key dev'essere **computata, unica, stabile, di tipo coerente** e stare sul vnode prodotto **direttamente** dalla `.map` (il figlio del fragment). I sibling dello stesso array vanno **o tutti keyed o tutti unkeyed**. → Dettaglio: [lifecycle-keys.md](lifecycle-keys.md) (sezioni "Restrizioni", "Animazioni glitch-free", "Gotchas sulle key").

---

## 3. onbeforeremove deve RITORNARE una Promise

**Sintomo:** l'animazione di uscita non si vede: l'elemento sparisce di colpo dal DOM. Oppure l'elemento non sparisce **mai** (Promise che non si risolve).

```javascript
// SBAGLIATO — niente return: Mithril rimuove subito
onbeforeremove: function(vnode) {
	vnode.dom.classList.add("fade-out")   // la classe viene messa ma il nodo è già staccato
}
```

```javascript
// GIUSTO — ritorna una Promise risolta a fine animazione, con fallback
onbeforeremove: function(vnode) {
	vnode.dom.classList.add("fade-out")
	return new Promise(function(resolve) {
		var done = false
		function finish() { if (done) return; done = true; vnode.dom.removeEventListener("animationend", finish); resolve() }
		vnode.dom.addEventListener("animationend", finish)
		setTimeout(finish, 450)   // fallback: se animationend non scatta, non bloccare il nodo per sempre
	})
}
```

**Perché:** finché la Promise ritornata da `onbeforeremove` è pending, Mithril **tiene** l'elemento nel DOM; alla risoluzione lo stacca. Senza `return`, la rimozione è immediata. Note: `onbeforeremove` scatta **solo** sul nodo che perde il `parentNode` (non sui figli); usa `transitionend` per le `transition`, `animationend` per le `@keyframes`; per il cleanup sincrono (timer/listener) usa `onremove`. → Dettaglio: [lifecycle-keys.md](lifecycle-keys.md) ("Animazioni di uscita"), [testing-animation.md](testing-animation.md).

---

## 4. L'auto-redraw non scatta fuori dal ciclo Mithril

**Sintomo:** muti lo stato ma la UI non cambia. Tipico con `setTimeout`/`setInterval`/`requestAnimationFrame`, Promise raw, WebSocket, callback di librerie terze.

```javascript
// SBAGLIATO — push fuori dal ciclo, niente redraw
socket.onmessage = function(ev) { Chat.messages.push(JSON.parse(ev.data)) }
```

```javascript
// GIUSTO — redraw esplicito dopo l'update
socket.onmessage = function(ev) {
	Chat.messages.push(JSON.parse(ev.data))
	m.redraw()
}
```

**Sottigliezza (debounce + loading):** dentro un `setTimeout` lo stato `loading = true` **non** si vede finché qualcosa non ridisegna. `m.request` fa auto-redraw **al completamento** (quindi i risultati appaiono), ma per mostrare il loading *durante* l'attesa serve un `m.redraw()` esplicito subito dopo aver settato `loading`:

```javascript
clearTimeout(timer)
timer = setTimeout(function() {
	state.loading = true
	m.redraw()                                   // mostra il loading ORA (siamo nel timer)
	m.request({url: "/api/search", params: {q: state.q}})
		.then(function(res) { state.results = res; state.loading = false })
	// niente m.redraw() qui: m.request ridisegna da solo al completamento
}, 300)
```

**Perché:** l'auto-redraw è un side effect del completamento di (1) un event handler dichiarato in una view Mithril, (2) una `m.request`, (3) un cambio rotta — e solo se hai bootstrappato con `m.mount`/`m.route` (non `m.render`). Tutto il resto richiede `m.redraw()`. Mai chiamarlo dentro `view()`. → Dettaglio: [rendering-redraw.md](rendering-redraw.md).

---

## 5. Risposte stale nelle ricerche con debounce

**Sintomo:** digitando veloce, i risultati mostrati sono quelli di una query precedente più lenta che è tornata dopo l'ultima.

```javascript
// GIUSTO — scarta le risposte non più attuali
state.q = e.target.value
var q = state.q
m.request({url: "/api/search", params: {q: q}}).then(function(res) {
	if (q !== state.q) return        // arrivata tardi: la query è cambiata, ignora
	state.results = res
})
```

**Perché:** le richieste possono completarsi in ordine diverso da quello di partenza. Confronta la query "catturata" con quella corrente (o usa un contatore di sequenza) e scarta i risultati obsoleti. → Dettaglio: [request.md](request.md).

---

## 6. Classici a colpo sicuro

Trappole brevi, già coperte in dettaglio nei rispettivi reference:

- **Hook per riferimento, non chiamata:** `oninit: Model.load` ✅ — `oninit: Model.load()` ❌ (esegue subito alla valutazione del modulo). → [lifecycle-keys.md](lifecycle-keys.md)
- **`style` come oggetto, non stringa:** la stringa sovrascrive tutti gli inline style a ogni redraw; l'oggetto permette il diff regola-per-regola. → [hyperscript-vnodes.md](hyperscript-vnodes.md)
- **Statico nel selettore, dinamico in `attrs`:** `class` selettore+attrs fa **merge**, ogni altro attributo in `attrs` **sovrascrive** il selettore. → [hyperscript-vnodes.md](hyperscript-vnodes.md)
- **`m.trust` mai su input utente** non sanitizzato (XSS); ricorda che `<script>` iniettato via innerHTML resta inerte. → [hyperscript-vnodes.md](hyperscript-vnodes.md)
- **`m.request` ritorna una Promise, non i dati:** usa `.then`, e nei metodi del model **ritorna** la Promise per concatenare. → [request.md](request.md)
- **`m.route.set`/`m.route.Link` senza prefix** (`#!`), e `disabled:true` (non `preventDefault`) per bloccare un Link. → [routing.md](routing.md)
- **`m.mount` vs `m.render`:** `m.redraw()` funziona solo con `m.mount`/`m.route`; `m.render` non ridisegna da solo. → [rendering-redraw.md](rendering-redraw.md)
- **Componenti/vnode mai creati o riusati fuori dalla view:** immutabili e confrontati per `===` → il diff li salta. → [hyperscript-vnodes.md](hyperscript-vnodes.md)

## Checklist esperto

- [ ] Inoltro attrs a un figlio? → `m.censor(vnode.attrs)`.
- [ ] Liste con identità? → `key: entity.id`, mai l'indice; `filter` prima di `map`; tutti keyed o tutti unkeyed.
- [ ] Animazione di uscita? → `onbeforeremove` che **ritorna** una Promise risolta su `animationend`/`transitionend`, con fallback timeout.
- [ ] Stato mutato fuori da event handler/`m.request`/route? → `m.redraw()` (mai dentro `view`).
- [ ] Loading durante un'attesa avviata in un timer? → `m.redraw()` dopo aver settato `loading`.
- [ ] Ricerca/fetch concorrenti? → scarta le risposte stale.
