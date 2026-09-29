const path = require('path');
const webpack = require('webpack');

module.exports = (env, argv) => ({
    entry: {
        // <demonic-terminal> custom element (the package's main entry).
        'demonic-terminal': './src/demonic-terminal.js',
        // run() API with the original page-wide markup and styles.
        'demonic-web.bundle': './src/cerberus.js',
    },
    experiments: {
        outputModule: true,
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        library: {
            type: 'module',
        },
        chunkFilename: '[name]-[chunkhash].js',
    },
    plugins: [
        new webpack.ProvidePlugin({
            process: 'process/browser',
        }),
    ],
    resolve: {
        extensions: [ '.ts', '.js', '.mjs' ],
        fallback: {
            "process/browser": require.resolve("process/browser"),
        }
    },
    watchOptions: {
        poll: true
    },
    target: 'web',
    watch: false,
    // eval-based source maps are for development only: they bloat the
    // bundle and are blocked by Content-Security-Policy without 'unsafe-eval'.
    devtool: argv.mode == 'production' ? false : 'eval-source-map',
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
});
