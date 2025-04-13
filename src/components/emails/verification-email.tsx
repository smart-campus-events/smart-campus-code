import { Html } from '@react-email/html';

export default function VerificationEmail({ verificationLink }: { verificationLink: string }) {
  return (
    <Html>
      <h1>Verify Your Email</h1>
      <p>Click the link below to verify your email:</p>
      <a href={verificationLink}>Verify Email</a>
    </Html>
  );
}
