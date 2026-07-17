// src/components/filtro_msd_content/filtro_msd_content.js

import RadioButton from "components/radio_button/radio_button.js"

class FiltroMsdContent {
    constructor() {
        if (process.env.NODE_ENV !== "production") {
            this._componentName = this.constructor.name
        }
    }

    oninit({ state }) {
        state.combos = ["ALL", "SI", "NO"]
        // state.id = "mercato"
        state.$filterOpt = lens({
            get: () => appState.dispatch("parseFilterMsd", [appState.$filterMsd.get()]),
            set: selection => appState.$msdComboValue.set(selection),
        })
    }

    view({ state }) {
        // prettier-ignore
        return m(".bx--form-item", m(".bx--radio-button-group", {onchange: (e) => state.$filterOpt.set(e.target.value) }, 
            state.combos.map(combo => {
                let checkBoxId = "bx--" + combo.toLowerCase()
                return m(RadioButton, {
                    id: checkBoxId,
                    label: combo,
                    state: this.checkenabled() ? "" : "[disabled=true]" , 
                    checked: state.$filterOpt.get() === combo ? true : "",
                })
            
            })
        )
        )
    }

    checkenabled() {
        let unique = [...new Set(appState.filterTecnologia().map(item => item["msd"]))]
        return unique.length == 2 ? true : false
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

export default FiltroMsdContent
