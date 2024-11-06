import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { resolve } from 'path';
import webpack from 'webpack';

export default {
	mode: 'production',
	entry: resolve('./src/index.ts'),
	devtool: false,
	output: {
		path: resolve('./dist'),
		filename: 'index.js',
		library: { name: 'monaco-bundle', type: 'umd', }
	},
	resolve: {
		extensions: ['.ts', '.js'],
		mainFields: ['browser', 'module', 'main']
	},
	module: {
		rules: [
			{ test: /\.css$/i, use: [ MiniCssExtractPlugin.loader, "css-loader" ], },
			{ test: /\.([cm]?ts|tsx)$/, loader: "ts-loader" },
			{ test: /\.ttf$/, type: 'asset/resource', generator: { filename: '[name][ext]' } }
		],
	},
	plugins: [
		new MiniCssExtractPlugin({ filename: "monaco.css" }),
		new webpack.optimize.LimitChunkCountPlugin({
			maxChunks: 1
		})
	],
	optimization: {
		splitChunks: false, // Disable code splitting
		runtimeChunk: false, // Include runtime in the bundle
	},	
};
