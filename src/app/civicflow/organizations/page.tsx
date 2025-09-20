import { Suspense } from 'react';
import Client from './page.client';

export default function OrgsPage() {
  return (
    <Suspense>
      <Client />
    </Suspense>
  );
}