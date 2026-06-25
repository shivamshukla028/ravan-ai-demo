"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Lock, Brain, Zap, ArrowRight, CheckCircle2, Terminal, Activity, Globe } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <div className="min-h-screen cyber-grid relative overflow-hidden bg-cyber-dark">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 flex items-center justify-between p-6 max-w-7xl mx-auto left-0 right-0 backdrop-blur-md bg-black/20 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 shadow-[0_0_15px_rgba(14,165,233,0.3)]">
            <Shield className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <span className="font-extrabold text-2xl tracking-tighter text-white">RAVAN AI</span>
        </div>
        <div className="hidden md:flex items-center gap-10 text-sm font-medium text-white/60">
          <Link href="#platform" className="hover:text-primary transition-colors">Platform</Link>
          <Link href="#intelligence" className="hover:text-primary transition-colors">Intelligence</Link>
          <Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-medium text-white/80 hover:text-white transition-colors">Log In</Link>
          <Link href="/register" className="relative group px-6 py-2.5 text-sm font-bold bg-white text-black rounded-lg hover:bg-primary hover:text-white transition-all duration-300">
            <span className="relative z-10">Deploy Now</span>
            <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 bg-primary shadow-[0_0_20px_rgba(14,165,233,0.6)] blur-md transition-opacity duration-300 -z-10" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-40 pb-20 md:pt-56 md:pb-32 max-w-7xl mx-auto px-6 flex flex-col items-center justify-center text-center">
        {/* Background Ambient Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="z-10 flex flex-col items-center w-full"
        >
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] mb-10 backdrop-blur-md shadow-lg">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
            </span>
            <span className="text-sm font-medium text-white/80 tracking-wide uppercase">Qyntraix Engine Active</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 max-w-5xl text-white leading-[1.1]">
            Unprecedented <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-accent neon-text">
              Cyber Intelligence
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-white/50 max-w-3xl mb-12 leading-relaxed font-light">
            The multi-model AI routing platform that outsmarts advanced persistent threats. Analyze faster, respond instantly, and secure your enterprise.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-6 w-full justify-center">
            <Link href="/register" className="px-8 py-4 bg-primary text-white font-bold rounded-xl hover:bg-blue-500 transition-all shadow-[0_0_30px_rgba(14,165,233,0.4)] hover:shadow-[0_0_40px_rgba(14,165,233,0.6)] hover:-translate-y-1 flex items-center gap-3 group w-full sm:w-auto justify-center text-lg">
              Initialize Command Center
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
            </Link>
            <Link href="#demo" className="px-8 py-4 bg-transparent text-white font-semibold rounded-xl border border-white/20 hover:bg-white/5 hover:border-white/40 transition-all flex items-center gap-3 w-full sm:w-auto justify-center backdrop-blur-sm text-lg">
              <Terminal className="w-5 h-5 text-white/70" />
              View Terminal Demo
            </Link>
          </div>
        </motion.div>

        {/* Dashboard Preview Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="mt-24 relative w-full max-w-5xl"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-cyber-dark to-transparent z-20 pointer-events-none h-full w-full" />
          <div className="glass-panel p-2 rounded-xl overflow-hidden border-white/10 relative z-10 shadow-2xl shadow-primary/10 group">
             <div className="h-8 bg-black/60 flex items-center px-4 gap-2 border-b border-white/5">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
             </div>
             <div className="bg-[#050505] aspect-video relative flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 cyber-grid opacity-30"></div>
                <div className="text-center">
                  <Activity className="w-16 h-16 text-primary/50 mx-auto mb-4 animate-pulse" />
                  <p className="text-white/40 font-mono text-sm uppercase tracking-widest">Awaiting Threat Intel Stream...</p>
                </div>
             </div>
          </div>
        </motion.div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 z-10 w-full" id="platform">
          <FeatureCard 
            icon={<Brain className="w-7 h-7 text-primary" />}
            title="Multi-Model LLM Engine"
            description="Dynamically routes queries between leading AI models (OpenAI, Anthropic, Gemini) for context-aware threat analysis and zero-day detection."
            delay={0.2}
          />
          <FeatureCard 
            icon={<Globe className="w-7 h-7 text-accent" />}
            title="Enterprise Knowledge Graph"
            description="Ingest infinite volumes of logs and documentation into a secure, private vector store. Ask complex queries and get cited, deterministic answers."
            delay={0.4}
          />
          <FeatureCard 
            icon={<Zap className="w-7 h-7 text-primary" />}
            title="Real-time Autonomous Response"
            description="Execute automated SIEM queries, isolate compromised nodes, and generate executive compliance reports at machine speed."
            delay={0.6}
          />
        </div>
      </main>

      {/* Pricing Section */}
      <section className="relative z-10 py-32 bg-black/40 border-t border-white/[0.05]" id="pricing">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Pricing for the Modern Enterprise</h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">Scale your cyber defense capabilities with flexible plans designed for high-velocity security teams.</p>
            
            <div className="mt-10 flex items-center justify-center gap-4">
              <span className={`text-sm font-medium ${!isAnnual ? 'text-white' : 'text-white/50'}`}>Monthly</span>
              <button 
                onClick={() => setIsAnnual(!isAnnual)}
                className="w-14 h-7 rounded-full bg-white/10 border border-white/20 relative transition-colors duration-300 focus:outline-none"
              >
                <motion.div 
                  className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-primary shadow-[0_0_10px_rgba(14,165,233,0.5)]"
                  animate={{ left: isAnnual ? '32px' : '4px' }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
              <span className={`text-sm font-medium ${isAnnual ? 'text-white' : 'text-white/50'}`}>Annually <span className="text-primary text-xs ml-1">(Save 20%)</span></span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <PricingCard 
              title="Standard"
              price={isAnnual ? "$99" : "$119"}
              description="For small security teams starting their AI journey."
              features={["10,000 AI Queries/mo", "Basic Knowledge Graph", "Standard Response Models", "Email Support"]}
            />
            <PricingCard 
              title="Enterprise"
              price={isAnnual ? "$499" : "$599"}
              description="Advanced threat intelligence and automation."
              features={["Unlimited AI Queries", "Full Multi-Model Routing", "Advanced Vector Store", "Priority 24/7 Support", "Custom Integrations"]}
              isPopular
            />
            <PricingCard 
              title="Defense Grade"
              price="Custom"
              description="Air-gapped deployments and dedicated infrastructure."
              features={["On-Premises Deployment", "Dedicated Compute", "SLA Guarantees", "Dedicated Success Manager", "Custom Model Fine-tuning"]}
            />
          </div>
        </div>
      </section>

      {/* Compliance Section */}
      <section className="border-t border-white/[0.05] bg-[#030303] relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm font-semibold tracking-widest text-white/40 uppercase mb-10">Certified & Compliant Global Infrastructure</p>
          <div className="flex flex-wrap justify-center gap-10 opacity-60 hover:opacity-100 transition-opacity duration-500 grayscale hover:grayscale-0">
            <ComplianceBadge name="ISO 27001" />
            <ComplianceBadge name="NIST CSF" />
            <ComplianceBadge name="SOC 2 Type II" />
            <ComplianceBadge name="GDPR Ready" />
            <ComplianceBadge name="HIPAA" />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="glass-panel p-8 text-left group"
    >
      <div className="w-14 h-14 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-inner group-hover:bg-primary/5 group-hover:border-primary/20">
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-white/50 leading-relaxed font-light text-lg">
        {description}
      </p>
    </motion.div>
  );
}

