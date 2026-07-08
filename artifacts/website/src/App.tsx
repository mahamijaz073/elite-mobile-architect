import { useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { Download, Gamepad2, Gift, Zap, Coins, Trophy, ShieldCheck, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-background/80 backdrop-blur-md border-b border-white/5 py-4" : "bg-transparent py-6"}`}>
      <div className="container mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-[0_0_15px_hsla(var(--primary),0.5)]">
            <Zap className="w-6 h-6 fill-current" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white font-display">Quiz<span className="text-primary">Box</span></span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
          <a href="#games" className="hover:text-primary transition-colors">Games</a>
          <a href="#how-it-works" className="hover:text-primary transition-colors">How it Works</a>
          <a href="#rewards" className="hover:text-primary transition-colors">Rewards</a>
        </div>
        <Button asChild size="sm" className="hidden sm:inline-flex">
          <a href="#download">
            <Download className="w-4 h-4 mr-2" />
            Download APK
          </a>
        </Button>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative min-h-[100dvh] flex items-center pt-20 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-secondary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="max-w-2xl text-center lg:text-left pt-12 lg:pt-0"
        >
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-primary mb-6 text-sm font-bold uppercase tracking-wider backdrop-blur-sm">
            <Trophy className="w-4 h-4" />
            <span>The Ultimate Reward Hub</span>
          </motion.div>
          
          <motion.h1 variants={fadeInUp} className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] mb-6 font-display">
            Play & Win. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-yellow-200 text-glow-primary">
              Collect Tokens.
            </span>
          </motion.h1>
          
          <motion.p variants={fadeInUp} className="text-lg md:text-xl text-white/70 mb-10 leading-relaxed">
            Step into the arcade. Conquer daily quizzes, spin the wheel of fortune, and claim your tokens. Exchange your wins for premium Gift Vouchers.
          </motion.p>
          
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <Button asChild size="lg" className="w-full sm:w-auto text-lg px-8 h-14">
              <a href="#download">
                <Download className="w-5 h-5 mr-2" />
                Download APK
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 h-14 bg-background/50 backdrop-blur-sm">
              <a href="#how-it-works">
                How to Play
              </a>
            </Button>
          </motion.div>
          
          <motion.div variants={fadeInUp} className="mt-12 flex items-center justify-center lg:justify-start gap-6 text-sm text-white/50 font-medium">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span>100% Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-secondary" />
              <span>Real Rewards</span>
            </div>
          </motion.div>
        </motion.div>
        
        <div className="relative h-[500px] lg:h-[700px] w-full hidden md:block">
          {/* Floating interactive elements */}
          <motion.img 
            src="/spin-wheel.png" 
            alt="Spin Wheel"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] z-10 drop-shadow-[0_0_40px_rgba(245,200,66,0.2)]"
            animate={{ 
              rotate: 360 
            }}
            transition={{ 
              duration: 40, 
              repeat: Infinity, 
              ease: "linear" 
            }}
          />
          
          <motion.img 
            src="/token.png" 
            alt="Gold Token"
            className="absolute top-20 right-20 w-32 z-20 drop-shadow-[0_0_20px_rgba(245,200,66,0.4)]"
            animate={{ 
              y: [0, -20, 0],
              rotate: [0, 10, -10, 0]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
          
          <motion.img 
            src="/token.png" 
            alt="Gold Token"
            className="absolute bottom-32 left-10 w-24 z-20 drop-shadow-[0_0_20px_rgba(108,63,232,0.4)]"
            style={{ filter: "hue-rotate(210deg)" }} // Purple-ish token variant
            animate={{ 
              y: [0, 20, 0],
              rotate: [0, -15, 15, 0]
            }}
            transition={{ 
              duration: 5, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: 1 
            }}
          />
        </div>
      </div>
    </section>
  );
}

