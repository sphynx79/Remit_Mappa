// src/components/mapbox/mapbox.js

import "./mapbox.scss"
// import mapboxgl from "mapbox-gl"
import Legend from "components/legend/legend.js"

var map

class MapBox {
    constructor() {
        if (process.env.NODE_ENV !== "production") {
            this._componentName = this.constructor.name
        }
        this._server = window.location.hostname
        this._accessToken = "pk.eyJ1IjoiYnJvd3NlcmlubyIsImEiOiJjajIzYXRmNnQwMDBuMndwODl1MTdjdG1yIn0.FJ-S1md8BPQtSwTF4SZsMA"
        // ferma i reactor allo smontaggio (react() non ritorna un handle per lo stop)
        this.$smontato = atom(false)
    }

    handleVisibilityUnita() {
        appState.$etsoVisibility.react(
            etso => {
                let filterRemit = ["in", "nome"]
                let filterCentrali = ["in", "etso"]

                if (etso.length > 0) {
                    etso.map(value => {
                        filterRemit.push(value)
                        filterCentrali.push(value)
                    })
                }

                map.setFilter("centrali", filterCentrali)
                map.setFilter("remit_centrali", filterRemit)
            },
            { skipFirst: true, until: this.$smontato }
        )
    }

    handleVisibilityLinee() {
        appState.$linee_380_visibility.react(
            value => {
                let layers = ["linee-380", "linee-380 blur", "remit_380"]
                let visibility = value == false ? "none" : "visible"
                layers.map(layer => {
                    map.setLayoutProperty(layer, "visibility", visibility)
                })
            },
            { until: this.$smontato }
        )

        appState.$linee_220_visibility.react(
            value => {
                let layers = ["linee-220", "linee-220 blur", "remit_220"]
                let visibility = value == false ? "none" : "visible"
                layers.map(layer => {
                    map.setLayoutProperty(layer, "visibility", visibility)
                })
            },
            { until: this.$smontato }
        )
    }

    handleRefreshRemitLinee() {
        appState.$remit_380.react(
            value => {
                map.getSource("remit_380").setData(value)
            },
            { skipFirst: true, until: this.$smontato }
        )

        appState.$remit_220.react(
            value => {
                map.getSource("remit_220").setData(value)
            },
            { skipFirst: true, until: this.$smontato }
        )
    }

    handleRefreshRemitCentrali() {
        appState.$remit_centrali.react(
            value => {
                // value && map.getSource("remit_centrali") && map.getSource("remit_centrali").setData(value)
                map.getSource("remit_centrali").setData(value)
            },
            { skipFirst: true, until: this.$smontato }
        )
    }

    handleSelectLine() {
        appState.$selectLine.react(
            feature => {
                let coordinates = feature.geometry.coordinates

                flyTo()
                showPopUp()

                function flyTo() {
                    let p1 = coordinates[0]
                    let p2 = coordinates[coordinates.length - 1]
                    let sw = []
                    let ne = []
                    if (p1[0] < p2[0]) {
                        sw[0] = p1[0]
                        ne[0] = p2[0]
                    } else {
                        sw[0] = p2[0]
                        ne[0] = p1[0]
                    }
                    if (p1[1] < p2[1]) {
                        sw[1] = p1[1]
                        ne[1] = p2[1]
                    } else {
                        sw[1] = p2[1]
                        ne[1] = p1[1]
                    }
                    let bounds = new mapboxgl.LngLatBounds(sw, ne)

                    // Usa fitBounds per ottenere le coordinate del centro e il livello di zoom
                    let fitBoundsOptions = {
                        padding: { top: 10, bottom: 25, left: 15, right: 5 }, // Opzioni di padding
                        maxZoom: 10, // Zoom massimo
                    }

                    // Ottieni i parametri dal metodo fitBounds
                    let camera = map.cameraForBounds(bounds, fitBoundsOptions)

                    // Usa flyTo per fare il fly su questa area
                    map.flyTo({
                        center: camera.center,
                        zoom: camera.zoom,
                        bearing: camera.bearing,
                        pitch: camera.pitch,
                        speed: 1.2, // Velocità di transizione
                        curve: 1.42, // Curvatura della traiettoria di volo
                        duration: 2000,
                        essential: true,
                        easing: function (t) {
                            return t
                        },
                    })

                    // map.fitBounds(bounds, {
                    //     padding: 200,
                    //     maxZoom: 10,
                    // })
                }

                function showPopUp() {
                    let middle = Math.trunc(coordinates.length / 2)
                    let popUps = document.getElementsByClassName("mapboxgl-popup")
                    if (popUps[0]) popUps[0].remove()
                    let popup = new mapboxgl.Popup()
                        .setLngLat(coordinates[middle])
                        .setHTML("<b>" + feature.nome + "</b><br>" + "<b>" + "update: " + "</b>" + feature.update + "<br>" + "<b>" + "start: " + "</b>" + feature.start + "<br>" + "<b>" + "end:  " + "</b>" + feature.end + "<br>")
                        .addTo(map)
                }
            },
            { skipFirst: true, until: this.$smontato }
        )
    }

