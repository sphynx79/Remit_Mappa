// src/components/grafico/grafico.js

import "./grafico.scss"
// import * as echarts from "echarts"

class Grafico {
    constructor() {
        this._componentName = this.constructor.name
    }

    _Option() {
        let option = (id => {
            switch (id) {
                case "grafico-remit-tecnologia-daily": {
                    return this._remitTecnologiaDailyOption()
                }
                case "grafico-remit-tecnologia-hourly": {
                    return this._remitTecnologiaHourlyOption()
                }
                case "grafico-remit-zona-daily": {
                    return this._remitZonaDailyOption()
                }
                case "grafico-remit-zona-hourly": {
                    return this._remitZonaHourlyOption()
                }
                default: {
                    console.log("Invalid choice")
                    break
                }
            }
        })(this.elId)

        let globalOption = {
            dataset: {
                dimensions: [],
                source: [],
            },
            backgroundColor: this.background,
            title: this.title,
            animationDuration: 800,
            animationEasing: "elasticOut",
            calculable: true,
            grid: {
                borderWidth: 1,
                top: 90,
                bottom: 40,
                left: 20,
                right: 20,
                containLabel: true,
                textStyle: {
                    color: "#90979c",
                },
            },
            tooltip: {
                trigger: "axis",
                backgroundColor: "#2b2b2bed",
                textStyle: {
                    fontSize: 10,
                },
                padding: 2,
                position: function (p) {
                    return [p[0] + 4, p[1] - 4]
                },
                axisPointer: {
                    type: "cross",
                    label: {
                        backgroundColor: "#2b2b2bd6",
                        fontSize: 8,
                        shadowColor: "#25252599",
                        shadowBlur: 10,
                        // show: false,
                    },
                    crossStyle: {
                        type: "solid",
                        color: "rgba(230, 230, 230, 0.6)",
                    },
                },
            },
            legend: {
                top: "34px",
                itemWidth: 18,
                itemHeight: 8,
                padding: 15,
                formatter: name => {
                    return name[0].toUpperCase() + name.slice(1)
                },
                textStyle: {
                    color: "#F4F5F5",
                    fontWeight: "bold",
                    fontSize: 10,
                },
            },
            toolbox: {
                show: true,
                right: 20,
                showTitle: false,
                feature: {
                    mark: {
                        show: true,
                    },
                    dataView: {
                        show: false,
                        readOnly: false,
                        title: "Data View",
                        lang: ["Data View", "Close", "Refresh"],
                    },
                    magicType: {
                        show: false,
                        type: ["line", "bar"],
                        title: {
                            line: "Switch Line Chart",
                            bar: "Switch Bar Chart",
                            stack: "Stack",
                            tiled: "Tile",
                        },
                    },
                    restore: {
                        show: false,
                        title: "Restore",
                    },
                    saveAsImage: {
                        show: true,
                        title: "Save Image",
                        lang: ["Right Click to Save Image"],
                    },
                },
            },
            dataZoom: [
                {
                    type: "slider",
                    realtime: false,
                    xAxisIndex: 0,
                    start: 70,
                    end: 100,
                    bottom: "10",
                    backgroundColor: "rgba(47,69,84,0)",
                    borderColor: "rgba(250,250,250,0.5)",
                    fillerColor: "rgba(47,69,84,0.3)",
                    dataBackground: {
                        lineStyle: {
                            color: "#000000",
                        },
                        areaStyle: {
                            color: "#FFF",
                        },
                    },
                },
                {
                    type: "inside",
                    xAxisIndex: 0,
                    start: 0,
                    end: 100,
                },
            ],
            yAxis: {
                name: "MWh",
                type: "value",
                // boundaryGap: [0, "40%"],
                splitNumber: 8,
                nameGap: 20,
                minInterval: 40,
                nameTextStyle: {
                    color: "#DADBDD",
                    fontSize: 10,
                    padding: [0, 0, 0, -30],
                },
                axisTick: {
                    show: true,
                    lineStyle: {
                        color: "#DADBDD",
                    },
                },
                axisLine: {
                    symbol: ["none", "arrow"],
                    symbolSize: [8, 14],
                    symbolOffset: [0, 11],
                    lineStyle: {
                        color: "#DADBDD",
                    },
                },
                axisLabel: {
                    color: "#DADBDD",
                    fontSize: 10,
                },
                splitLine: {
                    show: true,
                    lineStyle: {
                        color: "#8B8E94",
                        type: "dashed",
                    },
                },
            },
        }

        return Object.assign(globalOption, option)
    }

