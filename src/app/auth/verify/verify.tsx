import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function VerifyPage() {
  const { query } = useRouter();
  const [status, setStatus] = useState('Verifying…');

  useEffect(() => {
    if (!query.token) return;
    fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: query.token }),
    })
      .then((res) => res.json())
      .then((data) => setStatus(data.message))
      .catch(() => setStatus('Verification failed'));
  }, [query.token]);

  return <div style={{ padding: 20 }}><h1>{status}</h1></div>;
}