    handleSelectCentrale() {
        appState.$selectCentrale.react(
            feature => {
                let coordinates = feature.geometry.coordinates
                map.flyTo({
                    center: coordinates,
                    zoom: 12,
                    speed: 1.7,
                    curve: 1.2,
                    duration: 2000,
                    essential: true,
                    easing(t) {
                        return t
                    },
                })
            },
            { skipFirst: true, until: this.$smontato }
        )
    }

    handleResetZoom() {
        let el = document.querySelector("div.mapboxgl-ctrl-bottom-right > div.mapboxgl-ctrl.mapboxgl-ctrl-group > button.mapboxgl-ctrl-compass")
        if (!el) return
        this.resetZoomEl = el
        this.resetZoomHandler = () => {
            map.flyTo({
                center: [11.88, 42.13],
                zoom: 5.6,
                bearing: 0,
                pitch: 0,
                speed: 1.2,
                curve: 1.1,
                duration: 2000,
                essential: true,
                easing: function (t) {
                    return t
                },
            })
        }
        el.addEventListener("click", this.resetZoomHandler, false)
        // const start = {
        //     center: [11.88, -72.13],
        //     zoom: 3,
        //     bearing: 0,
        //     pitch: 63,
        // };
        // const end = {
        //     center: [11.88, 42.13],
        //     zoom: 5.6,
        //     bearing: 0,
        //     pitch: 0
        // };

        // let isAtStart = true;

        // el.addEventListener(
        //     "click",
        //     () => {
        //     const target = isAtStart ? end : start;
        //     isAtStart = !isAtStart;
        //     map.flyTo({
        //         ...target, // Fly to the selected target
        //         // duration: 12000, // Animate over 12 seconds
        //         essential: true, // This animation is considered essential with
        //         curve: 1.42,
        //         speed: 0.3,
        //         easing: function(t) {
        //             return t
        //         },
        //         //respect to prefers-reduced-motion
        //     });

        //     },
        //     false
        // )
    }

    initMap() {
        mapboxgl.accessToken = this._accessToken

        map = new mapboxgl.Map({
            container: "mapid",
            style: "mapbox://styles/browserino/cjhpwzyrx3ymw2smgsezxdwra",
            center: [11.88, 42.13],
            zoom: 5.6,
            maxZoom: 13,
            minZoom: 5.0,
        })
        let nav = new mapboxgl.NavigationControl()
        map.addControl(nav, "bottom-right")
    }

    initRemit() {
        if (!map.getLayer("remit_380")) {
            this.addLayerRemitLinee("380")
        }
        if (!map.getLayer("remit_220")) {
            this.addLayerRemitLinee("220")
        }
        if (!map.getLayer("remit_centrali")) {
            this.addLayerRemitCentrali()
        }
    }

    initAnimation() {
        let dashArraySeq = [
            [0, 4, 3],
            [1, 4, 2],
            [2, 4, 1],
            [3, 4, 0],
            [0, 1, 3, 3],
            [0, 2, 3, 2],
            [0, 3, 3, 1],
        ]
        let dashSpeed = 100
        let dashArrayPos = 0
        let dashArraylastPos = 0
        let limit = dashArraySeq.length
        let radiusSpeed = 20
        let initialRadius = 3
        let radius = initialRadius
        let initialOpacity = 1
        let opacity = initialOpacity
        // let maxRadius = 0
        // let zoom = 5.6
        let zoom = atom(5.6)
        let maxRadius = derive(() => {
            let z = zoom.get()
            return -0.06 * Math.pow(z, 2) + 1.14 * z - 2.68
        })
        map.on("zoom", () => zoom.set(map.getZoom()))

        function update(delta) {
            dashArrayPos = dashArrayPos + delta / dashSpeed
            if (dashArrayPos >= limit) dashArrayPos = 0

            radius += (maxRadius.get() - radius) / radiusSpeed
            // zoom = map.getZoom()
            // maxRadius = -0.06 * Math.pow(zoom, 2) + 1.14 * zoom - 2.68
            // radius += (maxRadius - radius) / radiusSpeed
            opacity -= 0.9 / radiusSpeed

            if (opacity < 0.2) {
                radius = initialRadius
                opacity = initialOpacity
            }
        }

        function draw() {
            let intPos = parseInt(dashArrayPos)
            if (dashArraylastPos != intPos) {
                map.setPaintProperty("remit_380", "line-dasharray", dashArraySeq[intPos])
                map.setPaintProperty("remit_220", "line-dasharray", dashArraySeq[intPos])
                dashArraylastPos = intPos
            }
            map.setPaintProperty("remit_centrali", "circle-stroke-width", radius)
            map.setPaintProperty("remit_centrali", "circle-stroke-opacity", opacity)
        }
        MainLoop.setSimulationTimestep(70)
        // MainLoop.setMaxAllowedFPS(20)
        MainLoop.setUpdate(update).setDraw(draw).start()
    }

