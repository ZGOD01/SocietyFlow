"use client";

import React from "react";

export function AmbientBackground() {
  return (
    <div 
      aria-hidden="true" 
      className="fixed inset-0 pointer-events-none overflow-hidden -z-20 select-none bg-gradient-to-b from-[#F8FAFC] via-[#FFFFFF] to-[#F8FAFC]"
    >
      {/* Subtle, soft top light wash */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[450px] bg-gradient-to-b from-indigo-100/35 via-slate-100/20 to-transparent blur-3xl opacity-70" />

      {/* Crisp Architectural Blueprint Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(226, 232, 240, 0.6) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(226, 232, 240, 0.6) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 90% 65% at 50% 25%, black 40%, transparent 90%)",
          WebkitMaskImage: "radial-gradient(ellipse 90% 65% at 50% 25%, black 40%, transparent 90%)",
        }}
      />
    </div>
  );
}
