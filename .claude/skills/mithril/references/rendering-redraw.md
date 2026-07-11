# Mithril.js 2.3.6 — Mount, Render e Redraw

File di riferimento per sviluppatore esperto. Copre il controllo del rendering e il sistema di auto-redraw. Tutto il contenuto è estratto dai file sorgente ufficiali (`mount.md`, `render.md`, `redraw.md`, `autoredraw.md`, `censor.md`). Sintassi hyperscript `m()`, non JSX.

## Indice

- [Modello mentale: i tre livelli di rendering](#modello-mentale-i-tre-livelli-di-rendering)
- [m.mount](#mmount)
  - [Firma](#firma-mmount)
  - [Come funziona, replace, unmount](#come-funziona-replace-unmount)
  - [Passare attrs a un componente montato](#passare-attrs-a-un-componente-montato)
  - [Headless mount](#headless-mount)
- [m.render](#mrender)
  - [Firma](#firma-mrender)
  - [Il terzo argomento `redraw`](#il-terzo-argomento-redraw)
- [m.mount vs m.render](#mmount-vs-mrender)
- [Il sistema di auto-redraw](#il-sistema-di-auto-redraw)
  - [Cosa triggera un redraw](#cosa-triggera-un-redraw)
  - [Cosa NON triggera un redraw](#cosa-non-triggera-un-redraw)
  - [Disabilitare il redraw: e.redraw = false e background](#disabilitare-il-redraw)
- [m.redraw e m.redraw.sync](#mredraw-e-mredrawsync)
- [Redraw nei lifecycle method](#redraw-nei-lifecycle-method)
- [m.censor](#mcensor)
- [Checklist esperto](#checklist-esperto)

---

## Modello mentale: i tre livelli di rendering

Mithril espone tre meccanismi di rendering con livelli crescenti di automazione:

1. **`m.render(element, vnodes)`** — basso livello, sincrono, **nessun** auto-redraw. Rendi tu un vnode tree; sei tu responsabile di ri-renderizzare.
2. **`m.mount(element, Component)`** — monta un componente e lo **iscrive** al subsystem di redraw: auto-redraw attivo.
3. **`m.route(element, default, routes)`** — come `m.mount` ma aggiunge il routing (fuori scope di questo file).

`m.render()` è chiamato internamente da `m.mount()`, `m.route()`, `m.redraw()` e `m.request()`. Non viene chiamato dopo gli update degli stream.

Il sistema di auto-redraw **si abilita** solo quando chiami `m.mount` o `m.route`. Resta disabilitato se la tua app è bootstrappata esclusivamente con `m.render`.

---

## m.mount

Attiva un componente, abilitandolo all'auto-redraw in risposta agli eventi utente.

```javascript
var state = {
    count: 0,
    inc: function() { state.count++ }
}

var Counter = {
    view: function() {
        return m("div", {onclick: state.inc}, state.count)
    }
}

m.mount(document.body, Counter)
```

### Firma m.mount

`m.mount(element, Component)`

| Argument    | Type             | Required | Description |
|-------------|------------------|----------|-------------|
| `element`   | `Element`        | Yes      | Il nodo DOM che farà da parent del subtree |
| `Component` | `Component\|null`| Yes      | Il componente da renderizzare. `null` smonta il tree e pulisce lo stato interno. |
| **returns** |                  |          | Non ritorna nulla |

### Come funziona, replace, unmount

Quando chiami `m.mount(element, Component)`, Mithril renderizza il componente nell'elemento e **iscrive la coppia `(element, Component)`** al redraw subsystem. Quel tree sarà ri-renderizzato a ogni redraw manuale (`m.redraw()`) o automatico.

Su redraw, il nuovo vDOM tree viene diffato con il vecchio e il DOM reale è modificato solo dove necessario. I nodi invariati non vengono toccati.

**Replace componente** — chiamare `m.mount(element, OtherComponent)` dove `element` è già un mount point **sostituisce** il componente precedentemente montato con `OtherComponent`.

```javascript
m.mount(root, ComponentA)   // monta A
m.mount(root, ComponentB)   // sostituisce A con B sullo stesso root
```

**Unmount** — `m.mount(element, null)` su un elemento con un componente montato lo smonta e pulisce lo stato interno di Mithril. Utile per evitare memory leak quando rimuovi manualmente il nodo `root` dal DOM.

```javascript
m.mount(root, null)   // smonta + cleanup, esegue gli onremove
```

> **Gotcha:** Multiple root sono supportate e non si calpestano a vicenda. Puoi montare/smontare dentro un componente di un altro framework senza problemi.

> **Gotcha:** Se rimuovi il nodo root dal DOM manualmente senza fare `m.mount(root, null)` prima, lo stato interno di Mithril (subscription al redraw + lifecycle) non viene pulito → memory leak. Smonta sempre con `null` prima di rimuovere il DOM.

### Passare attrs a un componente montato

`m.mount` accetta un **componente**, non una chiamata `m()`. Non c'è quindi un modo diretto di passare attrs. Il pattern idiomatico è wrappare in un componente anonimo il cui `view` ritorna `m(Component, attrs)`:

```javascript
m.mount(element, {view: function() { return m(Component, attrs) }})
```

### Headless mount

Per iscriverti ai redraw **senza renderizzare nulla** a schermo: monta su un elemento che non è nel DOM live e metti tutta la logica utile nei lifecycle del componente. Serve comunque un `view`, ma può ritornare un valore junk (`null`/`undefined`).

```javascript
var elem = document.createElement("div")

// Subscribe
m.mount(elem, {
    oncreate: function() {
        // una volta aggiunto
    },
    onupdate: function() {
        // a ogni redraw
    },
    onremove: function() {
        // cleanup
    },

    // Boilerplate necessario
    view: function() {}
})

// Unsubscribe
m.mount(elem, null)
```

> **Use case esperto:** l'headless mount è il modo idiomatico per agganciare logica reattiva (es. side-effect a ogni redraw globale, integrazione con store esterni) al ciclo di Mithril senza produrre DOM. `onupdate` qui diventa un "hook su ogni redraw".

---

## m.render

Renderizza un template nel DOM. È sincrono.

```javascript
m.render(document.body, "hello")
// <body>hello</body>
```

### Firma m.render

`m.render(element, vnodes, redraw)`

| Argument    | Type                  | Required | Description |
|-------------|-----------------------|----------|-------------|
| `element`   | `Element`             | Yes      | Il nodo DOM parent del subtree |
| `vnodes`    | `Array<Vnode>\|Vnode` | Yes      | I vnodes da renderizzare |
| `redraw`    | `() -> any`           | No       | Callback invocata ogni volta che un event handler nel subtree viene chiamato |
| **returns** |                       |          | Ritorna `undefined` |

`m.render` prende un vDOM tree (tipicamente generato da `m()`), genera un DOM tree e lo monta su `element`. Se `element` ha già un tree montato da un precedente `m.render()`, `vnodes` viene diffato contro il tree precedente e il DOM è modificato solo dove serve.

> **Gotcha cruciale:** `m.render` si aspetta un **vnode** (o array di vnodes), NON un componente. Per renderizzare un componente devi wrapparlo: `m.render(document.body, m(MyComponent))`. Con `m.mount` invece passi il componente nudo: `m.mount(document.body, MyComponent)`.

```javascript
// m.render: wrappa il componente in m()
m.render(document.body, m(MyComponent))

// m.mount: NON wrappare il componente
m.mount(document.body, MyComponent)
```

### Il terzo argomento `redraw`

Se passi l'argomento opzionale `redraw`, questo viene invocato **ogni volta che un event handler in qualsiasi punto del subtree viene chiamato**. È il meccanismo che `m.mount` e `m.redraw` usano internamente per implementare l'auto-redraw, ma è esposto per use case avanzati (es. integrazione con router/data-layer di terze parti).

```javascript
// Auto-redraw "fatto a mano" sopra m.render
function rerender() {
    m.render(root, m(App), rerender)
}
rerender()
// Ora ogni event handler nel subtree richiamerà rerender() → ridisegno controllato da te
```

> **Use case esperto:** questo è esattamente il pattern per integrare Mithril con Redux o altri store esterni: bypassi l'auto-redraw di `m.mount` e ridisegni manualmente quando lo store emette, mantenendo comunque la reattività agli eventi DOM via il callback `redraw`.

**Standalone usage:** `var render = require("mithril/render")`. Il modulo render è autosufficiente (diffing engine + DOM recycling), supporta SVG, custom elements, tutti gli attributi/eventi validi, componenti e lifecycle method. Dipende solo dalla normalizzazione esposta da `require("mithril/render/vnode")`.

---

## m.mount vs m.render

| Aspetto | `m.mount(el, Component)` | `m.render(el, vnodes)` |
|---|---|---|
| Secondo argomento | un **Component** | un **vnode** o array di vnodes |
| Auto-redraw su event handler | **Sì** | No |
| Auto-redraw su `m.request` | **Sì** | No |
| Reazione a `m.redraw()` | **Sì** (è iscritto) | No — devi richiamare `m.render` tu |
| Iscrizione al redraw subsystem | Sì | No |
| Livello | Alto (app dev) | Basso (library author) |
| Caso d'uso | Integrare widget Mithril con auto-redraw | Controllo manuale del rendering (Redux, router di terze parti) |

- `m.mount()` è adatto agli **application developer** che integrano widget Mithril in codebase esistenti dove il routing è gestito da un'altra libreria, godendo comunque dell'auto-redraw.
- `m.render()` è adatto ai **library author** che vogliono controllare manualmente il rendering.

> **Gotcha:** `m.redraw()` funziona SOLO se hai usato `m.mount` o `m.route`. Se hai renderizzato con `m.render`, per ridisegnare devi richiamare `m.render` di nuovo. `m.redraw()` non ridisegna i tree montati via `m.render`.

> **Differenza vs React/Vue:** in React il re-render è guidato da `setState`/segnali. Qui invece l'auto-redraw è guidato dal **completamento di certe funzioni** (event handler del view, `m.request`, cambi di rotta) — non da una mutazione di stato osservata. Mutare lo stato dentro un `setTimeout` NON ridisegna nulla finché non chiami `m.redraw()`.

---

## Il sistema di auto-redraw

L'auto-redraw consiste semplicemente nel triggerare una funzione di re-render dietro le quinte **dopo che certe funzioni completano**. Si abilita con `m.mount` o `m.route`.

### Cosa triggera un redraw

**1. Dopo gli event handler DOM definiti in un view Mithril.** Il redraw avviene **sincronamente** dopo l'esecuzione dell'handler.

```javascript
var MyComponent = {
    view: function() {
        return m("div", {onclick: doSomething})
    }
}
function doSomething() {
    // un redraw avviene sincronamente dopo che questa funzione gira
}
m.mount(document.body, MyComponent)
```

> **Gotcha:** "definito in un view Mithril" è la chiave. Un listener aggiunto con `addEventListener` in un `oncreate` **non** triggera auto-redraw — è un evento DOM "manuale". Solo gli handler dichiarati come attrs nel vnode (`onclick`, `oninput`, …) sono agganciati.

**2. Dopo `m.request` completa.** Il redraw avviene dopo che gira il `.then()`.

```javascript
m.request("/api/v1/users").then(function() {
    // un redraw avviene dopo che questa funzione gira
})
```

**3. Dopo i cambi di rotta** — dopo `m.route.set()` e dopo navigazione via `m.route.Link`. Questo redraw è **asincrono**.

```javascript
m("div", {
    onclick: function() {
        m.route.set("/")   // redraw asincrono dopo il cambio rotta
    }
})
```

### Cosa NON triggera un redraw

Mithril **non** ridisegna dopo:

- `setTimeout`
- `setInterval`
- `requestAnimationFrame`
- risoluzioni di `Promise` "raw" (non quelle di `m.request`)
- event handler di librerie di terze parti (es. callback di Socket.io, plugin jQuery, callback XHR di terze parti, web socket)
- i **lifecycle method** (vedi sezione dedicata)
- i tree renderizzati via `m.render` (auto-redraw mai attivo lì)

In tutti questi casi **devi** chiamare `m.redraw()` manualmente.

```javascript
// NON ridisegna da solo: serve m.redraw()
setTimeout(function() {
    state.count++
    m.redraw()        // obbligatorio
}, 1000)

fetch("/api/x").then(function(r) {   // Promise raw, non m.request
    return r.json()
}).then(function(data) {
    state.data = data
    m.redraw()        // obbligatorio
})
```

> **Throttling:** Mithril può evitare di auto-ridisegnare se la frequenza dei redraw richiesti supera un animation frame (~16ms). Quindi con eventi ad alta frequenza come `onresize`/`onscroll` i redraw vengono throttlati automaticamente per evitare lag.

### Disabilitare il redraw

**Per uno specifico evento:** imposta `e.redraw = false` dentro l'handler.

```javascript
var MyComponent = {
    view: function() {
        return m("div", {onclick: doSomething})
    }
}
function doSomething(e) {
    e.redraw = false
    // il click sul div non triggera più alcun redraw
}
m.mount(document.body, MyComponent)
```

> **Gotcha:** `e.redraw = false` agisce solo su quel singolo dispatch dell'evento. Va settato dentro l'handler, sull'oggetto evento. Non è una proprietà persistente del vnode. Utile per handler ad alta frequenza (es. `onmousemove` di tracking) che non devono ridisegnare.

**Per una specifica request:** opzione `background: true`.

```javascript
m.request("/api/v1/users", {background: true}).then(function() {
    // non triggera redraw
})
```

---

## m.redraw e m.redraw.sync

Aggiorna il DOM dopo un cambiamento nel data layer.

- **NON** serve chiamarlo se i dati cambiano dentro un event handler di un view Mithril, o dopo `m.request`. L'auto-redraw se ne occupa.
- **DEVI** chiamarlo nelle callback di `setTimeout`/`setInterval`/`requestAnimationFrame` o nelle callback di librerie di terze parti.

### Firma

`m.redraw()` — non prende argomenti, non ritorna nulla. **Asincrono.**

`m.redraw.sync()` — non prende argomenti, non ritorna nulla. **Sincrono.**

| | `m.redraw()` | `m.redraw.sync()` |
|---|---|---|
| Timing | Asincrono, agganciato a `requestAnimationFrame` | Sincrono, immediato |
| Throttling | Sì (~max 60/s, dipende dal refresh) | **No**, nessun throttle |
| Effetto | Re-render batchato | Una `m.render()` per ogni root registrato, immediatamente |
| Sicuro ovunque | **Sì** | No (vincoli sotto) |

`m.redraw()` è tied a `window.requestAnimationFrame()`: tipicamente al massimo 60 volte al secondo (più veloce su monitor ad alto refresh).

**`m.redraw.sync()`** è pensato principalmente per far funzionare il play dei video su iOS (funziona solo in risposta a eventi user-triggered). Caveat:

- **Non** chiamarlo da un lifecycle method o dal `view()` di un componente → undefined behavior (lancia un errore quando può).
- Chiamato da un event handler può modificare il DOM **mentre l'evento sta bubblando**: a seconda della struttura del vecchio/nuovo tree, l'evento può finire la fase di bubbling nel nuovo tree e triggerare handler indesiderati.
- Non è throttlato: una chiamata = immediatamente una `m.render()` per ogni root registrato con `m.mount()`/`m.route()`.

> **Regola pratica:** usa sempre `m.redraw()`. Ricorri a `m.redraw.sync()` solo per il caso specifico del playback video iOS dentro un event handler utente. `m.redraw()` non ha nessuno di quei problemi e puoi chiamarlo da dove vuoi.

```javascript
// Asincrono, sicuro, throttlato — il default
function onSocketMessage(data) {
    state.messages.push(data)
    m.redraw()
}
```

---

## Redraw nei lifecycle method

Mithril **non** auto-ridisegna dopo i lifecycle method. Dettagli importanti:

- Parti della UI possono essere ridisegnate dopo un handler `oninit`, ma altre parti possono essere **già** state ridisegnate quando un dato `oninit` parte (timing non garantito).
- `oncreate` e `onupdate` partono **dopo** che la UI è stata ridisegnata.

Per triggerare esplicitamente un redraw dentro un lifecycle method, chiama `m.redraw()` (asincrono). Caso tipico: leggere una misura dal DOM in `oncreate` e ri-renderizzare.

```javascript
function StableComponent() {
    var height = 0
    return {
        oncreate: function(vnode) {
            height = vnode.dom.offsetHeight
            m.redraw()        // asincrono; la seconda passata mostra l'altezza reale
        },
        view: function() {
            return m("div", "This component is " + height + "px tall")
        }
    }
}
```

> **Gotcha:** non usare `m.redraw.sync()` qui — è esplicitamente vietato dai lifecycle. Usa `m.redraw()`.

---

## m.censor

Ritorna un oggetto **shallow-cloned** con gli attributi di lifecycle (e eventuali attributi custom indicati) **omessi**.

```javascript
var attrs = {one: "two", enabled: false, oninit: function() {}}
var censored = m.censor(attrs, ["enabled"])
// {one: "two"}
```

### Firma

`censored = m.censor(object, extra)`

| Argument    | Type            | Required | Description |
|-------------|-----------------|----------|-------------|
| `object`    | `Object`        | Yes      | La mappa key-value da filtrare |
| `extra`     | `Array<String>` | No       | Proprietà aggiuntive da omettere |
| **returns** | `Object`        |          | L'oggetto originale se non c'era nulla da omettere; altrimenti uno shallow clone senza le proprietà rimosse |

**A cosa serve:** quando inoltri attributi sconosciuti da un componente wrapper a un elemento figlio (`m("div", vnode.attrs, ...)`), inoltri **anche** i lifecycle method (`oncreate`, `onupdate`, ...) e la `key`. Risultato: i lifecycle vengono eseguiti **due volte** (una dal componente, una dall'elemento), e la `key` finisce su un elemento dove non dovrebbe.

**Problema lifecycle doppio:**

```javascript
function SomePage() {
    return {
        view: function() {
            return m(SomeFancyView, {
                oncreate: function() {
                    sendViewHit(m.route.get(), "some fancy view")
                }
            })
        }
    }
}

function SomeFancyView() {
    return {
        view: function(vnode) {
            return m("div", vnode.attrs, [ // !!! oncreate eseguito due volte
                // ...
            ])
        }
    }
}
```

**Fix con `m.censor`:**

```javascript
function SomeFancyView() {
    return {
        view: function(vnode) {
            return m("div", m.censor(vnode.attrs), [
                // ...
            ])
        }
    }
}
```

**Problema con `key`:** inoltrare `vnode.attrs` che contiene una `key` mette la `key` su un elemento qualsiasi → [errore per restrizioni sulle key](keys.md#key-restrictions). Si risolve censurando la `key` (ed eventuali attributi custom non-DOM come `pageTitle`):

```javascript
function Layout() {
    return {
        view: function(vnode) {
            return [
                m("header", [
                    m("h1", "My beautiful web app"),
                    m("nav")
                ]),
                m(".body", m.censor(vnode.attrs, ["pageTitle"]), [
                    m("h2", vnode.attrs.pageTitle),
                    vnode.children
                ])
            ]
        }
    }
}
```

> **Gotcha:** `m.censor` rimuove di default **tutti** i lifecycle attribute (`oninit`, `oncreate`, `onupdate`, `onbeforeupdate`, `onremove`, `onbeforeremove`) e `key`. L'array `extra` aggiunge proprietà custom (es. `["pageTitle"]`) — non le sostituisce. Per ottimizzare: se non c'è nulla da omettere, ritorna l'oggetto originale (nessun clone inutile).

> **Use case esperto:** ogni volta che fai "spread di attrs" da un wrapper component a un elemento o componente figlio, passa attraverso `m.censor`. È il difetto silenzioso più comune nei componenti di layout/passthrough: doppi analytics hit, doppi side-effect, key fuori posto.

---

## Checklist esperto

1. **Scegli il livello giusto:** `m.mount` per app con auto-redraw; `m.render` (+ callback `redraw`) solo se devi controllare manualmente il rendering (Redux, router di terze parti). Non mescolare `m.redraw()` con tree montati via `m.render`.
2. **Wrappa correttamente:** `m.render` vuole un vnode (`m(Component)`), `m.mount` vuole il componente nudo (`Component`). Confondere i due è l'errore numero uno.
3. **Sempre `m.redraw()` fuori dal contesto Mithril:** in `setTimeout`, `setInterval`, `requestAnimationFrame`, Promise raw (non `m.request`), e callback di librerie esterne. Dentro event handler del view e dopo `m.request` NON serve.
4. **Preferisci `m.redraw()` (async) a `m.redraw.sync()`:** quest'ultimo solo per il playback video iOS dentro un event handler utente, mai nei lifecycle né nel `view`.
5. **Smonta prima di rimuovere il DOM:** `m.mount(root, null)` pulisce subscription e lifecycle (`onremove`) ed evita memory leak quando elimini il nodo root manualmente.
6. **Throttla con `e.redraw = false`:** negli handler ad alta frequenza (mousemove/scroll custom) che non devono ridisegnare; usa `{background: true}` per le request di sfondo.
7. **Censura sempre gli attrs inoltrati:** ogni passthrough `m(el, vnode.attrs, ...)` deve passare per `m.censor(vnode.attrs, [...custom])` per evitare doppi lifecycle e key fuori posto.
8. **Ricorda il timing dei lifecycle:** `oncreate`/`onupdate` girano dopo il redraw; `oninit` ha timing non garantito rispetto al resto della UI; per ridisegnare da un lifecycle usa `m.redraw()` async.
