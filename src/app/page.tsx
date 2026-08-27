import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Zap,
  Layout,
  Calendar,
  Clock,
  TrendingUp,
  Twitter,
  Linkedin,
  Youtube,
  FileEdit,
  PenTool,
  BrainCircuit,
  BellRing,
  BookOpen,
  Share2,
} from 'lucide-react';
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
            <Image src="/logoo.png" alt="MuseFlow Logo" width={50} height={50} className="rounded-xl shadow-xs" />
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-space-grotesk tracking-tight">
              MuseFlow
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex space-x-8">
            <Link href="#features" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
              Features
            </Link>
            <Link href="#workflow" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
              Workflow
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
              Pricing
            </Link>
          </nav>

          <div className="hidden md:flex items-center space-x-3">
            <ThemeToggle />
            <Link href="/sign-in">
              <Button variant="ghost" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 text-sm">
                Sign in
              </Button>
            </Link>
            <Link href={getStartedHref}>
              <Button className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white px-5 shadow-sm text-sm font-semibold">
                Start Writing Free
              </Button>
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <section className="pt-8 pb-16 md:pt-14 md:pb-24 lg:pt-16 lg:pb-28 text-center px-4 relative overflow-hidden">
          <div className="container mx-auto max-w-6xl relative">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-semibold mb-6 md:mb-8 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 mr-2 text-orange-500" />
              The AI Workspace for Writers & Content Creators
            </div>

            {/* Main Headline */}
            <div className="max-w-4xl mx-auto mb-8 sm:mb-10">
              <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4 sm:mb-6 text-gray-900 dark:text-gray-100 leading-[1.12]">
                From Raw Thoughts to<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500">
                  Published Masterpieces
                </span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8 sm:mb-10 px-2 leading-relaxed">
                Chat to spark viral hooks, map non-linear ideas on an infinite visual canvas, and craft high-engagement articles, threads, and newsletters in your authentic voice.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <Link href={getStartedHref} className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 font-medium">
                    Start creating for free
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="#features" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-7 text-base border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                    Explore features
                  </Button>
                </Link>
              </div>
            </div>

            {/* Floating Visual Cards (Desktop) */}
            <div className="hidden lg:flex items-start justify-between mt-12 xl:mt-16 relative h-48 xl:h-56 pointer-events-none">
              {/* Sticky Note - Left (Content Angles) */}
              <div className="w-52 xl:w-60 transform -rotate-6 transition-transform hover:rotate-0 hover:scale-105 duration-300 pointer-events-auto z-10">
                <div className="bg-amber-100 dark:bg-amber-950/80 rounded-xl shadow-xl p-4 xl:p-5 border border-amber-300 dark:border-amber-700 text-left">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-amber-800 dark:text-amber-300">Creator Brain</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <p className="text-xs xl:text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                    "Drop 1 raw thought → get 5 platform-tailored hooks, threads, and newsletter angles instantly."
                  </p>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
                    <span>Zero Fluff</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                </div>
              </div>

              {/* Center App Card */}
              <div className="absolute left-1/2 -translate-x-1/2 top-0 z-10 animate-in fade-in zoom-in duration-700">
                <div className="bg-slate-900 text-white rounded-2xl shadow-2xl p-4 border border-slate-700 flex items-center gap-3 max-w-sm text-left">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                    <PenTool className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Visual Node Canvas</div>
                    <div className="text-[11px] text-slate-400">Map non-linear ideas & branch hooks visually</div>
                  </div>
                </div>
              </div>

              {/* Best Time Card - Right */}
              <div className="w-52 xl:w-60 transform rotate-3 transition-transform hover:rotate-0 hover:scale-105 duration-300 pointer-events-auto z-10">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 xl:p-5 border border-gray-200 dark:border-gray-700 text-left">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-7 h-7 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <BellRing className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400">Smart Calendar</span>
                  </div>
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">Scheduled for Thursday</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">LinkedIn + Substack Drop</p>
                  <div className="mt-2.5 inline-flex items-center px-2 py-0.5 bg-green-50 dark:bg-green-900/30 rounded-md text-[11px] font-semibold text-green-600 dark:text-green-400">
                    <Clock className="w-3 h-3 mr-1" /> 9:15 AM (Reminder Set)
                  </div>
                </div>
              </div>
            </div>

            {/* Workflow Pillars Preview Cards */}
            <div className="mt-14 md:mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto text-left">
              {/* Pillar 1: Conversational Hub */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-4">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1">1. Conversational Spark</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  Chat naturally with Gemini AI to generate 5-10 viral angles, outline essays, or write punchy hooks in seconds.
                </p>
              </div>

              {/* Pillar 2: Visual Canvas */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
                <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-4">
                  <Layout className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1">2. Visual Node Canvas</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  Break free from rigid text documents. Drag, connect, and expand content nodes visually on an infinite Miro-style board.
                </p>
              </div>

              {/* Pillar 3: Distraction-Free Editor */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
                  <FileEdit className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1">3. Long-Form Studio</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  Refine articles and newsletters with inline AI tone adjusters, word counts, and 1-click markdown/HTML exports.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid Section */}
        <section id="features" className="py-20 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100 tracking-tight">
                Designed for the High-Output Creator
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
                Stop juggling five fragmented tools. MuseFlow combines ideation, visual planning, drafting, and scheduling into one seamless studio.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  icon: <BrainCircuit className="w-6 h-6 text-orange-500" />,
                  title: "Persona-Tuned AI",
                  description: "Anchor every AI output to your specific niche, audience, and custom tone sliders so content never sounds generic."
                },
                {
                  icon: <Layout className="w-6 h-6 text-sky-500" />,
                  title: "React Flow Canvas",
                  description: "Your creative thinking isn't linear. Connect ideas, compare angles, and build story maps on an infinite board."
                },
                {
                  icon: <Calendar className="w-6 h-6 text-emerald-500" />,
                  title: "Calendar & Reminders",
                  description: "Plan your monthly publishing queue with visual calendar chips and native browser notifications when it's time to drop."
                },
                {
                  icon: <FileEdit className="w-6 h-6 text-purple-500" />,
                  title: "WYSIWYG Tiptap Studio",
                  description: "Rich-text long-form editor with floating AI bubble menus to rewrite, expand, or simplify text on the fly."
                },
                {
                  icon: <BookOpen className="w-6 h-6 text-amber-500" />,
                  title: "Doc & URL Context Ingestion",
                  description: "Upload PDFs, Word docs, or drop research URLs. Let AI synthesize key insights into actionable posts."
                },
                {
                  icon: <Share2 className="w-6 h-6 text-blue-500" />,
                  title: "Multi-Platform Export",
                  description: "Export clean Markdown, HTML, or raw text formatted for LinkedIn, X (Twitter), Substack, or Medium in seconds."
                }
              ].map((feature, i) => (
                <div key={i} className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/80 hover:border-orange-500/50 dark:hover:border-orange-500/50 hover:shadow-lg transition-all">
                  <div className="w-12 h-12 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl flex items-center justify-center mb-4 shadow-xs">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-100">{feature.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing">
          <PricingSection />
        </section>

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
                  Empowering writers and content creators with intelligent workflows.
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-3 text-gray-900 dark:text-gray-100 text-sm">Product</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li><Link href="#features" className="hover:text-gray-900 dark:hover:text-gray-100">Features</Link></li>
                  <li><Link href="#pricing" className="hover:text-gray-900 dark:hover:text-gray-100">Pricing</Link></li>
                  <li><Link href="/dashboard" className="hover:text-gray-900 dark:hover:text-gray-100">Dashboard</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-3 text-gray-900 dark:text-gray-100 text-sm">Tools</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li><Link href="/dashboard/canvas" className="hover:text-gray-900 dark:hover:text-gray-100">Visual Canvas</Link></li>
                  <li><Link href="/dashboard/editor" className="hover:text-gray-900 dark:hover:text-gray-100">Rich-Text Editor</Link></li>
                  <li><Link href="/dashboard/schedule" className="hover:text-gray-900 dark:hover:text-gray-100">Calendar & Reminders</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-3 text-gray-900 dark:text-gray-100 text-sm">Legal</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li><Link href="#" className="hover:text-gray-900 dark:hover:text-gray-100">Privacy</Link></li>
                  <li><Link href="#" className="hover:text-gray-900 dark:hover:text-gray-100">Terms</Link></li>
                </ul>
              </div>
            </div>
            <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-8 border-t border-gray-200 dark:border-gray-800">
              <p>© {new Date().getFullYear()} MuseFlow. Built for creators.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
