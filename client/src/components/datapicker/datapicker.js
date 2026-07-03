// src/components/datapicker/datapicker.js

import "./datapicker.css"
import { DatePicker } from "carbon-components"
import { Italian } from "flatpickr/dist/l10n/it.js"
import calendarIcon from "./calendarIcon.js"

class DataPicker {
    constructor() {
        if (process.env.NODE_ENV !== "production") {
            this._componentName = this.constructor.name
        }
    }

    oninit({ state }) {
        appState.$data.react(data => {
            let urlLinee220 = `${appState.protocolo}://${appState.server}:${appState.port}/api/v1/remits/${data}/linee/220`
            let urlLinee380 = `${appState.protocolo}://${appState.server}:${appState.port}/api/v1/remits/${data}/linee/380`
            let urlCentrali = `${appState.protocolo}://${appState.server}:${appState.port}/api/v1/remits/${data}/centrali`
            appState.dispatch("getRemit", [urlLinee220])
            appState.dispatch("getRemit", [urlLinee380])
            appState.dispatch("getRemit", [urlCentrali])
        })
    }

    view({ attrs, state }) {
        // prettier-ignore
        return m(".bx--form-item", [
            m(".bx--date-picker.bx--date-picker--single[data-date-picker=''][data-date-picker-type='single']",
                m(".bx--date-picker-container", [
                    m(calendarIcon),
                    m("input.bx--date-picker__input[data-date-picker-input=''][id='date-picker'][pattern='d{1,2}/d{1,2}/d{4}'][placeholder='dd/mm/yyyy'][type='text']"),
                    // m(".bx--form-requirement", "Invalid date format.")
                m(".bx--number__controls", [ m(".bx--number__control-btn.up-icon", {
                            onclick: () => this.changeData(1)
                        },
                        m("svg[fill-rule='evenodd'][height='5'][viewBox='0 0 10 5'][width='10']",
                            m("path[d='M0 5L5 .002 10 5z']")
                        )
                    ),
                    m(".bx--number__control-btn.down-icon", {
                            onclick: () => this.changeData(-1)
                        },
                        m("svg[fill-rule='evenodd'][height='5'][viewBox='0 0 10 5'][width='10']",
                            m("path[d='M0 0l5 4.998L10 0z']")
                        )
                    )
                ]),
                ]),

            ),
        ])
    }

    changeData(incremento) {
        let currentDate = dayjs(appState.$data.get())
        let newDate = currentDate.add(incremento, "day")
        let dataStrPicker = newDate.format("DD-MM-YYYY")
        let dataStr = newDate.format("YYYY-MM-DD")
        this.picker.calendar.setDate(dataStrPicker)
        appState.$data.set(dataStr)
    }

    oncreate(vnode) {
        let el = vnode.dom.lastChild

        vnode.picker = DatePicker.create(el, {
            dateFormat: "d-m-Y",
            locale: Italian,
            defaultDate: new Date(appState.$data.get().replace(/-/g, "/")),
        })

        vnode.picker.calendar.config.onChange.push((selectedDates, dateStr, instance) => {
            appState.$data.set(dayjs(selectedDates).format("YYYY-MM-DD"))
        })
        vnode.state.picker = vnode.picker

        if (process.env.NODE_ENV !== "production") {
            let logStateAttrs = {
                attrs: vnode.attrs,
                state: vnode.state,
            }
            console.log(`Component: ${this._componentName}`, logStateAttrs)
        }
    }
}

export default DataPicker
