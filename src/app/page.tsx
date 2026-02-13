"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Sparkles, ArrowRight, FileText, TrendingUp, Zap, FolderOpen } from "lucide-react";
import { MOCK_BRIEFS, TRENDING_SEARCHES } from "@/lib/mockData";

export default function LandingPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = (searchQuery?: string) => {
    const q = searchQuery || query;
    if (q.trim()) {
      router.push(`/workspace?q=${encodeURIComponent(q.trim())}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const recentBriefs = MOCK_BRIEFS;

  return (
    <div className="min-h-screen flex flex-col bg-lens-bg relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-radial from-lens-primary/[0.08] via-transparent to-transparent blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[200px] bg-gradient-radial from-lens-primary/[0.05] via-transparent to-transparent blur-3xl" />
      </div>

      {/* Top bar */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative z-10 flex items-center justify-between px-8 py-5"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-lens-primary flex items-center justify-center">
            <Zap size={16} className="text-lens-secondary" />
          </div>
          <span className="text-lg font-bold text-lens-text tracking-tight">LENS</span>
        </div>
      </motion.header>

      {/* Center: Omnibox */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-4 -mt-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-extrabold text-lens-text mb-3 tracking-tight">
            What ads do you want to{" "}
            <span className="text-lens-primary">
              deconstruct?
            </span>
          </h1>
          <p className="text-base text-lens-muted max-w-md mx-auto">
            Search the Meta & TikTok ad libraries. Build a creative brief.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="w-full max-w-xl"
        >
          <div
            className={`omnibox-glow rounded-2xl transition-all duration-300 ${isFocused ? "animate-glow-pulse" : ""
              }`}
          >
            <div className="flex items-center gap-3 px-5 py-4">
              <Search
                size={20}
                className={`shrink-0 transition-colors duration-300 ${isFocused ? "text-lens-primary" : "text-lens-muted"
                  }`}
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. UGC hooks for skincare, pet supplement ads..."
                className="flex-1 bg-transparent text-lens-text text-base placeholder:text-lens-muted/40 outline-none"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSearch()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-lens-primary text-lens-secondary font-semibold text-sm hover:shadow-lg hover:shadow-lens-primary/20 transition-shadow shrink-0"
              >
                <Sparkles size={14} />
                Search Ads
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Quick-start chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex flex-wrap items-center justify-center gap-2 mt-5 max-w-xl"
        >
          <span className="text-xs text-lens-muted/50 mr-1 flex items-center gap-1">
            <TrendingUp size={11} /> Try:
          </span>
          {TRENDING_SEARCHES.slice(0, 4).map((s, i) => (
            <button
              key={i}
              onClick={() => handleSearch(s)}
              className="text-xs text-lens-muted hover:text-lens-primary px-3 py-1.5 rounded-full bg-lens-bg-subtle/60 border border-lens-border hover:border-lens-primary/30 transition-all"
            >
              {s}
            </button>
          ))}
        </motion.div>
      </div>

      {/* Recent Briefs — compact row at bottom */}
      {recentBriefs.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="relative z-10 px-8 pb-8"
        >
          <div className="flex items-center gap-2 mb-3">
            <FolderOpen size={13} className="text-lens-muted/50" />
            <span className="text-xs font-medium text-lens-muted/50 uppercase tracking-wider">
              Continue working
            </span>
          </div>

          <div className="flex gap-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {recentBriefs.map((brief) => (
              <div
                key={brief.id}
                onClick={() => router.push(`/workspace?brief=${brief.id}`)}
                className="shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl bg-lens-bg-subtle/50 border border-lens-border hover:border-lens-primary/30 cursor-pointer transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-lens-primary/10 flex items-center justify-center shrink-0">
                  <FileText size={14} className="text-lens-primary/80" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-lens-text font-medium truncate max-w-[200px]">
                    {brief.title}
                  </p>
                  <p className="text-[11px] text-lens-muted truncate">
                    {brief.campaign} · {brief.referenceVideoIds.length} refs
                  </p>
                </div>
                <ArrowRight
                  size={14}
                  className="text-lens-muted/30 group-hover:text-lens-primary/50 transition-colors shrink-0 ml-2"
                />
              </div>
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
}
