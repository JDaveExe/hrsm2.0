const webpack = require('webpack');
const path = require('path');

module.exports = function override(config, env) {
  // Tree shaking optimization for all environments
  config.optimization = {
    ...config.optimization,
    usedExports: true,
    sideEffects: false, // Enable tree shaking
  };

  // Only apply additional optimizations in production
  if (env === 'production') {
    // Bundle splitting
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            chunks: 'all',
          },
          common: {
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            priority: 20,
            chunks: 'all',
          },
          bootstrap: {
            test: /[\\/]node_modules[\\/](bootstrap|react-bootstrap)[\\/]/,
            name: 'bootstrap',
            priority: 15,
            chunks: 'all',
          },
          charts: {
            test: /[\\/]node_modules[\\/](chart\.js|react-chartjs-2)[\\/]/,
            name: 'charts',
            priority: 15,
            chunks: 'all',
          },
        },
      },
    };

    // Add compression plugin
    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify('production'),
      })
    );

    // Optimize imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@styles': path.resolve(__dirname, 'src/styles'),
      '@context': path.resolve(__dirname, 'src/context'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
    };
  }

  return config;
};
