/**
 * src/app/page.tsx
 * Server Component — dynamic + ssr:false는 Client Component에서만 허용.
 * HomeClientWrapper(Client Component)를 통해 HomeClient를 lazy-load합니다.
 */

import HomeClientWrapper from './HomeClientWrapper';

export default function Page() {
  return <HomeClientWrapper />;
}
