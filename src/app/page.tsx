import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, Sparkles, Zap, Layout, Calendar, Clock, TrendingUp, Twitter, Linkedin, Youtube } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import Image from 'next/image';
import { PricingSection } from '@/components/pricing/PricingSection';

export default async function Home() {
  const { userId } = await auth();
  const getStartedHref = userId ? '/dashboard' : '/sign-up';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      {/* Dotted Background Pattern */}
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <header className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Image src="/logoo.png" alt="MuseFlow Logo" width={60} height={60} className="rounded-lg" />
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-space-grotesk">
              MuseFlow
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex space-x-8">
            <Link href="#features" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
              Features
            </Link>
            <Link href="#solutions" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
              Solutions
            </Link>
            <Link href="#resources" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
              Resources
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
              Pricing
            </Link>
          </nav>

          <div className="hidden md:flex items-center space-x-2">
            <ThemeToggle />
            <Link href="/sign-in">
              <Button variant="ghost" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">Sign in</Button>
            </Link>
            <Link href={getStartedHref}>
              <Button className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white px-6 shadow-md">
                Get Started
              </Button>
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <section className="pt-8 pb-16 md:pt-16 md:pb-28 lg:pt-20 lg:pb-32 text-center px-4 relative overflow-hidden">
          <div className="container mx-auto max-w-6xl relative">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 text-xs font-medium mb-6 md:mb-8 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 mr-2 text-orange-500" />
              AI-Powered Content Ideation & Publishing
            </div>

            {/* Decorative Elements */}
            <div className="relative">
              {/* Sticky Note - Left (Visible only on desktop lg+ screens) */}
              <div className="hidden lg:block absolute -left-2 xl:left-0 top-6 xl:top-10 w-48 xl:w-56 transform -rotate-6 transition-transform hover:rotate-0 hover:scale-105 duration-300 pointer-events-auto z-10">
                <div className="bg-yellow-200 rounded-lg shadow-xl p-4 xl:p-5 border-t-8 border-yellow-300 text-left">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-5 h-5 bg-yellow-400 rounded-sm" />
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-yellow-800/70">Angles</span>
                  </div>
                  <p className="text-xs xl:text-sm text-gray-800 font-handwriting leading-relaxed italic">
                    Paste text or links<br />
                    → Get 5-10 unique<br />
                    content angles instantly
                  </p>
                  <div className="mt-3 flex items-center justify-end">
                    <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-sm">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Center Logo (Visible only on desktop lg+ screens) */}
              <div className="hidden lg:block absolute left-1/2 -translate-x-1/2 -top-6 xl:-top-8 animate-in fade-in zoom-in duration-700 delay-100 z-10">
                <div className="w-16 h-16 xl:w-20 xl:h-20 bg-slate-800 dark:bg-slate-700 rounded-2xl shadow-2xl flex items-center justify-center border border-gray-700 dark:border-gray-600 p-2">
                  <Image
                    src="/logoo.png"
                    alt="MuseFlow Logo"
                    width={64}
                    height={64}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Best Time Card - Right (Visible only on desktop lg+ screens) */}
              <div className="hidden lg:block absolute -right-2 xl:right-0 top-6 xl:top-10 w-48 xl:w-56 transform rotate-3 transition-transform hover:rotate-0 hover:scale-105 duration-300 pointer-events-auto z-10">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 xl:p-5 border border-gray-200 dark:border-gray-700 text-left">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <h4 className="text-xs xl:text-sm font-bold text-gray-900 dark:text-gray-100">Best Time</h4>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5 mb-2">
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">LinkedIn Post</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Peak Engagement</p>
                  </div>
                  <div className="text-center">
                    <div className="inline-flex items-center px-2.5 py-1 bg-green-50 dark:bg-green-900/30 rounded-full">
                      <Clock className="w-3 h-3 text-green-600 dark:text-green-400 mr-1" />
                      <span className="text-[11px] font-semibold text-green-600 dark:text-green-400 font-space-grotesk">Mon 9:00 AM</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Headline */}
              <div className="pt-2 md:pt-4 lg:pt-28 xl:pt-32 pb-8 max-w-4xl mx-auto">
                <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4 sm:mb-6 text-gray-900 dark:text-gray-100 leading-tight">
                  Transform Ideas into<br />
                  <span className="text-gray-400 dark:text-gray-500">Published Content with AI</span>
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8 sm:mb-10 px-2">
                  AI-powered ideation, smart canvas editing, and multi-channel publishing—all in one platform
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                  <Link href={getStartedHref} className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 font-medium">
                      Get started for free
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Preview Cards at Bottom */}
            <div className="mt-16 md:mt-24 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Content Pipeline Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 text-left animate-in fade-in slide-in-from-bottom duration-700 delay-300">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Content Pipeline</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-orange-100 rounded flex-shrink-0 mt-0.5">
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-orange-500 rounded-sm" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">AI Idea Generation</p>
                        <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                          <span className="text-xs">👤</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">In Progress</p>
                      <div className="mt-2 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                        <div className="bg-emerald-500 dark:bg-emerald-400 h-full rounded-full" style={{ width: '60%' }} />
                      </div>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium font-space-grotesk">60%</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-green-100 rounded flex-shrink-0 mt-0.5">
                      <div className="w-full h-full flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">Canvas Editing</p>
                        <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-xs">👤</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Complete</p>
                      <div className="mt-2 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                        <div className="bg-emerald-500 dark:bg-emerald-400 h-full rounded-full" style={{ width: '100%' }} />
                      </div>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium font-space-grotesk">100%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Multi-Channel Export Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 text-left animate-in fade-in slide-in-from-bottom duration-700 delay-400">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">Multi-Channel Export</h3>
                <div className="flex items-center justify-center gap-4">
                  <div className="w-16 h-16 bg-white dark:bg-gray-700 rounded-2xl shadow-md flex items-center justify-center border border-gray-100 dark:border-gray-600">
                    <Twitter className="w-8 h-8 text-blue-400" />
                  </div>
                  <div className="w-16 h-16 bg-white dark:bg-gray-700 rounded-2xl shadow-md flex items-center justify-center border border-gray-100 dark:border-gray-600">
                    <Linkedin className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="w-16 h-16 bg-white dark:bg-gray-700 rounded-2xl shadow-md flex items-center justify-center border border-gray-100 dark:border-gray-600">
                    <Youtube className="w-8 h-8 text-red-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-gray-100">Why Choose MuseFlow</h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Everything you need to scale your content production without sacrificing quality.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  icon: <Zap className="w-6 h-6 text-yellow-500" />,
                  title: "Lightning Fast",
                  description: "Create blog posts, social media captions, and more in seconds with advanced AI."
                },
                {
                  icon: <Layout className="w-6 h-6 text-blue-500" />,
                  title: "Smart Canvas",
                  description: "Drag, drop, and organize your ideas visually in a flexible workspace."
                },
                {
                  icon: <Calendar className="w-6 h-6 text-green-500" />,
                  title: "Auto Schedule",
                  description: "Plan your content calendar and auto-publish to your favorite platforms."
                }
              ].map((feature, i) => (
                <div key={i} className="p-6 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-lg transition-all">
                  <div className="w-12 h-12 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        

        {/* Pricing Section */}
        <PricingSection />

        {/* Footer */}
        <footer className="border-t border-gray-200 dark:border-gray-800 py-12 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center space-x-2 mb-4">
                  <Image src="/logoo.png" alt="MuseFlow Logo" width={28} height={28} className="rounded" />
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100 font-space-grotesk">MuseFlow</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Empowering creators with intelligent tools.
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-3 text-gray-900 dark:text-gray-100">Product</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li><Link href="#" className="hover:text-gray-900">Features</Link></li>
                  <li><Link href="#" className="hover:text-gray-900">Pricing</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-3 text-gray-900 dark:text-gray-100">Resources</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li><Link href="#" className="hover:text-gray-900">Blog</Link></li>
                  <li><Link href="#" className="hover:text-gray-900">Documentation</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-3 text-gray-900 dark:text-gray-100">Legal</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li><Link href="#" className="hover:text-gray-900">Privacy</Link></li>
                  <li><Link href="#" className="hover:text-gray-900">Terms</Link></li>
                </ul>
              </div>
            </div>
            <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-8 border-t border-gray-200 dark:border-gray-800">
              <p>© {new Date().getFullYear()} MuseFlow. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
