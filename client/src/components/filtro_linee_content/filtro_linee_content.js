// src/components/filtro_linee_content/filtro_linee_content.js

import CheckBox from "components/checkbox/checkbox.js"

class FiltroLineeContent {
    constructor() {
        if (process.env.NODE_ENV !== "production") {
            this._componentName = this.constructor.name
        }
    }

    oninit() {
        this.checkboxs = [
            { label: "Linee 380", state: appState.$linee_380_visibility },
            { label: "Linee 220", state: appState.$linee_220_visibility },
        ]
    }

    view({ state }) {
        // prettier-ignore
        return m("fieldset.bx--fieldset", [
            this.checkboxs.map(checkbox => {
                let label = checkbox.label
                let checkBoxId = "bx--" + label.toLowerCase().replace(" ", "-")
                return m(CheckBox, {
                    id: checkBoxId,
                    label: label,
                    checked: checkbox.state.get(),
                    onchange: () => { checkbox.state.set(!checkbox.state.get()) },
                })
            }),
        ])
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

export default FiltroLineeContent
