import { SignIn } from '@clerk/nextjs';

export default function ForgotPasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignIn routing="path" path="/auth/sign-in" initialValues={{ emailAddress: '' }} />
    </div>
  );
}
