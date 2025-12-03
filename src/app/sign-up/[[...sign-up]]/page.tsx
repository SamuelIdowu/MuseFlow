'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { useSignUp, useAuth } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Github, CheckCircle, X } from 'lucide-react';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signUp, isLoaded, setActive } = useSignUp();
  const { userId } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [pending, setPending] = useState(false);

  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState('');

  // Redirect if already signed in
  useEffect(() => {
    if (userId) {
      router.push('/dashboard');
    }
  }, [userId, router]);

  // Password validation checks
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
  const passwordsMatch = password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoaded) return;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!termsAccepted) {
      setError('Please accept the Terms of Service');
      return;
    }

    setPending(true);
    setError('');

    try {
      await signUp.create({
        emailAddress: email,
        password,
      });

      // After successful sign up, send email verification
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPending(false);
      setVerifying(true);
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      const errorMessage = err.errors?.[0]?.message || 'Failed to create account';

      // Handle "Session already exists" error
      if (errorMessage.toLowerCase().includes('session already exists') || err.status === 403) {
        console.log('Session already exists, redirecting to dashboard...');
        router.push('/dashboard');
        return;
      }

      setError(errorMessage);
      setPending(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setPending(true);
    setError('');

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status !== 'complete') {
        console.log(JSON.stringify(completeSignUp, null, 2));
        setError('Verification failed. Please try again.');
        setPending(false);
      } else {
        await setActive({ session: completeSignUp.createdSessionId });
        // Redirect handled by middleware or router
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setError(err.errors?.[0]?.message || 'Verification failed');
      setPending(false);
    }
  };

  if (verifying) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-background">
        <div className="flex h-full grow flex-col">
          <main className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-md mx-auto space-y-8">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-2xl">✉️</span>
                  </div>
                </div>
                <h2 className="text-2xl font-bold tracking-tight">Check your email</h2>
                <p className="text-muted-foreground mt-2">
                  We sent a verification code to <span className="font-medium text-foreground">{email}</span>
                </p>
              </div>

              {error && (
                <div className="rounded-lg bg-destructive/15 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Verification Code</Label>
                  <Input
                    id="code"
                    placeholder="Enter code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="text-center text-lg tracking-widest"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={pending || !code}
                >
                  {pending ? 'Verifying...' : 'Verify Email'}
                </Button>
              </form>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background">
      <div className="flex h-full grow flex-col">
        <main className="flex-1">
          <div className="flex flex-col md:flex-row min-h-screen">
            {/* Left Panel */}
            <div className="w-full md:w-1/2 lg:w-5/12 bg-[#111c22] p-8 sm:p-12 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-10">
                  <span className="text-4xl text-primary">✨</span>
                  <span className="text-white text-xl font-bold">ContentAI</span>
                </div>
              </div>
              <div className="my-auto">
                <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
                  <h1 className="text-white tracking-light text-4xl font-bold leading-tight pb-3">
                    The Future of Content Creation Starts Here.
                  </h1>
                  <p className="text-gray-300 text-lg font-normal leading-normal pb-3 pt-1">
                    Generate, refine, and publish compelling content in minutes.
                  </p>
                </div>
              </div>
              <div className="flex w-full grow @container pt-8">
                <div className="w-full gap-2 overflow-hidden aspect-[16/9] flex rounded-xl">
                  <div
                    className="w-full bg-center bg-no-repeat bg-cover aspect-auto flex-1"
                    style={{
                      backgroundImage: 'url(https://lh3.googleusercontent.com/aida-public/AB6AXuDI531-Vle0fO3brB5k-QeO-YvfudVhxbZmpxzZwCu5ZgcsZJwykl_QgHeLCUYoep7K3lNF7pNo7AdCE5uawqLGQWoAUK-hirK1-Ngtnlpi--Kct9ChN1Xo2StR5RupJd5WOAQN-LEp7pJttcW6fg1uShTkfh0xtpzOpRJpskOdoKvTmYwtr5fhGP0zaBtySR0n1_B0I71zyWOE-VeLVLDfPoh3GuINteRpSINuVjtmIiRPXUhQpdcot1e6Wz8YP0tKVu3RFxvgpA)',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Right Panel */}
            <div className="w-full md:w-1/2 lg:w-7/12 flex items-center justify-center p-8 sm:p-12 bg-background">
              <div className="w-full max-w-md mx-auto">
                <div className="layout-content-container flex flex-col flex-1">
                  <div className="flex flex-wrap justify-between gap-3 mb-6">
                    <div className="flex flex-col gap-1">
                      <p className="text-foreground text-3xl font-black leading-tight tracking-[-0.033em]">
                        Create Your Account
                      </p>
                      <p className="text-muted-foreground text-base font-normal leading-normal">
                        Get started for free
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 items-stretch">
                    <Button
                      variant="outline"
                      className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 text-base font-bold leading-normal tracking-[0.015em] w-full gap-2"
                      onClick={() => signUp?.authenticateWithRedirect({
                        strategy: 'oauth_google',
                        redirectUrl: '/dashboard',
                        redirectUrlComplete: '/auth/callback',
                      })}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <g clipPath="url(#clip0_105_233)">
                          <path d="M22.5002 12.2727C22.5002 11.4545 22.4275 10.6591 22.282 9.88636H12.2729V14.25H18.0684C17.8184 15.8636 17.0002 17.2955 15.6593 18.25V21.1023H19.5002C21.4547 19.3409 22.5002 16.0909 22.5002 12.2727Z" fill="#4285F4"></path>
                          <path d="M12.2727 22.5C15.1136 22.5 17.5682 21.5682 19.5 20.1023L15.6591 18.25C14.6818 18.9091 13.5682 19.2955 12.2727 19.2955C9.76136 19.2955 7.61364 17.6591 6.85227 15.3409H2.86364V18.2955C4.77273 20.8182 8.25 22.5 12.2727 22.5Z" fill="#34A853"></path>
                          <path d="M6.85227 15.3409C6.61364 14.6818 6.47727 13.9773 6.47727 13.2273C6.47727 12.4773 6.61364 11.7727 6.85227 11.1136V8.15909H2.86364C2.07273 9.68182 1.59091 11.4091 1.59091 13.2273C1.59091 15.0455 2.07273 16.7727 2.86364 18.2955L6.85227 15.3409Z" fill="#FBBC05"></path>
                          <path d="M12.2727 7.15909C13.75 7.15909 15.2045 7.68182 16.3182 8.75L19.5909 5.47727C17.5568 3.61364 15.1136 2.5 12.2727 2.5C8.25 2.5 4.77273 4.18182 2.86364 6.70455L6.85227 9.65909C7.61364 7.34091 9.76136 5.70455 12.2727 7.15909V7.15909Z" fill="#EA4335"></path>
                        </g>
                        <defs>
                          <clipPath id="clip0_105_233">
                            <rect fill="white" height="21" transform="translate(1.59091 1.5)" width="21"></rect>
                          </clipPath>
                        </defs>
                      </svg>
                      <span className="truncate">Continue with Google</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 text-base font-bold leading-normal tracking-[0.015em] w-full gap-2"
                      onClick={() => signUp?.authenticateWithRedirect({
                        strategy: 'oauth_github',
                        redirectUrl: '/dashboard',
                        redirectUrlComplete: '/auth/callback',
                      })}
                    >
                      <Github className="w-5 h-5" />
                      <span className="truncate">Continue with GitHub</span>
                    </Button>
                  </div>

                  <div className="flex items-center my-4">
                    <Separator className="flex-grow" />
                    <span className="mx-4 text-sm font-semibold text-foreground">OR</span>
                    <Separator className="flex-grow" />
                  </div>

                  {error && (
                    <div className="rounded-lg bg-destructive/15 p-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 px-4 rounded-lg"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="password" className="text-sm font-semibold text-foreground">
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-12 px-4 rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="confirm-password" className="text-sm font-semibold text-foreground">
                        Confirm Password
                      </Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-12 px-4 rounded-lg"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-foreground mt-1">
                      <span className="flex items-center gap-1.5">
                        {hasMinLength ? (
                          <CheckCircle className="text-sm text-green-500" size={16} />
                        ) : (
                          <X className="text-sm text-red-500" size={16} />
                        )}
                        8+ characters
                      </span>
                      <span className="flex items-center gap-1.5">
                        {hasUppercase ? (
                          <CheckCircle className="text-sm text-green-500" size={16} />
                        ) : (
                          <X className="text-sm text-red-500" size={16} />
                        )}
                        1 uppercase
                      </span>
                      <span className="flex items-center gap-1.5">
                        {hasNumber ? (
                          <CheckCircle className="text-sm text-green-500" size={16} />
                        ) : (
                          <X className="text-sm text-red-500" size={16} />
                        )}
                        1 number
                      </span>
                      <span className="flex items-center gap-1.5">
                        {hasSpecialChar ? (
                          <CheckCircle className="text-sm text-green-500" size={16} />
                        ) : (
                          <X className="text-sm text-red-500" size={16} />
                        )}
                        1 special character
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-4">
                      <input
                        type="checkbox"
                        id="terms"
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                      />
                      <label htmlFor="terms" className="text-sm text-muted-foreground">
                        I agree to the{' '}
                        <Link href="#" className="font-semibold text-primary hover:underline">
                          Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link href="#" className="font-semibold text-primary hover:underline">
                          Privacy Policy
                        </Link>.
                      </label>
                    </div>

                    <Button
                      type="submit"
                      className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 text-base font-bold leading-normal tracking-[0.015em] w-full mt-4"
                      disabled={!hasMinLength || !hasNumber || !hasUppercase || !hasSpecialChar || !passwordsMatch || !termsAccepted || pending}
                    >
                      {pending ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Creating Account...
                        </span>
                      ) : (
                        <span className="truncate">Create Free Account</span>
                      )}
                    </Button>
                  </form>

                  <p className="text-center text-sm text-muted-foreground mt-8">
                    Already have an account?{' '}
                    <Link
                      href="/sign-in"
                      className="font-semibold text-primary hover:underline"
                    >
                      Sign In
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
