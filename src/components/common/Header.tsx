import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../ThemeProvider';

interface HeaderProps {
  isFixed?: boolean;
  splitMode?: boolean;
  navItems?: React.ReactNode;
  rightContent?: React.ReactNode;
  centerContent?: React.ReactNode;
  maxWidthClass?: string;
  shrinkWidthClass?: string;
}

export function Header({ 
  isFixed = false, 
  splitMode = false,
  navItems, 
  rightContent, 
  centerContent,
  maxWidthClass = 'max-w-3xl',
  shrinkWidthClass = 'max-w-2xl'
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!isFixed) return;
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isFixed]);

  const containerClass = isFixed 
    ? "w-full fixed top-0 left-0 right-0 z-50 flex justify-center transition-[padding] duration-200 ease-out"
    : `w-full pt-6 px-4 md:px-6 relative z-20 flex justify-center ${splitMode ? 'mb-6' : 'mb-8'}`;
    
  const containerStyle = isFixed ? {
    paddingTop: scrolled ? '12px' : '24px',
    paddingLeft: '16px',
    paddingRight: '16px',
  } : {};

  const currentMaxWidth = (isFixed && scrolled) ? shrinkWidthClass : maxWidthClass;

  const headerClass = splitMode 
    ? `w-full ${currentMaxWidth} flex items-center justify-between transition-[max-width,padding] duration-200 ease-out`
    : `w-full ${currentMaxWidth} flex items-center justify-between bg-ink-surface/70 backdrop-blur-xl border border-ink-border/50 rounded-full shadow-lg shadow-black/10 transition-[max-width,background-color,border-color,padding] duration-200 ease-out`;
  
  const headerStyle = splitMode ? {} : {
    paddingTop: isFixed && scrolled ? '6px' : '10px',
    paddingBottom: isFixed && scrolled ? '6px' : '10px',
    paddingLeft: '12px',
    paddingRight: '12px',
  };

  const pillClass = "bg-ink-surface/70 backdrop-blur-xl border border-ink-border/50 rounded-full shadow-sm";

  return (
    <div className={containerClass} style={containerStyle}>
      <header className={headerClass} style={headerStyle}>
        <div className="flex items-center pl-4">
          <Link to="/" className="logo-link flex items-center">
            <span className="logo-text text-xl font-semibold tracking-wide drop-shadow-sm transition-colors duration-200">
              <span className="font-serif">lex<span className="italic">iq</span></span>
            </span>
          </Link>
        </div>
        
        {centerContent && (
          <div className="flex-1 flex justify-center items-center">
            {centerContent}
          </div>
        )}
        
        {navItems && (
          <nav className={`hidden md:flex items-center gap-8 text-xs tracking-wider font-medium text-ink-text ${splitMode ? pillClass + ' px-8 py-3' : ''}`}>
            {navItems}
          </nav>
        )}

        <div className={`flex items-center gap-3 ${splitMode ? '' : 'pr-1'}`}>
          <button 
            onClick={toggleTheme}
            className={`btn-press p-2 rounded-full text-ink-text ${splitMode ? pillClass : ''}`}
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {rightContent}
        </div>
      </header>
    </div>
  );
}
