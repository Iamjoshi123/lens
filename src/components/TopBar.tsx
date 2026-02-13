"use client";

import React, { useState, useRef, useEffect } from "react";
import { useStore } from "@/lib/store";
import {
    ChevronRight,
    Library,
    Clapperboard,
    Home,
    Search,
    X,
    Loader2,
    FileText,
    PanelRightOpen,
    PanelRightClose
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
            className="flex items-center justify-between px-6 py-3 border-b border-lens-border bg-white z-50 relative shadow-sm"
        >
            {/* LEFT: Branding & Breadcrumbs */}
            <div className="flex items-center gap-4">
                {/* Logo Placeholder */}
                <div className="w-8 h-8 bg-lens-secondary rounded-lg flex items-center justify-center">
                    <span className="text-lens-primary font-bold text-lg">L</span>
                </div>

                <div className="h-6 w-px bg-lens-border" />

                <div className="flex items-center gap-2 text-[13px] font-medium">
                    <Link
                        href="/"
                        className="flex items-center gap-1.5 text-lens-muted hover:text-lens-secondary transition-colors"
                    >
                        <Home size={14} />
                        <span className="hidden md:inline">Home</span>
                    </Link>
                    <ChevronRight size={12} className="text-gray-300" />
                    <span className="flex items-center gap-1.5 text-lens-muted">
                        <Library size={14} />
                        Library
                    </span>
                    {brief && (
                        <>
                            <ChevronRight size={12} className="text-gray-300" />
                            <span className="flex items-center gap-1.5 text-lens-secondary font-semibold">
                                <Clapperboard size={14} className="text-lens-primary" />
                                {brief.campaign}
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* CENTER: Search */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
                <AnimatePresence mode="wait">
                    {searchOpen ? (
                        <motion.div
                            key="search-input"
                            initial={{ width: 200, opacity: 0 }}
                            animate={{ width: 400, opacity: 1 }}
                            exit={{ width: 200, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="relative"
                        >
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-lens-secondary" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSearch(searchInput);
                                    if (e.key === "Escape") setSearchOpen(false);
                                }}
                                placeholder="Search by brand, hook, or platform..."
                                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-lens-primary/50 text-sm text-lens-secondary placeholder:text-gray-400 outline-none transition-all shadow-inner"
                            />
                            <button
                                onClick={() => setSearchOpen(false)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-lens-secondary transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </motion.div>
                    ) : (
                        <motion.button
                            key="search-btn"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSearchOpen(true)}
                            className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gray-50 border border-transparent hover:border-lens-border hover:bg-white text-sm text-gray-400 transition-all group"
                        >
                            <Search size={16} className="text-lens-secondary group-hover:text-lens-primary transition-colors" />
                            <span>Search creative ads...</span>
                            <kbd className="hidden md:inline-block ml-4 text-[10px] font-mono text-gray-300 bg-white border border-gray-200 px-1.5 py-0.5 rounded shadow-sm">/</kbd>
                        </motion.button>
                    )}
                </AnimatePresence>

                {state.isSearching && (
                    <Loader2 size={16} className="ml-3 text-lens-primary animate-spin" />
                )}
            </div>

            {/* RIGHT: controls */}
            <div className="flex items-center gap-4">
                {/* Brief Sidebar Toggle */}
                <button
                    onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all border ${state.sidebarOpen
                            ? "bg-lens-secondary text-white border-lens-secondary"
                            : "bg-white text-lens-secondary border-gray-200 hover:border-lens-primary hover:text-lens-primary"
                        }`}
                >
                    <FileText size={16} />
                    <span className="text-sm font-medium hidden md:inline">Briefs</span>
                    {state.sidebarOpen ? <PanelRightClose size={16} className="opacity-50" /> : <PanelRightOpen size={16} className="opacity-50" />}
                </button>

                {/* User Avatar (Profile) placeholder */}
                <div className="w-9 h-9 rounded-full bg-lens-primary flex items-center justify-center text-lens-secondary font-bold text-sm border-2 border-white shadow-sm cursor-pointer hover:scale-105 transition-transform">
                    JS
                </div>
            </div>
        </motion.div>
    );
}
