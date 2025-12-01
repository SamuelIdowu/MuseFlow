import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

export default function SignInCallbackPage() {
  return (
    <div>
      <AuthenticateWithRedirectCallback />
    </div>
  );
}