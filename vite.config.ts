
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // GitHub Pagesで公開する場合、リポジトリ名をbaseに指定する必要があります
  // 例: https://username.github.io/repo-name/ なら base: '/repo-name/'
  base: './', 
});
