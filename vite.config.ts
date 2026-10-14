import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // `BASE_PATH` cho phép deploy vào THƯ MỤC CON (ví dụ GitHub Pages project site).
  // - Deploy ở tên miền gốc (Cloudflare Pages, Vercel, Netlify, hosting thường): để trống.
  // - GitHub Pages dạng https://<user>.github.io/<repo>/ : đặt BASE_PATH=/<repo>/
  // Có thể set bằng biến môi trường khi build, hoặc tạo file .env / .env.local.
  const env = loadEnv(mode, process.cwd(), '');
  const base = process.env.BASE_PATH || env.BASE_PATH || '/';

  return {
    base,
    plugins: [react(), tailwindcss()],
  };
});