    addLayerRemitLinee(volt) {
        if (volt == "380") {
            var remitId = "remit_380"
            var color = "#FFFF00"
            var remitData = appState.$remit_380.get()
        } else {
            var remitId = "remit_220"
            var color = "#FFFF00"
            var remitData = appState.$remit_220.get()
        }

        map.addLayer({
            id: remitId,
            type: "line",
            source: {
                type: "geojson",
                data: remitData === undefined ? { type: "FeatureCollection", features: [] } : remitData,
            },
            paint: {
                "line-color": color,
                "line-opacity": 1,
                "line-width": {
                    base: 1,
                    stops: [
                        [6, 2],
                        [14, 3],
                    ],
                },
                "line-dasharray": [0, 4, 3],
            },
        })
    }

    addLayerRemitCentrali() {
        var remitData = appState.$remit_centrali.get()
        var color = {
            base: 1,
            type: "categorical",
            property: "tipo",
            stops: [
                ["TERMICO", "#E0090C"],
                ["EOLICO", "#5907AB"],
                ["IDRICO", "#04A1A1"],
                ["AUTOPRODUTTORE", "#9E577C"],
                ["SOLARE", "#9E4F0B"],
                ["POMPAGGIO", "#0E952F"],
                ["GEOTERMICO", "#7E4F21"],
            ],
        }

        map.addSource("remit_centrali", {
            type: "geojson",
            data: remitData === undefined ? { type: "FeatureCollection", features: [] } : remitData,
        })

        map.addLayer({
            id: "remit_centrali",
            type: "circle",
            source: "remit_centrali",
            paint: {
                "circle-color": color,
                "circle-stroke-color": "#FFFF00",
                "circle-stroke-opacity": 1,
                "circle-stroke-width": 2,
                "circle-opacity": 1,
                "circle-radius": {
                    base: 1,
                    type: "exponential",
                    property: "pmax",
                    stops: [
                        [{ value: 0, zoom: 4 }, 4],
                        [
                            {
                                value: 0,
                                zoom: 6,
                            },
                            6,
                        ],
                        [
                            {
                                value: 3000,
                                zoom: 6,
                            },
                            24,
                        ],
                        [
                            {
                                value: 0,
                                zoom: 8,
                            },
                            11,
                        ],
                        [
                            {
                                value: 3000,
                                zoom: 8,
                            },
                            33,
                        ],
                        [
                            {
                                value: 0,
                                zoom: 13,
                            },
                            13,
                        ],
                        [
                            {
                                value: 3000,
                                zoom: 13,
                            },
                            36,
                        ],
                    ],
                    default: 10,
                },
            },
        })
    }

    initHoverEffect() {
        this.addHoverEffect("380")
        this.addHoverEffect("220")
    }

    addHoverEffect(volt) {
        if (volt == "380") {
            var idLayer = "hover_380"
            var sourceName = "tileset_transmission_380"
            var urlTileSet = "mapbox://browserino.cjcb6ahdv0daq2xnwfxp96z9t-142vr"
            var sourceLayer = "transmission_380"
            var layer = "linee-380"
        } else {
            var idLayer = "hover_220"
            var sourceName = "tileset_transmission_220"
            var urlTileSet = "mapbox://browserino.cjcfb90n41pub2xp6liaz7quj-69qt1"
            var sourceLayer = "transmission_220"
            var layer = "linee-220"
        }

        map.addSource(sourceName, {
            type: "vector",
            url: urlTileSet,
        })

        map.addLayer({
            id: idLayer,
            type: "line",
            source: sourceName,
            layout: {},
            interactive: true,
            "source-layer": sourceLayer,
            maxzoom: 13,
            paint: {
                "line-color": "#88CC55",
                "line-width": 3,
            },
            filter: ["==", "nome", ""],
        })

        map.on("mouseover", layer, function (e) {
            // if (!map.loaded()) return
            map.getCanvas().style.cursor = "pointer"
            var bbox = [
                [e.point.x - 5, e.point.y - 5],
                [e.point.x + 5, e.point.y + 5],
            ]
            var features = map.queryRenderedFeatures(bbox, {
                layers: [layer],
            })

            if (!features.length) return

            if (features.length) {
                map.getCanvas().style.cursor = "pointer"
                let feature = features[0]
                map.setFilter(idLayer, ["==", "nome", feature.properties.nome])
            } else {
                map.setFilter(idLayer, ["==", "nome", ""])
            }
        })

        map.on("mouseout", layer, function () {
            map.getCanvas().style.cursor = ""
            map.setFilter(idLayer, ["==", "nome", ""])
        })
    }

