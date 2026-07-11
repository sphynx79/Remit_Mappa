# Mithril.js Streams (`mithril/stream`) — Riferimento esperto (v2.3.6)

Modulo separato per stato reattivo. Una `Stream` è una struttura dati reattiva, simile alle celle di un foglio di calcolo: se `A1 = B1 + C1`, cambiando `B1` o `C1` si aggiorna automaticamente `A1`. Si usano stream dipendenti per ricalcolare valori **solo quando necessario** (non a ogni redraw).

> Modulo **non** incluso nella distribuzione core di Mithril. Va importato a parte.

## Indice

- [Import e setup](#import-e-setup)
- [Creazione di stream: `stream(value)`](#creazione-di-stream-streamvalue)
- [Stream come getter-setter](#stream-come-getter-setter)
- [Membri statici](#membri-statici)
  - [`stream.map` (alias dell'istanza `.map`)](#streammap-alias-dellistanza-map)
  - [`stream.combine`](#streamcombine)
  - [`stream.merge`](#streammerge)
  - [`stream.scan`](#streamscan)
  - [`stream.scanMerge`](#streamscanmerge)
  - [`stream.lift`](#streamlift)
  - [`stream.SKIP`](#streamskip)
  - [`stream["fantasy-land/of"]`](#streamfantasy-landof)
- [Membri d'istanza](#membri-distanza)
  - [`.map`](#map)
  - [`.end`](#end)
  - [`.toJSON` / serializzazione](#tojson--serializzazione)
  - [Membri Fantasy Land](#membri-fantasy-land)
- [Stream dipendenti (chaining)](#stream-dipendenti-chaining)
- [Combinare più stream](#combinare-piu-stream)
- [Stati di uno stream: pending / active / ended](#stati-di-uno-stream-pending--active--ended)
- [Aggiornamento atomico](#aggiornamento-atomico)
- [Pattern con componenti Mithril](#pattern-con-componenti-mithril)
- [Gli stream NON innescano il rendering](#gli-stream-non-innescano-il-rendering)
- [Differenze rispetto a Promise / React / Vue](#differenze-rispetto-a-promise--react--vue)
- [Checklist esperto](#checklist-esperto)

---

## Import e setup

```javascript
// CommonJS / bundler
var stream = require("mithril/stream")
```

```html
<!-- Script tag diretto -->
<script src="https://unpkg.com/mithril/stream/stream.js"></script>
```

**Gotcha (script tag):** caricato via `<script>`, il modulo si espone come `window.m.stream`. Se usi anche il core Mithril come script tag, includi **Mithril prima** di `mithril/stream`, altrimenti `mithril` sovrascrive l'oggetto `window.m` definito da `mithril/stream`. Non è un problema con `require(...)` (CommonJS).

Convenzione: la variabile importata si chiama tipicamente `stream` (minuscolo). I membri statici (`stream.combine`, `stream.merge`, ecc.) vivono su quella funzione.

---

## Creazione di stream: `stream(value)`

Firma:

```
stream = Stream(value)
```

| Argomento   | Tipo     | Obbligatorio | Descrizione |
| ----------- | -------- | ------------ | --- |
| `value`     | `any`    | No           | Se presente, imposta il valore iniziale dello stream |
| **returns** | `Stream` |              | Ritorna uno stream |

```javascript
var withValue = stream("John")  // stream attivo, valore "John"
var pending   = stream()        // stream pending, nessun valore
```

---

## Stream come getter-setter

Uno stream **è una funzione**. Chiamato senza argomenti legge il valore; chiamato con un argomento lo imposta (e ritorna il valore impostato).

```javascript
var username = stream("John")
console.log(username())      // logs "John"   (getter)

username("John Doe")         // setter
console.log(username())      // logs "John Doe"
```

Essendo una funzione, può essere passato come callback in higher-order functions — utile per popolarlo dal risultato di una Promise:

```javascript
var users = stream()

fetch("/api/users")
  .then(function(response) { return response.json() })
  .then(users)   // `users` viene chiamato con il JSON => diventa setter
```

**Gotcha:** poiché il setter ritorna il valore, `someStream(x)` in mezzo a un'espressione assegna **e** restituisce `x`. Attenzione a non chiamare accidentalmente lo stream con un argomento `undefined` (es. `stream(maybeUndefined)`) quando intendevi leggerlo: imposterebbe il valore a `undefined`.

---

## Membri statici

### `stream.map` (alias dell'istanza `.map`)

Vedi [`.map`](#map) nei membri d'istanza. La creazione di stream dipendenti avviene tramite il metodo d'istanza `stream().map(...)`, non con un `stream.map` statico distinto.

### `stream.combine`

Crea uno stream calcolato che si aggiorna reattivamente se uno qualsiasi degli upstream cambia. Espone **gli stream stessi** (non i valori) al combiner — più di basso livello, per casi avanzati.

Firma:

```
stream = stream.combine(combiner, streams)
```

| Argomento   | Tipo                        | Obbligatorio | Descrizione |
| ----------- | --------------------------- | ------------ | --- |
| `combiner`  | `(Stream..., Array) -> any` | Sì           | Vedi firma `combiner` sotto |
| `streams`   | `Array<Stream>`             | Sì           | Lista di stream da combinare |
| **returns** | `Stream`                    |              | Ritorna uno stream |

Firma del `combiner`:

```
any = combiner(streams..., changed)
```

| Argomento     | Tipo            | Descrizione |
| ------------- | --------------- | --- |
| `streams...`  | splat di `Stream` | Splat degli stream passati come secondo argomento a `combine` |
| `changed`     | `Array<Stream>` | Lista degli stream che hanno subito un update in questo ciclo |
| **returns**   | `any`           | Valore calcolato |

```javascript
var a = stream(5)
var b = stream(7)

var added = stream.combine(function(a, b) {
  return a() + b()   // i parametri sono STREAM: vanno invocati per leggere
}, [a, b])

console.log(added()) // logs 12
```

**Gotcha:** dentro `combine` i parametri sono stream, quindi devi invocarli (`a()`, `b()`). In `lift`/`map` ricevi invece i **valori** già estratti. Confondere i due è l'errore più comune.

### `stream.merge`

Crea uno stream il cui valore è l'**array dei valori** di un array di stream.

Firma:

```
stream = stream.merge(streams)
```

| Argomento   | Tipo            | Obbligatorio | Descrizione |
| ----------- | --------------- | ------------ | --- |
| `streams`   | `Array<Stream>` | Sì           | Lista di stream |
| **returns** | `Stream`        |              | Stream il cui valore è l'array dei valori degli stream in input |

```javascript
var firstName = stream("John")
var lastName  = stream("Doe")

var fullName = stream.merge([firstName, lastName]).map(function(values) {
  return values.join(" ")   // values === ["John", "Doe"]
})

console.log(fullName()) // logs "John Doe"

firstName("Mary")
console.log(fullName()) // logs "Mary Doe"
```

### `stream.scan`

Crea un nuovo stream con i risultati dell'applicazione di `fn` a ogni valore dello stream sorgente, usando un accumulatore e il valore in arrivo (fold reattivo nel tempo).

Firma:

```
stream = stream.scan(fn, accumulator, stream)
```

| Argomento     | Tipo                                       | Obbligatorio | Descrizione |
| ------------- | ------------------------------------------ | ------------ | --- |
| `fn`          | `(accumulator, value) -> result \| SKIP`   | Sì           | Riceve accumulatore + valore, ritorna un nuovo accumulatore dello stesso tipo |
| `accumulator` | `any`                                      | Sì           | Valore iniziale dell'accumulatore |
| `stream`      | `Stream`                                   | Sì           | Stream contenente i valori |
| **returns**   | `Stream`                                   |              | Nuovo stream con il risultato |

```javascript
var inc   = stream()
var total = stream.scan(function(acc, value) {
  return acc + value
}, 0, inc)

inc(2); console.log(total()) // 2
inc(3); console.log(total()) // 5
inc(5); console.log(total()) // 10
```

Puoi impedire l'aggiornamento dei downstream restituendo `stream.SKIP` dentro `fn`.

### `stream.scanMerge`

Prende un array di coppie `[stream, scanFn]` e fonde tutti quegli stream con le rispettive funzioni in un singolo stream, condividendo un accumulatore.

Firma:

```
stream = stream.scanMerge(pairs, accumulator)
```

| Argomento     | Tipo                                              | Obbligatorio | Descrizione |
| ------------- | ------------------------------------------------- | ------------ | --- |
| `pairs`       | `Array<[Stream, (accumulator, value) -> value]>`  | Sì           | Array di tuple (stream, funzione di scan) |
| `accumulator` | `any`                                             | Sì           | Valore iniziale dell'accumulatore |
| **returns**   | `Stream`                                          |              | Nuovo stream con il risultato |

```javascript
var add = stream()
var sub = stream()

var count = stream.scanMerge([
  [add, function(acc, value) { return acc + value }],
  [sub, function(acc, value) { return acc - value }],
], 0)

add(2); console.log(count()) // 2
sub(1); console.log(count()) // 1
add(5); console.log(count()) // 6
```

### `stream.lift`

Come `combine`, ma più amichevole per le applicazioni: gli stream di input sono un **numero variabile di argomenti** (non un array) e il callback riceve i **valori** degli stream (non gli stream). **Nessun** parametro `changed`.

Firma:

```
stream = stream.lift(lifter, stream1, stream2, ...)
```

| Argomento     | Tipo              | Obbligatorio | Descrizione |
| ------------- | ----------------- | ------------ | --- |
| `lifter`      | `(any...) -> any` | Sì           | Vedi firma `lifter` sotto |
| `streams...`  | lista di `Stream` | Sì           | Stream da "liftare" |
| **returns**   | `Stream`          |              | Ritorna uno stream |

Firma del `lifter`:

```
any = lifter(streams...)
```

| Argomento    | Tipo            | Descrizione |
| ------------ | --------------- | --- |
| `streams...` | splat di valori | Splat dei **valori** degli stream passati a `lift` |
| **returns**  | `any`           | Valore calcolato |

```javascript
var a = stream("hello")
var b = stream("world")

var greeting = stream.lift(function(_a, _b) {
  return _a + " " + _b   // _a, _b sono VALORI, non stream
}, a, b)

console.log(greeting()) // logs "hello world"
```

**Quale scegliere:**
- `lift` → caso comune nelle app (valori già estratti, argomenti splat).
- `merge([...]).map(...)` → quando ti serve un array di valori, o vuoi una sola dipendenza riusabile.
- `combine` → quando devi ispezionare *quali* stream sono cambiati (`changed`) o manipolare gli stream come oggetti.

### `stream.SKIP`

Valore speciale restituibile da un callback (`map`, `combine`, `scan`, ...) per **saltare l'esecuzione dei downstream**: il valore corrente non si propaga ai dipendenti.

```javascript
var skipped = stream(1).map(function(value) {
  return stream.SKIP
})

skipped.map(function() {
  // non viene MAI eseguita
})
```

Con `combine`:

```javascript
var skipped = stream.combine(function(s) {
  return stream.SKIP
}, [stream(1)])

skipped.map(function() {
  // non viene mai eseguita
})
```

**Uso tipico:** filtrare valori (validazione, dedup) senza emettere a valle. È l'equivalente reattivo di un `filter`.

### `stream["fantasy-land/of"]`

Funzionalmente identico a `stream(value)`. Esiste per conformità alla spec **Applicative** di Fantasy Land.

```
stream = stream["fantasy-land/of"](value)
```

---

## Membri d'istanza

### `.map`

Crea uno stream **dipendente** il cui valore è il risultato del callback. Alias di `stream["fantasy-land/map"]`.

Firma:

```
dependentStream = stream().map(callback)
```

| Argomento   | Tipo         | Obbligatorio | Descrizione |
| ----------- | ------------ | ------------ | --- |
| `callback`  | `any -> any` | Sì           | Il valore di ritorno diventa il valore dello stream |
| **returns** | `Stream`     |              | Ritorna uno stream |

```javascript
var title = stream("")
var slug  = title.map(function(value) {
  return value.toLowerCase().replace(/\W/g, "-")
})

title("Hello world")
console.log(slug()) // logs "hello-world"
```

**Nota chiave (lazy push, non lazy pull):** il valore di `slug` è calcolato quando `title` viene **aggiornato**, non quando `slug` viene **letto**. È un modello push: l'aggiornamento dell'upstream propaga immediatamente in avanti.

**Reattività indipendente dall'ordine:** un dipendente si aggiorna sia che sia stato creato prima sia dopo che il parent ricevesse un valore.

### `.end`

Stream co-dipendente che, impostato a `true`, **deregistra** i dipendenti: rimuove la connessione tra lo stream e i suoi dipendenti.

```
endStream = stream().end
```

```javascript
var value   = stream()
var doubled = value.map(function(value) { return value * 2 })

value.end(true)  // stato ended

value(5)
console.log(doubled())
// logs undefined: `doubled` non dipende più da `value`
```

Dopo `end(true)` lo stream conserva la semantica di contenitore di stato (getter-setter funziona ancora):

```javascript
var value = stream(1)
value.end(true)

console.log(value(1)) // logs 1
value(2)
console.log(value())  // logs 2
```

**Uso tipico:** stream a vita limitata, es. reagire ai `mousemove` solo durante un drag e staccare i dipendenti al drop.

### `.toJSON` / serializzazione

Gli stream implementano `.toJSON()`: passati a `JSON.stringify()`, viene serializzato il **valore**.

```javascript
var value = stream(123)
console.log(JSON.stringify(value)) // logs 123
```

**Gotcha:** in un oggetto, `JSON.stringify({ a: stream(1) })` produce `{"a":1}` — comodo per inviare stato al server senza unwrapping manuale.

### Membri Fantasy Land

Per interoperabilità con la spec [Fantasy Land](https://github.com/fantasyland/fantasy-land) (codice funzionale generico tra strutture algebriche diverse):

- `stream["fantasy-land/of"](value)` — Applicative `of`. Identico a `stream(value)`.
- `stream()["fantasy-land/map"](callback)` — Functor `map`. Alias di `.map`.
- `stream()["fantasy-land/ap"](apply)` — Apply. Se lo stream `apply` ha **una funzione** come valore, `b["fantasy-land/ap"](a)` chiama quella funzione con il valore di `b` e ritorna uno stream col risultato.

```javascript
var add = stream(function(x) { return x + 1 })
var num = stream(10)
var res = num["fantasy-land/ap"](add)
console.log(res()) // logs 11
```

Adotta Fantasy Land solo se il team ha solida esperienza FP e disciplina documentale; per la maggior parte delle app `.map`/`lift`/`merge` bastano.

---

## Stream dipendenti (chaining)

`map` crea uno *stream dipendente*, reattivo verso il parent:

```javascript
var value   = stream(1)
var doubled = value.map(function(value) { return value * 2 })

console.log(doubled()) // logs 2

value(5)
console.log(doubled()) // logs 10
```

I dipendenti si aggiornano a ogni update del parent, a prescindere dall'ordine di creazione. Usa `stream.SKIP` per non propagare un valore.

---

## Combinare più stream

Tre approcci (esempi equivalenti che producono `"hello world"`):

```javascript
// merge + map  → ricevi un array di valori
var greeting = stream.merge([a, b]).map(function(values) {
  return values.join(" ")
})

// lift → ricevi i valori come argomenti splat
var greeting = stream.lift(function(_a, _b) {
  return _a + " " + _b
}, a, b)

// combine → ricevi gli STREAM (devi invocarli)
var added = stream.combine(function(a, b) {
  return a() + b()
}, [a, b])
```

---

## Stati di uno stream: pending / active / ended

Tre stati possibili: **pending**, **active**, **ended**.

### Pending
Creato con `stream()` senza argomenti. Un dipendente con almeno un parent pending è anch'esso pending e **non** aggiorna il valore.

```javascript
var a = stream(5)
var b = stream()              // pending

var added = stream.combine(function(a, b) {
  return a() + b()
}, [a, b])

console.log(added()) // logs undefined (added è pending perché b è pending)
```

Vale anche per `.map`:

```javascript
var value   = stream()
var doubled = value.map(function(value) { return value * 2 })
console.log(doubled()) // logs undefined: doubled è pending
```

### Active
Quando uno stream riceve un valore diventa active (a meno che non sia ended). Un dipendente con più parent diventa active **solo quando tutti** i parent sono active.

```javascript
var stream1 = stream("hello") // active

var stream2 = stream()        // pending
stream2("world")              // ora active
```

### Ended
Vedi [`.end`](#end). `stream.end(true)` recide il legame con i dipendenti; lo stream resta utilizzabile come getter-setter.

**Gotcha (pending ≠ valore `undefined`):** uno stream pending legge `undefined`, ma non è la stessa cosa di uno stream attivo che contiene `undefined`. Un parent pending blocca la propagazione ai dipendenti; un parent active con valore `undefined` invece propaga. Per "valore assente intenzionale" preferisci `null` o un sentinel, così distingui dal pending.

---

## Aggiornamento atomico

Le proprietà calcolate si aggiornano **atomicamente**: uno stream che dipende da più stream non viene mai chiamato più di una volta per ciclo di update, qualunque sia la complessità del grafo.

> Se A ha due dipendenti B e C, e D dipende da B e C, allora al cambio di A lo stream D si aggiorna **una sola volta**. Il callback di D non viene mai invocato con valori instabili (es. B nuovo ma C ancora vecchio). Oltre alla correttezza, evita ricalcoli inutili dei downstream.

Questa è una garanzia di design che molte librerie reattive naïve **non** offrono: in quelle si possono osservare valori intermedi incoerenti (glitch). Con Mithril streams no.

---

## Pattern con componenti Mithril

### Binding bidirezionale su un input

```javascript
var user = stream("")

m("input", {
  oninput: function(e) { user(e.target.value) },
  value: user()
})
```

### Stato di componente con stream + computed

```javascript
var stream = require("mithril/stream")

function SignupForm() {
  var title    = stream("")
  var slug     = title.map(function(v) {
    return v.toLowerCase().replace(/\W/g, "-")
  })

  return {
    view: function() {
      return m("form", [
        m("input", {
          value: title(),
          oninput: function(e) { title(e.target.value) }
        }),
        m("small", "slug: " + slug())
      ])
    }
  }
}
```

**Gotcha (redraw):** l'aggiornamento dello stream dentro `oninput` non ridisegna *perché è uno stream*; ridisegna perché Mithril fa autoredraw dopo gli **event handler** dei view. Se aggiorni lo stream fuori da un handler gestito da Mithril (timer, websocket, callback di libreria terza), devi chiamare `m.redraw()` manualmente (vedi sotto).

### Pulizia in `onremove`

```javascript
function Dragger() {
  var pos = stream()
  function onMove(e) { pos([e.clientX, e.clientY]); m.redraw() }
  window.addEventListener("mousemove", onMove)

  return {
    view: function() { /* ... usa pos() ... */ },
    onremove: function() {
      window.removeEventListener("mousemove", onMove)
      pos.end(true) // recide eventuali dipendenti
    }
  }
}
```

---

## Gli stream NON innescano il rendering

A differenza di Knockout, gli stream Mithril **non** triggerano il re-render dei template. Il redraw avviene in risposta a:
- event handler definiti nei `view` dei componenti Mithril,
- cambi di route,
- risoluzione di `m.request`.

Per eventi asincroni diversi (`setTimeout`/`setInterval`, websocket, handler di librerie terze) chiama manualmente [`m.redraw()`](redraw.md).

```javascript
var clock = stream(new Date())
setInterval(function() {
  clock(new Date())
  m.redraw()              // necessario: il setInterval non è gestito da Mithril
}, 1000)
```

---

## Differenze rispetto a Promise / React / Vue

- **vs Promise:** una Promise si risolve **una sola volta** ed è push monouso; uno stream emette **N volte** nel tempo, è sincrono e ri-leggibile come getter. `.map` su uno stream rieseguito a ogni nuovo valore; `.then` su una Promise una sola volta. Non c'è un meccanismo di error-channel built-in come `.catch` — gli errori li modelli tu (es. `SKIP`, sentinel, Either Fantasy Land). Pattern comune: `promise.then(myStream)` per "versare" la risoluzione in uno stream.
- **vs React state/`useMemo`:** gli stream sono push-based e **non** legati al ciclo di render; aggiornarli non programma un re-render (in React `setState` sì). Il ricalcolo di un computed avviene all'update dell'upstream, non al render. Devi accoppiare manualmente con `m.redraw()` quando l'update arriva fuori dagli handler gestiti da Mithril.
- **vs Vue `computed`/`ref`:** i `computed` di Vue sono **lazy pull** (calcolati al primo accesso, poi cache) e tracciano le dipendenze automaticamente; gli stream Mithril sono **eager push** (ricalcolati alla propagazione dell'upstream) con dipendenze **dichiarate esplicitamente** (`map`/`merge`/`lift`/`combine`). Vue ridisegna automaticamente sulle dipendenze reattive del template; Mithril no.

---

## Checklist esperto

1. **Importa il modulo a parte** (`require("mithril/stream")`) — non è nel core; con script tag carica Mithril **prima** di `mithril/stream`.
2. **Scegli lo strumento giusto per combinare:** `lift` per il caso comune (valori splat), `merge().map()` per array di valori, `combine` solo quando ti serve ispezionare `changed` o gli stream come oggetti — e ricorda che in `combine` i parametri vanno **invocati** (`a()`), in `lift`/`map` no.
3. **Ricorda che gli stream NON ridisegnano:** dopo un update fuori dagli handler gestiti da Mithril (timer, websocket, lib terze) chiama `m.redraw()` esplicitamente.
4. **Usa `stream.SKIP`** per filtrare/deduplicare valori senza propagarli ai downstream, invece di propagare e filtrare a valle.
5. **Distingui pending da `undefined`:** un parent pending blocca la propagazione; un parent active con valore `undefined` no. Usa `null`/sentinel per "assenza intenzionale".
6. **Sfrutta l'atomicità** per grafi a diamante: i computed si aggiornano una sola volta per ciclo, senza valori intermedi instabili — non aggirarla con flag manuali.
7. **Termina gli stream a vita limitata** con `.end(true)` in `onremove` e rimuovi i relativi listener per evitare leak e ricalcoli su componenti smontati.
8. **Per inviare stato al server** affidati a `.toJSON()`/`JSON.stringify` invece di fare unwrapping manuale degli stream nei payload.
