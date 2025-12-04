import { Sparkles } from 'lucide-react'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row">
      {/* Left Column: Branding */}
      <div className="relative hidden flex-1 items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 md:flex">
        {/* Neural Network Background */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{
            backgroundImage: `url("https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=2832&auto=format&fit=crop")`,
          }}
        />

        <div className="relative z-10 flex flex-col items-start gap-6 p-12 text-white">
          <div className="flex items-center gap-3">
            <Sparkles className="h-10 w-10 text-cyan-400" />
            <p className="text-3xl font-bold">ContentAI</p>
          </div>
          <h1 className="text-5xl font-black leading-tight tracking-tight">
            Where Ideas
            <br />
            Take Flight.
          </h1>
          <p className="max-w-md text-lg font-light text-gray-200">
            Your AI content co-pilot, designed to amplify your creative process
            from ideation to publication.
          </p>
        </div>
      </div>

      {/* Right Column: Form */}
      <div className="flex w-full flex-1 items-center justify-center p-6 sm:p-8 lg:p-12">
        <div className="flex w-full max-w-md flex-col gap-8">
          {/* Mobile Branding */}
          <div className="flex items-center gap-2 md:hidden justify-center mb-4">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">ContentAI</span>
          </div>

          <div className="flex flex-col gap-2 text-center md:text-left">
            <h2 className="text-3xl font-black leading-tight tracking-tight">
              {title}
            </h2>
            <p className="text-muted-foreground text-base">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
