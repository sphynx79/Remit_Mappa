// src/components/filtro_select_content/filtro_select_content.js

import Select from "components/select/select.js"

// Content unificato dei 4 filtri a select (sottotipo, societa, impianto, unita),
// parametrizzato via attrs: { id, placeholder, $filter, $select, tipo }
class FiltroSelectContent {
    constructor() {
        if (process.env.NODE_ENV !== "production") {
            this._componentName = this.constructor.name
        }
    }

    oninit({ attrs, state }) {
        state.$filterOpt = lens({
            get: () => appState.dispatch("parseFilter", [attrs.$filter.get(), attrs.tipo]),
            set: selection => attrs.$select.set(selection),
        })
    }

    view({ attrs, state }) {
        // prettier-ignore
        return m(".bx--form-item",
                [
                      m(Select, {
                          id: attrs.id,
                          placeholder: attrs.placeholder,
                          data: state.$filterOpt,
                          onchange: selection => state.$filterOpt.set(selection),
                      }),
                  ]
        )
    }

    oncreate({ attrs, state }) {
        if (process.env.NODE_ENV !== "production") {
            let logStateAttrs = {
                attrs: attrs,
                state: state,
            }
            console.log(`Component: ${this._componentName}`, logStateAttrs)
        }
    }
}

export default FiltroSelectContent
