// src/components/filtro_tecnologia_content/filtro_tecnologia_content.js

import CheckBox from "components/checkbox/checkbox.js"
import Slider from "components/slider/slider.js"

class FiltroTecnologiaContent {
    constructor() {
        if (process.env.NODE_ENV !== "production") {
            this._componentName = this.constructor.name
        }
    }

    oninit() {
        this.tecnologies = [
            { label: "Termico", stateChk: appState.$termicoVisibility, statePminPmax: appState.$termicoPminPmax, range: { min: 0, max: 1200 }, step: [0, 200, 400, 600, 800, 1000, 1200] },
            { label: "Idrico", stateChk: appState.$idricoVisibility, statePminPmax: appState.$idricoPminPmax, range: { min: 0, max: 1200 }, step: [0, 200, 400, 600, 800, 1000, 1200] },
            { label: "Eolico", stateChk: appState.$eolicoVisibility, statePminPmax: appState.$eolicoPminPmax, range: { min: 0, max: 300 }, step: [0, 50, 100, 150, 200, 250, 300] },
            { label: "Autoproduttore", stateChk: appState.$autoprodVisibility, statePminPmax: appState.$autoprodPminPmax, range: { min: 0, max: 300 }, step: [0, 50, 100, 150, 200, 250, 300] },
            { label: "Solare", stateChk: appState.$solareVisibility, statePminPmax: appState.$solarePminPmax, range: { min: 0, max: 300 }, step: [0, 50, 100, 150, 200, 250, 300] },
            { label: "Geotermico", stateChk: appState.$geotermicoVisibility, statePminPmax: appState.$geotermicoPminPmax, range: { min: 0, max: 300 }, step: [0, 50, 100, 150, 200, 250, 300] },
            { label: "Pompaggio", stateChk: appState.$pompaggiVisibility, statePminPmax: appState.$pompaggiPminPmax, range: { min: -1300, max: 1300 }, step: [-1300, -850, -400, 0, 400, 850, 1300] },
        ]
    }

    view({ state }) {
        // prettier-ignore
        return m("fieldset.bx--fieldset", [
            this.tecnologies.map(tecnologia => {
                let label = tecnologia.label
                let checkBoxId = "bx--checkbox__" + label.toLowerCase()
                let sliderId   = "bx--slider__" + label.toLowerCase()
                return m(".bx--form-item", [
                        m(CheckBox, {
                            id: checkBoxId, 
                            label: label,
                            checked: tecnologia.stateChk.get(),
                            onchange: () => tecnologia.stateChk.set(!tecnologia.stateChk.get()),
                        }),
                        m(Slider,{
                            id: sliderId,
                            pminpmax: tecnologia.statePminPmax,
                            range: tecnologia.range,
                            step: tecnologia.step, 
                            onchange: selection => tecnologia.statePminPmax.set(selection),
                        })
                        
                ])
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

export default FiltroTecnologiaContent
