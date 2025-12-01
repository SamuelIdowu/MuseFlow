import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center py-6">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary">✨ ContentAI</span>
          </div>
          <nav className="hidden md:flex space-x-6">
            <Link href="#" className="text-foreground hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="#" className="text-foreground hover:text-primary transition-colors">
              Pricing
            </Link>
            <Link href="#" className="text-foreground hover:text-primary transition-colors">
              About
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Link href="/sign-in">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Get Started</Button>
            </Link>
          </div>
        </header>

        <main className="flex flex-col items-center justify-center py-20 md:py-32 text-center">
          <div className="max-w-3xl space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Your AI Content <span className="text-primary">Co-Pilot</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Generate, refine, and publish compelling content in minutes.
              Our AI-powered platform helps you transform ideas into engaging content.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button size="lg" className="px-8 py-6 text-lg">
                  Go to Dashboard
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button size="lg" variant="outline" className="px-8 py-6 text-lg">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </main>

        <section className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-card p-6 rounded-xl border border-border">
              <h3 className="text-xl font-bold mb-2">AI-Powered Generation</h3>
              <p className="text-muted-foreground">
                Generate content ideas from any input - text, URLs, or keywords.
              </p>
            </div>
            <div className="bg-card p-6 rounded-xl border border-border">
              <h3 className="text-xl font-bold mb-2">Smart Canvas</h3>
              <p className="text-muted-foreground">
                Organize and refine your content with our intuitive canvas interface.
              </p>
            </div>
            <div className="bg-card p-6 rounded-xl border border-border">
              <h3 className="text-xl font-bold mb-2">Publish & Schedule</h3>
              <p className="text-muted-foreground">
                Schedule content for optimal engagement across multiple platforms.
              </p>
            </div>
          </div>
        </section>

        <footer className="py-12 text-center text-muted-foreground">
          <p>© {new Date().getFullYear()} ContentAI. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
