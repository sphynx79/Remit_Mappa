// src/components/sidebar/sidebar.js

import "./sidebar.scss"
import Table from "components/table/table.js"
import Filtri from "components/filtri/filtri.js"
import Switch from "components/switch/switch.js"
import Grafico from "components/grafico/grafico.js"

class SideBar {
    constructor() {
        if (process.env.NODE_ENV !== "production") {
            this._componentName = this.constructor.name
        }
    }

    _getRemit(url) {
        let request = m.request({
            method: "GET",
            url: url,
        })
        return request
    }

    oninit({ state }) {
        let startDtDaily = derive(() => dayjs(appState.$data.get()).subtract(6, "month").format("DD-MM-YYYY"))
        let endDtDaily = derive(() => dayjs(appState.$data.get()).add(1, "month").format("DD-MM-YYYY"))
        let startDtHourly = derive(() => dayjs(appState.$data.get()).subtract(6, "day").format("DD-MM-YYYY"))
        let endDtHourly = derive(() => dayjs(appState.$data.get()).add(1, "day").format("DD-MM-YYYY"))
        state.$remitCentraliTecnologiaDaily = derive(() => state._getRemit(`${appState.protocolo}://${appState.server}:${appState.port}/api/v1/reports/${startDtDaily.get()}/${endDtDaily.get()}/centrali_tecnologia_daily${appState.cache}`))
        state.$remitCentraliTecnologiaHourly = derive(() =>
            state._getRemit(`${appState.protocolo}://${appState.server}:${appState.port}/api/v1/reports/${startDtHourly.get()}/${endDtHourly.get()}/centrali_tecnologia_hourly${appState.cache}`)
        )
        state.$remitCentraliZonaDaily = derive(() => state._getRemit(`${appState.protocolo}://${appState.server}:${appState.port}/api/v1/reports/${startDtDaily.get()}/${endDtDaily.get()}/centrali_zona_daily${appState.cache}`))
        state.$remitCentraliZonaHourly = derive(() => state._getRemit(`${appState.protocolo}://${appState.server}:${appState.port}/api/v1/reports/${startDtHourly.get()}/${endDtHourly.get()}/centrali_zona_hourly${appState.cache}`))
    }

    view({ attrs, state }) {
        // prettier-ignore
        if (attrs.type == "right") { 
            return m("nav.sidebar#sidebar_right", attrs, [appState.$lista_centrali.get() === undefined ? "" : m(Filtri)])
        } else {
            return m("nav.sidebar#sidebar_left", attrs, [
                m(Switch),
                m(".sidebar__content-wrapper#tabelle", [
                        appState.$remit_380.get()      === undefined ? "" : m(Table, { type: "linee",    volt: "380", remit: appState.$remit_380  }),
                        appState.$remit_220.get()      === undefined ? "" : m(Table, { type: "linee",    volt: "220", remit: appState.$remit_220 }),
                        appState.$remit_centrali.get() === undefined ? "" : m(Table, { type: "centrali", remit: appState.$remitCentraliFiltered }),
                ]), 
                m(".sidebar__content-wrapper#grafici", [ 
                        m(Grafico, { 
                            elId: "grafico-remit-tecnologia-daily",
                            title: "Totale indisponibilità programmate lungo termine per tecnologia",
                            data: state.$remitCentraliTecnologiaDaily 
                        }),
                        m(Grafico, { 
                            elId: "grafico-remit-tecnologia-hourly",
                            title: "Totale indisponibilità programmate breve termine per tecnologia",
                            data: state.$remitCentraliTecnologiaHourly 
                        }),
                        m(Grafico, { 
                            elId: "grafico-remit-zona-daily",
                            title: "Totale indisponibilità programmate lungo termine per zona",
                            data: state.$remitCentraliZonaDaily
                        }),
                        m(Grafico, { 
                            elId: "grafico-remit-zona-hourly",
                            title: "Totale indisponibilità programmate breve termine per zona",
                            data: state.$remitCentraliZonaHourly
                        }),
                ]), 
            ])
        }
    }

    oncreate({ attrs, state }) {
        let el = document.getElementById("grafici")
        el.setAttribute("hidden", "")
        if (process.env.NODE_ENV !== "production") {
            let logStateAttrs = {
                attrs: attrs,
                state: state,
            }
            console.log(`Component: ${this._componentName}`, logStateAttrs)
        }
    }
}

export default SideBar