    _remitTecnologiaDailyOption() {
        let option = {
            xAxis: {
                name: "",
                type: "category",
                nameGap: 0,
                nameTextStyle: {
                    color: "#DADBDD",
                    fontSize: 10,
                    padding: [0, 0, -24, 0],
                },
                splitLine: {
                    show: false,
                    lineStyle: {
                        color: "#B2B4B8",
                    },
                },
                axisLine: {
                    onZero: false,
                    symbol: ["none", "arrow"],
                    symbolSize: [8, 14],
                    symbolOffset: [0, 12],
                    lineStyle: {
                        color: "#DADBDD",
                    },
                },
                axisTick: {
                    show: true,
                    lineStyle: {
                        color: "#DADBDD",
                    },
                },
                axisLabel: {
                    color: function (value, index) {
                        return dayjs(appState.$data.get()).format("DD-MM-YYYY") == value.substring(0, 10) ? "#5aaafa" : "#DADBDD"
                    },
                    fontSize: 9,
                    rotate: 45,
                },
            },
            series: [],
        }
        return option
    }

    _remitTecnologiaHourlyOption() {
        let option = {
            xAxis: {
                name: "",
                type: "category",
                nameGap: 0,
                boundaryGap: false,
                nameTextStyle: {
                    color: "#DADBDD",
                    fontSize: 10,
                    padding: [0, 0, -24, 0],
                },
                splitLine: {
                    show: false,
                    lineStyle: {
                        color: "#B2B4B8",
                    },
                },
                axisLine: {
                    onZero: false,
                    symbol: ["none", "arrow"],
                    symbolSize: [8, 14],
                    symbolOffset: [0, 12],
                    lineStyle: {
                        color: "#DADBDD",
                    },
                },
                axisTick: {
                    show: true,
                    lineStyle: {
                        color: "#DADBDD",
                    },
                },
                axisLabel: {
                    // color: "#DADBDD",
                    color: function (value, index) {
                        return dayjs(appState.$data.get()).format("DD-MM-YYYY") == value.substring(0, 10) ? "#5aaafa" : "#DADBDD"
                    },
                    fontSize: 9,
                    rotate: 45,
                    formatter: function (value) {
                        let label
                        let m = value.match(/(\d+)-(\d+)-(\d+)\s+(\d+)/)
                        if (m[4] == "00") {
                            label = `${m[1]}-${m[2]}-${m[3]}`
                        } else {
                            label = `${m[4]}`
                        }
                        return label
                    },
                },
            },
            dataZoom: [
                {
                    type: "slider",
                    realtime: false,
                    xAxisIndex: 0,
                    start: 50,
                    end: 100,
                    bottom: "10",
                    backgroundColor: "rgba(47,69,84,0)",
                    borderColor: "rgba(250,250,250,0.5)",
                    fillerColor: "rgba(47,69,84,0.3)",
                    dataBackground: {
                        lineStyle: {
                            color: "#000000",
                        },
                        areaStyle: {
                            color: "#FFF",
                        },
                    },
                },
                {
                    type: "inside",
                    xAxisIndex: 0,
                    start: 0,
                    end: 100,
                },
            ],
            series: [],
        }

        return option
    }

    _remitZonaDailyOption() {
        let option = {
            xAxis: {
                name: "",
                type: "category",
                boundaryGap: false,
                nameTextStyle: {
                    color: "#DADBDD",
                    fontSize: 10,
                    padding: [0, 0, -24, 0],
                },
                splitLine: {
                    show: true,
                    lineStyle: {
                        color: "#B2B4B8",
                    },
                },
                axisLine: {
                    symbol: ["none", "arrow"],
                    symbolSize: [8, 14],
                    symbolOffset: [0, 12],
                    lineStyle: {
                        color: "#DADBDD",
                    },
                },
                axisTick: {
                    show: true,
                    lineStyle: {
                        color: "#DADBDD",
                    },
                },
                axisLabel: {
                    color: function (value, index) {
                        return dayjs(appState.$data.get()).format("DD-MM-YYYY") == value.substring(0, 10) ? "#5aaafa" : "#DADBDD"
                    },
                    fontSize: 9,
                    rotate: 45,
                },
            },
            series: [],
            color: ["#ADED5F", "#3ABDEC", "#F0563C", "#3A8E78", "#FD8E32", "#F93B1C", "#6AB015", "#2C81A5", "#BE2A14", "#245749", "#c4ccd3"],
        }

        return option
    }

