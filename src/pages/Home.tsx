import { Sun, Moon, ArrowUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../components/ThemeProvider';
import { useState, useEffect } from 'react';

export function Home() {
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-ink-bg min-h-screen text-ink-text flex flex-col selection:bg-ink-accent/30 selection:text-white transition-colors duration-300 relative">
      
      {/* Full-Screen Background Image for Hero */}
      <div 
        className="absolute top-0 left-0 w-full h-[120vh] z-0 transition-all duration-700 bg-no-repeat"
        style={{
          backgroundImage: `url(${theme === 'dark' ? '/dark-home-dither.png' : '/light-home-dither.png'})`,
          backgroundPosition: 'top center',
          backgroundSize: 'cover',
        }}
      />
      
      {/* Progressive Blur Overlay */}
      <div 
        className="absolute top-0 left-0 w-full h-[120vh] z-0 backdrop-blur-[24px] pointer-events-none"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 40%, black 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 40%, black 100%)'
        }}
      />

      {/* Multi-stop gradient fade */}
      <div className="absolute top-0 left-0 w-full h-[120vh] z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[30vh] bg-gradient-to-b from-ink-bg/30 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-[15vh] bg-gradient-to-t from-ink-bg to-transparent" />
      </div>

      {/* ── Floating Pill Header */}
      <div 
        className="w-full fixed top-0 left-0 right-0 z-50 flex justify-center transition-all duration-300"
        style={{
          paddingTop: scrolled ? '12px' : '24px',
          paddingLeft: '16px',
          paddingRight: '16px',
        }}
      >
        <header 
          className="w-full flex items-center justify-between bg-ink-surface/70 backdrop-blur-xl border border-ink-border/50 rounded-full shadow-lg shadow-black/10 transition-all duration-300"
          style={{
            maxWidth: scrolled ? '44rem' : '48rem', // shrinks from max-w-3xl (48rem) to max-w-2xl (42/44rem)
            paddingTop: scrolled ? '6px' : '10px',
            paddingBottom: scrolled ? '6px' : '10px',
            paddingLeft: '12px',
            paddingRight: '12px',
          }}
        >
          <div className="flex items-center pl-4">
            <span className="text-xl font-semibold tracking-wide drop-shadow-sm">
              <span className="font-serif">lex<span className="italic">iq</span></span>
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-xs tracking-wider font-medium text-ink-text">
            <a href="#features" className="hover:text-ink-accent" style={{transition: 'color 150ms ease'}}>Features</a>
            <a href="#privacy" className="hover:text-ink-accent" style={{transition: 'color 150ms ease'}}>Privacy</a>
          </nav>

          <div className="flex items-center gap-2 pr-1">
            <button 
              onClick={toggleTheme}
              className="btn-press p-2 rounded-full text-ink-text"
              style={{backgroundColor: 'transparent'}}
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <Link
              to="/library"
              className="btn-pill px-5 py-2.5 bg-ink-text text-ink-bg"
            >
              Library
            </Link>
          </div>
        </header>
      </div>


      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-[110vh] px-6 text-center -mt-10">
        <h1 className="text-7xl md:text-[8rem] lg:text-[10rem] font-medium tracking-tight mb-4 drop-shadow-2xl flex items-center justify-center text-white">
          <span className="font-serif">Lex<span className="italic">iq</span></span>
        </h1>
        
        <p className="text-lg md:text-xl text-white/95 max-w-2xl mb-12 font-sans leading-relaxed drop-shadow-md font-medium">
          Turn your screen into a sanctuary. Upload your EPUBs and PDFs, set your typography, and read in absolute peace.
        </p>

        <Link 
          to="/library"
          className="btn-press group w-full max-w-2xl bg-ink-surface/95 backdrop-blur-md border border-ink-border/50 rounded-2xl p-4 flex items-center justify-between shadow-2xl cursor-pointer"
          style={{transition: 'box-shadow 200ms ease, border-color 200ms ease, transform 160ms var(--ease-out)'}}
        >
          <div className="flex items-center gap-3 text-ink-text-muted pl-2">
            <span className="text-sm font-medium tracking-wide">Open your library</span>
          </div>
          <div 
            className="w-9 h-9 rounded-full border border-ink-border/70 flex items-center justify-center text-ink-text-muted"
            style={{transition: 'background-color 200ms ease, color 200ms ease, border-color 200ms ease'}}
          >
            <ArrowUp size={16} className="group-hover:rotate-45" style={{transition: 'transform 200ms var(--ease-out)'}} />
          </div>
        </Link>
      </section>

      {/* ── Body ────────────────────────────────────────── */}
      <div className="page-enter relative z-20 bg-ink-bg w-full">

        {/* ── Features strip ──────────────────────────── */}
        <section id="features" className="w-full max-w-6xl mx-auto px-6 pt-24 pb-20 border-t border-ink-border/30">

          <div className="mb-20">
            <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-ink-text-muted mb-4">How it works</p>
            <h2 className="font-serif text-4xl md:text-5xl font-medium leading-tight max-w-xl">
              A reader built around<br />the text, not the interface.
            </h2>
          </div>

          <div className="divide-y divide-ink-border/30">

            <div className="grid md:grid-cols-[2fr_1fr_3fr] gap-6 py-10 items-start">
              <p className="text-xs uppercase tracking-[0.18em] font-semibold text-ink-text-muted pt-1">01 — Format support</p>
              <p className="font-serif text-xl font-medium text-ink-text md:text-right">PDF &amp; EPUB</p>
              <p className="text-ink-text-muted text-sm leading-relaxed max-w-sm">
                Smooth paginated PDF viewports with zoom controls, and reflowable EPUB rendering via EPUB.js — font styling and color themes included.
              </p>
            </div>

            <div className="grid md:grid-cols-[2fr_1fr_3fr] gap-6 py-10 items-start">
              <p className="text-xs uppercase tracking-[0.18em] font-semibold text-ink-text-muted pt-1">02 — Reading themes</p>
              <p className="font-serif text-xl font-medium text-ink-text md:text-right">Ink · Paper · Sepia</p>
              <p className="text-ink-text-muted text-sm leading-relaxed max-w-sm">
                Three carefully tuned reader modes that adjust contrast, background tone, and type rendering to match your environment and preference.
              </p>
            </div>

            <div className="grid md:grid-cols-[2fr_1fr_3fr] gap-6 py-10 items-start">
              <p className="text-xs uppercase tracking-[0.18em] font-semibold text-ink-text-muted pt-1">03 — Local storage</p>
              <p className="font-serif text-xl font-medium text-ink-text md:text-right">No cloud</p>
              <p className="text-ink-text-muted text-sm leading-relaxed max-w-sm">
                Every file you add lives in your browser's IndexedDB. No sign-in, no uploads to any server, no analytics. Fully sandboxed.
              </p>
            </div>

          </div>
        </section>

        {/* ── Image + callout ─────────────────────────── */}
        <section className="w-full max-w-6xl mx-auto px-6 py-20 border-t border-ink-border/30">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">

            {/* Image slot — drop in a screenshot here */}
            <div className="aspect-[4/3]  overflow-hidden order-2 md:order-1"
             style={{
               backgroundImage: `url(${theme === 'dark' ? '/art-1-dark.png' : '/art-1.png'})`,
               backgroundSize: 'contain',
               backgroundPosition: 'center',
               backgroundRepeat: 'no-repeat'
             }}
            >
            </div>

            <div className="order-1 md:order-2">
              <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-ink-text-muted mb-5">The reading experience</p>
              <h2 className="font-serif text-3xl md:text-4xl font-medium leading-snug mb-6">
                A canvas for the words,<br />nothing more.
              </h2>
              <p className="text-ink-text-muted text-sm leading-relaxed mb-8 max-w-sm">
                The toolbar collapses. The margins breathe. Typography is yours to control. Lexiq gets out of the way so the writing can take over.
              </p>
              <Link
                to="/library"
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-ink-text border-b border-ink-text/30 pb-0.5 hover:border-ink-text"
                style={{transition: 'border-color 200ms ease'}}
              >
                Add your first book <ArrowUp size={11} className="rotate-45" />
              </Link>
            </div>

          </div>
        </section>

        {/* ── Privacy ─────────────────────────────────── */}
        <section id="privacy" className="w-full border-t border-ink-border/30">
          <div className="max-w-6xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-16 items-center">

            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-ink-text-muted mb-5">Privacy</p>
              <h2 className="font-serif text-3xl md:text-4xl font-medium leading-snug mb-6">
                Zero cloud.<br />Private by design.
              </h2>
              <p className="text-ink-text-muted text-sm leading-relaxed max-w-sm">
                Lexiq stores everything in IndexedDB — your books, your progress, your preferences. Nothing leaves your device. No account required, ever.
              </p>
            </div>

            {/* Image slot — drop in an on-device diagram here */}
            <div className="aspect-[4/3] rounded-2xl bg-ink-surface border border-ink-border/50 overflow-hidden flex items-center justify-center">
              <span className="text-xs uppercase tracking-widest text-ink-text-muted/40 font-semibold select-none">
                On-device diagram
              </span>
            </div>

          </div>
        </section>

        {/* ── Footer ──────────────────────────────────── */}
        <footer className="w-full border-t border-ink-border/30">
          <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <span className="font-serif text-base font-medium">lex<span className="italic">iq</span></span>
              <p className="text-xs text-ink-text-muted mt-1">© {new Date().getFullYear()} — Built for peace.</p>
            </div>
            <nav className="flex gap-8 text-xs uppercase tracking-[0.15em] font-semibold text-ink-text-muted">
              <a href="#features" className="hover:text-ink-text transition-colors">Features</a>
              <a href="#privacy" className="hover:text-ink-text transition-colors">Privacy</a>
              <Link to="/library" className="hover:text-ink-text transition-colors">Library</Link>
            </nav>
          </div>
        </footer>

      </div>
    </div>
  );
}
