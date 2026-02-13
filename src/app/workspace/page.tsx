"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import TopBar from "@/components/TopBar";
import HeroPlayer from "@/components/HeroPlayer";
import BriefSidebar from "@/components/BriefSidebar";
import SearchGrid from "@/components/SearchGrid";
import { motion, AnimatePresence } from "framer-motion";

type ViewMode = "player" | "grid";

function WorkspaceContent() {
    const searchParams = useSearchParams();
    const { state, dispatch, searchVideos } = useStore();
    const [viewMode, setViewMode] = useState<ViewMode>("player");

    useEffect(() => {
        const q = searchParams.get("q");
        const briefId = searchParams.get("brief");

        if (q) {
            searchVideos(q);
        }

        if (briefId) {
            dispatch({ type: "SET_ACTIVE_BRIEF", payload: briefId });
        }
    }, [searchParams, searchVideos, dispatch]);

    // Switch to grid view when search results arrive
    useEffect(() => {
        if (state.searchResults.length > 0 && !state.isSearching) {
            setViewMode("grid");
        }
    }, [state.searchResults, state.isSearching]);

    // Switch back to player when search is cleared
    useEffect(() => {
        if (state.searchQuery === "" && state.searchResults.length === 0) {
            setViewMode("player");
        }
    }, [state.searchQuery, state.searchResults]);

    const handleSelectFromGrid = (videoId: string) => {
        dispatch({ type: "SET_ACTIVE_VIDEO", payload: videoId });
        setViewMode("player");
    };

    const handleBackToGrid = () => {
        if (state.searchResults.length > 0) {
            setViewMode("grid");
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-screen flex flex-col bg-lens-bg overflow-hidden"
        >
            {/* Top Bar */}
            <TopBar />

            {/* Main content */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Reel-style video feed */}
                <HeroPlayer
                    showBackToGrid={viewMode === "player" && state.searchResults.length > 0}
                    onBackToGrid={handleBackToGrid}
                />

                {/* Brief Sidebar */}
                <BriefSidebar />

                {/* Grid overlay when searching */}
                <AnimatePresence>
                    {viewMode === "grid" && (
                        <SearchGrid
                            onSelectVideo={handleSelectFromGrid}
                            onClose={() => setViewMode("player")}
                        />
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

export default function WorkspacePage() {
    return (
        <Suspense
            fallback={
                <div className="h-screen flex items-center justify-center bg-lens-bg">
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full border-2 border-lens-gold border-t-transparent animate-spin" />
                        <span className="text-lens-muted text-sm">Loading workspace...</span>
                    </div>
                </div>
            }
        >
            <WorkspaceContent />
        </Suspense>
    );
}
