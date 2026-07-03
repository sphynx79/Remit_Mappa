// src/components/table/table.js

import "./table.scss"
import Tabulator from "tabulator-tables"

class Table {
    constructor() {
        if (process.env.NODE_ENV !== "production") {
            this._componentName = this.constructor.name
        }
    }

    _columns() {
        let columnsFields = this.type == "linee" ? ["fold", "nome", "update", "start", "end"] : ["fold", "nome", "company", "tipo", "sottotipo", "update", "start", "end"]
        let columns = columnsFields.map(col => {
            return col == "fold" ? this._columFold() : this._column(col)
        })
        return columns
    }

    _column(col) {
        return {
            title: col[0].toUpperCase() + col.slice(1),
            field: col,
            headerFilter: true,
            // width: 100,
        }
    }

    _columFold() {
        return {
            field: "fold",
            visible: true,
            resizable: false,
            // editor: true,
            headerSort: false,
            hozAlign: "center",
            width: 26,
            minWidth: 26,
            cellClick: (e, cell) => {
                var cellValue = cell.getValue()
                var cellEl = cell.getElement()
                if (cell.getValue() == false) {
                    cell.getRow().getElement().lastElementChild.style.display = "none"
                } else {
                    cell.getRow().getElement().lastElementChild.style.display = ""
                }
                cell.setValue(!cellValue, true)
            },
            formatter: (cell, formatterParams, onRendered) => {
                if (cell.getValue() == true) {
                    return "<svg width='10' height='5' viewBox='0 0 10 5'><path d='M0 0l5 4.998L10 0z'></path></svg>"
                } else {
                    return "<svg width='10' height='5' viewBox='0 0 10 5'><path d='M0 5L5 .002 10 5z'></path></svg>"
                }
            },
        }
    }

    _formatRow(row) {
        let element = row.getElement()
        let width = element.offsetWidth - 40
        let data = row.getData()
        let { hours, ...field } = data
        let hoursRow

        // prettier-ignore
        var table =  m(".table" , { style: { "display": "none", "cursor": "auto" } } ,
                  m(".hours-row.bx--type-legal", { style: { "padding-left": "25px" } }, Object.keys(hours).map((key) => { 
                      return m(".tabulator-cell", {style: {"width": `${(width / 24)+0.6}px`, "height": "20px", "text-align": "center"}},
                          [ `${key}`,
                          ]
                        )
                  })), 
                  m(".hours-row.bx--type-legal", { style: { "padding-left": "25px" , "cursor": "auto" } }, Object.values(hours).map((value) => { 
                      return m(".tabulator-cell", {style: {"width": `${(width / 24)+0.6}px`, "height": "20px", "text-align": "center"}},
                          [ `${value | 0}`,
                          ]
                        )
                  } ))
                )

        hoursRow = document.createElement("div")
        m.render(hoursRow, [table])

        element.append(hoursRow.firstChild)
    }

    _rowClick(e, row) {
        if (e.target.firstElementChild == null && e.target.tagName != "path") {
            // prettier-ignore
            let selection = this.type == "linee" 
                        ? appState.$selectLine.set(row.getData()) 
                        : appState.$selectCentrale.set(row.getData())
            return selection
        }
    }

    oninit({ attrs, state }) {
        state.tabulator = null
        state.tableData = null
        state.type = attrs.type
        state.titolo = attrs.type == "linee" ? `LINEE ${attrs.volt}` : "CENTRALI"
        // @TODO: Vedere se gestire la linea correntemente selezionata
        // state.activeLine = -1
        // appState.$data.react(() => (state.activeLine = -1))
    }

    view({ attrs, state }) {
        // prettier-ignore
        return attrs.remit.length != 0
            ? m(".tbl", [
                 m(".tbl__header", state.titolo),
                 m(`#table_${state.type}${state.type == "linee" ? attrs.volt : "" }.table`)
              ])
            : m("")
    }

    oncreate(vnode) {
        var el = vnode.dom.children[1]

        vnode.state.tabulator = new Tabulator(el, {
            // height: "210px",
            layout: "fitColumns",
            resizableColumns: false,
            // minHeight: 40,
            // maxHeight: 40,
            // data: vnode.state.tableData,
            placeholder: "No Data Set",
            columns: this._columns(),
            rowFormatter: row => this._formatRow(row),
            rowClick: (e, row) => this._rowClick(e, row),
        })

        vnode.attrs.remit.react(r => {
            let remit = vnode.attrs.type == "linee" ? r.features : r
            let propAndGeometry = remit.map(item => {
                let merged = { ...item["properties"], ...{ geometry: item["geometry"] } }
                return merged
            })
            this.tabulator.setData(propAndGeometry)
        })

        document.addEventListener("content-switcher-selected", evt => {
            let el = evt.target.getElementsByClassName("bx--content-switcher--selected")[0].getAttribute("data-target")
            if (el == "#tabelle") {
                vnode.state.tabulator.redraw()
            }
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

export default Table
