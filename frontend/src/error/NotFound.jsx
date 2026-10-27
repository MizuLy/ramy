import React, { useState } from "react";
import { FiArrowLeft, FiHome, FiAlertTriangle } from "react-icons/fi";
import { TbGhost, TbDice5 } from "react-icons/tb";

const FUNNY_EXCUSES = [
  "We sent a search party for this page, but they found a stash of cat videos and haven't returned.",
  "Either this URL is wrong, or our backend developers are having a very public breakdown.",
  "This page exists in a parallel universe. Unfortunately, you're in this one.",
  "404: Page not found. It probably went out for coffee and forgot to come back.",
  "You've managed to find a page as empty as a politician's promises. We're impressed!",
  "This page ran away to find itself. It has not been seen since.",
  "Our server checked everywhere, including under the couch cushions. Still nothing.",
  "You broke the internet. Just kidding. Probably.",
  "This page is currently in witness protection.",
  "404: The page you're looking for is on a spiritual journey and cannot be reached.",
  "We looked. We really did. This page just doesn't want to be found.",
  "Somewhere, a page is crying because you can't find it.",
  "This URL led to nowhere, much like most New Year's resolutions.",
  "Page not found. Much like our motivation on Mondays.",
  "You've reached the edge of the map. Here be dragons, not pages.",
];

export default function NotFound() {
  const [excuseIndex, setExcuseIndex] = useState(0);

  const handleNewExcuse = () => {
    setExcuseIndex((prev) => (prev + 1) % FUNNY_EXCUSES.length);
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-zinc-950 p-6 text-white font-sans">
      {/* Background Glow Accents */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-purple-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-blue-600/15 blur-[120px]" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-2xl text-center">
        {/* 404 Headline with Icon Box */}
        <div className="relative inline-flex items-center justify-center gap-3 select-none">
          <span className="text-8xl font-black tracking-tighter text-neutral-700 sm:text-[160px] leading-none">
            4
          </span>
          <div className="relative flex h-24 w-24 sm:h-36 sm:w-36 items-center justify-center rounded-3xl border border-neutral-700/80 bg-neutral-800/50 shadow-inner backdrop-blur-md">
            <TbGhost className="h-12 w-12 sm:h-20 sm:w-20 text-purple-400 animate-bounce" />
            <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 font-bold text-black text-xs">
              <FiAlertTriangle className="h-4 w-4" />
            </span>
          </div>
          <span className="text-8xl font-black tracking-tighter text-neutral-700 sm:text-[160px] leading-none">
            4
          </span>
        </div>

        {/* Glass Card */}
        <div className="-mt-6 sm:-mt-10 rounded-3xl border border-neutral-800 bg-neutral-900/60 p-8 sm:p-12 backdrop-blur-xl shadow-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Oops! Looks like you took a wrong turn.
          </h2>

          <p className="mt-4 text-base sm:text-lg text-neutral-300 min-h-[56px] flex items-center justify-center">
            "{FUNNY_EXCUSES[excuseIndex]}"
          </p>

          <p className="mt-4 text-lg sm:text-xl font-medium text-neutral-400 flex items-center justify-center gap-2">
            This page is a ghost town. Just you, us, and a tumbleweed.
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800/80 px-5 py-3 text-sm font-medium text-neutral-300 transition-all hover:bg-neutral-800 hover:text-white hover:border-neutral-600 active:scale-95"
            >
              <FiArrowLeft className="h-4 w-4" />
              <span>Go Back</span>
            </button>

            <button
              onClick={handleNewExcuse}
              className="flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-5 py-3 text-sm font-medium text-purple-300 transition-all hover:bg-purple-500/20 active:scale-95"
            >
              <TbDice5 className="h-4 w-4" />
              <span>Blame the dev</span>
            </button>

            <a
              href="/"
              className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition-all hover:bg-neutral-200 active:scale-95 shadow-lg shadow-white/10"
            >
              <FiHome className="h-4 w-4" />
              <span>Take Me Home</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
