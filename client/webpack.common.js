const { resolve } = require("path")

var webpack = require("webpack")

module.exports = {
    context: resolve(__dirname, "src"),
    entry: ["./pack/application.js"],
    output: {
        path: resolve(__dirname, "dist/"),
        filename: "./js/[name]-bundle.js",
        chunkFilename: "js/[name]-bundle.js",
    },
    resolve: {
        extensions: [".js"],
        alias: {
            components: resolve(__dirname, "src/components"),
            "mithril/stream": resolve(__dirname, "node_modules/mithril/stream/stream.js"),
            mithril: resolve(__dirname, "node_modules/mithril/mithril.js"),
        },
    },
    module: {
        rules: [
            {
                // selectr è un UMD che in webpack prenderebbe il ramo AMD: disabilito define e lego this a window
                test: /mobius1-selectr[\\/]dist[\\/]selectr\.min\.js$/,
                use: [
                    {
                        loader: "imports-loader",
                        options: {
                            wrapper: "window",
                            additionalCode: "var define = false;",
                        },
                    },
                ],
            },
            {
                test: /.(ttf|otf|eot|woff(2)?)(\?[a-z0-9]+)?$/,
                type: "asset/resource",
                generator: {
                    filename: "fonts/[name][ext]",
                    // il css finisce in css/, i font vanno raggiunti con ../fonts/
                    publicPath: "../",
                },
            },
            {
                test: /\.(png|jpg|svg|gif|ico)$/,
                type: "asset/resource",
                generator: {
                    filename: "images/[name][ext]",
                    publicPath: "../",
                },
            },
        ],
    },
    plugins: [
        new webpack.ProvidePlugin({
            m: "mithril", //Global access
            noUiSlider: "nouislider",
            MainLoop: "mainloop.js",
            // shim locale: registra i moduli echarts usati (use) e riesporta il core
            echarts: resolve(__dirname, "src/init/echarts.js"),
            dayjs: "dayjs",
            derive: ["derivable", "derive"],
            atom: ["derivable", "atom"],
            lens: ["derivable", "lens"],
        }),
    ],
}
