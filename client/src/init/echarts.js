// src/init/echarts.js

// echarts 6 modulare: registra i soli moduli usati dai 4 grafici e riesporta il core.
// Questo modulo è il target del ProvidePlugin (global "echarts"): chiunque usi echarts
// passa da qui, quindi la registrazione è garantita prima di ogni echarts.init
import * as echarts from "echarts/core"
import { BarChart, LineChart } from "echarts/charts"
import { AxisPointerComponent, DataZoomComponent, DatasetComponent, GridComponent, LegendComponent, TitleComponent, ToolboxComponent, TooltipComponent } from "echarts/components"
import { CanvasRenderer } from "echarts/renderers"

echarts.use([BarChart, LineChart, AxisPointerComponent, DataZoomComponent, DatasetComponent, GridComponent, LegendComponent, TitleComponent, ToolboxComponent, TooltipComponent, CanvasRenderer])

export * from "echarts/core"
