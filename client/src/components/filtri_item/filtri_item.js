// src/components/filtri_item/filtri_item.js

import "./filtri_item.css"
import DataPicker from "components/datapicker/datapicker.js"

class FiltriItem {
    constructor() {
        if (process.env.NODE_ENV !== "production") {
            this._componentName = this.constructor.name
        }
    }

    view({ attrs }) {
        // prettier-ignore
        return m("li.bx--accordion__item[data-accordion-item='']", [
            m("button.bx--accordion__heading[aria-controls='pane1'][aria-expanded='false']", [
                m("svg.bx--accordion__arrow[fill-rule='evenodd'][height='12'][viewBox='0 0 8 12'][width='8']",
                    m("path[d='M0 10.6L4.7 6 0 1.4 1.4 0l6.1 6-6.1 6z']")
                ),
                m("p.bx--accordion__title.bx--type-epsilon", attrs.content_title),
            ]),
            m(`.bx--accordion__content[id='${attrs.content_id}']`, m(attrs.content, attrs.content_attrs || {})),
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

export default FiltriItem
