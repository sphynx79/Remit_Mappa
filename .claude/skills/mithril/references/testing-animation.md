# Mithril.js 2.3.6 — Testing e Animazioni

Riferimento per sviluppatori esperti. Tutto il contenuto è derivato dai file ufficiali `docs/testing.md` e `docs/animation.md`. Le note "Gotcha" segnalano dove il sorgente è esplicito e dove invece si tratta di una conseguenza diretta delle API documentate.

## Indice

- [Testing — Stack e setup](#testing--stack-e-setup)
  - [Componenti dello stack](#componenti-dello-stack)
  - [Setup jsdom + ospec](#setup-jsdom--ospec)
  - [I globals richiesti da Mithril](#i-globals-richiesti-da-mithril)
- [Testing — ospec](#testing--ospec)
  - [API minima di ospec](#api-minima-di-ospec)
- [Testing — mithril-query (mq)](#testing--mithril-query-mq)
  - [Firma e valore di ritorno](#firma-e-valore-di-ritorno)
  - [Unit testing di componenti](#unit-testing-di-componenti)
- [Testing — Best practices](#testing--best-practices)
- [Animazioni — Scelte tecnologiche](#animazioni--scelte-tecnologiche)
- [Animazioni — Creazione elemento (enter)](#animazioni--creazione-elemento-enter)
- [Animazioni — Rimozione elemento (exit) con onbeforeremove](#animazioni--rimozione-elemento-exit-con-onbeforeremove)
  - [Il gotcha del parentNode](#il-gotcha-del-parentnode)
- [Animazioni — requestAnimationFrame e oncreate](#animazioni--requestanimationframe-e-oncreate)
- [Animazioni — Performance](#animazioni--performance)
- [Checklist esperto](#checklist-esperto)

---

## Testing — Stack e setup

### Componenti dello stack

Lo stack di testing raccomandato ufficialmente per Mithril.js è composto da tre pezzi, tutti dev-dependency:

```bash
npm install --save-dev ospec mithril-query jsdom
```

- **ospec** — test runner/assertion library della famiglia MithrilJS. È il runner usato dagli esempi ufficiali (eseguibile `ospec`).
- **mithril-query** (`mq`) — utility per renderizzare un componente in memoria e fare asserzioni sull'output virtuale.
- **jsdom** — implementazione DOM in Node, necessaria perché Mithril ha bisogno di `window`/`document` per operare.

> **Gotcha:** il sorgente parla di `ospec` e `mithril-query`, NON di un pacchetto `mithril/test-utils`. In Mithril 2.x non esiste un modulo `mithril/test-utils` con `mq` integrato: `mq` è il pacchetto esterno `mithril-query`. Non importare da `mithril/test-utils`.

### Setup jsdom + ospec

`package.json` — registra ospec come comando di test e carica un file di setup prima della suite:

```json
{
	"name": "my-project",
	"scripts": {
		"test": "ospec --require ./test-setup.js"
	}
}
```

`test-setup.js` — crea l'ambiente DOM e popola i globals:

```javascript
var o = require("ospec")
var jsdom = require("jsdom")
var dom = new jsdom.JSDOM("", {
	// Necessario per ottenere `requestAnimationFrame`
	pretendToBeVisual: true,
})

// Riempi i globals di cui Mithril.js ha bisogno per operare.
// I primi due sono spesso utili anche direttamente nei test.
global.window = dom.window
global.document = dom.window.document
global.requestAnimationFrame = dom.window.requestAnimationFrame

// Richiedi Mithril.js per assicurarti che si carichi correttamente.
require("mithril")

// Assicura che JSDOM si chiuda alla fine dei test.
o.after(function() {
	dom.window.close()
})
```

### I globals richiesti da Mithril

Punti non ovvi, tutti presenti nel setup ufficiale:

- **`pretendToBeVisual: true`** è obbligatorio per avere `requestAnimationFrame` su `dom.window`. Senza, `dom.window.requestAnimationFrame` è `undefined` e qualsiasi codice di animazione/redraw che dipende da rAF si rompe in test.
- **`global.requestAnimationFrame`** va assegnato esplicitamente: Mithril usa rAF internamente per lo scheduling del redraw, quindi va esposto come globale (non basta averlo su `window` in Node).
- **`require("mithril")` dopo** aver impostato i globals: l'ordine conta. Mithril cattura riferimenti all'ambiente DOM all'import; impostare i globals prima del `require` garantisce che si agganci al jsdom appena creato.
- **`o.after(() => dom.window.close())`** chiude jsdom a fine suite per non lasciare handle aperti.

> **Gotcha (ordine):** se inverti `require("mithril")` e l'assegnazione dei globals, rischi che Mithril non trovi `window`/`document`. Imposta SEMPRE i globals prima.

> **Gotcha (vs React):** non esiste un equivalente di `act()` o di un cleanup automatico tra test come in React Testing Library. Con `mithril-query` ogni `mq(...)` produce un'istanza isolata; con `m.render`/`m.mount` su jsdom devi gestire tu lo stato del DOM tra i test.

---

## Testing — ospec

### API minima di ospec

ospec è volutamente minimale. Gli elementi usati negli esempi ufficiali:

- **`o.spec(nome, fn)`** — raggruppa test (suite/blocco descrittivo).
- **`o(nome, fn)`** — definisce un singolo test.
- **`o(valore).equals(atteso)`** — asserzione di uguaglianza (`===`).
- **`o.after(fn)`** — hook eseguito dopo (usato per teardown, es. chiusura jsdom).

Esempio di unit test puro (nessun componente):

```javascript
o.spec("addition", function() {
	o("works with integers", function() {
		o(1 + 2).equals(3)
	})

	o("works with floats", function() {
		// Sì, grazie IEEE-754 floating point per essere strano.
		o(0.1 + 0.2).equals(0.30000000000000004)
	})
})
```

> **Gotcha:** `o(x).equals(y)` usa uguaglianza stretta. Per oggetti/array serve confronto deep (ospec espone `o(a).deepEquals(b)` nella sua API, ma negli esempi del doc Mithril compare solo `.equals`). Attieniti a `.equals` per primitivi.

> **Gotcha (filosofia):** "tests are specifications, not normal code". ospec è scelto anche perché spinge a test piatti e leggibili. Non astrarre prematuramente: la duplicazione nei test è feature, non bug (vedi Best practices).

---

## Testing — mithril-query (mq)

### Firma e valore di ritorno

`mithril-query` esporta una funzione, convenzionalmente assegnata a `mq`:

```javascript
var mq = require("mithril-query")
```

**Firma usata nel doc ufficiale:**

```
mq(Component)                  // monta il componente senza attrs
mq(Component, attrs)           // monta il componente passando `attrs`
```

- `Component` — un componente Mithril (oggetto con `view`, o factory che ritorna tale oggetto).
- `attrs` — oggetto che diventa `vnode.attrs` dentro il `view` del componente.
- **Valore di ritorno** (`out`) — un oggetto di rendering con metodi di asserzione/interrogazione. Negli esempi ufficiali si usa `out.should.contain(testo)` per asserire che l'output renderizzato contenga una certa stringa.

```javascript
var out = mq(MyComponent, {text: "What a wonderful day to be alive!"})
out.should.contain("day")
```

> **Gotcha:** gli `attrs` passati come secondo argomento finiscono in `vnode.attrs`, non come children. Se il componente legge `vnode.attrs.text`, passa `{text: "..."}`.

### Unit testing di componenti

Componente sotto test:

```javascript
// MyComponent.js
var m = require("mithril")

function MyComponent() {
	return {
		view: function(vnode) {
			return m("div", [
				vnode.attrs.type === "goodbye"
					? "Goodbye, world!"
					: "Hello, world!"
			])
		}
	}
}

module.exports = MyComponent
```

Suite che copre i rami logici (input → output):

```javascript
var mq = require("mithril-query")
var MyComponent = require("./MyComponent")

o.spec("MyComponent", function() {
	o("says 'Hello, world!' when `type` is `hello`", function() {
		var out = mq(MyComponent, {type: "hello"})
		out.should.contain("Hello, world!")
	})

	o("says 'Goodbye, world!' when `type` is `goodbye`", function() {
		var out = mq(MyComponent, {type: "goodbye"})
		out.should.contain("Goodbye, world!")
	})

	o("says 'Hello, world!' when no `type` is given", function() {
		var out = mq(MyComponent)
		out.should.contain("Hello, world!")
	})
})
```

Pattern di ogni test: **set up state → run code → check results**.

> **Gotcha (closure component):** `MyComponent` è una factory (closure component). `mq` la istanzia correttamente perché Mithril chiama la factory e ne usa il `view`. Funziona sia con POJO component (`{view}`) sia con factory (`function(){ return {view} }`).

> **Gotcha (cosa testare):** il doc è esplicito — testa l'output/comportamento (es. il testo renderizzato, l'emissione di un evento), NON l'intera struttura DOM. Asserire su `out.should.contain("testo")` è resistente a refactor di markup; asserire sull'albero DOM completo ti costringe a riscrivere i test per ogni classe aggiunta.

> **Nota su route/request mock:** il doc di testing non fornisce un'API specifica per mockare `m.route` o `m.request`. La via supportata è l'isolamento via unit test: estrai la logica che dipende da `m.request` in funzioni iniettabili, e testa il componente con dati già forniti via `attrs`. Non inventare helper di mock non documentati.

---

## Testing — Best practices

Dal doc ufficiale, tre principi azionabili:

1. **Scrivi i test il prima possibile.** Idealmente man mano che scrivi il codice. Costo di 5 minuti ora vs giorni di debug a 6 mesi di distanza.

2. **Testa l'API e il comportamento, non l'implementazione.** Va benissimo verificare che un evento venga emesso a fronte di un'azione. NON testare l'intera struttura DOM: aggiungere una classe stilistica o un metodo d'istanza non deve costringerti a riscrivere 5 test.

3. **Non temere la ripetizione.** Astrai solo quando ripeti la stessa cosa decine/centinaia di volte nello stesso file, o quando generi test programmaticamente. Nel codice normale si astrae dopo 2-3 ripetizioni; nei test la ridondanza dà contesto in fase di troubleshooting. **Tests are specifications, not normal code.**

---

## Animazioni — Scelte tecnologiche

Mithril.js **non fornisce API di animazione proprie**: le alternative (CSS animations, librerie JS come GSAP/Velocity, Web Animations API + polyfill) sono più che sufficienti. Mithril offre però **hook** per i casi tradizionalmente difficili — in particolare l'animazione di uscita, dove l'elemento deve restare nel DOM finché l'animazione non finisce.

Le due leve principali:

- **`oncreate`** — per agganciare animazioni JS / leggere il DOM dopo l'inserimento.
- **`onbeforeremove`** — per ritardare la rimozione di un elemento finché un'animazione di uscita non è completa.

---

## Animazioni — Creazione elemento (enter)

L'animazione in ingresso non richiede alcun hook: basta una classe CSS con `animation`. Quando Mithril inserisce l'elemento nel DOM, l'animazione parte da sola.

```css
.fancy {animation:fade-in 0.5s;}
@keyframes fade-in {
	from {opacity:0;}
	to {opacity:1;}
}
```

```javascript
var FancyComponent = {
	view: function() {
		return m(".fancy", "Hello world")
	}
}

m.mount(document.body, FancyComponent)
```

> **Gotcha:** per l'enter NON serve `oncreate`. È sufficiente che la classe con `animation` sia presente al primo render. Usa `oncreate` solo se devi pilotare l'animazione via JS o leggere misure dal DOM reale.

---

## Animazioni — Rimozione elemento (exit) con onbeforeremove

Il problema dell'exit: devi aspettare la fine dell'animazione **prima** di rimuovere l'elemento. La soluzione è l'hook `onbeforeremove`, che permette di **differire** la rimozione restituendo una `Promise`.

CSS dell'animazione di uscita:

```css
.exit {animation:fade-out 0.5s;}
@keyframes fade-out {
	from {opacity:1;}
	to {opacity:0;}
}
```

Componente contenitore che mostra/nasconde il figlio:

```javascript
var on = true

var Toggler = {
	view: function() {
		return [
			m("button", {onclick: function() {on = !on}}, "Toggle"),
			on ? m(FancyComponent) : null,
		]
	}
}
```

Componente con animazione di uscita via `onbeforeremove`:

```javascript
var FancyComponent = {
	onbeforeremove: function(vnode) {
		vnode.dom.classList.add("exit")
		return new Promise(function(resolve) {
			vnode.dom.addEventListener("animationend", resolve)
		})
	},
	view: function() {
		return m(".fancy", "Hello world")
	}
}
```

```javascript
m.mount(document.body, Toggler)
```

Meccanica esatta (dal doc):

- **`vnode.dom`** punta all'elemento DOM radice del componente (qui `<div class="fancy">`).
- Si usa `classList.add("exit")` per applicare la classe che fa partire `fade-out`.
- Si ritorna una `Promise` che **resolve** all'evento `animationend`.
- Quando `onbeforeremove` ritorna una Promise, **Mithril attende che sia risolta e solo allora rimuove l'elemento.** In questo caso attende la fine dell'animazione di uscita.

**Firma:** `onbeforeremove(vnode)` — riceve il vnode; ritorna `Promise` (per differire) oppure niente/valore non-promise (rimozione immediata).

> **Gotcha (Promise mai risolta):** se la Promise non risolve mai, l'elemento NON viene mai rimosso. Assicurati che `animationend` scatti davvero (es. che la classe `.exit` abbia un'animazione definita) o aggiungi un fallback con timeout.

> **Gotcha (`animationend` vs `transitionend`):** il doc usa `animationend` perché l'effetto è una `@keyframes animation`. Se usi `transition` invece di `animation`, l'evento corretto è `transitionend`. Allinea evento e tecnica CSS.

### Il gotcha del parentNode

Citazione testuale del comportamento, fondamentale:

> `onbeforeremove` si attiva **solo sull'elemento che perde il suo `parentNode`** quando viene staccato dal DOM.

Questo è **by design**, per evitare che ad ogni cambio di route partano tutte le possibili animazioni di uscita della pagina (UX sgradevole).

**Conseguenza pratica:** se la tua animazione di uscita non parte, attacca l'handler `onbeforeremove` **più in alto possibile nell'albero**, sull'elemento che effettivamente perde il `parentNode` quando la sottostruttura viene rimossa.

> **Gotcha (vs React/Vue):** a differenza di `<Transition>` di Vue o di librerie come Framer Motion in React, qui non c'è un wrapper che intercetta l'uscita dei figli annidati. Solo l'elemento che si stacca direttamente riceve `onbeforeremove`. I figli interni a quell'elemento NON ricevono il proprio `onbeforeremove` durante quella rimozione.

---

## Animazioni — requestAnimationFrame e oncreate

Per animazioni guidate da JS (non pure CSS), il pattern è agganciarsi a `oncreate` e usare `requestAnimationFrame`. `requestAnimationFrame` è uno dei globals che il setup di test espone (`global.requestAnimationFrame = dom.window.requestAnimationFrame`), proprio perché Mithril e il codice di animazione lo usano per sincronizzarsi col frame del browser.

Pattern tipico (basato sulle API documentate — `oncreate`, `vnode.dom`, `requestAnimationFrame`):

```javascript
var SlideIn = {
	oncreate: function(vnode) {
		// stato iniziale fuori schermo
		vnode.dom.style.transform = "translateX(100%)"
		// forza il frame successivo prima di applicare lo stato finale,
		// così la transition CSS ha un "from" e un "to" distinti
		requestAnimationFrame(function() {
			vnode.dom.style.transition = "transform 0.3s"
			vnode.dom.style.transform = "translateX(0)"
		})
	},
	view: function() {
		return m(".slide", "Contenuto")
	}
}
```

> **Gotcha (doppio rAF / reflow):** per innescare in modo affidabile una transition tra stato iniziale e finale serve separare i due stati su frame diversi (rAF) o forzare un reflow. Applicare entrambi gli stili nello stesso tick fa "saltare" l'animazione perché il browser non vede mai lo stato iniziale.

> **Gotcha (test di rAF):** in jsdom con `pretendToBeVisual: true`, `requestAnimationFrame` esiste ma lo scheduling è asincrono. Nei test, codice dipendente da rAF non è completato in modo sincrono dopo `mq(...)`/`m.redraw()`; vai gestito con attese asincrone.

---

## Animazioni — Performance

Raccomandazioni ufficiali per animazioni fluide:

- **Anima solo `opacity` e `transform`.** Sono hardware-accelerabili dai browser moderni e rendono molto meglio rispetto ad animare `top`, `left`, `width`, `height`.
- **Evita `box-shadow`** e selettori come **`:nth-child`**: sono costosi. Per animare un'ombra, metti il `box-shadow` su uno pseudo-elemento e anima l'`opacity` di quello.
- **Evita** immagini grandi o scalate dinamicamente, e la sovrapposizione di elementi con `position` diversi (es. un `absolute` sopra un `fixed`): sono costosi.

> **Gotcha:** animare `width`/`height`/`top`/`left` causa layout/reflow ad ogni frame. `transform: scale()/translate()` opera sul compositing layer e non innesca reflow — preferiscilo sempre.

---

## Checklist esperto

1. **Setup globals nell'ordine giusto:** in `test-setup.js` assegna `global.window`, `global.document`, `global.requestAnimationFrame` PRIMA di `require("mithril")`, e usa `pretendToBeVisual: true` per avere rAF.
2. **Usa `mithril-query` (`mq`), non un inesistente `mithril/test-utils`:** `mq(Component, attrs)` monta in memoria; gli `attrs` finiscono in `vnode.attrs`; asserisci con `out.should.contain(...)`.
3. **Testa comportamento e output, mai l'albero DOM completo:** asserzioni su testo/eventi sopravvivono ai refactor di markup; asserzioni sulla struttura no.
4. **Scrivi i test mentre scrivi il codice** e non temere la duplicazione nei test — sono specifiche, non codice da DRY-ficare.
5. **Enter animation = solo CSS** (`animation` su una classe presente al primo render). Riserva `oncreate`/`requestAnimationFrame` alle animazioni JS-driven, usando il doppio-rAF per separare stato iniziale e finale.
6. **Exit animation = `onbeforeremove` che ritorna una Promise** risolta su `animationend` (o `transitionend` se usi `transition`); senza resolve l'elemento non viene mai rimosso.
7. **Attacca `onbeforeremove` sull'elemento che perde il `parentNode`** (in alto nell'albero): è l'unico che riceve l'hook quando viene staccato. Se l'exit non parte, sali di livello.
8. **In animazione anima solo `opacity` e `transform`**; evita `box-shadow`, `:nth-child`, e l'animazione di proprietà di layout (`top/left/width/height`).