function PricingCard({ title, price, description, features, isPopular }: { title: string, price: string, description: string, features: string[], isPopular?: boolean }) {
  return (
    <div className={`glass-panel p-8 relative flex flex-col ${isPopular ? 'border-primary/50 shadow-[0_0_30px_rgba(14,165,233,0.15)] -translate-y-4' : ''}`}>
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-lg">
          Most Popular
        </div>
      )}
      <h3 className="text-2xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-white/50 text-sm mb-6 h-10">{description}</p>
      <div className="mb-8">
        <span className="text-5xl font-bold text-white">{price}</span>
        {price !== "Custom" && <span className="text-white/40">/mo</span>}
      </div>
      <ul className="space-y-4 mb-8 flex-1">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
            <span className="text-white/70 text-sm">{feature}</span>
          </li>
        ))}
      </ul>
      <button className={`w-full py-3 rounded-lg font-bold transition-all ${isPopular ? 'bg-primary text-white hover:bg-blue-500 shadow-lg' : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'}`}>
        {price === "Custom" ? "Contact Sales" : "Start Free Trial"}
      </button>
    </div>
  );
}

function ComplianceBadge({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2">
      <Shield className="w-5 h-5 text-white/50" />
      <span className="font-bold text-white/70 text-lg tracking-wide">{name}</span>
    </div>
  );
}