    _remitZonaHourlyOption() {
        let option = {
            xAxis: {
                name: "",
                type: "category",
                nameGap: 0,
                nameTextStyle: {
                    color: "#DADBDD",
                    fontSize: 10,
                    padding: [0, 0, -24, 0],
                },
                splitLine: {
                    show: false,
                    lineStyle: {
                        color: "#B2B4B8",
                    },
                },
                axisLine: {
                    onZero: false,
                    symbol: ["none", "arrow"],
                    symbolSize: [8, 14],
                    symbolOffset: [0, 12],
                    lineStyle: {
                        color: "#DADBDD",
                    },
                },
                axisTick: {
                    show: true,
                    lineStyle: {
                        color: "#DADBDD",
                    },
                },
                axisLabel: {
                    color: function (value, index) {
                        return dayjs(appState.$data.get()).format("DD-MM-YYYY") == value.substring(0, 10) ? "#5aaafa" : "#DADBDD"
                    },
                    fontSize: 9,
                    rotate: 45,
                    formatter: function (value) {
                        let label
                        let m = value.match(/(\d+)-(\d+)-(\d+)\s+(\d+)/)
                        if (m[4] == "00") {
                            label = `${m[1]}-${m[2]}-${m[3]}`
                        } else {
                            label = `${m[4]}`
                        }
                        return label
                    },
                },
            },
            dataZoom: [
                {
                    type: "slider",
                    realtime: false,
                    xAxisIndex: 0,
                    start: 50,
                    end: 100,
                    bottom: "10",
                    backgroundColor: "rgba(47,69,84,0)",
                    borderColor: "rgba(250,250,250,0.5)",
                    fillerColor: "rgba(47,69,84,0.3)",
                    dataBackground: {
                        lineStyle: {
                            color: "#000000",
                        },
                        areaStyle: {
                            color: "#FFF",
                        },
                    },
                },
                {
                    type: "inside",
                    xAxisIndex: 0,
                    start: 0,
                    end: 100,
                },
            ],
            series: [],
            color: ["#ADED5F", "#3ABDEC", "#F0563C", "#3A8E78", "#FD8E32", "#F93B1C", "#6AB015", "#2C81A5", "#BE2A14", "#245749", "#c4ccd3"],
        }

        return option
    }

    _Series() {
        let series = (id => {
            switch (id) {
                case "grafico-remit-tecnologia-daily": {
                    return this._remitTecnologiaDailySeries()
                }
                case "grafico-remit-tecnologia-hourly": {
                    return this._remitTecnologiaHourlySeries()
                }
                case "grafico-remit-zona-daily": {
                    return this._remitZonaDailySeries()
                }
                case "grafico-remit-zona-hourly": {
                    return this._remitZonaHourlySeries()
                }
                default: {
                    console.log("Invalid choice")
                    break
                }
            }
        })(this.elId)

        return series
    }

