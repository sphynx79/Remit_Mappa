// src/components/filtri/filtri.js

import "./filtri.scss"
import { Accordion } from "carbon-components"
import FiltroData from "components/filtro_data/filtro_data.js"
import FiltroLinee from "components/filtro_linee/filtro_linee.js"
import FiltroTecnologia from "components/filtro_tecnologia/filtro_tecnologia.js"
import FiltroMsd from "components/filtro_msd/filtro_msd.js"
import FiltroSottotipo from "components/filtro_sottotipo/filtro_sottotipo.js"
import FiltroSocieta from "components/filtro_societa/filtro_societa.js"
import FiltroImpianto from "components/filtro_impianto/filtro_impianto.js"
import FiltroUnita from "components/filtro_unita/filtro_unita.js"

class Filtri {
    constructor() {
        if (process.env.NODE_ENV !== "production") {
            this._componentName = this.constructor.name
        }
    }

    view({ attrs, state }) {
        // prettier-ignore
        return m(".filtri",  [
                m("ul.bx--accordion[data-accordion='']", [
                    m(FiltroData),
                    m(FiltroLinee),
                    m(FiltroTecnologia),
                    m(FiltroMsd),
                    m(FiltroSottotipo),
                    m(FiltroSocieta),
                    m(FiltroImpianto),
                    m(FiltroUnita),
            ]),
        ])
    }

    oncreate(vnode) {
        let el = vnode.dom.firstElementChild
        vnode.state.accordion = Accordion.create(el)
        if (process.env.NODE_ENV !== "production") {
            let logStateAttrs = {
                attrs: vnode.attrs,
                state: vnode.state,
            }
            console.log(`Component: ${this._componentName}`, logStateAttrs)
        }
    }

    onremove({ state }) {
        if (state.accordion) state.accordion.release()
    }
}

export default Filtri
