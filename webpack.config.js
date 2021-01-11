const webpack = require('webpack');

module.exports = {
    entry: {
        web: './src/cerberus.js',
    },
    output: {
        path: __dirname,
        filename: './dist/demonic-[name].bundle.js',
        library: 'DemonicWeb',
        libraryTarget: 'umd',
        chunkFilename: '[name]-[chunkhash].js',
        globalObject: 'this',
    },
    watchOptions: {
        poll: true
    },
    target: 'web',
    watch: false,
    devtool: 'eval-source-map',
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

