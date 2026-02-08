const esbuild = require('esbuild');
const path = require('path');

// Plugin to ignore CSS imports entirely
const ignoreCssPlugin = {
    name: 'ignore-css',
    setup(build) {
        build.onResolve({ filter: /\.css$/ }, args => ({
            path: args.path,
            namespace: 'ignore-css',
        }));
        build.onLoad({ filter: /.*/, namespace: 'ignore-css' }, () => ({
            contents: '',
            loader: 'js',
        }));
    },
};

async function build() {
    try {
        console.log('Starting JS Build...');
        await esbuild.build({
            entryPoints: ['./src/main.jsx'],
            bundle: true,
            minify: true,
            outfile: './dist/assets/index.js',
            format: 'esm',
            loader: {
                '.jsx': 'jsx',
                '.js': 'jsx',
                '.svg': 'dataurl',
                '.png': 'dataurl',
                '.jpg': 'dataurl',
            },
            alias: {
                '@': path.resolve(__dirname, 'src'),
            },
            plugins: [ignoreCssPlugin],
            define: {
                'process.env.NODE_ENV': '"production"',
                'global': 'window',
            },
            resolveExtensions: ['.jsx', '.js', '.json'],
            // Inject React shim into every file
            inject: ['./react-shim.js'],
            jsx: 'automatic',
        });
        console.log('JS Build Success: ./dist/assets/index.js');
    } catch (error) {
        console.error('JS Build Failed:', error);
        process.exit(1);
    }
}

build();
