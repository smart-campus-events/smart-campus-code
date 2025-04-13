'use client';

import { useFormState } from 'react-dom';
import { signUp } from '@/app/actions/auth-actions';

export default function SignupPage() {
  const [state, formAction] = useFormState(signUp, { error: null });

  return (
    <form action={formAction}>
      <input
        type="email"
        name="email"
        placeholder="[email protected]"
        required
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        required
      />
      <button type="submit">Sign Up</button>
      {state.error && <p className="text-red-500">{state.error}</p>}
    </form>
  );
}
