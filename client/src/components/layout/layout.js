// src/components/layout/layout.js

class Layout {
    constructor() {
        if (process.env.NODE_ENV !== "production") {
            this._componentName = this.constructor.name
        }
    }

    _toggleSideBar(type) {
        if (type == "left") {
            appState.sidebarLeft = !appState.sidebarLeft
        } else {
            appState.sidebarRight = !appState.sidebarRight
        }
    }

    view({ attrs, state }) {
        // prettier-ignore
        return m("#layout", [
            m(attrs.sidebarLeft, {class: (appState.sidebarLeft ? "active" : "") + " " + "left",type: "left", }),
            m(attrs.burgerLeft, {class: (appState.sidebarLeft ? "active" : "") + " " + "left",onclick: () => { state._toggleSideBar("left") }}),
            m(attrs.sidebarRight, {class: (appState.sidebarRight ? "active" : "") + " " + "right", type: "right"}),
            m(attrs.burgerRight, {class: (appState.sidebarRight ? "active" : "") + " " + "right", onclick: () => { state._toggleSideBar("right") }}),
            m(attrs.remitTransmission),
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

export default Layout
