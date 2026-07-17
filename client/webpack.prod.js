const { merge } = require("webpack-merge")
const webpack = require("webpack")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin")
const CompressionPlugin = require("compression-webpack-plugin")
const common = require("./webpack.common.js")
const HtmlWebPackPlugin = require("html-webpack-plugin")
const TerserPlugin = require("terser-webpack-plugin")

module.exports = merge(common, {
    mode: "production",
    output: {
        clean: true,
    },
    module: {
        rules: [
            {
                test: /(\.css|\.scss)$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    { loader: "css-loader", options: { sourceMap: false } },
                    { loader: "postcss-loader", options: { sourceMap: false } },
                    {
                        loader: "sass-loader",
                        options: {
                            sourceMap: false,
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
    optimization: {
        nodeEnv: "production",
        splitChunks: {
            chunks: "async",
            cacheGroups: {
                default: false,
                commons: {
                    test: /[\\/]node_modules[\\/]/,
                    name: "vendor",
                    chunks: "initial",
                    reuseExistingChunk: true,
                    enforce: true,
                },
            },
        },
        runtimeChunk: {
            name: "manifest",
        },
        minimizer: [
            new TerserPlugin({
                parallel: true,
                extractComments: false,
                terserOptions: {
                    ecma: 2017,
                },
            }),
            new CssMinimizerPlugin({
                minimizerOptions: {
                    preset: [
                        "default",
                        {
                            discardComments: {
                                removeAll: true,
                            },
                        },
                    ],
                },
            }),
        ],
    },
    plugins: [
        new HtmlWebPackPlugin({
            template: "./index_prod.html",
            filename: "./index.html",
            inject: false,
        }),
        new webpack.DefinePlugin({
        }),
        new MiniCssExtractPlugin({
            filename: "css/[name].css",
        }),
        new CompressionPlugin({
            algorithm: "gzip",
            test: /\.js$|\.css$/,
            threshold: 10240,
            minRatio: 0.8,
        }),
    ],
})
