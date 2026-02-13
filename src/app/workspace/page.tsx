"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import TopBar from "@/components/TopBar";
import BriefSidebar from "@/components/BriefSidebar";
import SearchGrid from "@/components/SearchGrid"; // Now acts as the main VideoGrid
import VideoModal from "@/components/VideoModal";
import { motion, AnimatePresence } from "framer-motion";
// VideoItem import removed as it wasn't used directly here anymore (we use types inferred or handled by components)

function WorkspaceContent() {
    const searchParams = useSearchParams();
    const { state, dispatch, searchVideos } = useStore();
    const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

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

    // Handle initial video selection from grid
    const handleSelectFromGrid = (videoId: string) => {
        dispatch({ type: "SET_ACTIVE_VIDEO", payload: videoId });
        setSelectedVideoId(videoId);
    };

    // Close modal
    const handleCloseModal = () => {
        setSelectedVideoId(null);
    };

    // Find the video object for the modal
    const selectedVideo = state.videos.find((v) => v.id === selectedVideoId);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-screen flex flex-col bg-lens-bg overflow-hidden text-lens-text"
        >
            {/* Top Bar */}
            <TopBar />

            {/* Main content area */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* Main View: Grid of Videos */}
                <div className="flex-1 flex flex-col min-w-0">
                    <SearchGrid
                        onSelectVideo={handleSelectFromGrid}
                        onClose={() => { }} // No-op since we don't close the grid anymore
                    />
                </div>

                {/* Brief Sidebar (Toggled via TopBar) */}
                <BriefSidebar />

                {/* Video Modal Overlay */}
                <AnimatePresence>
                    {selectedVideoId && selectedVideo && (
                        <VideoModal
                            video={selectedVideo}
                            onClose={handleCloseModal}
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
                <div className="h-screen flex items-center justify-center bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full border-2 border-[#FCA311] border-t-transparent animate-spin" />
                    </div>
                </div>
            }
        >
            <WorkspaceContent />
        </Suspense>
    );
}
