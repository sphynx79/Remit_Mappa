const { resolve } = require("path")
const webpack = require("webpack")
const { merge } = require("webpack-merge")
const common = require("./webpack.common.js")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const HtmlWebPackPlugin = require("html-webpack-plugin")
const fs = require("fs")

if (process.env.ssl) {
    var serverport = 9000
    var port = 2015
    var server = { type: "https", options: { key: fs.readFileSync("localhost.key"), cert: fs.readFileSync("localhost.crt") } }
} else {
    var serverport = 9001
    var port = 9292
    var server = { type: "http" }
}

module.exports = merge(common, {
    mode: "development",
    devtool: "inline-source-map",
    devServer: {
        static: false,
        hot: true,
        port: serverport,
        historyApiFallback: true,
        server: server,
        open: false,
        client: {
            overlay: {
                errors: true,
                warnings: true,
            },
        },
        devMiddleware: {
            stats: "errors-only",
        },
    },
    module: {
        rules: [
            {
                test: /(\.css|\.scss)$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: "css-loader",
                        options: {
                            sourceMap: true,
                        },
                    },
                    {
                        loader: "postcss-loader",
                    },
                    {
                        loader: "sass-loader",
                        options: {
                            sassOptions: {
                                // il carbon v9 custom usa sintassi scss vecchia: zittisco le deprecation di dart-sass
                                quietDeps: true,
                                silenceDeprecations: ["import", "global-builtin", "color-functions", "slash-div", "if-function", "new-global"],
                            },
                        },
                    },
                ],
            },
        ],
    },
    plugins: [
        new webpack.optimize.LimitChunkCountPlugin({
            maxChunks: 1,
        }),
        new HtmlWebPackPlugin({
            template: "./index.html",
            filename: "./index.html",
            favicon: "./images/ampere.png",
        }),
        new webpack.DefinePlugin({
            NEXT: JSON.stringify(process.env.next),
            PORTDEV: JSON.stringify(port),
        }),
        new webpack.WatchIgnorePlugin({ paths: [resolve(__dirname, "node_modules")] }),
        new MiniCssExtractPlugin({
            filename: "css/[name].css",
        }),
    ],
})
