# Mithril.js 2.3.6 — JSX, ES6 e Tooling

Riferimento operativo per setup JSX/Babel, installazione (npm/ESM/CDN/bundler), pattern ES6 moderni e la decisione JSX vs hyperscript. Tutto estratto dai doc ufficiali (`jsx.md`, `es6.md`, `installation.md`). Le API non documentate in quei file NON sono incluse.

## Indice

- [1. Installazione](#1-installazione)
  - [1.1 CDN / script tag](#11-cdn--script-tag)
  - [1.2 npm + ESM import](#12-npm--esm-import)
  - [1.3 Quick start con esbuild](#13-quick-start-con-esbuild)
  - [1.4 Starter template](#14-starter-template)
- [2. JSX: cos'è e come si trasforma](#2-jsx-cosè-e-come-si-trasforma)
- [3. Setup JSX con Babel (JavaScript)](#3-setup-jsx-con-babel-javascript)
  - [3.1 Babel standalone](#31-babel-standalone)
  - [3.2 Babel + Webpack](#32-babel--webpack)
  - [3.3 Production build](#33-production-build)
  - [3.4 `m` globale via Webpack ProvidePlugin](#34-m-globale-via-webpack-provideplugin)
- [4. Setup JSX con TypeScript (.tsx)](#4-setup-jsx-con-typescript-tsx)
  - [4.1 Closure components in TS + JSX (workaround)](#41-closure-components-in-ts--jsx-workaround)
- [5. Setup JSX con esbuild](#5-setup-jsx-con-esbuild)
- [6. ES6+ e transpiling per browser legacy](#6-es6-e-transpiling-per-browser-legacy)
- [7. Differenze JSX Mithril vs React](#7-differenze-jsx-mithril-vs-react)
- [8. JSX vs hyperscript: quando usare cosa](#8-jsx-vs-hyperscript-quando-usare-cosa)
- [9. Pattern ES6 moderni](#9-pattern-es6-moderni)
- [10. Tips & tricks (HTML → JSX/hyperscript)](#10-tips--tricks-html--jsxhyperscript)
- [Checklist esperto](#checklist-esperto)

---

## 1. Installazione

### 1.1 CDN / script tag

Setup minimo senza build step. Espone `m` come globale.

```html
<script src="https://unpkg.com/mithril/mithril.js"></script>
```

Playground online ufficiale: `https://flems.io/mithril`.

> **Gotcha:** l'URL `unpkg.com/mithril/mithril.js` serve la build **non minificata**. Per produzione vincola la versione e usa il file minificato, es. `https://unpkg.com/mithril@2.3.6/mithril.min.js`. Senza pin di versione unpkg risolve all'ultima major disponibile.

### 1.2 npm + ESM import

```bash
npm install mithril
```

Tipi TypeScript (da DefinitelyTyped, pacchetto separato):

```bash
npm install @types/mithril --save-dev
```

Import ESM standard:

```javascript
import m from "mithril";

m.render(document.getElementById("app"), "hello world");
```

> **Gotcha (ESM nativo nel browser):** Mithril è compatibile con la sintassi `import`/`export` nativa dei browser moderni, ma i browser **non** supportano la module resolution "magica" di Node. Non puoi fare `import * as _ from "lodash-es"` con ESM nativo: solo path relativi o URL completi funzionano. Per gli specifier "bare" come `"mithril"` serve un bundler (esbuild/Webpack/Vite/Rollup) o un import map.

### 1.3 Quick start con esbuild

```bash
npm init --yes
npm install mithril
npm install esbuild --save-dev
```

`package.json` (script base, senza JSX):

```json
{
  "scripts": {
    "start": "esbuild index.js --bundle --outfile=bin/main.js --watch"
  }
}
```

`index.js`:

```javascript
import m from "mithril";
m.render(document.getElementById("app"), "hello world");
```

`index.html`:

```html
<!DOCTYPE html>
<body>
  <div id="app"></div>
  <script src="bin/main.js"></script>
</body>
```

```bash
npm run start
```

### 1.4 Starter template

Template ufficiali citati nei doc (scaffolding rapido):

- `mithril-vite-starter` (ArthurClemens)
- `mithril-esbuild-starter` (kevinfiol)
- `mithril-rollup-starter` (kevinfiol)

Esempio con `degit`:

```bash
npx degit kevinfiol/mithril-esbuild-starter hello-world
cd ./hello-world/
npm install
npm run dev
```

---

## 2. JSX: cos'è e come si trasforma

JSX è un'estensione di sintassi che intervalla tag HTML e JavaScript. **Non** fa parte di alcuno standard JS e **non** è richiesto per costruire app Mithril: è una preferenza stilistica che necessita di un build step.

Equivalenza di base — le due forme producono lo stesso vnode:

```jsx
// JSX
function MyComponent() {
  return {
    view: () => (
      <main>
        <h1>Hello world</h1>
      </main>
    ),
  };
}
```

```javascript
// hyperscript equivalente
function MyComponent() {
  return {
    view: () => m("main", [m("h1", "Hello world")]),
  };
}
```

Interpolazione di espressioni JS con graffe `{ }`:

```jsx
var greeting = "Hello";
var url = "https://google.com";
var link = <a href={url}>{greeting}!</a>;
// yields <a href="https://google.com">Hello!</a>
```

Uso di componenti — convenzione: prima lettera maiuscola, oppure accesso via property:

```jsx
m.render(document.body, <MyComponent />)
// equivalente a m.render(document.body, m(MyComponent))

<m.route.Link href="/home">Go home</m.route.Link>
// equivalente a m(m.route.Link, {href: "/home"}, "Go home")
```

> **Punto chiave sul pragma:** Mithril usa `m` come *factory function* del JSX (in React è `React.createElement`). Per i Fragment usa la stringa `"["` come fragment pragma (`pragmaFrag: "'['"` in Babel, `m.Fragment` in TypeScript). Questo perché in Mithril un fragment è rappresentato dal selettore `[`.

---

## 3. Setup JSX con Babel (JavaScript)

Per JavaScript, il modo più semplice di usare JSX è il plugin Babel `@babel/plugin-transform-react-jsx` con pragma `m`. (Per TypeScript vedi §4: non serve Babel.)

Babel richiede npm (incluso con Node.js). Inizializza il progetto:

```bash
npm init -y
```

### 3.1 Babel standalone

```bash
npm install @babel/core @babel/cli @babel/preset-env @babel/plugin-transform-react-jsx --save-dev
```

`.babelrc`:

```json
{
  "presets": ["@babel/preset-env"],
  "plugins": [
    [
      "@babel/plugin-transform-react-jsx",
      {
        "pragma": "m",
        "pragmaFrag": "'['"
      }
    ]
  ]
}
```

Script npm in `package.json`:

```json
{
  "name": "my-project",
  "scripts": {
    "babel": "babel src --out-dir bin --source-maps"
  }
}
```

```bash
npm run babel
```

> **Gotcha (`pragmaFrag`):** il valore è `"'['"` — cioè una **stringa che contiene l'apostrofo** `'['`. Nel JSON `.babelrc` va scritto esattamente così: gli apici interni fanno parte del valore passato a Babel, che deve emettere il letterale stringa `"["` come tag del fragment. Ometterlo rompe i fragment JSX (`<></>`-style) ma non i tag normali.

### 3.2 Babel + Webpack

Se non hai Webpack:

```bash
npm install webpack webpack-cli --save-dev
```

Dipendenze Babel per l'integrazione:

```bash
npm install @babel/core babel-loader @babel/preset-env @babel/plugin-transform-react-jsx --save-dev
```

`.babelrc` (identico a §3.1):

```json
{
  "presets": ["@babel/preset-env"],
  "plugins": [
    [
      "@babel/plugin-transform-react-jsx",
      {
        "pragma": "m",
        "pragmaFrag": "'['"
      }
    ]
  ]
}
```

`webpack.config.js`:

```javascript
const path = require("path");

module.exports = {
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "./bin"),
    filename: "app.js",
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /\/node_modules\//,
        use: {
          loader: "babel-loader",
        },
      },
    ],
  },
  resolve: {
    extensions: [".js", ".jsx"],
  },
};
```

Entry point assunto `src/index.js`, output `bin/app.js`.

Script npm:

```json
{
  "name": "my-project",
  "scripts": {
    "start": "webpack --mode development --watch"
  }
}
```

```bash
npm start
```

> **Gotcha (config Babel in `babel-loader`):** mettere le opzioni Babel (`pragma`, ecc.) inline nella sezione `babel-loader` del `webpack.config.js` **genera un errore**. Le opzioni vanno tenute nel file `.babelrc` separato.

### 3.3 Production build

Build minificata via script npm dedicato:

```json
{
  "name": "my-project",
  "scripts": {
    "start": "webpack -d --watch",
    "build": "webpack -p"
  }
}
```

Hook di build automatica in produzione (esempio Heroku):

```json
{
  "name": "my-project",
  "scripts": {
    "start": "webpack -d --watch",
    "build": "webpack -p",
    "heroku-postbuild": "webpack -p"
  }
}
```

> **Nota:** i flag `-d`/`-p` (development/production) sono la sintassi Webpack 4 mostrata nei doc Mithril 2.x. Su Webpack 5 usa invece `--mode development` / `--mode production` (vedi `--mode development` nello script `start` di §3.2). I doc mescolano entrambe le forme; preferisci `--mode` su toolchain moderne.

### 3.4 `m` globale via Webpack ProvidePlugin

Per accedere a `m` globalmente in tutto il progetto senza import espliciti, in `webpack.config.js`:

```javascript
const webpack = require('webpack')
```

```javascript
{
  plugins: [
    new webpack.ProvidePlugin({
      m: "mithril",
    }),
  ];
}
```

> **Gotcha:** `ProvidePlugin` inietta `m` solo nei moduli bundlati da Webpack. JSX necessita comunque che `m` sia in scope al momento della trasformazione: con ProvidePlugin Webpack lo fornisce automaticamente, quindi puoi omettere `import m from "mithril"` nei file sorgente. Senza ProvidePlugin ogni file `.jsx` deve importare `m` esplicitamente, altrimenti il codice trasformato (`m(...)`) lancia `ReferenceError`.

---

## 4. Setup JSX con TypeScript (.tsx)

TypeScript transpila JSX da solo: **non serve Babel**. Basta configurare `tsconfig.json`.

`compilerOptions`:

```json
{
  "compilerOptions": {
    "jsx": "react",
    "jsxFactory": "m",
    "jsxFragmentFactory": "m.Fragment"
  }
}
```

- `jsx: "react"` → modalità di trasformazione classica (factory call).
- `jsxFactory: "m"` → usa `m(...)` invece di `React.createElement`.
- `jsxFragmentFactory: "m.Fragment"` → equivalente TS del `pragmaFrag` di Babel.

### 4.1 Closure components in TS + JSX (workaround)

> **Raccomandazione ufficiale:** a causa di [TypeScript#21699](https://github.com/microsoft/TypeScript/issues/21699), i doc **sconsigliano** l'uso di [closure components](components.md#closure-component-state) in TypeScript con JSX. Preferisci class components (senza ispezione attributi) o hyperscript.

Il problema: TS si aspetta un oggetto attributi come parametro del componente, ma Mithril passa un `Vnode`. Questo causa errori in editor anche se il JSX compila. Codice che fallisce:

```tsx
interface Attributes {
  greet: string
}
function ChildComponent(vNode: Vnode<Attributes>): m.Component<Attributes> {
  return {
    view: () => <div>{vNode.attrs.greet}</div>
  };
}

function ParentComponent() {
  return {
    view: () => <div>
      <ChildComponent greet="Hello World"/>
    </div>
  };
}
```

Errori TS emessi:

```
TS2739: Type { greet: string; } is missing the following properties from type Vnode<{}, {}>: tag, attrs, state
TS2786: ChildComponent cannot be used as a JSX component.
```

Tre opzioni per aggirarlo:

1. **Usa hyperscript per quel componente:** invece di `<div><ChildComponent greet="Hello World"/></div>` scrivi `<div>{m(ChildComponent, {greet: "Hello World"})}</div>`.
2. **Usa class components:** non mostrano errori, ma TS non potrà autocompletare/ispezionare gli attributi (`greet` risulterebbe `unknown` in `ParentComponent`).
3. **Translation function** per "ingannare" il type checker.

Helper della translation function (opzione 3), che compila senza errori:

```tsx
// Forza TS a trattare i closure component come JSX component validi
export function TsClosureComponent<T>(create: Mithril.ClosureComponent<T>) {
  return create as any as (
    (attrs: T & Mithril.CommonAttributes<T, unknown>) => JSX.Element
  )
}

interface Attributes {
  greet: string
}

const ChildComponent = TsClosureComponent<Attributes>(vNode => {
  return {
    view: () => <div>{vNode.attrs.greet}</div>
  };
})

function ParentComponent() {
  return {
    view: () => <div>
      <ChildComponent greet="Hello World"/>
    </div>
  };
}
```

Funziona anche con i generics, purché il generic sia definito nel componente wrappato:

```tsx
function ChildComponentImpl<T>() {
  // ...
}

const ChildComponent = TsClosureComponent(ChildComponentImpl);

const jsx = <div>
  <ChildComponent<SomeClass> />
</div>
```

---

## 5. Setup JSX con esbuild

esbuild supporta JSX nativamente tramite flag CLI. Aggiungi `--jsx-factory=m` e `--jsx-fragment` allo script.

`package.json`:

```json
{
  "scripts": {
    "start": "esbuild index.js --bundle --outfile=bin/main.js --jsx-factory=m --jsx-fragment='\"[\"' --watch"
  }
}
```

> **Gotcha (quoting di `--jsx-fragment`):** il valore deve essere il letterale stringa `"["`. Nel JSON dello script va scritto `'\"[\"'` — apici singoli esterni più doppi apici escapati interni — così esbuild riceve `"["` come token del fragment. Stesso concetto del `pragmaFrag` di Babel e del `jsxFragmentFactory` di TS, solo con quoting da shell.

---

## 6. ES6+ e transpiling per browser legacy

Mithril.js è scritto in **ES5** ma è pienamente compatibile con ES6+. Tutti i browser moderni supportano ES6 nativamente (incluso il module syntax nativo). Quindi puoi usare arrow function per i closure component e `class` per i class component senza transpiling, **se** non devi supportare browser vecchi (es. Internet Explorer). Per IE & co. serve Babel per ridurre a ES5.

### Babel standalone (ES6 → ES5, senza JSX)

```bash
npm install @babel/cli @babel/preset-env --save-dev
```

`.babelrc`:

```json
{
  "presets": ["@babel/preset-env"],
  "sourceMaps": true
}
```

```bash
babel src --out-dir dist
```

Script npm:

```json
{
  "scripts": {
    "build": "babel src --out-dir dist"
  }
}
```

### Babel + Webpack (ES6 → ES5)

```bash
npm install webpack webpack-cli @babel/core babel-loader @babel/preset-env --save-dev
```

`.babelrc` come sopra. `webpack.config.js`:

```javascript
const path = require('path')

module.exports = {
  entry: path.resolve(__dirname, 'src/index.js'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'app.js',
  },
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /\/node_modules\//,
      use: {
        loader: 'babel-loader'
      }
    }]
  }
}
```

> **Nota su Browserslist:** se non configuri nulla, Browserslist usa la query di default `> 0.5%, last 2 versions, Firefox ESR, not dead`, che è sensata nella maggior parte dei casi. Configura una query custom solo per requisiti molto specifici (es. IE 8 con molti polyfill). **Differenza con il setup JSX (§3):** qui il `.babelrc` per il solo ES6 non include `@babel/plugin-transform-react-jsx`; se usi anche JSX devi aggiungerlo (e relativo `pragma`/`pragmaFrag`).

---

## 7. Differenze JSX Mithril vs React

JSX in Mithril ha differenze sottili ma importanti rispetto a React.

### 7.1 Attributi e nomi di property/style

- **Attributi:** React richiede i nomi di *DOM property* camelCase (`className`, `htmlFor`) tranne per `data-*` e `aria-*`. **In Mithril è idiomatico usare i nomi degli attributi HTML lowercase** (`class`, `for`). Mithril ricade automaticamente su `setAttribute` se una property non esiste, quindi puoi sempre usare gli attributi HTML. Nella maggior parte dei casi nome property e nome attributo coincidono o sono simili (`value`, `checked` identici; `tabindex` → property `tabIndex`). Eccezioni note: property `className` per l'attributo `class`, property `htmlFor` per l'attributo `for`.
- **Style:** React usa solo le property camelCase di `elem.style` (`cssHeight`, `backgroundColor`). **Mithril supporta sia quello sia i nomi CSS kebab-case** (`height`, `background-color`), e i nomi CSS con trattino sono l'idioma preferito. Solo `cssHeight`, `cssFloat` e alcune property vendor-prefixed differiscono per più del semplice case.

```jsx
// Idiomatico Mithril (HTML attribute + CSS kebab-case)
<label class="field" for="email">
  <input id="email" style={{ "background-color": "#eee", height: "2rem" }} />
</label>
```

### 7.2 Eventi DOM

- React capitalizza la prima lettera (`onClick` → `click`, `onSubmit` → `submit`) e concatena le parole (`onMouseMove` → `mousemove`).
- **Mithril non fa case mapping:** antepone solo `on` al nome nativo dell'evento. Quindi `onclick`, `onmousemove`, `onsubmit` — tutto lowercase, aderente all'HTML.

```jsx
// Mithril
<button onclick={(e) => doThing(e)}>Click</button>
<div onmousemove={handleMove} />
```

> **Gotcha (capture phase):** React supporta i listener in fase di capture con il suffisso `Capture` (`onClickCapture`). **Mithril non ha equivalente.** Se serve la capture phase, aggiungi/rimuovi manualmente i tuoi listener nei [lifecycle hooks](lifecycle-methods.md) (es. `oncreate`/`onremove` con `addEventListener(..., true)`).

---

## 8. JSX vs hyperscript: quando usare cosa

Due sintassi per gli stessi vnode, con tradeoff diversi.

**JSX** — meglio se vieni da un background HTML/XML:
- Più leggibile per molti (meno punteggiatura, attributi con meno rumore visivo).
- Autocomplete degli elementi DOM come per l'HTML in molti editor.
- **Contro:** richiede un build step, supporto editor meno ampio del JS puro, più verboso. Più verboso ancora con molto contenuto dinamico, perché tutto va interpolato con `{ }`.

**Hyperscript** — meglio se vieni da un background backend JS:
- Più conciso, meno ridondanza.
- Zucchero sintattico CSS-like per classi/ID/attributi statici (es. `m("a.feed-icon[src=./x.gif]")`).
- **Nessun build step** (opzionale: l'ottimizzatore [mopt](https://github.com/MithrilJS/mopt)).
- Più facile con molto contenuto dinamico: non serve "interpolare" nulla.
- **Contro:** la terseness lo rende più ostico per chi viene dal front-end HTML/CSS/XML; nessun plugin nota che autocompleti ID/classi/attributi nei selettori hyperscript.

Confronto sullo stesso albero (estratto dai doc):

```javascript
// hyperscript
function feed(type, href) {
  return m(".feed", [
    type,
    m("a", { href }, m("img.feed-icon[src=./feed-icon-16.gif]")),
  ]);
}
```

```jsx
// JSX equivalente
function feed(type, href) {
  return (
    <div class="feed">
      {type}
      <a href={href}>
        <img class="feed-icon" src="./feed-icon-16.gif" />
      </a>
    </div>
  );
}
```

Branch condizionale e liste:

```javascript
// hyperscript
tag != null
  ? m(TagHeader, { len: posts.length, tag })
  : m(".summary-header", [
      m(".summary-title", "Posts, sorted by most recent."),
      m(TagSearch),
    ]),

m(".blog-list",
  posts.map((post) =>
    m(m.route.Link, { class: "blog-entry", href: `/posts/${post.url}` }, [
      m(".post-title", post.title),
    ])
  )
)
```

```jsx
// JSX
{tag != null ? (
  <TagHeader len={posts.length} tag={tag} />
) : (
  <div class="summary-header">
    <div class="summary-title">Posts, sorted by most recent</div>
    <TagSearch />
  </div>
)}

<div class="blog-list">
  {posts.map((post) => (
    <m.route.Link class="blog-entry" href={`/posts/${post.url}`}>
      <div class="post-title">{post.title}</div>
    </m.route.Link>
  ))}
</div>
```

> **Regola pratica da esperto:** preferisci **hyperscript** quando l'albero è ricco di logica/contenuto dinamico (mappature, condizioni, attributi calcolati) o quando vuoi zero build step; preferisci **JSX** per markup prevalentemente statico e team con forte background HTML. I due stili sono interoperabili nello stesso file (vedi §4.1, opzione 1): in JSX puoi sempre annidare `{m(Component, attrs)}` per casi che JSX gestisce male.

---

## 9. Pattern ES6 moderni

I doc confermano l'uso idiomatico di arrow function (closure component) e `class` (class component) senza transpiling sui browser moderni. Pattern derivati dagli esempi sorgente:

### Closure component con stato locale (closure over variabili)

Lo stato vive nella closure; niente `this`. `init({ attrs })` destruttura il vnode.

```javascript
function SummaryView() {
  let tag, posts; // stato privato nella closure

  function init({ attrs }) {           // destructuring del vnode
    if (attrs.tag != null) {
      tag = attrs.tag.toLowerCase();
      posts = Model.getTag(tag);
    } else {
      tag = undefined;
      posts = Model.posts;
    }
  }

  return {
    oninit: init,
    onbeforeupdate: init, // ri-esegue init sul cambio route per diffing corretto
    view: () =>
      m(".blog-summary", [
        m("p", "My ramblings about everything"),
        // ...
      ]),
  };
}
```

> **Gotcha (closure component):** la funzione esterna gira **una sola volta per istanza di componente** (alla creazione), non a ogni redraw. Le variabili dichiarate lì sono lo stato. Se hai bisogno di reagire al cambio degli `attrs` tra redraw (es. cambio route con stesso componente), ricalcola in `onbeforeupdate`/`oninit` come sopra — non assumere che la closure si ri-esegua.

### Destructuring del vnode nei lifecycle / view

```javascript
// destructuring di attrs e children dal Vnode
const Card = {
  view: ({ attrs, children }) =>
    m(".card", { class: attrs.variant }, children),
};

// uso
m(Card, { variant: "primary" }, m("p", "contenuto"));
```

### Arrow function come view inline

```javascript
const Hello = { view: () => m("h1", "Hello world") };
```

### Shorthand di property ES6 negli attributi

```javascript
// { href } equivale a { href: href }
function link(href, label) {
  return m("a", { href }, label);
}
```

### Template literal per URL/route dinamici

```javascript
m(m.route.Link, { href: `/posts/${post.url}` }, post.title);
```

> **Gotcha (ESM nativo, ricordare da §1.2):** `import m from "mithril"` con specifier bare richiede un bundler. In ESM browser puro funzionano solo path relativi/URL. Non confondere "Mithril supporta ES6" con "il browser risolve i bare specifier".

---

## 10. Tips & tricks (HTML → JSX/hyperscript)

### HTML → JSX

In Mithril, HTML ben formato è generalmente JSX valido. Servono pochi aggiustamenti, dovuti al fatto che JSX è basato su XML, non HTML:

- Quota i valori non quotati: `attr=value` → `attr="value"`.
- Chiudi i void element: `<input>` → `<input />`.

```jsx
// HTML:   <input type="text" required>
// JSX:    <input type="text" required />
```

### HTML → hyperscript

Per hyperscript spesso serve tradurre l'HTML. Converter community ufficiale citato nei doc: `https://arthurclemens.github.io/mithril-template-converter/index.html`.

---

## Checklist esperto

1. **Pragma corretto sempre:** Babel `pragma: "m"` + `pragmaFrag: "'['"`; TS `jsxFactory: "m"` + `jsxFragmentFactory: "m.Fragment"`; esbuild `--jsx-factory=m --jsx-fragment='"["'`. Sbagliare il fragment pragma rompe solo i fragment, non i tag — bug subdolo.
2. **`m` deve essere in scope** in ogni file JSX: importa `import m from "mithril"` oppure configura `webpack.ProvidePlugin({ m: "mithril" })`. Codice trasformato senza `m` in scope = `ReferenceError` a runtime.
3. **Non mettere le opzioni Babel in `babel-loader`** dentro `webpack.config.js`: vanno in `.babelrc`, altrimenti Webpack lancia errore.
4. **Usa attributi HTML lowercase** (`class`, `for`) e CSS kebab-case (`background-color`), non i nomi React (`className`, `htmlFor`, `backgroundColor`): è l'idioma Mithril e riduce attrito nel copia-incolla da HTML.
5. **Eventi senza camelCase:** `onclick`, `onmousemove`, `onsubmit`. Per la capture phase (assente in Mithril) usa listener manuali nei lifecycle hook.
6. **Evita closure component in TypeScript+JSX:** preferisci hyperscript inline (`{m(Child, attrs)}`) o class component; usa l'helper `TsClosureComponent` solo se devi davvero mantenere closure component tipizzati.
7. **Transpila a ES5 solo se serve:** i browser moderni eseguono ES6+ nativamente. Aggiungi `@babel/preset-env` per IE & co.; lascia la query Browserslist di default a meno di requisiti specifici.
8. **Pin di versione su CDN in produzione** e usa il file `.min.js`; per ESM nativo nel browser ricorda che i bare specifier (`"mithril"`) richiedono un bundler o un import map.
```