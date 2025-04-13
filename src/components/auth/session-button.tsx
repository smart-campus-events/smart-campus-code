'use client';

import { useSession } from 'next-auth/react';
import { signOut } from '@/app/api/auth/[...nextauth]/route';

export default function SessionButton() {
  const { data: session } = useSession();

  if (session) {
    return (
      <div>
        Signed in as
        {' '}
        {session.user?.email}
        <button onClick={() => signOut()}>Sign out</button>
      </div>
    );
  }

  return <a href="/auth/signin">Sign in</a>;
}
