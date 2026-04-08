import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    // Note: vite-plugin-ssg is available if you want to enable static site generation
    // Uncomment below to enable SSG for the landing page
    // This will pre-render the landing page for better SEO
    /*
    VitePluginSSG({
      routes: ['/'],
      onBeforePageRender: (route, app) => {
        // Custom logic before rendering
      }
    })
    */
  ],
  // Development server configuration
  server: {
    port: 3001,
    host: '0.0.0.0', // Allow external connections for subdomain routing
    allowedHosts: ['.localhost.com'], // Allow any subdomain of localhost.com
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          // Handle subdomain routing for API calls
          proxy.on('proxyReq', (proxyReq, req) => {
            // Extract subdomain from host header
            const host = req.headers.host;
            // Updated check to handle different local hostnames
            if (host && host.includes('.localhost.com')) {
              const subdomain = host.split('.')[0];
              proxyReq.setHeader('X-Tenant-Subdomain', subdomain);
              // Also set the origin header to match the subdomain request
              proxyReq.setHeader('Origin', `http://${host}`);
            }
          });

          // Handle CORS preflight requests
          proxy.on('proxyRes', (proxyRes, req) => {
            // Add CORS headers for subdomain requests
            const origin = req.headers.origin;
            if (origin && origin.includes('.localhost.com')) {
              proxyRes.headers['Access-Control-Allow-Origin'] = origin;
              proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
            }
          });
        },
      },
    },
  },
  // Build optimization
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          landing: [
            './src/components/landing/Hero.jsx',
            './src/components/landing/ProblemSolution.jsx',
            './src/components/landing/MobileAppSection.jsx',
            './src/components/landing/HowItWorks.jsx',
            './src/components/landing/Footer.jsx',
          ],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