function Games() {
  return (
    <section id="games" className="py-24 relative bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 font-display">
            The Arena Awaits
          </h2>
          <p className="text-white/60 text-lg">
            Multiple ways to play. Endless ways to win. Rack up tokens across our arcade modes and dominate the leaderboards.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: "Trivia Quizzes",
              desc: "Test your knowledge across 50+ categories. Fast answers mean bigger token multipliers.",
              icon: Gamepad2,
              color: "text-primary",
              bg: "bg-primary/10",
              border: "border-primary/20",
              shadow: "hover:shadow-[0_0_30px_hsla(var(--primary),0.15)]"
            },
            {
              title: "Spin the Wheel",
              desc: "Feeling lucky? Take your daily spins for a chance at massive token drops and rare multipliers.",
              icon: Zap,
              color: "text-secondary",
              bg: "bg-secondary/10",
              border: "border-secondary/20",
              shadow: "hover:shadow-[0_0_30px_hsla(var(--secondary),0.15)]"
            },
            {
              title: "Focus Captchas",
              desc: "Quick, skill-based focus challenges. Perfect for steady token collection while on the go.",
              icon: Target,
              color: "text-emerald-400",
              bg: "bg-emerald-400/10",
              border: "border-emerald-400/20",
              shadow: "hover:shadow-[0_0_30px_rgba(52,211,153,0.15)]"
            }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              className={`p-8 rounded-2xl bg-card border ${feature.border} transition-all duration-300 ${feature.shadow} group`}
            >
              <div className={`w-14 h-14 rounded-xl ${feature.bg} flex items-center justify-center mb-6 transition-transform group-hover:scale-110`}>
                <feature.icon className={`w-7 h-7 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-white/60 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-secondary/5 skew-y-3 origin-top-left" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <div className="flex-1 space-y-12">
            <div className="mb-12">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 font-display">
                Your Path to <br />
                <span className="text-secondary text-glow-secondary">Real Rewards</span>
              </h2>
              <p className="text-white/60 text-lg">
                No complex rules. Just play, win, and redeem. The ultimate reward hub is waiting for you.
              </p>
            </div>

            <div className="space-y-8">
              {[
                { step: "01", title: "Play & Win", desc: "Download the APK, create your profile, and jump into the daily games.", icon: Gamepad2 },
                { step: "02", title: "Collect Tokens", desc: "Every victory adds to your vault. The more you play, the faster you stack.", icon: Coins },
                { step: "03", title: "Redeem Prizes", desc: "Hit the threshold and instantly claim premium Gift Vouchers.", icon: Gift }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className="flex gap-6 items-start"
                >
                  <div className="flex-shrink-0 w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-display text-2xl font-bold text-white/30 relative">
                    {item.step}
                    {i !== 2 && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 h-12 w-[1px] bg-gradient-to-b from-white/10 to-transparent" />
                    )}
                  </div>
                  <div className="pt-2">
                    <h4 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                      <item.icon className="w-5 h-5 text-primary" />
                      {item.title}
                    </h4>
                    <p className="text-white/60">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          
          <div className="flex-1 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-full blur-[100px]" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative bg-card border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl z-10"
            >
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-secondary to-primary" />
                  <div>
                    <div className="text-white font-bold">Player_One</div>
                    <div className="text-white/50 text-sm">Level 24</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-primary font-bold text-2xl flex items-center gap-1">
                    <Coins className="w-5 h-5" /> 12,450
                  </div>
                  <div className="text-white/50 text-sm">Tokens Available</div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-white font-medium">Daily Quiz Won</div>
                      <div className="text-white/50 text-xs">2 mins ago</div>
                    </div>
                  </div>
                  <div className="text-primary font-bold">+250</div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-white font-medium">Mega Spin Bonus</div>
                      <div className="text-white/50 text-xs">1 hour ago</div>
                    </div>
                  </div>
                  <div className="text-primary font-bold">+1,000</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Rewards() {
  return (
    <section id="rewards" className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 text-secondary mb-6 text-sm font-bold uppercase tracking-wider"
          >
            <Gift className="w-4 h-4" />
            <span>The Vault</span>
          </motion.div>
          <motion.h2 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-3xl md:text-5xl font-bold text-white mb-6 font-display"
          >
            Claim Your Reward
          </motion.h2>
          <motion.p 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-white/60 text-lg"
          >
            Stack your tokens and cash them in for digital Gift Vouchers. Sent instantly to your profile.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Rs. 500 Card */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group relative rounded-3xl p-1 bg-gradient-to-b from-white/10 to-transparent hover:from-primary/30 transition-all duration-500"
          >
            <div className="absolute inset-0 bg-primary/20 blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative h-full bg-card rounded-[23px] p-8 overflow-hidden flex flex-col">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px]" />
              
              <div className="flex-1">
                <div className="mb-6 relative w-full h-48 rounded-xl overflow-hidden flex items-center justify-center bg-black/50 border border-white/5">
                  <img src="/gift-voucher.png" alt="Gift Voucher" className="w-3/4 object-contain drop-shadow-[0_0_15px_rgba(245,200,66,0.3)] transition-transform duration-500 group-hover:scale-110" />
                </div>
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">Rs. 500</h3>
                    <p className="text-white/50">Gift Voucher</p>
                  </div>
                  <div className="text-right">
                    <div className="text-primary font-bold text-xl flex items-center gap-1 justify-end">
                      <Coins className="w-5 h-5" /> 50,000
                    </div>
                    <p className="text-white/50 text-xs">Tokens required</p>
                  </div>
                </div>
              </div>
              
              <Button className="w-full mt-6 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-[0_0_20px_hsla(var(--primary),0.4)]">
                Claim Reward
              </Button>
            </div>
          </motion.div>

          {/* Rs. 1000 Card */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="group relative rounded-3xl p-1 bg-gradient-to-b from-white/10 to-transparent hover:from-secondary/30 transition-all duration-500"
          >
            <div className="absolute inset-0 bg-secondary/20 blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative h-full bg-card rounded-[23px] p-8 overflow-hidden flex flex-col">
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-[40px]" />
              
              <div className="flex-1">
                <div className="mb-6 relative w-full h-48 rounded-xl overflow-hidden flex items-center justify-center bg-black/50 border border-white/5">
                  <img src="/gift-voucher.png" alt="Gift Voucher" className="w-3/4 object-contain drop-shadow-[0_0_15px_rgba(108,63,232,0.3)] transition-transform duration-500 group-hover:scale-110" style={{ filter: "hue-rotate(60deg)" }} />
                </div>
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">Rs. 1,000</h3>
                    <p className="text-white/50">Gift Voucher</p>
                  </div>
                  <div className="text-right">
                    <div className="text-primary font-bold text-xl flex items-center gap-1 justify-end">
                      <Coins className="w-5 h-5" /> 90,000
                    </div>
                    <p className="text-white/50 text-xs">Tokens required</p>
                  </div>
                </div>
              </div>
              
              <Button variant="secondary" className="w-full mt-6 group-hover:bg-secondary group-hover:text-secondary-foreground group-hover:shadow-[0_0_20px_hsla(var(--secondary),0.4)]">
                Claim Reward
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section id="download" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/5" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-full bg-gradient-to-r from-primary/20 to-secondary/20 blur-[100px] pointer-events-none" />
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto bg-card/80 backdrop-blur-xl border border-white/10 rounded-3xl p-12 md:p-20 text-center shadow-2xl relative overflow-hidden"
        >
          {/* Decorative corners */}
          <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-primary/50 rounded-tl-3xl m-4" />
          <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-secondary/50 rounded-br-3xl m-4" />

          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 font-display">
            Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-yellow-200">Play & Win?</span>
          </h2>
          <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto">
            Join thousands of players already collecting tokens and claiming Gift Vouchers daily. The next reward could be yours.
          </p>
          
          <Button size="lg" className="h-16 px-10 text-xl w-full sm:w-auto shadow-[0_0_30px_hsla(var(--primary),0.3)] hover:shadow-[0_0_50px_hsla(var(--primary),0.5)]">
            <Download className="w-6 h-6 mr-3" />
            Download APK Now
          </Button>
          
          <div className="mt-8 text-sm text-white/40 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            V1.0.4 | Requires Android 8.0+
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-background border-t border-white/5 py-12 relative z-10">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold text-white font-display">Quiz<span className="text-primary">Box</span></span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 text-sm text-white/50">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary transition-colors">Support</a>
          </div>
          
          <div className="text-sm text-white/30">
            &copy; {new Date().getFullYear()} QuizBox. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/30 selection:text-primary font-sans">
      <Navbar />
      <main>
        <Hero />
        <Games />
        <HowItWorks />
        <Rewards />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}