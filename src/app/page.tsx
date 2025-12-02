import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, Sparkles, Zap, Layout, Calendar, Users, Star } from 'lucide-react';

export default async function Home() {
  const { userId } = await auth();
  const getStartedHref = userId ? '/dashboard' : '/sign-up';

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] opacity-50" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[120px] opacity-50" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
              ContentAI
            </span>
          </div>
          <nav className="hidden md:flex space-x-8">
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="#workflow" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Workflow
            </Link>
            <Link href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Testimonials
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Link href="/sign-in">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">Sign In</Button>
            </Link>
            <Link href={getStartedHref}>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                Get Started
              </Button>
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <section className="pt-20 pb-32 md:pt-32 md:pb-48 text-center px-4">
          <div className="container mx-auto max-w-5xl">
            <div className="inline-flex items-center px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <span className="flex w-2 h-2 rounded-full bg-primary mr-2 animate-pulse" />
              New: AI Content Scheduling
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white via-white/90 to-white/50 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
              Simplify Your Workflow <br />
              with <span className="text-primary">ContentAI</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
              Generate, refine, and publish compelling content in minutes.
              The all-in-one platform for modern content creators.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
              <Link href={getStartedHref}>
                <Button size="lg" className="h-12 px-8 text-lg bg-primary hover:bg-primary/90 shadow-[0_0_30px_-5px_rgba(var(--primary),0.4)]">
                  Start for Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="#">
                <Button size="lg" variant="outline" className="h-12 px-8 text-lg border-primary/20 hover:bg-primary/5">
                  Watch Demo
                </Button>
              </Link>
            </div>

            {/* Abstract Dashboard Preview */}
            <div className="mt-20 relative mx-auto max-w-4xl animate-in fade-in zoom-in-95 duration-1000 delay-500">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-xl blur opacity-30" />
              <div className="relative bg-card border border-border rounded-xl shadow-2xl overflow-hidden aspect-video flex items-center justify-center bg-grid-white/[0.02]">
                <div className="text-center p-8">
                  <div className="w-16 h-16 bg-primary/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">AI Workspace</h3>
                  <p className="text-muted-foreground">Your content command center</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Why Choose ContentAI</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Everything you need to scale your content production without sacrificing quality.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  icon: <Zap className="w-6 h-6 text-yellow-400" />,
                  title: "Lightning Fast Generation",
                  description: "Create blog posts, social media captions, and more in seconds with advanced AI models."
                },
                {
                  icon: <Layout className="w-6 h-6 text-blue-400" />,
                  title: "Smart Canvas Interface",
                  description: "Drag, drop, and organize your ideas visually. A flexible workspace for your creativity."
                },
                {
                  icon: <Calendar className="w-6 h-6 text-green-400" />,
                  title: "Intelligent Scheduling",
                  description: "Plan your content calendar and auto-publish to your favorite platforms."
                }
              ].map((feature, i) => (
                <div key={i} className="group relative p-8 rounded-2xl bg-card/50 border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_-10px_rgba(var(--primary),0.2)]">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-background border border-border rounded-lg flex items-center justify-center mb-6 shadow-sm">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Workflow Section */}
        <section id="workflow" className="py-24 bg-secondary/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Unlock the Power of ContentAI</h2>
              <p className="text-muted-foreground">Streamline your process from first thought to final post.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              <div className="space-y-8">
                {[
                  {
                    step: "01",
                    title: "Ideation",
                    desc: "Input a topic or keyword and get dozens of unique angles instantly."
                  },
                  {
                    step: "02",
                    title: "Creation",
                    desc: "Use the Smart Canvas to build your content blocks and refine the flow."
                  },
                  {
                    step: "03",
                    title: "Distribution",
                    desc: "Schedule and publish directly to your audience with one click."
                  }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                      <p className="text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 blur-3xl rounded-full opacity-30" />
                <div className="relative bg-card border border-border rounded-2xl p-8 shadow-2xl">
                  {/* Abstract Workflow Visual */}
                  <div className="flex flex-col gap-4 items-center">
                    <div className="w-full h-16 bg-secondary/50 rounded-lg animate-pulse" />
                    <ArrowRight className="text-muted-foreground rotate-90" />
                    <div className="w-full h-32 bg-secondary/50 rounded-lg animate-pulse delay-100" />
                    <ArrowRight className="text-muted-foreground rotate-90" />
                    <div className="flex gap-4 w-full">
                      <div className="flex-1 h-16 bg-primary/20 rounded-lg animate-pulse delay-200" />
                      <div className="flex-1 h-16 bg-primary/20 rounded-lg animate-pulse delay-300" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-5xl font-bold text-center mb-16">
              Loved by Creators
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {[
                {
                  name: "Alex Rivera",
                  role: "Marketing Director",
                  content: "ContentAI has completely transformed how we approach our blog strategy. The ideation tools are a game changer."
                },
                {
                  name: "Sarah Chen",
                  role: "Freelance Writer",
                  content: "I can take on twice as many clients now. The workflow is so intuitive, it feels like it was made just for me."
                },
                {
                  name: "Marcus Johnson",
                  role: "Startup Founder",
                  content: "Finally, a tool that actually helps me write better, not just faster. The quality of the output is consistently impressive."
                }
              ].map((t, i) => (
                <div key={i} className="bg-card p-6 rounded-xl border border-border hover:border-primary/30 transition-colors">
                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6">"{t.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-secondary-foreground">
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="relative rounded-3xl overflow-hidden p-12 text-center border border-primary/20">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background z-0" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-primary rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-primary/30">
                  <Sparkles className="w-8 h-8 text-primary-foreground" />
                </div>
                <h2 className="text-3xl md:text-5xl font-bold mb-6">
                  Ready to Transform Your Content?
                </h2>
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Join thousands of creators who are already saving time and creating better content with ContentAI.
                </p>
                <Link href={getStartedHref}>
                  <Button size="lg" className="h-14 px-10 text-lg bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20">
                    Get Started for Free
                  </Button>
                </Link>
                <p className="mt-6 text-sm text-muted-foreground">
                  No credit card required · 14-day free trial
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-12 bg-card/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-primary-foreground" />
                  </div>
                  <span className="text-lg font-bold">ContentAI</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Empowering creators with intelligent tools for the future of content.
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-4">Product</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="#" className="hover:text-foreground">Features</Link></li>
                  <li><Link href="#" className="hover:text-foreground">Pricing</Link></li>
                  <li><Link href="#" className="hover:text-foreground">Roadmap</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4">Resources</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="#" className="hover:text-foreground">Blog</Link></li>
                  <li><Link href="#" className="hover:text-foreground">Documentation</Link></li>
                  <li><Link href="#" className="hover:text-foreground">Community</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4">Legal</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="#" className="hover:text-foreground">Privacy</Link></li>
                  <li><Link href="#" className="hover:text-foreground">Terms</Link></li>
                </ul>
              </div>
            </div>
            <div className="text-center text-sm text-muted-foreground pt-8 border-t border-border/50">
              <p>© {new Date().getFullYear()} ContentAI. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
