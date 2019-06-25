const webpack = require('webpack');

module.exports = {
    entry: {
        demo: './demo.js',
    },
    output: {
        path: __dirname,
        filename: './[name].bundle.js',
        library: "Demo",
        libraryTarget: "umd",
        chunkFilename: '[name]-[chunkhash].js'
    },
    target: 'web',
    watch: false,
    devtool: "eval-source-map",
    devServer: {
        port: 5000
    },
    cache: true,
};

