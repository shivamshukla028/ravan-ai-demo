"use client";

import { useEffect, useState } from "react";

export function VoiceWave({ active }: { active: boolean }) {
  const [bars, setBars] = useState<number[]>(Array(5).fill(20));

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (active) {
      interval = setInterval(() => {
        setBars(bars.map(() => Math.max(20, Math.random() * 100)));
      }, 100);
    } else {
      setBars(Array(5).fill(20));
    }
    return () => clearInterval(interval);
  }, [active]);

  return (
    <div className="flex items-center justify-center gap-1.5 h-16">
      {bars.map((height, i) => (
        <div
          key={i}
          className={`w-2 rounded-full transition-all duration-100 ease-in-out ${
            active ? "bg-cyan-400" : "bg-slate-700"
          }`}
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
}
