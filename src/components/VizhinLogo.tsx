import React from 'react';

interface VizhinLogoProps {
  className?: string;
  lightMode?: boolean;
}

export default function VizhinLogo({ className = "h-8 w-auto", lightMode = false }: VizhinLogoProps) {
  // On dark backgrounds, #181C24 is invisible. We should use a beautiful off-white/silver or white color (#F3F4F6) instead.
  // The left chevron (leaf) is #0D5C46 (Deep Forest Green) which has the green they designed.
  const textFill = lightMode ? "#181C24" : "#F3F4F6";
  const taglineFill = lightMode ? "#717D8A" : "#94A3B8";

  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 1000 320" 
      className={className}
      id="vizhin_svg_logo"
    >
      <g transform="translate(40, 20)">
        {/* Deep Forest Green Left Accent Chevron Leaf (Left half of V) */}
        <path d="M 50,55 L 90,55 L 140,205 L 100,205 Z" fill="#0D5C46" />
        
        {/* Right Accent Chevron Leaf (Right half of V) */}
        <path d="M 235,55 L 195,55 L 120,235 L 160,235 Z" fill={textFill} />
        
        {/* Wordmark Character Component Mapping: 'I' */}
        <path d="M 295,60 L 312,60 L 312,230 L 295,230 Z" fill={textFill} />
        
        {/* Wordmark Character Component Mapping: 'Z' */}
        <path d="M 378,60 L 460,60 L 460,76 L 396,213 L 462,213 L 462,230 L 376,230 L 376,214 L 440,77 L 378,77 Z" fill={textFill} />
        
        {/* Wordmark Character Component Mapping: 'H' */}
        <path d="M 528,60 L 545,60 L 545,134 L 611,134 L 611,60 L 628,60 L 628,230 L 611,230 L 611,151 L 545,151 L 545,230 L 528,230 Z" fill={textFill} />
        
        {/* Wordmark Character Component Mapping: 'I' */}
        <path d="M 695,60 L 712,60 L 712,230 L 695,230 Z" fill={textFill} />
        
        {/* Wordmark Character Component Mapping: 'N' */}
        <path d="M 780,60 L 799,60 L 859,190 L 859,60 L 876,60 L 876,230 L 858,230 L 797,98 L 797,230 L 780,230 Z" fill={textFill} />
        
        {/* Corporate Subtext Tagline Centering Framework Matrix */}
        <text 
          x="465" 
          y="295" 
          fontFamily="system-ui, -apple-system, sans-serif" 
          fontSize="44" 
          fontWeight="300" 
          letterSpacing="14" 
          fill={taglineFill} 
          textAnchor="middle"
        >
          a better way forward
        </text>
      </g>
    </svg>
  );
}
