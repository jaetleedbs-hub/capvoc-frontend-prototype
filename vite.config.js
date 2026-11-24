import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // 백엔드 기본 포트(로컬). 필요 시 .env 의 VITE_PROXY_TARGET 로 재정의한다.
  //  ★ backend/.env 의 SERVER_PORT 와 <반드시 짝이 맞아야> 한다.
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://localhost:18030';

  const proxyOptions = {
    target: proxyTarget,
    changeOrigin: true,
    secure: false,
    // 로컬 개발 전용: 브라우저 Origin/Referer 제거로 동일출처 요청처럼 처리
    configure: (proxy) => {
      proxy.on('proxyReq', (proxyReq) => {
        proxyReq.removeHeader('origin');
        proxyReq.removeHeader('referer');
      });
    },
  };

  const aliasDirs = ['common', 'components', 'containers', 'store', 'assets',
    'service', 'constants', 'routes', 'utils', 'cti', 'sample', 'rec', 'docs', 'examples'];
  const alias = Object.fromEntries(
    aliasDirs.map((d) => [d, path.resolve(__dirname, 'src/' + d)])
  );

  return {
    plugins: [
      react({
        jsxRuntime: 'automatic',
        include: '**/*.{js,jsx,ts,tsx}',
      }),
    ],
    // 이 프로젝트의 소스는 .js 안에 JSX 가 있으므로 esbuild 에 jsx 로더를 지정한다
    esbuild: {
      loader: 'jsx',
      include: /\.js$/,
      exclude: [],
      // 운영 빌드 산출물에서 console/debugger 를 제거한다.
      // 개별 로그를 지워도 새 코드가 다시 추가되므로 산출물 단계에서 일괄 차단한다.
      // 개발 모드에서는 그대로 두어 디버깅을 막지 않는다.
      drop: mode === 'production' ? ['console', 'debugger'] : [],
    },
    optimizeDeps: {
      // 루트 index.html 만 dep 스캔 엔트리로 삼는다(docs/public/src 의 html 제외)
      entries: ['index.html'],
      // dep 사전번들 스캐너에도 .js 를 jsx 로 파싱 (키는 esbuildOptions)
      esbuildOptions: {
        loader: { '.js': 'jsx' },
      },
    },
    resolve: {
      dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
      alias,
      extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json'],
    },
    css: {
      modules: { localsConvention: 'camelCase' },
      preprocessorOptions: { scss: { additionalData: '' } },
    },
    server: {
      port: Number(env.VITE_PORT) || 18031,   // 백엔드(18030)와 짝
      strictPort: true,   // 포트가 점유돼 있으면 조용히 옮기지 않고 명확히 실패한다
      open: true,
      // 배포 도메인의 Host 헤더 허용. localhost·IP 는 기본 허용이라 로컬 개발에는 영향이 없다.
      //  ★ 새 프로젝트의 도메인으로 바꾼다.
      allowedHosts: ['.buttle.co.kr'],
      proxy: {
        '/api': proxyOptions,
        '/login': proxyOptions,
        '/logout': proxyOptions,
      },
    },
    // 배포에서 `vite preview` 로 서빙될 때도 동일하게 허용목록을 둔다.
    preview: {
      allowedHosts: ['.buttle.co.kr'],
    },
    build: {
      outDir: 'build',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            redux: ['redux', 'react-redux'],
            router: ['react-router-dom'],
            grid: ['ag-grid-community', 'ag-grid-react'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.PUBLIC_URL': JSON.stringify(''),
      'process.env.API_URL': JSON.stringify(process.env.API_URL || ''),
      'process.env.REACT_APP_USE_MOCK': JSON.stringify(process.env.REACT_APP_USE_MOCK || 'false'),
      // 회사·테마별 빌드 스위치. src/common/theme.js 가 이 값으로 색 계열을 고른다.
      'process.env.REACT_APP_COMPANY_CODE': JSON.stringify(process.env.VITE_COMPANY_CODE || 'DEFAULT'),
    },
  };
});
