import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import { PreviewApp } from './PreviewApp';

/**
 * Trang xem trước model 3D — CHỈ dùng khi phát triển.
 *
 * Mở: `npm run dev` rồi vào http://localhost:5173/preview.html
 * Trang này không nằm trong `dist/` sau khi build production
 * (Vite chỉ build `index.html`), nên không lọt lên web.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PreviewApp />
  </StrictMode>
);
