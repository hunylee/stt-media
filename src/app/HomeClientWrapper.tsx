'use client';

/**
 * src/app/HomeClientWrapper.tsx
 * Client Component — dynamic + ssr:false를 여기서 처리합니다.
 * Next.js App Router에서 ssr:false는 Server Component에서 사용 불가.
 * page.tsx(Server)가 이 래퍼를 import → 래퍼가 HomeClient를 lazy-load.
 */

import dynamic from 'next/dynamic';

const HomeClient = dynamic(() => import('./HomeClient'), {
  ssr: false,
  loading: () => (
    <div className="app-loading">
      <span>✈️</span>
      <span>공항 자막 서비스 로딩 중...</span>
    </div>
  ),
});

export default function HomeClientWrapper() {
  return <HomeClient />;
}
