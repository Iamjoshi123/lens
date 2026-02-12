"use client";

import React, { useState, useRef, useEffect } from "react";
import { useStore } from "@/lib/store";
import {
    ChevronRight,
    Library,
    Clapperboard,
    PanelRightOpen,
    PanelRightClose,
    Home,
    Search,
    X,
    Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function TopBar() {
    const { state, dispatch, getActiveBrief, searchVideos } = useStore();
    const brief = getActiveBrief();

    const [searchOpen, setSearchOpen] = useState(false);
    const [searchInput, setSearchInput] = useState(state.searchQuery || "");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (searchOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [searchOpen]);

    // Keyboard shortcut: "/" opens search
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (e.key === "/") {
                e.preventDefault();
                setSearchOpen(true);
            }
            if (e.key === "Escape") {
                setSearchOpen(false);
            }
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, []);

    const handleSearch = (query: string) => {
        if (!query.trim()) return;
        searchVideos(query.trim());
        setSearchOpen(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between px-5 py-2.5 border-b border-lens-border/50 bg-lens-bg/80 backdrop-blur-lg z-50 relative"
        >
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-[13px]">
                <Link
                    href="/"
                    className="flex items-center gap-1.5 text-lens-muted hover:text-lens-text transition-colors"
                >
                    <Home size={13} />
                    <span>Home</span>
                </Link>
                <ChevronRight size={11} className="text-lens-border" />
                <span className="flex items-center gap-1.5 text-lens-muted">
                    <Library size={13} />
                    Library
                </span>
                {brief && (
                    <>
                        <ChevronRight size={11} className="text-lens-border" />
                        <span className="flex items-center gap-1.5 text-lens-muted">
                            <Clapperboard size={13} />
                            {brief.campaign}
                        </span>
                        <ChevronRight size={11} className="text-lens-border" />
                        <span className="text-lens-text font-medium">{brief.title}</span>
                    </>
                )}
            </div>

            {/* Center — search */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
                <AnimatePresence mode="wait">
                    {searchOpen ? (
                        <motion.div
                            key="search-input"
                            initial={{ width: 200, opacity: 0 }}
                            animate={{ width: 360, opacity: 1 }}
                            exit={{ width: 200, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="relative"
                        >
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-lens-muted/50" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSearch(searchInput);
                                    if (e.key === "Escape") setSearchOpen(false);
                                }}
                                placeholder="Search ads — brand, category, platform..."
                                className="w-full pl-9 pr-8 py-2 rounded-lg bg-lens-card border border-lens-border/50 text-sm text-lens-text placeholder:text-lens-muted/30 outline-none focus:border-white/15 transition-colors"
                            />
                            <button
                                onClick={() => setSearchOpen(false)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-lens-muted/40 hover:text-lens-text transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </motion.div>
                    ) : (
                        <motion.button
                            key="search-btn"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSearchOpen(true)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-lens-card/50 border border-lens-border/30 text-[12px] text-lens-muted/40 hover:text-lens-muted hover:border-white/10 transition-all"
                        >
                            <Search size={12} />
                            <span>Search ads</span>
                            <kbd className="ml-2 text-[10px] text-lens-muted/20 bg-lens-bg px-1.5 py-0.5 rounded">/</kbd>
                        </motion.button>
                    )}
                </AnimatePresence>

                {state.isSearching && (
                    <Loader2 size={14} className="ml-2 text-lens-muted animate-spin" />
                )}
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-3">
                {/* Search result count */}
                {state.searchResults.length > 0 && !state.isSearching && (
                    <span className="text-[11px] text-lens-muted/40">
                        {state.searchResults.length} ads
                    </span>
                )}

                {/* Auto-save indicator */}
                <div className="flex items-center gap-1.5 text-[11px] text-lens-muted/40">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
                    Auto-saved
                </div>

                {/* Sidebar toggle */}
                <button
                    onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
                    className="p-2 rounded-lg text-lens-muted/50 hover:text-lens-text hover:bg-white/[0.03] transition-all"
                    title={state.sidebarOpen ? "Close Sidebar" : "Open Sidebar"}
                >
                    {state.sidebarOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
                </button>
            </div>
        </motion.div>
    );
}
