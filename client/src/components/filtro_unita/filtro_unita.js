// src/components/filtro_unita/filtro_unita.js

import "./filtro_unita.scss"
import FiltriItem from "components/filtri_item/filtri_item.js"
import FiltroUnitaContent from "components/filtro_unita_content/filtro_unita_content.js"

class FiltroUnita {
    constructor() {
        if (process.env.NODE_ENV !== "production") {
            this._componentName = this.constructor.name
        }
    }

    view() {
        // prettier-ignore
        return m(FiltriItem, {
            content: FiltroUnitaContent,
            content_id: "filtro_unita",
            content_title: "Unita",
        })
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

export default FiltroUnita
