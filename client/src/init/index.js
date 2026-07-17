// src/init/index.js

// echarts 6 modulare: si registrano solo i moduli usati dai 4 grafici
// (bar/line su dataset, tooltip con axisPointer, legend, toolbox, dataZoom)
import * as echarts from "echarts/core"
import { BarChart, LineChart } from "echarts/charts"
import { AxisPointerComponent, DataZoomComponent, DatasetComponent, GridComponent, LegendComponent, TitleComponent, ToolboxComponent, TooltipComponent } from "echarts/components"
import { CanvasRenderer } from "echarts/renderers"

echarts.use([BarChart, LineChart, AxisPointerComponent, DataZoomComponent, DatasetComponent, GridComponent, LegendComponent, TitleComponent, ToolboxComponent, TooltipComponent, CanvasRenderer])

import "./index.scss"
import "../model/app.js"
import "./routes.js"
