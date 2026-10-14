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
  FileEdit,
  PenTool,
  BrainCircuit,
  BellRing,
  BookOpen,
  Share2,
  HelpCircle,
  Workflow,
  Check,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import Image from 'next/image';
import { PricingSection } from '@/components/pricing/PricingSection';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default async function Home() {
  const { userId } = await auth();
  const getStartedHref = userId ? '/dashboard' : '/sign-up';

  const faqs = [
    {
      question: 'How is MuseFlow different from standard AI chat tools?',
      answer:
        'Standard chat interfaces trap your thoughts in linear, forgettable scrolls. MuseFlow combines conversational AI brainstorming with an infinite visual node canvas and a dedicated long-form editor. You can branch hooks, map storylines visually, and turn ideas into multi-platform drafts seamlessly.',
    },
    {
      question: 'How do Brand Profiles and Persona-Tuned AI work?',
      answer:
        'Brand Profiles allow you to define your audience, writing tone, preferred formatting, and stylistic rules. Once configured, every outline, thread, and essay generated adheres strictly to your unique voice, eliminating robotic AI fluff.',
    },
    {
      question: 'What platforms can I export my content to?',
      answer:
        'You can export your completed drafts with 1-click formatting tailored for LinkedIn, X (Twitter) threads, Substack newsletters, Medium essays, or copy clean Markdown and raw HTML directly.',
    },
    {
      question: 'Can I start using MuseFlow for free?',
      answer:
        'Yes! Our Free plan includes 25 AI generations per month, 2 brand profiles, and 3 full canvas sessions with no credit card required.',
    },
    {
      question: 'Can I upgrade, downgrade, or cancel at any time?',
      answer:
        'Absolutely. You have complete control over your subscription directly from your billing dashboard. Upgrades and downgrades are prorated automatically.',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors selection:bg-orange-500/20 selection:text-orange-600">
      {/* Precision Dotted Background Pattern with Edge Fade */}
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-60 dark:opacity-25"
        style={{
          backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, black 40%, transparent 95%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, black 40%, transparent 95%)',
        }}
      />

      <div className="relative z-10">
        {/* Sticky Blurred Header */}
        <header className="sticky top-0 z-50 backdrop-blur-md bg-background/85 border-b border-border/40 transition-colors">
          <div className="container mx-auto px-4 py-3.5 flex justify-between items-center max-w-6xl">
            {/* Brand Logo */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-xs border border-border/50 group-hover:border-orange-500/50 transition-colors">
                <Image
                  src="/logoo.png"
                  alt="MuseFlow Logo"
                  width={36}
                  height={36}
                  className="object-cover"
                  priority
                />
              </div>
              <span className="text-xl font-bold text-foreground font-space-grotesk tracking-tight">
                MuseFlow
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                href="#features"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </Link>
              <Link
                href="#workflow"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Workflow
              </Link>
              <Link
                href="#pricing"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="#faq"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                FAQ
              </Link>
            </nav>

            {/* Action Bar */}
            <div className="flex items-center space-x-2.5">
              <ThemeToggle />
              {userId ? (
                <Link href="/dashboard">
                  <Button
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white px-4 text-xs sm:text-sm font-semibold shadow-xs shadow-orange-500/20"
                  >
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/sign-in" className="hidden sm:inline-flex">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground text-sm font-medium"
                    >
                      Sign in
                    </Button>
                  </Link>
                  <Link href="/sign-up">
                    <Button
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white px-4 text-xs sm:text-sm font-semibold shadow-xs shadow-orange-500/20"
                    >
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="pt-12 pb-16 md:pt-16 md:pb-24 lg:pt-20 lg:pb-28 text-center px-4 relative overflow-hidden">
          <div className="container mx-auto max-w-6xl relative">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-semibold mb-6 md:mb-8 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 mr-2 text-orange-500" />
              The AI Workspace for Writers & Content Creators
            </div>

            {/* Main Headline */}
            <div className="max-w-4xl mx-auto mb-8 sm:mb-10">
              <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4 sm:mb-6 text-foreground font-space-grotesk leading-[1.12]">
                From Raw Thoughts to
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500">
                  Published Masterpieces
                </span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-10 px-2 leading-relaxed font-normal">
                Chat to spark viral hooks, map non-linear ideas on an infinite visual canvas, and craft high-engagement articles, threads, and newsletters in your authentic voice.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <Link href={getStartedHref} className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto h-12 px-8 text-base bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 font-medium"
                  >
                    {userId ? 'Go to Dashboard' : 'Get Started for Free'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="#features" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto h-12 px-7 text-base border-border bg-card/60 hover:bg-muted font-medium"
                  >
                    Explore features
                  </Button>
                </Link>
              </div>
            </div>

            {/* Floating Visual Cards (Desktop) */}
            <div className="hidden lg:flex items-start justify-between mt-12 xl:mt-16 relative h-48 xl:h-56 pointer-events-none">
              {/* Sticky Note - Left (Content Angles) */}
              <div className="w-56 xl:w-64 transform -rotate-6 transition-transform hover:rotate-0 hover:scale-105 duration-300 pointer-events-auto z-10">
                <div className="bg-amber-50 dark:bg-amber-950/80 rounded-2xl shadow-xl p-4 xl:p-5 border border-amber-200 dark:border-amber-800 text-left">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-amber-800 dark:text-amber-300 font-space-grotesk">
                      Creator Brain
                    </span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <p className="text-xs xl:text-sm text-amber-950 dark:text-gray-200 leading-relaxed font-medium">
                    "Drop 1 raw thought → get 5 platform-tailored hooks, threads, and newsletter angles instantly."
                  </p>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
                    <span>Zero Fluff</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                </div>
              </div>

              {/* Center App Card */}
              <div className="absolute left-1/2 -translate-x-1/2 top-0 z-10 animate-in fade-in zoom-in duration-700 pointer-events-auto">
                <div className="bg-card text-card-foreground rounded-2xl shadow-xl p-4 border border-border/80 flex items-center gap-3.5 max-w-sm text-left backdrop-blur-md">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                    <PenTool className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground font-space-grotesk">
                      Visual Node Canvas
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Map non-linear ideas & branch hooks visually
                    </div>
                  </div>
                </div>
              </div>

              {/* Best Time Card - Right */}
              <div className="w-56 xl:w-64 transform rotate-3 transition-transform hover:rotate-0 hover:scale-105 duration-300 pointer-events-auto z-10">
                <div className="bg-card text-card-foreground rounded-2xl shadow-xl p-4 xl:p-5 border border-border/80 text-left backdrop-blur-md">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-7 h-7 bg-emerald-500/10 rounded-full flex items-center justify-center">
                      <BellRing className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground font-space-grotesk">
                      Smart Calendar
                    </span>
                  </div>
                  <p className="text-xs font-bold text-foreground">Scheduled for Thursday</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">LinkedIn + Substack Drop</p>
                  <div className="mt-2.5 inline-flex items-center px-2 py-0.5 bg-emerald-500/10 rounded-md text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <Clock className="w-3 h-3 mr-1" /> 9:15 AM (Reminder Set)
                  </div>
                </div>
              </div>
            </div>

            {/* Social Proof Trust Bar */}
            <div className="mt-14 pt-10 border-t border-border/40 max-w-4xl mx-auto flex flex-wrap items-center justify-around gap-6 text-muted-foreground text-xs uppercase tracking-wider font-semibold font-space-grotesk">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-500" />
                <span>10x Faster Outlining</span>
              </div>
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-sky-500" />
                <span>Persona-Tuned AI</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span>Multi-Platform Ready</span>
              </div>
            </div>
          </div>
        </section>

        {/* Workflow Section */}
        <section id="workflow" className="py-20 bg-muted/30 border-t border-border/50 transition-colors">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <div className="inline-flex items-center px-3.5 py-1 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-semibold mb-4">
                <Workflow className="w-3.5 h-3.5 mr-1.5" />
                The Complete Creative Cycle
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground font-space-grotesk tracking-tight">
                How MuseFlow Powers Your Thinking
              </h2>
              <p className="text-muted-foreground text-base leading-relaxed">
                From scattered thoughts into high-converting drafts in three frictionless stages.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1: Conversational Spark */}
              <div className="bg-card text-card-foreground rounded-3xl p-8 border border-border/80 shadow-xs hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                    <BrainCircuit className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest font-space-grotesk">
                    Stage 01
                  </span>
                </div>
                <h3 className="text-xl font-bold text-foreground font-space-grotesk mb-2">
                  Conversational Spark
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Chat naturally with Gemini AI to explore angles, brainstorm viral hooks, or synthesize complex research into crisp talking points.
                </p>
                <div className="text-xs font-medium text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Instant angle generation
                </div>
              </div>

              {/* Step 2: Visual Canvas */}
              <div className="bg-card text-card-foreground rounded-3xl p-8 border border-border/80 shadow-xs hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                    <Layout className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest font-space-grotesk">
                    Stage 02
                  </span>
                </div>
                <h3 className="text-xl font-bold text-foreground font-space-grotesk mb-2">
                  Visual Node Canvas
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Break free from rigid text documents. Drag, connect, and expand non-linear ideas visually on an infinite board.
                </p>
                <div className="text-xs font-medium text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Infinite React Flow map
                </div>
              </div>

              {/* Step 3: Studio & Publish */}
              <div className="bg-card text-card-foreground rounded-3xl p-8 border border-border/80 shadow-xs hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <FileEdit className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest font-space-grotesk">
                    Stage 03
                  </span>
                </div>
                <h3 className="text-xl font-bold text-foreground font-space-grotesk mb-2">
                  Long-Form Studio
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Refine articles and newsletters with inline AI tone adjusters, schedule reminders, and export clean formatted text with one click.
                </p>
                <div className="text-xs font-medium text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> One-click multi-format export
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid Section */}
        <section id="features" className="py-24 bg-background border-t border-border/50 transition-colors">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <div className="inline-flex items-center px-3.5 py-1 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-semibold mb-4">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Designed for High-Output Creators
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-foreground font-space-grotesk tracking-tight">
                Everything You Need to Create Consistently
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
                Stop juggling five fragmented tools. MuseFlow combines ideation, visual planning, drafting, and scheduling into one studio.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {[
                {
                  icon: <BrainCircuit className="w-6 h-6 text-orange-600 dark:text-orange-400" />,
                  bg: 'bg-orange-500/10',
                  title: 'Persona-Tuned AI',
                  description:
                    'Anchor every AI output to your specific niche, audience, and custom tone sliders so content never sounds generic.',
                },
                {
                  icon: <Layout className="w-6 h-6 text-sky-600 dark:text-sky-400" />,
                  bg: 'bg-sky-500/10',
                  title: 'React Flow Canvas',
                  description:
                    'Your creative thinking isn’t linear. Connect ideas, compare angles, and build story maps on an infinite board.',
                },
                {
                  icon: <Calendar className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
                  bg: 'bg-emerald-500/10',
                  title: 'Calendar & Reminders',
                  description:
                    'Plan your monthly publishing queue with visual calendar chips and browser notifications when it’s time to drop.',
                },
                {
                  icon: <FileEdit className="w-6 h-6 text-purple-600 dark:text-purple-400" />,
                  bg: 'bg-purple-500/10',
                  title: 'WYSIWYG Tiptap Studio',
                  description:
                    'Rich-text long-form editor with floating AI bubble menus to rewrite, expand, or simplify text on the fly.',
                },
                {
                  icon: <BookOpen className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
                  bg: 'bg-amber-500/10',
                  title: 'Doc & URL Context Ingestion',
                  description:
                    'Upload PDFs, Word docs, or drop research URLs. Let AI synthesize key insights into actionable posts.',
                },
                {
                  icon: <Share2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
                  bg: 'bg-blue-500/10',
                  title: 'Multi-Platform Export',
                  description:
                    'Export clean Markdown, HTML, or raw text formatted for LinkedIn, X (Twitter), Substack, or Medium in seconds.',
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="p-7 rounded-3xl bg-card text-card-foreground border border-border/80 shadow-xs hover:border-orange-500/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div
                      className={`w-12 h-12 ${feature.bg} rounded-2xl flex items-center justify-center mb-5`}
                    >
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-foreground font-space-grotesk">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Accordion Section */}
        <section id="faq" className="py-20 bg-muted/30 border-t border-border/50 transition-colors">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-14">
              <div className="inline-flex items-center px-3.5 py-1 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-semibold mb-4">
                <HelpCircle className="w-3.5 h-3.5 mr-1.5" />
                Frequently Asked Questions
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-3 text-foreground font-space-grotesk tracking-tight">
                Got Questions? We’ve Got Answers.
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base">
                Everything you need to know about getting started with MuseFlow.
              </p>
            </div>

            <div className="bg-card text-card-foreground rounded-3xl p-6 sm:p-8 border border-border/80 shadow-xs">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, i) => (
                  <AccordionItem key={i} value={`faq-${i}`} className="border-border/60 py-1">
                    <AccordionTrigger className="text-base sm:text-lg font-semibold text-foreground hover:no-underline hover:text-orange-600 dark:hover:text-orange-400 font-space-grotesk">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-4">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <PricingSection />

        {/* Final Conversion CTA Section */}
        <section className="py-20 bg-background border-t border-border/50 text-center px-4 relative overflow-hidden">
          <div className="container mx-auto max-w-4xl relative z-10">
            <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-b from-orange-500/10 via-background to-background border border-orange-500/20 shadow-lg">
              <h2 className="text-3xl sm:text-5xl font-bold text-foreground font-space-grotesk tracking-tight mb-4">
                Ready to Publish Your Best Work?
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto mb-8 leading-relaxed">
                Join creators and writers building their content flywheel on MuseFlow.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href={getStartedHref} className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto h-12 px-8 text-base bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 font-semibold"
                  >
                    {userId ? 'Go to Dashboard' : 'Get Started Free'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/50 py-12 bg-background transition-colors">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center space-x-2 mb-4">
                  <Image
                    src="/logoo.png"
                    alt="MuseFlow Logo"
                    width={28}
                    height={28}
                    className="rounded-lg shadow-2xs"
                  />
                  <span className="text-lg font-bold text-foreground font-space-grotesk">
                    MuseFlow
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Empowering writers and content creators with intelligent workflows.
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-3 text-foreground text-sm font-space-grotesk">Product</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <Link href="#features" className="hover:text-foreground transition-colors">
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link href="#workflow" className="hover:text-foreground transition-colors">
                      Workflow
                    </Link>
                  </li>
                  <li>
                    <Link href="#pricing" className="hover:text-foreground transition-colors">
                      Pricing
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-3 text-foreground text-sm font-space-grotesk">Studio Tools</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <Link href="/dashboard/canvas" className="hover:text-foreground transition-colors">
                      Visual Canvas
                    </Link>
                  </li>
                  <li>
                    <Link href="/dashboard/editor" className="hover:text-foreground transition-colors">
                      Rich-Text Studio
                    </Link>
                  </li>
                  <li>
                    <Link href="/dashboard/schedule" className="hover:text-foreground transition-colors">
                      Calendar & Reminders
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-3 text-foreground text-sm font-space-grotesk">Support</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <Link href="#faq" className="hover:text-foreground transition-colors">
                      FAQ
                    </Link>
                  </li>
                  <li>
                    <Link href="/dashboard/settings" className="hover:text-foreground transition-colors">
                      Account Settings
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="text-center text-xs text-muted-foreground pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p>© {new Date().getFullYear()} MuseFlow. Built for high-output creators.</p>
              <div className="flex items-center gap-4">
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> All Systems Operational
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
