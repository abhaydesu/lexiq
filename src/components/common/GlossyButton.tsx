import { Link } from 'react-router-dom';

interface GlossyButtonProps {
  text: string;
  to?: string;
  onClick?: () => void;
  fromColor?: string;
  viaColor?: string;
  toColor?: string;
  borderColor?: string;
  shadowColor?: string;
  className?: string;
}

export function GlossyButton({
  text,
  to,
  onClick,
  fromColor = '#f08c00',
  viaColor = '#e67e00',
  toColor = '#d96c00',
  borderColor = 'rgba(255, 179, 71, 0.6)',
  shadowColor = 'rgba(230, 126, 0, 0.35)',
  className = '',
}: GlossyButtonProps) {
  
  const buttonStyle = {
    background: `linear-gradient(to bottom, ${fromColor}, ${viaColor}, ${toColor})`,
    borderColor: borderColor,
    boxShadow: `0 1px 1px ${shadowColor}`,
  };

  const classes = `
    relative inline-flex items-center justify-center
    w-full md:w-auto
    px-4 py-2
    rounded-lg
    overflow-hidden
    border
    text-white text-sm font-medium tracking-wide
    transition-all duration-200
    hover:brightness-[1.03]
    active:scale-[0.98]
    ${className}
  `;

  const content = (
    <>
      {/* Gloss */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-white/12 via-transparent to-transparent pointer-events-none" />

      {/* Inner border */}
      <div
        className="absolute inset-[2px] border border-white/25 pointer-events-none"
        style={{ borderRadius: "calc(0.5rem - 2px)" }}
      />

      <span className="relative z-10">
        {text}
      </span>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} style={buttonStyle}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={classes} style={buttonStyle}>
      {content}
    </button>
  );
}