    initShowPopUp() {
        this.addShowPopUp("380")
        this.addShowPopUp("220")
        this.addShowPopUp("centrale")
    }

    addShowPopUp(volt) {
        if (volt == "380") {
            var layer = "linee-380"
        } else if (volt == "220") {
            var layer = "linee-220"
        } else {
            var layer = "centrali"
        }
        // console.log(layer)

        map.on("click", function (e) {
            var bbox = [
                [e.point.x - 2, e.point.y - 2],
                [e.point.x + 2, e.point.y + 2],
            ]

            var features = map.queryRenderedFeatures(bbox, {
                layers: [layer], // replace this with the name of the layer
            })

            if (!features.length) {
                return
            }

            var feature = features[0]
            let content = setContentPopUp(feature)

            var popup = new mapboxgl.Popup({
                offset: [0, -5],
            })
                .setLngLat(e.lngLat)
                .setHTML(content)
                .addTo(map)
        })

        function setContentPopUp(feature) {
            // prettier-ignore

            if (feature.layer.id == "centrali") {
                var content = "<b>" + feature.properties.etso + "</b><br>" +
                              "<b>" + "Company: " + "</b>" + feature.properties.company + "<br>" +
                              "<b>" + "Impianto: " + "</b>" + feature.properties.impianto + "<br>" +
                              "<b>" + "Operatore: " + "</b>" + feature.properties.operatore + "<br>" +
                              "<b>" + "Proprietario: " + "</b>" + feature.properties.proprietario + "<br>" +
                              "<b>" + "Localita: " + "</b>" + feature.properties.localita + "<br>" +
                              "<b>" + "Tecnologia: " + "</b>" + feature.properties.tipo + " (" + feature.properties.sottotipo + ")" + "<br>" +
                              "<b>" + "Sottotipo: " + "</b>" + feature.properties.sottotipo + "<br>" +
                              "<b>" + "Msd: " + "</b>" + feature.properties.msd + "<br>" +
                              "<b>" + "Pmin: " + "</b>" + feature.properties.pmin + "<br>" +
                              "<b>" + "Pmax: " + "</b>" + feature.properties.pmax + "<br>"

            } else {
                var content = "<b>" + feature.properties.nome + "</b><br>" +
                              "<b>" + "From: " + "</b>" + feature.properties.p1 + "<br>" +
                              "<b>" + "To: " + "</b>" + feature.properties.p2 + "<br>" +
                              "<b>" + "Lunghezza: " + "</b>" + feature.properties.lunghezza + "<br>" +
                              "<b>" + "Voltage: " + "</b>" + feature.properties.voltage + "<br>"
            }

            return content
        }
    }

    view({ attrs }) {
        // prettier-ignore
        return m("#mapid", attrs, m(Legend))
    }

    oncreate({ attrs, state }) {
        this.initMap()
        map.on("load", () => {
            this.initRemit()
            this.initHoverEffect()
            this.initShowPopUp()
            this.handleVisibilityLinee()
            this.handleVisibilityUnita()
            this.handleRefreshRemitLinee()
            this.handleRefreshRemitCentrali()
            if (process.env.NODE_ENV == "production") {
                this.initAnimation()
            }
        })
        this.handleSelectLine()
        this.handleSelectCentrale()
        this.handleResetZoom()

        if (process.env.NODE_ENV !== "production") {
            let logStateAttrs = {
                attrs: attrs,
                state: state,
            }
            console.log(`Component: ${this._componentName}`, logStateAttrs)
        }
    }

    onremove({ state }) {
        state.$smontato.set(true)
        if (state.resetZoomEl) state.resetZoomEl.removeEventListener("click", state.resetZoomHandler)
        if (process.env.NODE_ENV == "production") MainLoop.stop()
        // la mappa mapbox globale resta viva: componente radice, mai smontato nel flusso normale
    }
}

export default MapBox
