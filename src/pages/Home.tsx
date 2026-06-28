import { ArrowUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../components/ThemeProvider';
import { Header } from '../components/common/Header';

export function Home() {
  const { theme } = useTheme();

  return (
    <div className="bg-ink-bg min-h-screen text-ink-text flex flex-col selection:bg-ink-accent/30 selection:text-white transition-colors duration-300 relative">
      
      {/* Full-Screen Background Image for Hero - Dark */}
      <div 
        className="absolute top-0 left-0 w-full h-[120vh] z-0 transition-opacity duration-700 ease-in-out bg-no-repeat"
        style={{
          backgroundImage: "url('/dark-home-dither.png')",
          backgroundPosition: 'top center',
          backgroundSize: 'cover',
          opacity: theme === 'dark' ? 1 : 0
        }}
      />
      {/* Full-Screen Background Image for Hero - Light */}
      <div 
        className="absolute top-0 left-0 w-full h-[120vh] z-0 transition-opacity duration-700 ease-in-out bg-no-repeat"
        style={{
          backgroundImage: "url('/light-home-dither.png')",
          backgroundPosition: 'top center',
          backgroundSize: 'cover',
          opacity: theme === 'dark' ? 0 : 1
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
      <Header 
        isFixed={true}
        maxWidthClass="max-w-3xl"
        shrinkWidthClass="max-w-2xl"
        navItems={
          <>
            <a href="#features" className="hover:text-ink-accent font-pixel text-xs tracking-wide" style={{transition: 'color 150ms ease'}}>features</a>
            <a href="#highlights" className="hover:text-ink-accent font-pixel text-xs tracking-wide" style={{transition: 'color 150ms ease'}}>highlights</a>
            <a href="#custom-themes" className="hover:text-ink-accent font-pixel text-xs tracking-wide" style={{transition: 'color 150ms ease'}}>themes</a>
          </>
        }
        rightContent={
          <Link
            to="/library"
            className="btn-pill px-5 py-2.5 bg-ink-text text-ink-bg font-pixel text-[11px]"
          >
            library
          </Link>
        }
      />


      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-[110vh] px-6 text-center -mt-10">
        <h1 className="text-5xl sm:text-7xl md:text-[8rem] lg:text-[10rem] font-medium tracking-tight mb-4 drop-shadow-2xl flex items-center justify-center text-white">
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
            <p className="text-[11px] font-pixel tracking-wide text-ink-text-muted mb-4">how it works</p>
            <h2 className="font-serif text-4xl md:text-5xl font-medium leading-tight max-w-xl">
              A reader built around<br />the text, not the interface.
            </h2>
          </div>

          <div className="divide-y divide-ink-border/30">

            <div className="grid md:grid-cols-[2fr_1fr_3fr] gap-6 py-10 items-start">
              <p className="text-xs font-pixel tracking-wide text-ink-text-muted pt-1">01 — format support</p>
              <p className="font-serif text-xl font-medium text-ink-text md:text-right">PDF &amp; EPUB</p>
              <p className="text-ink-text-muted text-sm leading-relaxed max-w-sm">
                Smooth paginated PDF viewports with zoom controls, and reflowable EPUB rendering via EPUB.js — font styling and color themes included.
              </p>
            </div>

            <div className="grid md:grid-cols-[2fr_1fr_3fr] gap-6 py-10 items-start">
              <p className="text-xs font-pixel tracking-wide text-ink-text-muted pt-1">02 — reading themes</p>
              <p className="font-serif text-xl font-medium text-ink-text md:text-right">Ink · Paper · Sepia</p>
              <p className="text-ink-text-muted text-sm leading-relaxed max-w-sm">
                Three carefully tuned reader modes that adjust contrast, background tone, and type rendering to match your environment and preference.
              </p>
            </div>

            <div className="grid md:grid-cols-[2fr_1fr_3fr] gap-6 py-10 items-start">
              <p className="text-xs font-pixel tracking-wide text-ink-text-muted pt-1">03 — local storage</p>
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
            <div className="aspect-[4/3] rounded-xl overflow-hidden order-2 md:order-1 relative">
              <div 
                className="absolute inset-0 transition-opacity duration-700 ease-in-out"
                style={{
                  backgroundImage: "url('/art-1-dark.png')",
                  backgroundSize: 'contain',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  opacity: theme === 'dark' ? 1 : 0
                }}
              />
              <div 
                className="absolute inset-0 transition-opacity duration-700 ease-in-out"
                style={{
                  backgroundImage: "url('/art-1.png')",
                  backgroundSize: 'contain',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  opacity: theme === 'dark' ? 0 : 1
                }}
              />
            </div>

            <div className="order-1 md:order-2">
              <p className="text-[11px] font-pixel tracking-wide text-ink-text-muted mb-5">the reading experience</p>
              <h2 className="font-serif text-3xl md:text-4xl font-medium leading-snug mb-6">
                A canvas for the words,<br />nothing more.
              </h2>
              <p className="text-ink-text-muted text-sm leading-relaxed mb-8 max-w-sm">
                The toolbar collapses. The margins breathe. Typography is yours to control. Lexiq gets out of the way so the writing can take over.
              </p>
              <Link
                to="/library"
                className="inline-flex items-center gap-2 text-xs font-pixel tracking-wide text-ink-text border-b border-ink-text/30 pb-0.5 hover:border-ink-text"
                style={{transition: 'border-color 200ms ease'}}
              >
                add your first book <ArrowUp size={11} className="rotate-45" />
              </Link>
            </div>

          </div>
        </section>

        {/* ── Highlights & Notes ─────────────────────── */}
        <section id="highlights" className="w-full border-t border-ink-border/30">
          <div className="max-w-6xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-16 items-center">
            
            <div>
              <p className="text-[11px] font-pixel tracking-wide text-ink-text-muted mb-5">active reading</p>
              <h2 className="font-serif text-3xl md:text-4xl font-medium leading-snug mb-6">
                Capture your thoughts.<br />Leave your mark.
              </h2>
              <p className="text-ink-text-muted text-sm leading-relaxed max-w-sm">
                Highlight passages and jot down notes without breaking your flow. Your annotations are stored locally and layered beautifully over the text.
              </p>
            </div>

            {/* Diagram/Visual for Highlights */}
            <div className="aspect-[4/3] rounded-2xl bg-ink-surface border border-ink-border/50 overflow-hidden relative flex flex-col items-center justify-center p-8 group">
              {/* Grid Background */}
              <div 
                className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-700" 
                style={{ 
                  backgroundImage: 'radial-gradient(var(--ink-text) 1px, transparent 1px)', 
                  backgroundSize: '24px 24px' 
                }} 
              />
              
              <div className="relative w-full max-w-md z-10 transition-transform duration-700 ease-out group-hover:scale-105">
                 {/* Text paragraph */}
                 <div className="text-ink-text-muted/70 font-serif text-sm md:text-base leading-loose mb-2">
                   The difference between the almost right word and the right word is really a large matter. 
                   <span className="relative inline-block mx-1">
                     <span className="relative z-10 text-ink-text mix-blend-difference selection:bg-transparent">
                       'Tis the difference between the lightning bug and the lightning.
                     </span>
                     <span className="absolute inset-0 bg-[#FFD700] mix-blend-multiply opacity-50 dark:opacity-80 rounded-[2px] -mx-1 px-1"></span>
                   </span>
                 </div>
                 
                 {/* Note popup */}
                 <div className="ml-12 mt-6 bg-ink-bg border border-ink-border rounded-xl p-4 shadow-lg flex gap-3.5 items-start relative before:absolute before:top-[-9px] before:left-5 before:w-4 before:h-4 before:bg-ink-bg before:border-l before:border-t before:border-ink-border before:rotate-45 transition-transform duration-500 hover:-translate-y-1">
                   <div className="w-7 h-7 rounded-full bg-ink-surface flex items-center justify-center border border-ink-border/50 shrink-0 mt-0.5">
                     <svg className="w-3.5 h-3.5 text-ink-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                     </svg>
                   </div>
                   <div>
                     <div className="text-sm font-medium text-ink-text mb-1">Mark Twain</div>
                     <div className="text-xs text-ink-text-muted leading-relaxed">
                       This is perfectly stated. Precision in language is everything when crafting a narrative.
                     </div>
                   </div>
                 </div>
              </div>
            </div>

          </div>
        </section>

        {/* ── Custom Themes ──────────────────────────── */}
        <section id="custom-themes" className="w-full border-t border-ink-border/30">
          <div className="max-w-6xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-16 items-center">
            
            {/* Visual for Custom Themes */}
            <div className="aspect-[4/3] rounded-2xl bg-ink-surface border border-ink-border/50 overflow-hidden relative flex items-center justify-center order-2 md:order-1 group">
               {/* Soft gradient background */}
               <div className="absolute inset-0 bg-gradient-to-br from-ink-bg to-ink-surface opacity-50"></div>
               
               {/* Floating Themes */}
               <div className="relative z-10 flex gap-4 md:gap-6 items-center">
                 {/* Theme 1 */}
                 <div className="w-16 h-24 md:w-24 md:h-32 rounded-xl bg-[#FAF9F6] shadow-sm flex flex-col p-3 md:p-4 gap-2.5 group-hover:-translate-y-2 group-hover:-rotate-3 transition-all duration-500 ease-out">
                   <div className="w-full h-2 bg-[#1A1A1A]/20 rounded-full"></div>
                   <div className="w-3/4 h-2 bg-[#1A1A1A]/20 rounded-full"></div>
                   <div className="w-5/6 h-2 bg-[#1A1A1A]/20 rounded-full"></div>
                 </div>
                 
                 {/* Theme 2 (Active) */}
                 <div className="w-16 h-24 md:w-24 md:h-32 rounded-xl bg-[#111111] border border-[#222222] shadow-xl flex flex-col p-3 md:p-4 gap-2.5 relative group-hover:-translate-y-4 group-hover:scale-105 transition-all duration-500 ease-out delay-75">
                   <div className="w-full h-2 bg-[#F5F5F5]/20 rounded-full"></div>
                   <div className="w-3/4 h-2 bg-[#F5F5F5]/20 rounded-full"></div>
                   <div className="w-5/6 h-2 bg-[#F5F5F5]/20 rounded-full"></div>
                   
                   {/* Custom Color Selector Tool UI */}
                   <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex bg-[#111111] border border-[#222222] rounded-full p-1.5 gap-1.5 shadow-lg">
                      <div className="w-3.5 h-3.5 rounded-full bg-[#111111] border border-[#333333]"></div>
                      <div className="w-3.5 h-3.5 rounded-full bg-[#E5B567]"></div>
                      <div className="w-3.5 h-3.5 rounded-full bg-[#F5F5F5]"></div>
                   </div>
                 </div>
                 
                 {/* Theme 3 */}
                 <div className="w-16 h-24 md:w-24 md:h-32 rounded-xl bg-[#F4ECD8] border border-[#E3D9C1] shadow-sm flex flex-col p-3 md:p-4 gap-2.5 group-hover:-translate-y-2 group-hover:rotate-3 transition-all duration-500 ease-out delay-150">
                   <div className="w-full h-2 bg-[#4A3C31]/20 rounded-full"></div>
                   <div className="w-3/4 h-2 bg-[#4A3C31]/20 rounded-full"></div>
                   <div className="w-5/6 h-2 bg-[#4A3C31]/20 rounded-full"></div>
                 </div>
               </div>
               
               {/* Ambient Glow */}
               <div className="absolute w-40 h-40 bg-ink-text/5 rounded-full blur-3xl group-hover:bg-ink-text/10 transition-colors duration-700"></div>
            </div>

            <div className="order-1 md:order-2">
              <p className="text-[11px] font-pixel tracking-wide text-ink-text-muted mb-5">custom themes</p>
              <h2 className="font-serif text-3xl md:text-4xl font-medium leading-snug mb-6">
                Your colors.<br />Your rules.
              </h2>
              <p className="text-ink-text-muted text-sm leading-relaxed max-w-sm">
                Don't like the defaults? Build your own theme. Fine-tune background, text, and accent colors to create the perfect reading environment for your eyes.
              </p>
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
            <nav className="flex gap-8 text-xs font-pixel tracking-wide text-ink-text-muted">
              <a href="#features" className="hover:text-ink-text transition-colors">features</a>
              <a href="#highlights" className="hover:text-ink-text transition-colors">highlights</a>
              <a href="#custom-themes" className="hover:text-ink-text transition-colors">themes</a>
              <Link to="/library" className="hover:text-ink-text transition-colors">library</Link>
            </nav>
          </div>
        </footer>

      </div>
    </div>
  );
}
