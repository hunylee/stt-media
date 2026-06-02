'use client';

/**
 * src/app/page.tsx
 * 'use client' 선언으로 Client Component로 지정.
 * dynamic + ssr:false는 Client Component 안에서만 허용됩니다.
 * 브라우저 API를 사용하는 HomeClient는 서버에서 렌더되지 않으므로
 * hydration 불일치가 완전히 제거됩니다.
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

export default function Page() {
  return <HomeClient />;
}
