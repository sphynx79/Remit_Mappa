// src/model/app.js

import { atom, derive } from "derivable"

class App {
    constructor() {
        this._modelName = this.constructor.name
        this.server = window.location.hostname
        // server configuration
        this.port = process.env.NODE_ENV == "production" ? 80 : 9292
        // sidebar state to interact with burger with sidebar, in layout.js
        this.sidebarLeft = false
        this.sidebarRight = false
        this.$data = atom(dayjs().add(1, "day").format('YYYY-MM-DD'))
        // toogle dashboard
        this.dashboard = false
        // click table row fly in mapbox
        this.$selectLine = atom()
        this.$selectCentrale = atom()
        // toggle visibility linee
        this.$linee_380_visibility = atom(true)
        this.$linee_220_visibility = atom(true)
        // toggle visibility tecnologia
        this.$termicoVisibility = atom(true)
        this.$eolicoVisibility = atom(true)
        this.$idricoVisibility = atom(true)
        this.$autoprodVisibility = atom(true)
        this.$solareVisibility = atom(true)
        this.$pompaggiVisibility = atom(true)
        this.$geotermicoVisibility = atom(true)
        // filtro pmin e pmax tecnologia
        this.$termicoPminPmax = atom([0, 1200])
        this.$eolicoPminPmax = atom([0, 300])
        this.$idricoPminPmax = atom([0, 1200])
        this.$autoprodPminPmax = atom([0, 300])
        this.$solarePminPmax = atom([0, 300])
        this.$pompaggiPminPmax = atom([-1300, 1300])
        this.$geotermicoPminPmax = atom([0, 300])
        // filro msd
        this.$msdComboValue = atom("ALL")
        // sincronizzare i filtri
        this.$lista_centrali = atom(this.fetchCentrali())
        this.$filterMsd = derive(() => this.filterMsd(this.filterTecnologia(), this.$msdComboValue.get()))
        this.$filterSottotipo = derive(() => this.$filterMsd.get())
        this.$selectSottotipo = atom([])
        this.$filterSocieta = derive(() => this.filterUnita(this.$filterSottotipo.get(), this.$selectSottotipo.get(), "sottotipo"))
        this.$selectSocieta = atom([])
        this.$filterImpianto = derive(() => this.filterUnita(this.$filterSocieta.get(), this.$selectSocieta.get(), "company"))
        this.$selectImpianto = atom([])
        this.$filterUnita = derive(() => this.filterUnita(this.$filterImpianto.get(), this.$selectImpianto.get(), "impianto"))
        this.$selectUnita = atom([])
        this.$unitaVisibility = derive(() => this.filterUnita(this.$filterUnita.get(), this.$selectUnita.get(), "etso"))
        this.$etsoVisibility = derive(() => this.$unitaVisibility.get().map(item => item["etso"]))
        // gestione remit
        this.$remit_220 = atom()
        this.$remit_380 = atom()
        this.$remit_centrali = atom()
        this.$remitCentraliFiltered = derive(() => this.filterRemitCentrali())
    }

    dispatch(action, args) {
        return this[action].apply(this, args || [])
    }

