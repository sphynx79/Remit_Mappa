// src/components/select/select.js

import "./select.scss"
// il wrapping UMD di selectr viene forzato in CommonJS dalla rule imports-loader in webpack.common.js
const Selectr = require("mobius1-selectr")

class Select {
    constructor() {
        if (process.env.NODE_ENV !== "production") {
            this._componentName = this.constructor.name
        }
    }

    view({ attrs }) {
        // prettier-ignore
        return m("select")
    }

    oncreate(vnode) {
        let el = vnode.dom

        vnode.select = new Selectr(el, {
            searchable: true,
            multiple: true,
            clearable: true,
            defaultSelected: false,
            closeOnScroll: false,
            placeholder: vnode.attrs.placeholder,
            data: vnode.attrs.data.get(),
            customClass: "custom-style",
            width: 500,
            // pagination: 30,
        })

        let elId = document.querySelector(`${vnode.attrs.id}`)

        vnode.select.on("selectr.open", () => {
            elId && elId.style.setProperty("--space", "16rem")
            // debugger
            // document.querySelector("#sidebar_right > div > ul").scrollTop += 500
        })

        vnode.select.on("selectr.close", () => {
            elId && elId.style.setProperty("--space", "4rem")
        })

        vnode.select.on("selectr.change", option => {
            let options = vnode.select.getValue()
            vnode.attrs.onchange(options)
        })
        // let elSelect = elId.querySelector(".selectr-selected")
        // elSelect.addEventListener('focus', () => vnode.select.open());

        vnode.attrs.data.react(value => {
            // appState.$unita_visibility.react(r => console.dir(r), { skipFirst: true})
            // if (vnode.attrs.id == "#filtro_unita") {
            //     appState.$unita_visibility.set(value.map(value => value.value))
            // }
            // vnode.select.clear()
            vnode.select.removeAll()
            vnode.select.add(value)
            // vnode.select.setValue(value)
        })

        if (process.env.NODE_ENV !== "production") {
            let logStateAttrs = {
                attrs: vnode.attrs,
                state: vnode.state,
            }
            console.log(`Component: ${this._componentName}`, logStateAttrs)
        }
    }
}

export default Select
