import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { fileURLToPath } from 'url';
import { componentTagger } from 'lovable-tagger';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget =
    env.VITE_DEV_PROXY_TARGET ||
    env.VITE_API_BASE_URL ||
    'http://localhost:8000';

  return {
    server: {
      host: '::',
      port: 8080,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          // Uncomment if your backend does not prefix routes with /api
          // rewrite: (p) => p.replace(/^\/api/, ''),
        },
      },
    },
    plugins: [react(), mode === 'development' && componentTagger()].filter(
      Boolean
    ),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    cacheDir: path.resolve(__dirname, 'node_modules/.vite'),
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        '@tanstack/react-query',
        'next-themes',
        'lucide-react',
        'sonner',
        'recharts',
        'embla-carousel-react',
        'react-day-picker',
        'jspdf',
        'jspdf-autotable',
        'vaul',
        'cmdk',
        'zod',
        'date-fns',
        'class-variance-authority',
        'clsx',
        '@radix-ui/react-accordion',
        '@radix-ui/react-alert-dialog',
        '@radix-ui/react-aspect-ratio',
        '@radix-ui/react-avatar',
        '@radix-ui/react-checkbox',
        '@radix-ui/react-collapsible',
        '@radix-ui/react-context-menu',
        '@radix-ui/react-dialog',
        '@radix-ui/react-dropdown-menu',
        '@radix-ui/react-hover-card',
        '@radix-ui/react-label',
        '@radix-ui/react-menubar',
        '@radix-ui/react-navigation-menu',
        '@radix-ui/react-popover',
        '@radix-ui/react-progress',
        '@radix-ui/react-radio-group',
        '@radix-ui/react-scroll-area',
        '@radix-ui/react-select',
        '@radix-ui/react-separator',
        '@radix-ui/react-slider',
        '@radix-ui/react-slot',
        '@radix-ui/react-switch',
        '@radix-ui/react-tabs',
        '@radix-ui/react-toast',
        '@radix-ui/react-toggle',
        '@radix-ui/react-toggle-group',
        '@radix-ui/react-tooltip',
      ],
    },
  };
});
