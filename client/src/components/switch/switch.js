// src/components/switch/switch.js

import "./switch.scss"
import { ContentSwitcher } from "carbon-components"

class Switch {
    constructor() {
        if (process.env.NODE_ENV !== "production") {
            this._componentName = this.constructor.name
        }
    }

    view(vnode) {
        // prettier-ignore
        return m("#sidebar__switch.bx--content-switcher[aria-label='switch content'][data-content-switcher=''][role='tablist']", [
                    m("button.bx--content-switcher-btn.bx--content-switcher--selected[data-target='#tabelle'][role='tab']",
                      [
                        m("svg.bx--content-switcher__icon[height='20'][viewBox='0 0 24 20'][width='24'][xmlns='http://www.w3.org/2000/svg']", 
                            m("path[d='M.452.473v18.739h23.156V.473zm8.194 3.565h6.767v2.505H8.646zm7.323.025H23V6.52h-7.031zM1.086 4.09H7.96v2.408H1.086zm7.402 2.986h7.031v2.457H8.488zm-7.402.048h6.662v2.505H1.086zm14.935.026h7.032v2.456H16.02zm0 2.89h7.032v2.457H16.02zm-7.56.096h7.032v2.457H8.46zm-7.56.048h7.032v2.457H.9zm.106 2.987h7.031v2.457H1.007zm7.56 0h7.031v2.457h-7.03zm7.507 0h7.032v2.457h-7.032zm-7.401 2.986h7.031v2.457H8.673zm7.454 0h7.032v2.457h-7.032zm-15.173.049h7.032v2.456H.954z'][fill-rule='evenodd'][stroke='#000'][stroke-width='.054']")
                        )
                      ]
                    ),
                    m("button.bx--content-switcher-btn[data-target='#grafici'][role='tab']",
                      [
                        m("svg.bx--content-switcher__icon[height='20'][viewBox='0 0 24 20'][width='24'][xmlns='http://www.w3.org/2000/svg']", 
                          m("g[stroke='#000'][stroke-linecap='round']",
                            [
                              m("path[d='M.7 296.216h18.616'][fill='none'][stroke-width='.656'][transform='matrix(1.21336 0 0 1.36967 -.064 -386.593)']"),
                              m("path[d='M1.738 295.839l.043-5.84h1.863l.086 5.968'][fill='none'][stroke-linejoin='round'][stroke-miterlimit='11.7'][stroke-width='.509'][transform='matrix(1.21336 0 0 1.36967 -.064 -386.593)']"),
                              m("path[d='M5.985 285.436H8.09v10.722H5.985z'][fill='#000001'][fill-opacity='.696'][fill-rule='evenodd'][stroke-linejoin='round'][stroke-miterlimit='11.7'][stroke-width='.509'][transform='matrix(1.21336 0 0 1.36967 -.064 -386.593)']"),
                              m("path[d='M10.959 287.694h2.233v8.406h-2.233z'][fill='none'][stroke-linejoin='round'][stroke-miterlimit='11.7'][stroke-width='.517'][transform='matrix(1.21336 0 0 1.36967 -.064 -386.593)']"),
                              m("path[d='M15.874 282.9h2.152v13.215h-2.152z'][fill-opacity='.624'][fill-rule='evenodd'][stroke-linejoin='round'][stroke-miterlimit='11.7'][stroke-width='.507'][transform='matrix(1.21336 0 0 1.36967 -.064 -386.593)']")
                            ]
                          )
                        )
                      ]
                    ),
                ])
    }

    oncreate(vnode) {
        let el = vnode.dom
        vnode.state.switcher = ContentSwitcher.create(el)

        // const instance = ContentSwitcher.init()
        if (process.env.NODE_ENV !== "production") {
            let logStateAttrs = {
                attrs: vnode.attrs,
                state: vnode.state,
            }
            console.log(`Component: ${this._componentName}`, logStateAttrs)
        }
    }

    onremove({ state }) {
        if (state.switcher) state.switcher.release()
    }
}

export default Switch
