"use client";

import React, { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import TopBar from "@/components/TopBar";
import HeroPlayer from "@/components/HeroPlayer";
import BriefSidebar from "@/components/BriefSidebar";
import { motion } from "framer-motion";

function WorkspaceContent() {
    const searchParams = useSearchParams();
    const { state, dispatch, searchVideos } = useStore();

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

    // Set first search result as active video if none selected
    useEffect(() => {
        if (state.searchResults.length > 0 && !state.activeVideoId) {
            dispatch({ type: "SET_ACTIVE_VIDEO", payload: state.searchResults[0].id });
        }
    }, [state.searchResults, state.activeVideoId, dispatch]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-screen flex flex-col bg-lens-bg overflow-hidden"
        >
            {/* Top Bar */}
            <TopBar />

            {/* Main content: Reel player + Brief sidebar */}
            <div className="flex-1 flex overflow-hidden">
                {/* Reel-style video feed — takes full remaining space */}
                <HeroPlayer />

                {/* Brief Sidebar */}
                <BriefSidebar />
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
