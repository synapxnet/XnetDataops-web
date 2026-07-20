import { defineConfig } from '@vben/vite-config';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      server: {
        proxy: {
          '/usr': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/usr/, '/api/usr'),
            target: 'http://127.0.0.1:9287',
            ws: true,
          },
          '/dsm': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/dsm/, '/api/dsm'),
            target: 'http://127.0.0.1:9281',
            ws: true,
          },
          '/dim': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/dim/, '/api/dim'),
            target: 'http://127.0.0.1:9282',
            ws: true,
          },
          '/ddv': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/ddv/, '/api/ddv'),
            target: 'http://127.0.0.1:9283',
            ws: true,
          },
          '/tsk': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/tsk/, '/api/tsk'),
            target: 'http://127.0.0.1:9284',
            ws: true,
          },
          '/dqm': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/dqm/, '/api/dqm'),
            target: 'http://127.0.0.1:9285',
            ws: true,
          },
          '/dgv': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/dgv/, '/api/dgv'),
            target: 'http://127.0.0.1:9286',
            ws: true,
          },
          '/das': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/das/, '/api/das'),
            target: 'http://127.0.0.1:9288',
            ws: true,
          },
          '/dap': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/dap/, '/api/dap'),
            target: 'http://127.0.0.1:9289',
            ws: true,
          },
          '/dms': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/dms/, '/api/dms'),
            target: 'http://127.0.0.1:9290',
            ws: true,
          },
          '/dob': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/dob/, '/api/dob'),
            target: 'http://127.0.0.1:9291',
            ws: true,
          },
          '/dau': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/dau/, '/api/dau'),
            target: 'http://127.0.0.1:9292',
            ws: true,
          },
        },
      },
    },
  };
});
