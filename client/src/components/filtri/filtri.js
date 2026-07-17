// src/components/filtri/filtri.js

import "./filtri.scss"
import { Accordion } from "carbon-components"
import FiltriItem from "components/filtri_item/filtri_item.js"
import DataPicker from "components/datapicker/datapicker.js"
import FiltroLineeContent from "components/filtro_linee_content/filtro_linee_content.js"
import FiltroTecnologiaContent from "components/filtro_tecnologia_content/filtro_tecnologia_content.js"
import FiltroMsdContent from "components/filtro_msd_content/filtro_msd_content.js"
import FiltroSelectContent from "components/filtro_select_content/filtro_select_content.js"

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
                    m(FiltriItem, { content: DataPicker,              content_id: "filtro_data",       content_title: "Data" }),
                    m(FiltriItem, { content: FiltroLineeContent,      content_id: "filtro_linee",      content_title: "Linee" }),
                    m(FiltriItem, { content: FiltroTecnologiaContent, content_id: "filtro_tecnologia", content_title: "Tecnologia" }),
                    m(FiltriItem, { content: FiltroMsdContent,        content_id: "filtro_msd",        content_title: "Unità Abilitata MSD" }),
                    m(FiltriItem, { content: FiltroSelectContent, content_id: "filtro_sottotipo", content_title: "Sottotipo",
                        content_attrs: { id: "#filtro_sottotipo", placeholder: "Sottotipo", $filter: appState.$filterSottotipo, $select: appState.$selectSottotipo, tipo: "sottotipo" } }),
                    m(FiltriItem, { content: FiltroSelectContent, content_id: "filtro_societa", content_title: "Societa",
                        content_attrs: { id: "#filtro_societa", placeholder: "Societa", $filter: appState.$filterSocieta, $select: appState.$selectSocieta, tipo: "company" } }),
                    m(FiltriItem, { content: FiltroSelectContent, content_id: "filtro_impianto", content_title: "Impianto",
                        content_attrs: { id: "#filtro_impianto", placeholder: "Impianto", $filter: appState.$filterImpianto, $select: appState.$selectImpianto, tipo: "impianto" } }),
                    m(FiltriItem, { content: FiltroSelectContent, content_id: "filtro_unita", content_title: "Unita",
                        content_attrs: { id: "#filtro_unita", placeholder: "Unita", $filter: appState.$filterUnita, $select: appState.$selectUnita, tipo: "etso" } }),
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
