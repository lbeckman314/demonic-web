const webpack = require('webpack');

module.exports = {
    entry: {
        web: './web.js',
    },
    output: {
        path: __dirname,
        filename: './[name].bundle.js',
        library: "Web",
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
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
};

