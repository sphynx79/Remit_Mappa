# Mithril.js 2.3.6 — Hyperscript `m()` e Vnodes

Riferimento operativo su `m()`, struttura dei vnode, `m.fragment` e `m.trust`. Tutto estratto dai sorgenti doc ufficiali (`hyperscript.md`, `vnodes.md`, `fragment.md`, `trust.md`, `signatures.md`). Sintassi hyperscript `m()`, non JSX.

## Indice

- [1. `m()` — firma e semantica](#1-m--firma-e-semantica)
- [2. Selettori CSS](#2-selettori-css)
- [3. Attributi (secondo argomento)](#3-attributi-secondo-argomento)
- [4. DOM attributes: JS API vs setAttribute](#4-dom-attributes-js-api-vs-setattribute)
- [5. Style](#5-style)
- [6. Eventi](#6-eventi)
- [7. Properties (value, selectedIndex...)](#7-properties-value-selectedindex)
- [8. Children, splat e normalizzazione](#8-children-splat-e-normalizzazione)
- [9. Lifecycle hooks sui vnode](#9-lifecycle-hooks-sui-vnode)
- [10. Keys](#10-keys)
- [11. SVG / MathML / Xlink](#11-svg--mathml--xlink)
- [12. Struttura del vnode](#12-struttura-del-vnode)
- [13. I cinque tipi di vnode](#13-i-cinque-tipi-di-vnode)
- [14. `m.fragment()`](#14-mfragment)
- [15. `m.trust()` e XSS](#15-mtrust-e-xss)
- [16. Anti-pattern](#16-anti-pattern)
- [Checklist esperto](#checklist-esperto)

---

## 1. `m()` — firma e semantica

```
vnode = m(selector, attrs, children)
```

| Argomento  | Tipo                                  | Obbligatorio | Descrizione |
| ---------- | ------------------------------------- | ------------ | --- |
| `selector` | `String\|Object\|Function`            | Sì           | Selettore CSS o [component](components.md) |
| `attrs`    | `Object`                              | No           | HTML attributes o element properties |
| `children` | `Array<Vnode>\|String\|Number\|Boolean` | No         | Child vnodes; scrivibili come splat |
| **returns**| `Vnode`                               |              | Un vnode |

`m()` è **polimorfica** e **variadica**: accetta forme diverse di input.

```javascript
m("div")                        // <div></div>
m("a", {id: "b"})               // <a id="b"></a>
m("span", "hello")              // <span>hello</span>
m("ul", [m("li", "a"), m("li", "b")])  // children come array
m("ul", m("li", "a"), m("li", "b"))    // children come splat (array opzionale)
```

**Concetto chiave:** `m()` NON ritorna un elemento DOM. Ritorna un *vnode*, un plain object JS che descrive il DOM da creare. La trasformazione in DOM reale avviene solo tramite [`m.render()`](render.md):

```javascript
m.render(document.body, m("br")) // inserisce <br> in <body>
```

`m.render()` chiamata ripetutamente **non** ricostruisce l'albero da zero: diffa contro la versione precedente e modifica il DOM solo dove strettamente necessario (preserva focus, stato input, ecc.).

> **Gotcha (vs React):** non esiste `createElement` che produce nodi reali. Il vnode è inerte finché non lo passi a `m.render`/`m.mount`/`m.route`. Inoltre i vnode sono **immutabili per contratto**: mutare un vnode già renderizzato → undefined behavior (vedi §16).

---

## 2. Selettori CSS

Il primo argomento accetta qualsiasi combinazione valida di `#` (id), `.` (class) e `[attr]`.

```javascript
m("div#hello")                          // <div id="hello"></div>
m("section.container")                  // <section class="container"></section>
m("input[type=text][placeholder=Name]") // <input type="text" placeholder="Name">
m("a#exit.external[href='https://example.com']", "Leave")
// <a id="exit" class="external" href="https://example.com">Leave</a>
```

Se ometti il tag name, Mithril assume `div`:

```javascript
m(".box.box-bordered") // <div class="box box-bordered"></div>
```

**Best practice:** selettore per attributi **statici**, oggetto `attrs` per quelli **dinamici**.

```javascript
var currentURL = "/"
m("a.link[href=/]", { class: currentURL === "/" ? "selected" : "" }, "Home")
// <a href="/" class="link selected">Home</a>
```

> **Gotcha:** le classi del selettore e quelle dell'attributo `class` vengono **fuse** (merge), non sostituite. Vedi §3 per le regole di precedenza.

---

## 3. Attributi (secondo argomento)

Nel secondo argomento passi attributi, properties, eventi e lifecycle hook.

```javascript
m("button", {
	class: "my-button",
	onclick: function() {/* ... */},
	oncreate: function() {/* ... */}
})
```

Regole di risoluzione (esatte, da non confondere):

1. Valore `null` o `undefined` → l'attributo è trattato **come assente**.
2. `class` in selettore E in `attrs` → **merge**. Se il `class` in `attrs` è `null`/`undefined` → ignorato (la classe del selettore resta).
3. Altri attributi presenti sia nel selettore sia in `attrs` → **vince `attrs`**, *anche se* il suo valore è `null`/`undefined` (cioè può cancellare quello del selettore).

> **Gotcha:** la regola 2 (`class` → merge) e la regola 3 (altri attributi → override) sono **diverse**. `class` si somma; tutto il resto si sovrascrive. È l'errore numero uno quando si combina selettore + oggetto.

---

## 4. DOM attributes: JS API vs setAttribute

Mithril risolve gli attributi usando **sia** la JS API (`element.readOnly`) **sia** la DOM API (`setAttribute`). Quindi entrambe le grafie funzionano:

```javascript
m("input", {readonly: true}) // lowercase
m("input", {readOnly: true}) // uppercase (proprietà JS)
m("input[readonly]")
m("input[readOnly]")
```

Funziona anche con **custom elements** (es. A-Frame). Per i custom element Mithril **non auto-stringifica** le properties: puoi passare array/numeri/oggetti e finiscono sulla property così come sono.

```javascript
m("my-special-element", {
	whitelist: ["https://example.com", "https://google.com"] // resta un Array sulla property
})
```

Shorthand di id/class funzionano anche sui custom element:

```javascript
m("a-entity#player")          // equivalente a:
m("a-entity", {id: "player"})
```

> **Nota esperto:** properties con semantica magica — lifecycle (`on*` hooks), handler `onevent`, `key`, `class`, `style` — sono trattate **sempre** allo stesso modo, anche sui custom element. Non vengono passate grezze come una whitelist arbitraria.

---

## 5. Style

`style` accetta sia stringa sia oggetto:

```javascript
m("div", {style: "background:red;"})
m("div", {style: {background: "red"}})
m("div[style=background:red]")
```

- Property hyphenated (`background-color`) **e** camelCase (`backgroundColor`) sono entrambe valide.
- Supportate le [CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_variables) (se il browser le supporta).
- Mithril **non aggiunge unità** ai numeri: li stringifica e basta. `{width: 10}` → `width:10` (non `10px`).

> **Gotcha critico (perf + diff):** usare `style` come **stringa** sovrascrive *tutti* gli inline style a ogni redraw, non solo le regole cambiate. Usare l'**oggetto** permette il diff regola-per-regola. Preferire l'oggetto per stili dinamici.

---

## 6. Eventi

Binding per tutti gli eventi DOM, anche quelli senza property `on${event}` nello spec (es. `touchstart`).

```javascript
function doSomething(e) { console.log(e) }
m("div", {onclick: doSomething})
```

Accetta funzioni **e** oggetti [EventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventListener):

```javascript
var clickListener = { handleEvent: function(e) { console.log(e) } }
m("div", {onclick: clickListener})
```

**Auto-redraw:** quando un handler agganciato via hyperscript scatta, Mithril triggera un auto-redraw **dopo** il ritorno della callback — *solo* se stai usando `m.mount`/`m.route` (non `m.render` diretto). Disabilitalo per il singolo evento con `e.redraw = false`:

```javascript
m("div", {
	onclick: function(e) {
		e.redraw = false // niente redraw automatico dopo questo handler
	}
})
```

> **Gotcha:** `e.redraw = false` previene **solo** il redraw automatico di *quell'evento*. Non blocca redraw futuri né quelli innescati altrove. E con `m.render` puro non c'è alcun auto-redraw da disabilitare.

---

## 7. Properties (value, selectedIndex...)

Mithril supporta funzionalità DOM esposte come properties, es. `selectedIndex` e `value` di `<select>`:

```javascript
m("select", {selectedIndex: 0}, [
	m("option", "Option A"),
	m("option", "Option B"),
])
```

---

## 8. Children, splat e normalizzazione

`children` può essere `Array<Vnode> | String | Number | Boolean`. Grazie agli **splat**, un array può essere srotolato in argomenti variadici:

```javascript
m("div", {id: "foo"}, ["a", "b", "c"])
m("div", {id: "foo"}, "a", "b", "c") // identico
```

**Normalizzazione automatica** (fatta da `m()`):

- Le **stringhe** nei children diventano **text vnode** (`{tag: "#"}`).
- Gli **array annidati** nei children diventano **fragment vnode** (`{tag: "["}`).
- *Tutto* nell'albero virtuale è un vnode, incluso il testo.

Template dinamici — sono solo espressioni JS:

```javascript
// testo dinamico
m(".name", user.name)

// loop con Array.map
m("ul", users.map(function(u) { return m("li", u.name) }))

// condizionale con ternario
m("div", isError ? "An error occurred" : "Saved")
```

> **Gotcha:** non puoi usare **statement** (`if`, `for`) dentro un'espressione di children. Usa ternario per i condizionali e `map` per le liste. Vedi §16 (anti-pattern "statements in view").

---

## 9. Lifecycle hooks sui vnode

Definiti come gli event handler, ma ricevono il **vnode** (non un Event):

```javascript
function initialize(vnode) { console.log(vnode) }
m("div", {oninit: initialize})
```

| Hook                         | Quando |
| ---------------------------- | --- |
| `oninit(vnode)`              | Prima che il vnode sia renderizzato in un elemento DOM reale. `vnode.dom` è `undefined` qui. |
| `oncreate(vnode)`            | Dopo che il vnode è stato appeso al DOM. |
| `onupdate(vnode)`            | A ogni redraw mentre l'elemento è attaccato al document. |
| `onbeforeremove(vnode)`      | Prima della rimozione. Se ritorna una Promise, Mithril rimuove il DOM solo dopo la risoluzione. Triggera **solo** sull'elemento staccato dal genitore, **non** sui figli. |
| `onremove(vnode)`            | Prima della rimozione. Se c'è `onbeforeremove`, viene chiamato dopo che `done` è stato chiamato. Triggera sull'elemento staccato **e su tutti i suoi figli**. |
| `onbeforeupdate(vnode, old)` | Prima di `onupdate`. Se ritorna `false`, salta il diff per l'elemento **e tutti i figli**. |

> **Gotcha:** asimmetria voluta — `onbeforeremove` colpisce solo il nodo radice rimosso; `onremove` si propaga ai figli. Non aspettarti `onbeforeremove` sui discendenti.

---

## 10. Keys

`key` è un attributo speciale per mappare l'identità di un elemento DOM al rispettivo item dei dati. Tipicamente l'id univoco dell'oggetto.

```javascript
var users = [{id: 1, name: "John"}, {id: 2, name: "Mary"}]
function userInputs(users) {
	return users.map(function(u) {
		return m("input", {key: u.id}, u.name)
	})
}
m.render(document.body, userInputs(users))
```

Con le key, se l'array viene mescolato e ri-renderizzato, gli elementi DOM seguono lo stesso ordine, mantenendo focus e stato DOM corretti.

> **Gotcha (vs §16):** non passare al volo un modello dati come `attrs` di un componente se contiene una property `key` propria (es. `key: "red"` come colore): Mithril la interpreta come key di reconciliation → componenti distrutti/ricreati o riposizionati. Estrai esplicitamente: `m(Comp, {key: user.id, model: user})`.

---

## 11. SVG / MathML / Xlink

SVG e MathML pienamente supportati. Xlink richiede il **namespace esplicito** (diversamente dalle versioni pre-1.0):

```javascript
m("svg", [
	m("image[xlink:href='image.gif']")
])
```

---

## 12. Struttura del vnode

Un vnode è un plain object JS con queste property:

| Property   | Tipo                              | Descrizione |
| ---------- | --------------------------------- | --- |
| `tag`      | `String\|Object`                  | `nodeName` dell'elemento. Oppure `"["` (fragment), `"#"` (text), `"<"` (trusted HTML), o un component (oggetto). |
| `key`      | `String?`                         | Mappa l'elemento DOM al suo item nell'array di dati. |
| `attrs`    | `Object?`                         | Hashmap di attributi DOM, eventi, properties e lifecycle. |
| `children` | `(Array\|String\|Number\|Boolean)?` | Nella maggior parte dei tipi è un array di vnode. Per text e trusted HTML è string/number/boolean. |
| `text`     | `(String\|Number\|Boolean)?`      | Usato **al posto di** `children` quando l'unico figlio è un text node (per performance). I **component vnode non usano mai** `text`, anche con un solo figlio testo. |
| `dom`      | `Element?`                        | L'elemento DOM corrispondente. È `undefined` in `oninit`. In fragment e trusted HTML punta al **primo** elemento del range. |
| `domSize`  | `Number?`                         | Solo in fragment e trusted HTML; `undefined` altrove. Numero di elementi DOM rappresentati (a partire da `dom`). |
| `state`    | `Object?`                         | Persistito tra redraw, fornito dal core. Nei POJO component eredita prototipalmente dall'oggetto component; nei class component è un'istanza della classe; nei closure component è l'oggetto ritornato dalla closure. |
| `events`   | `Object?`                         | **Interno**. Handler persistiti per la rimozione via DOM API. `undefined` se nessun handler. Non usare/modificare. |
| `instance` | `Object?`                         | **Interno**. Storage del valore ritornato da `view`. Non usare/modificare. |

> **Gotcha:** la dualità `text` vs `children` è la trappola classica quando si ispeziona un vnode a mano: un elemento con solo testo ha `vnode.text` valorizzato e `vnode.children` no. Non assumere mai che `children` sia popolato. E `dom` su un fragment è solo il **primo** nodo: per coprire il range serve `domSize`.

---

## 13. I cinque tipi di vnode

Il `tag` determina il tipo:

| Tipo         | Esempio                        | Descrizione |
| ------------ | ------------------------------ | --- |
| Element      | `{tag: "div"}`                 | Un elemento DOM. |
| Fragment     | `{tag: "[", children: []}`     | Lista di elementi DOM il cui genitore può contenere anche altri elementi fuori dal fragment. Via `m()` si creano **solo** annidando array nei children. `m("[")` **non** crea un vnode valido. |
| Text         | `{tag: "#", children: ""}`     | Un text node DOM. |
| Trusted HTML | `{tag: "<", children: "<br>"}` | Lista di elementi DOM da una stringa HTML. Creabile solo via `m.trust()`. |
| Component    | `{tag: ExampleComponent}`      | Se `tag` è un oggetto con metodo `view`, rappresenta il DOM generato dal component. |

> **Gotcha:** solo **tag-name di elementi** e **component** sono validi come `selector` di `m()`. `"["`, `"#"`, `"<"` **non** sono selettori validi. I fragment nascono da array annidati; i trusted HTML solo da `m.trust()`.

**Monomorphic class:** il modulo `mithril/render/vnode` genera tutti i vnode con la stessa hidden class, così i JS engine ottimizzano il diff. Se scrivi una libreria che emette vnode, usa quel modulo invece di plain object scritti a mano, per non degradare le performance di rendering.

---

## 14. `m.fragment()`

```
vnode = m.fragment(attrs, children)
```

| Argomento  | Tipo                                  | Obbligatorio | Descrizione |
| ---------- | ------------------------------------- | ------------ | --- |
| `attrs`    | `Object`                              | No           | HTML attributes o element properties (qui tipicamente `key` o lifecycle) |
| `children` | `Array<Vnode>\|String\|Number\|Boolean` | No         | Child vnodes; scrivibili come splat |
| **returns**| `Vnode`                               |              | Un fragment vnode |

Serve ad attaccare **lifecycle** o **key** a un fragment, **senza** introdurre un elemento wrapper (utile p.es. in strutture `<table>` complesse dove un `<div>` extra romperebbe il markup).

```javascript
var groupVisible = true
var log = function() { console.log("group is now visible") }

m("ul", [
	m("li", "child 1"),
	m("li", "child 2"),
	groupVisible ? m.fragment({oninit: log}, [
		m("li", "child 3"),
		m("li", "child 4"),
	]) : null
])
```

Per un semplice raggruppamento **senza** key/lifecycle, basta un array o gli splat — non serve `m.fragment`:

```javascript
m("ul",
	m("li", "child 1"),
	groupVisible ? [ m("li", "child 3"), m("li", "child 4") ] : null
)
```

Vantaggi di `m.fragment` rispetto a scrivere a mano `{tag: "[", ...}`: crea oggetti **monomorfici** (più performanti), rende l'intento esplicito, ed evita l'errore di settare attributi sull'oggetto vnode invece che dentro `attrs`.

> **Gotcha:** gli **array JS nudi non possono** portare `key` né lifecycle. Se ti serve una key su un gruppo di nodi senza wrapper, l'unica via è `m.fragment`. Per un solo elemento, usa `m()` normale.

---

## 15. `m.trust()` e XSS

```
vnode = m.trust(html)
```

| Argomento  | Tipo     | Obbligatorio | Descrizione |
| ---------- | -------- | ------------ | --- |
| `html`     | `String` | Sì           | Stringa HTML o SVG |
| **returns**| `Vnode`  |              | Un trusted HTML vnode (`tag: "<"`) |

Di default Mithril **escape** tutti i valori per prevenire XSS:

```javascript
var userContent = "<script>alert('evil')</script>"
m.render(document.body, m("div", userContent))
// <div>&lt;script&gt;alert('evil')&lt;/script&gt;</div>
```

`m.trust` rende l'HTML **non** escapato:

```javascript
m("div", [ m.trust("<h1>Here's some <em>HTML</em></h1>") ])
// <div><h1>Here's some <em>HTML</em></h1></div>
```

I trusted vnode sono **oggetti, non stringhe**: non concatenabili con stringhe regolari.

### Sicurezza (XSS) — quando NON usarlo

**Mai** `m.trust` su input utente non sanitizzato. Senza sanitizzazione, qualsiasi punto JS asincrono nella stringa gira con i privilegi dell'utente che visualizza la pagina. Vettori reali:

```javascript
data.description = "<img onload='alert(1)'>"                  // attributo JS
data.description = "</span><img onload='alert(1)'><span"      // tag sbilanciati
data.title       = "' onerror='alert(1)"                      // quote sbilanciate
data.title       = "' onmouseover='alert(1)"                  // altro attributo
data.description = "<a href='https://evil.com/...'>Click</a>" // attacco senza JS
```

Regole esperto:
- Sanitizza con **whitelist** di tag/attributi/valori, **non** blacklist.
- Usa un **parser HTML** vero, **non** regex.
- `<script>` inseriti via innerHTML **non vengono eseguiti** (comportamento browser, che Mithril segue — diverso da jQuery). Per eseguire script, spostali in un hook `oncreate`.

### Evita `m.trust` quando non serve

```javascript
// AVOID
m("div", m.trust("hello world"))
// PREFER
m("div", "hello world")
```

- **Snippet di terze parti** (es. Facebook Like): non copia-incollare in `m.trust`. Sposta lo `<script>` in `oncreate` e dichiara il markup con `m()`.
- **Entità HTML:** non usare `m.trust("&trade;")`. Usa il carattere unicode diretto (`"Coca-Cola™"`) o l'escape codepoint (`"™"`). Tutte le entità (`&nbsp;`, `&shy;`...) hanno controparte unicode. Imposta encoding UTF-8 sul file JS e `<meta charset="utf-8">` nell'host HTML.

> **Gotcha:** la sorpresa più comune per chi viene da jQuery è che `<script>` in `m.trust(...)` resta inerte. Non è un bug di Mithril: è il comportamento di `innerHTML` del browser.

---

## 16. Anti-pattern

**Evita selettori dinamici.** Rendere il selettore configurabile fa trapelare i dettagli implementativi del componente.

```javascript
// AVOID
m(vnode.attrs.type || "input")
// PREFER: codifica esplicitamente ogni caso valido, o estrai la variabilità come children
```

**Evita di creare vnode fuori dalle view.** Un vnode strettamente uguale (`===`) a quello del render precedente viene **saltato** nel diff: i suoi contenuti non si aggiornano e i lifecycle a valle non scattano più. I vnode di Mithril sono **immutabili**: le mutazioni non vengono persistite, i nuovi vengono confrontati con i vecchi.

**Evita di riusare vnode.** Mithril assume che un vnode riusato sia invariato. Per saltare un diff intenzionalmente, preferisci [`onbeforeupdate`](lifecycle-methods.md#onbeforeupdate) invece di riciclare l'oggetto vnode.

**Evita di passare il model dati direttamente come attrs di un component** (vedi §10): `key`/`onupdate`/`onremove` nel modello collidono con la semantica di Mithril.

```javascript
// AVOID
users.map(function(user){ return m(UserComponent, user) })
// PREFER
users.map(function(user){ return m(UserComponent, {key: user.id, model: user}) })
```

**Evita statement nelle view.** Niente `for`/`if` nel corpo che assembla l'albero; usa `map` e ternario.

```javascript
// AVOID
view: function(vnode) {
	var list = []
	for (var i = 0; i < vnode.attrs.items.length; i++) list.push(m("li", vnode.attrs.items[i]))
	return m("ul", list)
}
// PREFER
view: function(vnode) {
	return m("ul", vnode.attrs.items.map(function(item) { return m("li", item) }))
}
```

---

## Checklist esperto

- [ ] **Statico nel selettore, dinamico in `attrs`.** Ricorda: `class` fa merge tra i due; ogni altro attributo in `attrs` sovrascrive il selettore (anche con `null`).
- [ ] **`style` come oggetto** per stili dinamici (diff regola-per-regola); la stringa azzera tutti gli inline style a ogni redraw. Mithril non aggiunge `px` ai numeri.
- [ ] **Mai `m.trust` su input non sanitizzato.** Sanitizza con whitelist + parser HTML; ricorda che `<script>` non gira e va spostato in `oncreate`.
- [ ] **Usa `key` = id univoco** per liste mescolabili; **non** lasciare che una `key` del model finisca negli attrs di un component (estraila esplicitamente).
- [ ] **Mai mutare o riusare un vnode** già renderizzato: sono immutabili per contratto; per saltare un diff usa `onbeforeupdate`, non il riciclo dell'oggetto.
- [ ] **`m.fragment` solo quando serve key/lifecycle su un gruppo senza wrapper**; altrimenti array/splat nudi.
- [ ] **Niente statement nelle view**: ternario per condizionali, `Array.map` per liste; niente selettori dinamici.
- [ ] **Ispezionando un vnode**, controlla `text` *prima* di `children` (testo singolo va in `text`); su fragment/trusted il `dom` è solo il primo nodo, usa `domSize` per il range.
