import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import socIndexHandler from './api/soc-index';
import wagesHandler from './api/wages';

const apiMiddleware = () => ({
    name: 'api-middleware',
    configureServer(server: any) {
        server.middlewares.use(async (req: any, res: any, next: any) => {
            if (!req.url.startsWith('/api/')) {
                return next();
            }

            // Parse query string for Vercel req mock
            const url = new URL(req.url, `http://${req.headers.host}`);
            req.query = Object.fromEntries(url.searchParams);

            // Mock Vercel response helper
            res.status = (code: number) => {
                res.statusCode = code;
                return res;
            };
            res.json = (data: any) => {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
            };

            try {
                if (url.pathname === '/api/soc-index') {
                    await socIndexHandler(req, res);
                } else if (url.pathname === '/api/wages') {
                    await wagesHandler(req, res);
                } else {
                    res.status(404).json({ error: 'Not found' });
                }
            } catch (err: any) {
                console.error('API Error:', err);
                res.status(500).json({ error: err.message });
            }
        });
    }
});

export default defineConfig({
    plugins: [react(), apiMiddleware()],
});
