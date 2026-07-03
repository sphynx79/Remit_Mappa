const prettierRecommended = require("eslint-plugin-prettier/recommended")
const globals = require("globals")

module.exports = [
    prettierRecommended,
    {
        files: ["src/**/*.js"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                ...globals.browser,
                // globali iniettati da webpack.ProvidePlugin / DefinePlugin
                m: "readonly",
                noUiSlider: "readonly",
                MainLoop: "readonly",
                echarts: "readonly",
                dayjs: "readonly",
                derive: "readonly",
                atom: "readonly",
                lens: "readonly",
                NEXT: "readonly",
                PORTDEV: "readonly",
            },
        },
    },
]
