# Mithril.js 2.3.6 — Componenti

Riferimento completo sui componenti Mithril: strutture (POJO / closure / class), `view`, attrs e children, gestione dello stato, attributi speciali, anti-pattern. Tutto estratto da `docs/components.md`.

## Indice

- [1. Struttura e definizione](#1-struttura-e-definizione)
- [2. Lifecycle methods nei componenti](#2-lifecycle-methods-nei-componenti)
- [3. Passaggio dati: attrs e children](#3-passaggio-dati-attrs-e-children)
- [4. Stato del componente](#4-stato-del-componente)
  - [4.1 Closure component (raccomandato)](#41-closure-component-raccomandato)
  - [4.2 POJO component state](#42-pojo-component-state)
  - [4.3 Class component state](#43-class-component-state)
- [5. Mixing dei tipi di componente](#5-mixing-dei-tipi-di-componente)
- [6. Attributi speciali (reserved keys)](#6-attributi-speciali-reserved-keys)
- [7. Anti-pattern](#7-anti-pattern)
- [8. Differenze con React/Vue](#8-differenze-con-reactvue)
- [Checklist esperto](#checklist-esperto)

---

## 1. Struttura e definizione

Un componente Mithril è **qualsiasi oggetto JavaScript che possiede un metodo `view`**. Non esiste una classe base obbligatoria, né un decoratore, né registrazione globale. Il componente viene consumato passandolo come primo argomento a `m()`.

```javascript
// Definizione (POJO)
var Example = {
	view: function(vnode) {
		return m("div", "Hello")
	}
}

// Consumo: il componente è il "tag" del vnode
m(Example)

// HTML equivalente: <div>Hello</div>
```

Firma del metodo `view`:

```
view(vnode) -> vnode | array | string | number | boolean | null | undefined
```

`view` è **obbligatorio** in tutti e tre i tipi di componente:
- **POJO**: l'oggetto deve avere una proprietà `view` (funzione).
- **Closure**: la funzione esterna deve **ritornare** un oggetto con `view`.
- **Class**: la classe deve definire `view()` sul prototype (rilevato via `.prototype.view`).

Esistono tre forme sintattiche, semanticamente intercambiabili lato consumo (`m(Component, attrs, children)`):

| Forma | Cos'è | Stato vive in |
|---|---|---|
| POJO | oggetto literal con `view` | `vnode.state` / `this` (prototipo dell'istanza) |
| Closure | funzione che ritorna un POJO | variabili della closure |
| Class | classe ES6 con `view()` | proprietà di istanza (`this`) |

**Gotcha — POJO come prototipo condiviso.** Per i componenti POJO, l'oggetto che definisci è usato internamente da Mithril come **prototype** di ogni istanza. Quindi una proprietà definita direttamente sull'oggetto componente (es. `data: "..."`) è un valore *condiviso/di blueprint* via catena del prototipo, non una proprietà per-istanza finché non la riassegni su `vnode.state`. Mutare un oggetto/array definito sul blueprint lo muta per TUTTE le istanze. Questo è uno dei motivi principali per preferire i closure component.

---

## 2. Lifecycle methods nei componenti

I componenti accettano gli stessi lifecycle method dei vnode DOM. `vnode` è passato come argomento a ogni hook **e** a `view`. Solo `onbeforeupdate` riceve anche il vnode *precedente* come secondo argomento.

```javascript
var ComponentWithHooks = {
	oninit: function(vnode) {
		console.log("initialized")
	},
	oncreate: function(vnode) {
		console.log("DOM created")          // vnode.dom disponibile
	},
	onbeforeupdate: function(newVnode, oldVnode) {
		return true                          // false => salta diff del sottoalbero
	},
	onupdate: function(vnode) {
		console.log("DOM updated")
	},
	onbeforeremove: function(vnode) {
		// exit animation: ritorna una Promise per ritardare la rimozione
		return new Promise(function(resolve) { resolve() })
	},
	onremove: function(vnode) {
		console.log("removing DOM element")
	},
	view: function(vnode) {
		return "hello"
	}
}
```

Firme dei lifecycle:

```
oninit(vnode)
oncreate(vnode)
onbeforeupdate(vnode, old) -> boolean
onupdate(vnode)
onbeforeremove(vnode) -> Promise | undefined
onremove(vnode)
```

**Hook anche dal vnode di consumo.** Si possono passare lifecycle method nell'`attrs` al momento del consumo. Essi **non** sovrascrivono quelli del componente, né viceversa:

```javascript
function initialize(vnode) { console.log("initialized as vnode") }

m(ComponentWithHooks, {oninit: initialize})
```

Ordine garantito: **il lifecycle del componente gira sempre DOPO quello del vnode** corrispondente.

**Gotcha — collisione di nomi.** Poiché i nomi dei lifecycle possono comparire sia nell'oggetto componente sia in `attrs`, NON usare `oninit`, `oncreate`, `onupdate`, ecc. come nomi di tue callback applicative passate in `attrs`: verrebbero invocate da Mithril stesso come lifecycle. Vedi [§6](#6-attributi-speciali-reserved-keys).

---

## 3. Passaggio dati: attrs e children

I dati si passano come secondo argomento di `m()` (l'oggetto `attrs`); i figli come terzo argomento (o successivi).

```javascript
m(Example, {name: "Floyd"})                    // attrs
m(Example, {name: "Floyd"}, "child text")      // attrs + children
```

Accesso interno via `vnode.attrs` e `vnode.children`:

```javascript
var Example = {
	view: function (vnode) {
		return m("div", "Hello, " + vnode.attrs.name)
	}
}
```

- `vnode.attrs` — oggetto delle proprietà passate (o `{}` se omesso).
- `vnode.children` — array dei figli passati.

**Gotcha — i lifecycle stanno dentro `attrs`.** Come nota la doc: i lifecycle method possono essere definiti nell'oggetto `attrs`, quindi evita i loro nomi per le tue callback a meno che tu non li voglia esattamente come lifecycle.

**Gotcha — non c'è auto-redraw sui cambi di attrs interni.** Cambiare `vnode.attrs` da dentro il componente non ha senso (sono input dall'alto); il redraw e il passaggio di nuovi attrs vengono dal genitore.

---

## 4. Stato del componente

**Punto cruciale (differenza fondamentale con React/Vue):** in Mithril, **mutare lo stato del componente NON innesca un redraw**. Il redraw automatico avviene solo:

- quando scatta un event handler agganciato da Mithril (es. `onclick` su un vnode),
- quando una richiesta `m.request` si completa,
- quando il router naviga verso una rotta diversa.

Per un cambiamento fuori da questi casi (es. dentro un `setTimeout`, una callback di libreria terza, un `addEventListener` manuale) devi chiamare **`m.redraw()`** manualmente.

```javascript
setTimeout(function() {
	state.value = "updated"
	m.redraw()   // necessario: nessun auto-redraw qui
}, 1000)
```

Lo stato del componente esiste come comodità: non è un sistema reattivo.

### 4.1 Closure component (raccomandato)

Un **closure component** è una funzione che riceve il primo vnode e **ritorna** un POJO component. Lo stato vive nelle variabili della closure: unico per istanza, niente `this`.

```javascript
function ComponentWithState(initialVnode) {
	// Variabile di stato, unica per istanza
	var count = 0

	// Ritorna un'istanza POJO (oggetto con `view`)
	return {
		oninit: function(vnode) {
			console.log("init a closure component")
		},
		view: function(vnode) {
			return m("div",
				m("p", "Count: " + count),
				m("button", {
					onclick: function() {
						count += 1            // mutazione locale; redraw automatico (event handler)
					}
				}, "Increment count")
			)
		}
	}
}
```

Le funzioni dichiarate nella closure accedono allo stato senza binding:

```javascript
function ComponentWithState(initialVnode) {
	var count = 0

	function increment() { count += 1 }
	function decrement() { count -= 1 }

	return {
		view: function(vnode) {
			return m("div",
				m("p", "Count: " + count),
				m("button", {onclick: increment}, "Increment"),
				m("button", {onclick: decrement}, "Decrement")
			)
		}
	}
}
```

Consumo identico ai POJO: `m(ComponentWithState, {passedData: ...})`.

Vantaggio chiave: **`this` non viene mai usato** → nessuna ambiguità di contesto, nessun `.bind`, nessuna arrow-function obbligatoria per gli handler.

**Gotcha — `attrs` freschi a ogni redraw.** Lo `vnode` del primo argomento della closure è quello di *init*; per leggere gli attrs *aggiornati* a ogni render, usa il `vnode` passato a `view`/agli hook (`view: function(vnode) { ... vnode.attrs ... }`), non l'`initialVnode` catturato. Catturare `initialVnode.attrs` in una variabile congela i valori iniziali.

### 4.2 POJO component state

Sconsigliato rispetto al closure. Lo stato è accessibile in tre modi:

**(a) Blueprint all'inizializzazione** — proprietà definite sull'oggetto componente diventano proprietà di `vnode.state` via prototipo:

```javascript
var ComponentWithInitialState = {
	data: "Initial content",
	view: function(vnode) {
		return m("div", vnode.state.data)
	}
}

m(ComponentWithInitialState)   // <div>Initial content</div>
```

**(b) Via `vnode.state`** — disponibile in tutti i lifecycle e in `view`:

```javascript
var ComponentWithDynamicState = {
	oninit: function(vnode) {
		vnode.state.data = vnode.attrs.text
	},
	view: function(vnode) {
		return m("div", vnode.state.data)
	}
}

m(ComponentWithDynamicState, {text: "Hello"})   // <div>Hello</div>
```

**(c) Via `this`** — `this` === istanza del componente in tutti i lifecycle e in `view`:

```javascript
var ComponentUsingThis = {
	oninit: function(vnode) {
		this.data = vnode.attrs.text
	},
	view: function(vnode) {
		return m("div", this.data)
	}
}

m(ComponentUsingThis, {text: "Hello"})   // <div>Hello</div>
```

**Gotcha — `this` nelle funzioni annidate ES5.** In una funzione anonima annidata (es. un `onclick: function() {...}`), `this` **NON** è l'istanza del componente. Soluzioni raccomandate dalla doc: usare **arrow function** (eredita il `this` lessicale) oppure riferirsi a **`vnode.state`** (che è stabile e sempre l'istanza).

### 4.3 Class component state

Le classi gestiscono lo stato con proprietà/metodi d'istanza, accessibili via `this`. La classe deve definire `view()` (rilevato via `.prototype.view`); il `constructor` riceve il vnode.

```javascript
class ClassComponent {
	constructor(vnode) {
		this.kind = "class component"
	}
	view() {
		return m("div", `Hello from a ${this.kind}`)
	}
	oncreate() {
		console.log(`A ${this.kind} was created`)
	}
}
```

Consumo identico alle altre forme:

```javascript
m.render(document.body, m(ClassComponent))
m.mount(document.body, ClassComponent)
m.route(document.body, "/", { "/": ClassComponent })

class AnotherClassComponent {
	view() {
		return m("main", [ m(ClassComponent) ])
	}
}
```

Stato con contatore:

```javascript
class ComponentWithState {
	constructor(vnode) { this.count = 0 }
	increment() { this.count += 1 }
	decrement() { this.count -= 1 }
	view() {
		return m("div",
			m("p", "Count: ", this.count),
			m("button", {onclick: () => { this.increment() }}, "Increment"),
			m("button", {onclick: () => { this.decrement() }}, "Decrement")
		)
	}
}
```

**Gotcha — arrow obbligatorie negli handler.** Negli event handler di una class component **devi** usare arrow function (`() => this.increment()`) per preservare `this`. Una `function(){}` perderebbe il contesto.

---

## 5. Mixing dei tipi di componente

I tipi possono essere mescolati liberamente: una class component può avere figli closure o POJO, e viceversa. Non c'è incompatibilità tra le forme nella composizione.

```javascript
class Parent {
	view() {
		return m("main", [
			m(ClosureChild),
			m(PojoChild, {label: "x"})
		])
	}
}
```

---

## 6. Attributi speciali (reserved keys)

Mithril assegna semantica speciale ad alcune chiavi; evitale negli attrs applicativi normali:

- **Lifecycle**: `oninit`, `oncreate`, `onbeforeupdate`, `onupdate`, `onbeforeremove`, `onremove` — invocati come hook.
- **`key`** — usata per tracciare l'identità nei keyed fragment.
- **`tag`** — usata internamente per distinguere i vnode dagli oggetti `attrs` e da altri oggetti non-vnode.

**Gotcha — `key` e fragment misti.** Aggiungere `key` rende il vnode "keyed"; un fragment non può avere mix di elementi keyed e unkeyed → Mithril lancia un errore già nella factory dei vnode (vedi anti-pattern §7.2).

---

## 7. Anti-pattern

### 7.1 Evita i "fat component"

Un fat component è un componente con **metodi/stato d'istanza custom** (funzioni attaccate a `vnode.state` o `this`). Sposta logica e stato nel data layer: più riusabile, più facile da refactorare, condivisibile tra componenti.

```javascript
// AVOID — stato e logica incapsulati nel componente
var Login = {
	username: "",
	password: "",
	setUsername: function(value) { this.username = value },
	setPassword: function(value) { this.password = value },
	canSubmit: function() { return this.username !== "" && this.password !== "" },
	login: function() { /*...*/ },
	view: function() {
		return m(".login", [
			m("input[type=text]", {
				oninput: function (e) { this.setUsername(e.target.value) },   // `this` rotto qui!
				value: this.username,
			}),
			/* ... */
		])
	}
}
```

```javascript
// PREFER — stato nel data layer (models/Auth.js)
var Auth = {
	username: "",
	password: "",
	setUsername: function(value) { Auth.username = value },
	setPassword: function(value) { Auth.password = value },
	canSubmit: function() { return Auth.username !== "" && Auth.password !== "" },
	login: function() { /*...*/ },
}
module.exports = Auth
```

```javascript
// views/Login.js — componente snello
var Auth = require("../models/Auth")

var Login = {
	view: function() {
		return m(".login", [
			m("input[type=text]", {
				oninput: function (e) { Auth.setUsername(e.target.value) },
				value: Auth.username
			}),
			m("input[type=password]", {
				oninput: function (e) { Auth.setPassword(e.target.value) },
				value: Auth.password
			}),
			m("button", {disabled: !Auth.canSubmit(), onclick: Auth.login}, "Login")
		])
	}
}
```

Bonus: niente `.bind`, niente problemi di `this`, stato condivisibile (es. prepopolare l'email passando a Register/PasswordRecovery).

### 7.2 Non inoltrare `vnode.attrs` direttamente ad altri vnode

> **Trappola più dimenticata** — è il gotcha che si salta più spesso quando si scrive un componente wrapper "che inoltra gli attributi". Tienilo in cima alla checklist quando un componente ripassa `vnode.attrs` al proprio elemento radice.

Inoltrare l'intero `vnode.attrs` a un elemento/figlio fa "filtrare" i lifecycle del componente sul figlio e, se l'elemento è dentro un fragment, può iniettare una `key` causando l'errore di **chiavi miste**.

**Sintomo concreto:** **tutti** i lifecycle hook presenti negli attrs vengono eseguiti **due volte** — non solo `onupdate`, ma anche `oninit`, `oncreate`, `onbeforeupdate`, `onbeforeremove`, `onremove` — perché vengono interpretati una volta sul componente e una seconda volta sull'elemento a cui li hai inoltrati. In più la `key` ricevuta dall'esterno finisce sull'elemento figlio invece che sul componente, spostando la reconciliation sul nodo sbagliato.

```javascript
// AVOID
var Modal = {
	view: function(vnode) {
		return m(".modal[tabindex=-1][role=dialog]", vnode.attrs, [ /* ... */ ])
		//                            forwarding ^ qui: lifecycle e key passano oltre
	}
}
```

Soluzione: **`m.censor(vnode.attrs)`** rimuove lifecycle method e `key`/`tag` problematici prima dell'inoltro (vedi `censor.md`).

```javascript
// PREFER
var Modal = {
	view: function(vnode) {
		return m(".modal[tabindex=-1][role=dialog]", m.censor(vnode.attrs), [ /* ... */ ])
	}
}
```

In alternativa, usa un singolo attributo dedicato e inoltra quello:

```javascript
// PREFER — attributo namespaced
var Modal = {
	view: function(vnode) {
		return m(".modal[tabindex=-1][role=dialog]", vnode.attrs.attrs, [ /* ... */ ])
	}
}

m(Modal, {
	attrs: {
		onupdate: function(vnode) { if (toggle) $(vnode.dom).modal("toggle") }   // invocato una volta sola
	}
})
```

### 7.3 Non manipolare `children` posizionalmente

Non fare destructuring di `vnode.children[0]`, `[1]`, ecc. per dare ruoli ai figli: rompe l'assunzione che i figli vengano emessi nello stesso formato contiguo in cui arrivano, ed è incomprensibile senza leggere l'implementazione.

```javascript
// AVOID
var Header = {
	view: function(vnode) {
		return m(".section", [
			m(".header", vnode.children[0]),
			m(".tagline", vnode.children[1]),
		])
	}
}
```

```javascript
// PREFER — attrs come parametri nominali; children riservato a contenuto uniforme
var BetterHeader = {
	view: function(vnode) {
		return m(".section", [
			m(".header", vnode.attrs.title),
			m(".tagline", vnode.attrs.tagline),
		])
	}
}

m(BetterHeader, {
	title: m("h1", "My title"),
	tagline: m("h2", "Lorem ipsum"),
})
```

### 7.4 Definisci i componenti staticamente, chiamali dinamicamente

**(a) Non creare definizioni di componente dentro `view`.** Una factory chiamata nel render produce a ogni redraw un clone diverso; il diff confronta i componenti per **uguaglianza stretta (`===`)** → componente sempre ricreato da zero.

```javascript
// AVOID — nuova definizione a ogni chiamata
var ComponentFactory = function(greeting) {
	return { view: function() { return m("div", greeting) } }
}
m.render(document.body, m(ComponentFactory("hello")))
m.render(document.body, m(ComponentFactory("hello")))   // ricrea il div da zero

// PREFER — definizione statica, dati via attrs
var Component = {
	view: function(vnode) { return m("div", vnode.attrs.greeting) }
}
m.render(document.body, m(Component, {greeting: "hello"}))
m.render(document.body, m(Component, {greeting: "hello"}))   // nessuna modifica al DOM
```

**(b) Non creare istanze di componente fuori da `view`.** Un vnode-componente creato una volta e riusato condivide il riferimento: il render fa equality check e **salta il diff** → la view non si aggiorna mai.

```javascript
// AVOID
var Counter = {
	count: 0,
	view: function(vnode) {
		return m("div",
			m("p", "Count: " + vnode.state.count),
			m("button", {onclick: function() { vnode.state.count++ }}, "Increase count")
		)
	}
}

var counter = m(Counter)   // istanza creata UNA volta, fuori dalla view

m.mount(document.body, {
	view: function(vnode) {
		return [ m("h1", "My app"), counter ]   // stesso riferimento => diff saltato
	}
})
```

```javascript
// PREFER — chiama il componente DENTRO la view: nuovo vnode a ogni render
m.mount(document.body, {
	view: function(vnode) {
		return [ m("h1", "My app"), m(Counter) ]
	}
})
```

---

## 8. Differenze con React/Vue

- **Nessun re-render su `setState`.** Mutare lo stato non innesca redraw; serve un trigger (event handler di Mithril, `m.request`, route change) o `m.redraw()` esplicito. In React `setState` schedula sempre un render.
- **Nessun hook system / nessun `useState`.** Lo stato per-istanza idiomatico è la closure (variabili catturate), non hook con regole di chiamata.
- **`view` riceve `vnode`, non props/state separati.** Tutto passa da `vnode.attrs` (props) e `vnode.children`.
- **Componente = chiave d'identità per riferimento.** Come in React l'identità per il diff dipende dal riferimento al tipo di componente: definirlo inline lo ricrea. Ma in Mithril non esiste `React.memo`/`shouldComponentUpdate` con shallow-compare automatico delle props; usa `onbeforeupdate` per cortocircuitare.
- **`children` non si manipola posizionalmente** (niente equivalente di `React.Children.map` idiomatico): usa attrs nominali.

---

## Checklist esperto

1. **Default = closure component** per qualsiasi componente con stato locale: niente `this`, niente `.bind`, stato isolato per istanza nelle variabili della closure.
2. **Leggi sempre `vnode.attrs` dal `vnode` passato a `view`/agli hook**, mai dall'`initialVnode` catturato in una closure (i valori si congelerebbero).
3. **Ricorda che non c'è auto-redraw**: dopo mutazioni in `setTimeout`/callback di terze parti/`addEventListener` manuali chiama `m.redraw()`.
4. **Chiama i componenti dentro `view` con `m(Comp, attrs)`**; non creare definizioni o istanze fuori dalla view (diff saltato o ricreazione da zero).
5. **Sposta stato e logica condivisibile nel data layer** (modello/modulo); evita fat component con metodi su `vnode.state`/`this`.
6. **Per inoltrare attrs a figli/elementi usa `m.censor(vnode.attrs)`** o un attributo namespaced (`attrs.attrs`); mai inoltrare `vnode.attrs` grezzo (lifecycle doppi, `key` su fragment).
7. **Non dare ruoli posizionali ai `children`**: usa attrs nominali (`title`, `tagline`, ...) e riserva `children` a contenuto uniforme.
8. **Evita le reserved key** (`oninit`/`oncreate`/`onbeforeupdate`/`onupdate`/`onbeforeremove`/`onremove`, `key`, `tag`) come nomi di callback applicative negli `attrs`.
