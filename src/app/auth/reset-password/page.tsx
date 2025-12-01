'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // For a real implementation, we'd use Clerk's password reset API
    // For now, we'll just simulate the reset
    console.log("Password reset with new password:", password);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background font-sans">
        <div className="flex w-full max-w-md flex-col items-center gap-6">
          <div className="w-full flex flex-col gap-6 bg-card border border-input rounded-xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <h1 className="text-foreground tracking-tight text-3xl font-bold leading-tight pb-2">
                Password Reset Successful
              </h1>
              <p className="text-muted-foreground text-base font-normal leading-normal">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
            </div>
            <div className="flex w-full flex-col gap-4">
              <Button asChild className="w-full">
                <Link href="/sign-in">Back to Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const passwordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 1;
    return strength;
  };

  const strength = passwordStrength(password);
  const strengthText = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'][strength] || 'Very Weak';
  const strengthColor = ['red', 'orange', 'yellow', 'blue', 'green'][strength] || 'red';

  return (
    <div className="flex min-h-screen items-center justify-center bg-background font-sans">
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        <div className="w-full flex flex-col gap-6 bg-card border border-input rounded-xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-foreground tracking-tight text-3xl font-bold leading-tight pb-2">
              Reset Your Password
            </h1>
            <p className="text-muted-foreground text-base font-normal leading-normal">
              Enter your new password below
            </p>
          </div>
          
          {error && (
            <div className="rounded-lg bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="password" className="text-foreground text-base font-medium leading-normal pb-2">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your new password"
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
                    <span className="text-muted-foreground">Hide</span>
                  ) : (
                    <span className="text-muted-foreground">Show</span>
                  )}
                </Button>
              </div>
              
              {/* Password strength indicator */}
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full ${
                      strength <= 1 ? 'bg-red-500' : 
                      strength <= 2 ? 'bg-orange-500' : 
                      strength <= 3 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${(strength / 4) * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Password strength: <span className={strengthColor}>{strengthText}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirm-password" className="text-foreground text-base font-medium leading-normal pb-2">
                Confirm New Password
              </Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 px-4 rounded-lg"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <span className="text-muted-foreground">Hide</span>
                  ) : (
                    <span className="text-muted-foreground">Show</span>
                  )}
                </Button>
              </div>
            </div>
            
            <Button className="w-full mt-4" type="submit">
              Reset Password
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