import path from 'path';
import { fileURLToPath } from 'url';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import webpack from 'webpack';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

export default (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: './src/main.tsx',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? '[name].[contenthash].js' : '[name].js',
      clean: true,
      publicPath: process.env.PUBLIC_PATH || '/',
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.jsx'],
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx|js|jsx)$/,
          use: 'babel-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
            'postcss-loader',
          ],
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource',
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './index.html',
        favicon: false,
        publicPath: process.env.PUBLIC_PATH || '/',
      }),
      new webpack.DefinePlugin({
        'import.meta.env': JSON.stringify({
          MODE: isProduction ? 'production' : 'development',
          VITE_GMAPS_API_KEY: process.env.VITE_GMAPS_API_KEY,
          VITE_GAS_ENDPOINT: process.env.VITE_GAS_ENDPOINT,
          VITE_APP_PASSWORD: process.env.VITE_APP_PASSWORD,
        }),
      }),
      ...(isProduction ? [new MiniCssExtractPlugin({
        filename: '[name].[contenthash].css',
      })] : []),
      new CopyWebpackPlugin({
        patterns: [
          { from: 'public', to: '.' }
        ],
      }),
    ],
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist'),
      },
      port: 4000,
      host: 'localhost',
      hot: true,
      open: true,
    },
    devtool: isProduction ? 'source-map' : 'eval-source-map',
  };
};