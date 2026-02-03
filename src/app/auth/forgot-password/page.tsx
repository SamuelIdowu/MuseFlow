'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object().shape({
  email: yup.string().email('Please enter a valid email').required('Email is required'),
});

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
    }
  });

  const onSubmit = async (data: { email: string }) => {
    // For a real implementation, we'd integrate with Clerk's password reset API
    // For now, we'll just simulate the submission
    console.log("Password reset requested for:", data.email);
    setSubmittedEmail(data.email);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background font-sans">
        <div className="flex w-full max-w-md flex-col items-center gap-6">
          <div className="w-full flex flex-col gap-6 bg-card border border-input rounded-xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <h1 className="text-foreground tracking-tight text-3xl font-bold leading-tight pb-2">
                Check Your Email
              </h1>
              <p className="text-muted-foreground text-base font-normal leading-normal">
                We've sent a password reset link to <span className="font-semibold">{submittedEmail}</span>
              </p>
            </div>
            <div className="flex w-full flex-col gap-4">
              <Button asChild className="w-full">
                <Link href="/sign-in">Back to Sign In</Link>
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <Link
              href="/sign-in"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              Remember your password? <span className="font-bold">Back to Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background font-sans">
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        <div className="w-full flex flex-col gap-6 bg-card border border-input rounded-xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-foreground tracking-tight text-3xl font-bold leading-tight pb-2">
              Forgot Your Password?
            </h1>
            <p className="text-muted-foreground text-base font-normal leading-normal">
              Enter your email and we'll send you a link to get back into your account.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex w-full flex-col gap-4">
            <div className="w-full">
              <Label htmlFor="email" className="text-foreground text-base font-medium leading-normal pb-2 block">
                Email Address
              </Label>
              <div className="flex w-full flex-1 items-stretch rounded-lg group">
                <Input
                  className={`flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-foreground focus:outline-0 focus:ring-2 focus:ring-primary/50 border bg-background h-12 placeholder:text-muted-foreground p-3 text-base font-normal leading-normal ${errors.email ? 'border-destructive focus:border-destructive' : 'border-input focus:border-primary/80'}`}
                  id="email"
                  placeholder="e.g., yourname@example.com"
                  type="email"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <Button className="w-full" type="submit">
              Send Password Reset Link
            </Button>
          </form>
        </div>
        <div className="flex items-center justify-center">
          <Link
            href="/sign-in"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            Remember your password? <span className="font-bold">Back to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
