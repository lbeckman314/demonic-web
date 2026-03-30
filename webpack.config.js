const webpack = require('webpack');

module.exports = {
    entry: {
        web: './src/cerberus.js',
    },
    experiments: {
        outputModule: true,
    },
    output: {
        path: __dirname,
        filename: './dist/demonic-[name].bundle.js',
        library: {
            type: 'module',
        },
        chunkFilename: '[name]-[chunkhash].js',
    },
    plugins: [
        // Work around for Buffer is undefined:
        // https://github.com/webpack/changelog-v5/issues/10
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
        }),
        new webpack.ProvidePlugin({
            process: 'process/browser',
        }),
    ],
    resolve: {
        extensions: [ '.ts', '.js', '.mjs' ],
        fallback: {
            "process/browser": require.resolve("process/browser"),
            "buffer": require.resolve("buffer")
        }
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

