import React from 'react';

interface VizhinCRMLogoProps {
  className?: string;
  lightMode?: boolean;
}

export default function VizhinCRMLogo({ className = "h-8 w-auto", lightMode = false }: VizhinCRMLogoProps) {
  // Use off-white #F3F4F6 on dark backgrounds and ink black #181C24 on light backgrounds
  const textFill = lightMode ? "#181C24" : "#F3F4F6";

  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 1000 400" 
      className={className}
      id="vizhin_crm_logo_svg"
    >
      <g transform="translate(40, 20)">
        {/* Deep Forrest Green Left Accent Chevron Leaf */}
        <path d="M 50,55 L 90,55 L 140,205 L 100,205 Z" fill="#0D5C46" />
        
        {/* Dark Ink Black Right Accent Chevron Leaf */}
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

        {/* CRM Extension: 'C' (perfectly aligned below 'H') */}
        <path d="M 520,275 L 620,275 L 620,292 L 537,292 L 537,358 L 620,358 L 620,375 L 520,375 Z" fill={textFill} />
        
        {/* CRM Extension: 'R' (perfectly aligned below 'I') */}
        <rect x="650" y="275" width="17" height="100" fill={textFill} />
        <path d="M 667,275 L 750,275 L 750,325 L 667,325 L 667,308 L 733,308 L 733,292 L 667,292 Z" fill={textFill} />
        <path d="M 700,325 L 722,325 L 750,375 L 728,375 Z" fill={textFill} />
        
        {/* CRM Extension: 'M' (perfectly aligned under 'N') */}
        <path d="M 780,275 L 800,275 L 828,335 L 856,275 L 876,275 L 876,375 L 859,375 L 859,305 L 828,368 L 797,305 L 797,375 L 780,375 Z" fill={textFill} />
      </g>
    </svg>
  );
}