    _remitTecnologiaDailySeries() {
        let series = this.dimensions.slice(1, this.dimensions.length).map(dim => {
            return {
                type: "bar",
                stack: "1",
                symbolSize: 1,
                showSymbol: true,
                // barWidth: "20%",
                barMaxWidth: 14,
                // connectNulls: true,
                barCategoryGap: "20%",
                animationDuration: 600,
                // barGap: "90%",
                emphasis: {
                    itemStyle: {
                        shadowColor: "rgba(0, 0, 0, 1)",
                        shadowOffsetX: 3,
                        symbolSize: 5,
                        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                            {
                                offset: 0,
                                color: this.colors[`${dim}EmphasisColor2`],
                            },
                            {
                                offset: 0.5,
                                color: this.colors[`${dim}EmphasisColor2`],
                            },
                            {
                                offset: 1,
                                color: this.colors[`${dim}EmphasisColor1`],
                            },
                        ]),
                    },
                },
                label: {
                    show: false,
                },
                itemStyle: {
                    borderWidth: 0.4,
                    borderColor: "#000",
                    opacity: 1,
                    shadowColor: "rgba(0, 0, 0, 0.7)",
                    shadowBlur: 6,
                    shadowOffsetX: 2,
                    color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                        {
                            offset: 0,
                            color: this.colors[`${dim}Color1`],
                        },
                        {
                            offset: 0.5,
                            color: this.colors[`${dim}Color2`],
                        },
                        {
                            offset: 1,
                            color: this.colors[`${dim}Color1`],
                        },
                    ]),
                },
                areaStyle: {
                    opacity: 0.75,
                },
            }
        })
        return series
    }

    _remitTecnologiaHourlySeries() {
        let series = this.dimensions.slice(1, this.dimensions.length).map(dim => {
            return {
                type: "line",
                symbolSize: 1,
                showSymbol: true,
                // barWidth: "20%",
                barMaxWidth: 14,
                // connectNulls: true,
                barCategoryGap: "20%",
                animationDuration: 600,
                barGap: "90%",
                emphasis: {
                    itemStyle: {
                        shadowColor: "rgba(0, 0, 0, 1)",
                        shadowOffsetX: 2,
                        symbolSize: 2,
                        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                            {
                                offset: 0,
                                color: this.colors[`${dim}EmphasisColor2`],
                            },
                            {
                                offset: 0.5,
                                color: this.colors[`${dim}EmphasisColor2`],
                            },
                            {
                                offset: 1,
                                color: this.colors[`${dim}EmphasisColor1`],
                            },
                        ]),
                    },
                },
                label: {
                    show: false,
                },
                itemStyle: {
                    borderWidth: 0.4,
                    borderColor: "#000",
                    opacity: 1,
                    shadowColor: "rgba(0, 0, 0, 0.7)",
                    shadowBlur: 6,
                    shadowOffsetX: 2,
                    color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                        {
                            offset: 0,
                            color: this.colors[`${dim}Color1`],
                        },
                        {
                            offset: 0.5,
                            color: this.colors[`${dim}Color2`],
                        },
                        {
                            offset: 1,
                            color: this.colors[`${dim}Color1`],
                        },
                    ]),
                },
            }
        })
        return series
    }

    _remitZonaDailySeries() {
        let series = this.dimensions.slice(1, this.dimensions.length).map(dim => {
            return {
                // TERMICO
                type: "line",
                stack: "1",
                symbolSize: 1,
                showSymbol: true,
                animationDuration: 600,
                // color: this.colors[`${zona}Color1`],
                // barWidth: "30%",
                emphasis: {
                    itemStyle: {
                        shadowColor: "rgba(0, 0, 0, 1)",
                        shadowOffsetX: 2,
                        // color:  this.colors[`${zona}Color1`],
                        symbolSize: 5,
                    },
                },
                lineStyle: {
                    width: 0.5,
                    opacity: 0.8,
                    // color: this.colors[`${zona}Color1`]
                },
                areaStyle: {
                    opacity: 0.75,
                    // color: this.colors[`${zona}Color1`],
                },
            }
        })
        return series
    }

    _remitZonaHourlySeries() {
        let series = this.dimensions.slice(1, this.dimensions.length).map(dim => {
            return {
                type: "line",
                // stack: "1",
                symbolSize: 1,
                showSymbol: true,
                // barWidth: "20%",
                barMaxWidth: 14,
                // connectNulls: true,
                barCategoryGap: "20%",
                animationDuration: 600,
                // barGap: "90%",
                emphasis: {
                    itemStyle: {
                        shadowColor: "rgba(0, 0, 0, 1)",
                        shadowOffsetX: 2,
                        symbolSize: 2,
                        // color: this.colors[`${zona}Color1`],
                    },
                },
                label: {
                    show: false,
                },
                itemStyle: {
                    borderWidth: 0.4,
                    borderColor: "#000",
                    opacity: 1,
                    shadowColor: "rgba(0, 0, 0, 0.7)",
                    shadowBlur: 6,
                    shadowOffsetX: 2,
                    // color: this.colors[`${zona}Color2`],
                },
            }
        })
        return series
    }

    oninit({ attrs, state }) {
        state.dimensions = []
        state.source = []
        state.elId = attrs.elId

        state.background = {
            type: "linear",
            x: -1,
            y: 0,
            x2: 2,
            y2: 0,
            colorStops: [
                {
                    offset: 0,
                    color: "rgba(28, 30, 40, 0.3)",
                },
                {
                    offset: 0.4,
                    color: "rgba(28, 30, 40, 0.3)",
                },
                {
                    offset: 0.5,
                    color: "rgba(50, 50, 50, 0.3)",
                },
                {
                    offset: 0.7,
                    color: "rgba(28, 30, 40, 0.3)",
                },
                {
                    offset: 1,
                    color: "rgba(28, 30, 40, 0.3)",
                },
            ],
        }

        state.title = {
            show: true,
            text: attrs.title,
            left: "center",
            y: "100",
            top: "16",
            textStyle: {
                fontSize: 12,
                fontStyle: "italic",
                fontWeight: "bolder",
                color: "#F4F5F5",
            },
        }

        state.colors = {
            // termico color
            termicoColor1: "rgb(154, 31, 26)",
            termicoColor2: "rgb(228, 93, 87)",
            termicoEmphasisColor1: "rgb(144, 21, 16)",
            termicoEmphasisColor2: "rgb(228, 93, 87)",
            // pompaggio color
            pompaggioColor1: "rgb(0,92,59)",
            pompaggioColor2: "rgb(22,190,114)",
            pompaggioEmphasisColor1: "rgb(0,84,54)",
            pompaggioEmphasisColor2: "rgb(17,142,85)",
            // idrico color
            idricoColor1: "rgb(0,119,144)",
            idricoColor2: "rgb(69,195,222)",
            idricoEmphasisColor1: "rgb(1,94,113)",
            idricoEmphasisColor2: "rgb(52,162,185)",
            // idrico color
            autoproduttoreColor1: "rgb(85,72,184)",
            autoproduttoreColor2: "rgb(110,96,219)",
            autoproduttoreEmphasisColor1: "rgb(73,58,183)",
            autoproduttoreEmphasisColor2: "rgb(17,142,85)",
            // eolico color
            eolicoColor1: "rgb(15,122,205)",
            eolicoColor2: "rgb(84,159,216)",
            eolicoEmphasisColor1: "rgb(3,107,186)",
            eolicoEmphasisColor2: "rgb(59,141,204)",
            // solare color
            solareColor1: "rgb(239,212,38)",
            solareColor2: "rgb(255,245,181)",
            solareEmphasisColor1: "rgb(209,163,19)",
            solareEmphasisColor2: "rgb(217,217, 87)",
            // geotermico color
            geotermicoColor1: "rgb(100,61,22)",
            geotermicoColor2: "rgb(178,123,67)",
            geotermicoEmphasisColor1: "rgb(89, 53, 16)",
            geotermicoEmphasisColor2: "rgb(217, 217, 87)",
        }
    }

    view({ state }) {
        return m(`.grafico#${state.elId}`)
    }

    oncreate({ attrs, state }) {
        let dom = document.getElementById(state.elId)
        let myChart = echarts.init(dom, "dark", { height: 300 })
        let option = this._Option()

        myChart.setOption(option, true)

        state.chart = myChart
        state.resizeObserver = new ResizeObserver(() => {
            requestAnimationFrame(() => {
                if (!myChart.isDisposed()) myChart.resize({ height: 300 })
            })
        })
        state.resizeObserver.observe(dom)

        attrs.data.react(resp => {
            resp.then(remit => {
                state.dimensions = Object.keys(remit[0])
                state.source = remit
                myChart.setOption({
                    dataset: {
                        dimensions: state.dimensions,
                        source: state.source,
                    },
                    series: this._Series(),
                })
            }).catch(err => {
                console.log(`Errore richiesta json remit`, err)
            })
        })

        if (process.env.NODE_ENV !== "production") {
            let logStateAttrs = {
                attrs: attrs,
                state: state,
            }
            console.log(`Component: ${this._componentName}`, logStateAttrs)
        }
    }

    onremove({ state }) {
        if (state.resizeObserver) state.resizeObserver.disconnect()
        if (state.chart) state.chart.dispose()
    }
}

export default Grafico
