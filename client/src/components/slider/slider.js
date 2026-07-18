// src/components/slider/slider.js

import "./slider.scss"

class Slider {
    constructor() {
        if (process.env.NODE_ENV !== "production") {
            this._componentName = this.constructor.name
        }
    }

    view({ attrs }) {
        // prettier-ignore
        return m(`.slider[id='${attrs.id}']`)
    }

    oncreate({ attrs, state }) {
        state.range = document.getElementById(`${attrs.id}`)

        var slider = noUiSlider.create(state.range, {
            start: attrs.pminpmax.get(),
            connect: true,
            tooltips: true,
            step: 1,
            range: attrs.range,
            pips: {
                mode: "values",
                // values: 10,
                values: attrs.step,
                density: 4,
                stepped: true,
            },
            format: {
                to: function (value) {
                    return parseInt(value)
                },
                from: function (value) {
                    return parseInt(value)
                },
            },
        })

        state.pipHandler = e => this.clickOnPip(e)
        var pips = state.range.querySelectorAll(".noUi-value")
        for (var i = 0; i < pips.length; i++) {
            // For this example. Do this in CSS!
            pips[i].style.cursor = "pointer"
            pips[i].addEventListener("click", state.pipHandler)
        }

        slider.on("set", min_max => {
            attrs.onchange(min_max)
        })

        if (process.env.NODE_ENV !== "production") {
            let logStateAttrs = {
                attrs: attrs,
                state: state,
            }
            console.log(`Component: ${this._componentName}`, logStateAttrs)
        }
    }

    clickOnPip(e) {
        var value = Number(e.target.getAttribute("data-value"))
        this.range.noUiSlider.set(value)
    }

    onremove({ state }) {
        state.range.querySelectorAll(".noUi-value").forEach(pip => pip.removeEventListener("click", state.pipHandler))
        if (state.range.noUiSlider) state.range.noUiSlider.destroy()
    }
}

export default Slider