    filterTecnologia() {
        if (this.$lista_centrali.get() === undefined) return []
        let filterArray = []
        this.$termicoVisibility.get() && filterArray.push({ tipo: "TERMICO", pmin: this.$termicoPminPmax.get()[0], pmax: this.$termicoPminPmax.get()[1] })
        this.$eolicoVisibility.get() && filterArray.push({ tipo: "EOLICO", pmin: this.$eolicoPminPmax.get()[0], pmax: this.$eolicoPminPmax.get()[1] })
        this.$idricoVisibility.get() && filterArray.push({ tipo: "IDRICO", pmin: this.$idricoPminPmax.get()[0], pmax: this.$idricoPminPmax.get()[1] })
        this.$autoprodVisibility.get() && filterArray.push({ tipo: "AUTOPRODUTTORE", pmin: this.$autoprodPminPmax.get()[0], pmax: this.$autoprodPminPmax.get()[1] })
        this.$solareVisibility.get() && filterArray.push({ tipo: "SOLARE", pmin: this.$solarePminPmax.get()[0], pmax: this.$solarePminPmax.get()[1] })
        this.$pompaggiVisibility.get() && filterArray.push({ tipo: "POMPAGGIO", pmin: this.$pompaggiPminPmax.get()[0], pmax: this.$pompaggiPminPmax.get()[1] })
        this.$geotermicoVisibility.get() && filterArray.push({ tipo: "GEOTERMICO", pmin: this.$geotermicoPminPmax.get()[0], pmax: this.$geotermicoPminPmax.get()[1] })
        let filterArrayLenght = filterArray.length
        let centrali = this.$lista_centrali.get()
        let centraliLenght = centrali.length
        let centraliFiltered = []

        for (let i = 0; i < centraliLenght; i++) {
            let centrale = centrali[i]

            for (let y = 0; y < filterArrayLenght; y++) {
                let filter = filterArray[y]
                let min = centrale["tipo"] === "POMPAGGIO" ? centrale["pmin"] : centrale["pmax"]
                if (centrale["tipo"] === filter.tipo && min >= filter.pmin && centrale["pmax"] <= filter.pmax) {
                    centraliFiltered.push(centrale)
                    break
                }
            }
        }
        return centraliFiltered
    }

    filterUnita(filterValue, select, type) {
        if (select.length == 0) return filterValue
        let unitaFiltered = []
        let filterValueLength = filterValue.length
        for (let i = 0; i < filterValueLength; i++) {
            let unita = filterValue[i]
            if (select.indexOf(unita[type]) != -1) unitaFiltered.push(unita)
        }
        // return filterValue.filter(item => (select.length == 0 ? true : select.includes(item[type])))
        return unitaFiltered
    }

    filterRemitCentrali() {
        let remits = this.$remit_centrali.get()
        if (remits === undefined) return undefined
        let etsoVisibility = this.$etsoVisibility.get()
        return remits.features.filter(item => etsoVisibility.includes(item.properties.nome))
    }

    parseFilter(items, type) {
        let unique = [...new Set(items.map(item => item[type]))]
        let selectItems = unique.map(item => new Object({ value: item, text: item }))
        return selectItems
    }

    filterMsd(filterValue, select) {
        if (select == "ALL") {
            return filterValue
        }
        return filterValue.filter(item => item["msd"] == select)
    }

    parseFilterMsd(items) {
        let unique = [...new Set(items.map(item => item["msd"]))]
        return unique.length == 2 ? "ALL" : unique[0]
    }

    fetchCentrali() {
        // prettier-ignore
        m.request({ 
            method: "GET",
            url: `http://${this.server}:${this.port}/api/v1/units`,
            headers: (process.env.NODE_ENV == "production") ? {"Cache-Control": "public, max-age=0" } : {},
        }).then(response => {
            this.$lista_centrali.set(response)
        }).catch(err => {
            console.log("Errore richiesta json lista centrali", err)
        })
    }

    getRemit(url) {
        // prettier-ignore
        m.request({
                method: "GET",
                url: url,
            })
            .then(response => {
                switch (url) {
                  case String(url.match(/.*\/remits\/.*\/centrali/)):
                    this.$remit_centrali.set(response)
                    break
                  case String(url.match(/.*\/remits\/.*\/linee\/220/)):
                    this.$remit_220.set(response)
                    break
                  case String(url.match(/.*\/remits\/.*\/linee\/380/)):
                    this.$remit_380.set(response)
                    break
                  default:
                    console.log("Didn't match")
                    break
                }
                
            })
            .catch(err => {
                console.log(`Errore richiesta json remit  ${url}`, err)
            })
    }
    
    
}

window.appState = new App()
