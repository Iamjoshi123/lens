"use client";

import React, { useRef } from "react";
import { useStore } from "@/lib/store";
import { motion } from "framer-motion";
import { Plus, X, ChevronLeft, ChevronRight, Film } from "lucide-react";

export default function ReferenceRail() {
    const { state, dispatch, getActiveBrief } = useStore();
    const brief = getActiveBrief();
    const scrollRef = useRef<HTMLDivElement>(null);

    const referenceVideos = brief
        ? state.videos.filter((v) => brief.referenceVideoIds.includes(v.id))
        : [];

    const availableVideos =
        state.searchResults.length > 0 ? state.searchResults : state.videos;

    const displayVideos =
        referenceVideos.length > 0 ? referenceVideos : availableVideos;

    const scroll = (direction: "left" | "right") => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollBy({
            left: direction === "left" ? -300 : 300,
            behavior: "smooth",
        });
    };

    const handleVideoSelect = (videoId: string) => {
        dispatch({ type: "SET_ACTIVE_VIDEO", payload: videoId });
        if (brief) {
            dispatch({
                type: "ADD_REFERENCE_VIDEO",
                payload: { briefId: brief.id, videoId },
            });
        }
    };

    const handleRemoveReference = (videoId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (brief) {
            dispatch({
                type: "REMOVE_REFERENCE_VIDEO",
                payload: { briefId: brief.id, videoId },
            });
        }
    };

    const platformColors: Record<string, string> = {
        meta: "bg-blue-500/20 text-blue-400",
        tiktok: "bg-pink-500/20 text-pink-400",
        youtube: "bg-red-500/20 text-red-400",
    };

    return (
        <div className="border-t border-lens-border/50 bg-lens-surface/80 backdrop-blur-sm shrink-0">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2">
                <div className="flex items-center gap-2">
                    <Film size={13} className="text-lens-muted/60" />
                    <span className="text-[11px] font-medium text-lens-muted/60 uppercase tracking-wider">
                        {referenceVideos.length > 0
                            ? `References (${referenceVideos.length})`
                            : `Search Results (${displayVideos.length})`}
                    </span>
                    {referenceVideos.length === 0 && (
                        <span className="text-[10px] text-lens-muted/40">
                            — click to watch, actions appear on video
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => scroll("left")}
                        className="p-1 rounded text-lens-muted/40 hover:text-lens-text hover:bg-lens-card transition-all"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        onClick={() => scroll("right")}
                        className="p-1 rounded text-lens-muted/40 hover:text-lens-text hover:bg-lens-card transition-all"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* Horizontal scroll — landscape-ratio thumbnails */}
            <div
                ref={scrollRef}
                className="flex gap-2.5 px-4 pb-3 overflow-x-auto"
                style={{ scrollbarWidth: "none" }}
            >
                {displayVideos.map((video, index) => {
                    const isActive = video.id === state.activeVideoId;
                    const isReference = brief?.referenceVideoIds.includes(video.id);

                    return (
                        <motion.div
                            key={video.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.04 }}
                            onClick={() => handleVideoSelect(video.id)}
                            className={`rail-thumb relative shrink-0 rounded-lg overflow-hidden cursor-pointer group ${isActive ? "active" : ""
                                }`}
                            style={{ width: 220 }}
                        >
                            {/* 16:9 landscape thumbnail */}
                            <div className="relative w-full overflow-hidden bg-lens-card" style={{ aspectRatio: "16/9" }}>
                                <video
                                    src={video.videoUrl}
                                    className="w-full h-full object-cover"
                                    muted
                                    preload="metadata"
                                    onMouseEnter={(e) => {
                                        const target = e.target as HTMLVideoElement;
                                        target.currentTime = 0;
                                        target.play().catch(() => { });
                                    }}
                                    onMouseLeave={(e) => {
                                        const target = e.target as HTMLVideoElement;
                                        target.pause();
                                        target.currentTime = 0;
                                    }}
                                />

                                {/* Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                                {/* Platform badge */}
                                <span
                                    className={`absolute top-1.5 left-1.5 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${platformColors[video.platform] || "bg-gray-500/20 text-gray-400"
                                        }`}
                                >
                                    {video.platform}
                                </span>

                                {/* Remove */}
                                {isReference && (
                                    <button
                                        onClick={(e) => handleRemoveReference(video.id, e)}
                                        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <X size={10} />
                                    </button>
                                )}

                                {/* Bottom info overlay */}
                                <div className="absolute bottom-0 inset-x-0 px-2 pb-1.5 pt-4">
                                    <p className="text-[11px] text-white font-medium truncate leading-tight">
                                        {video.title}
                                    </p>
                                    <div className="flex items-center justify-between mt-0.5">
                                        <span className="text-[10px] text-white/50">{video.brand}</span>
                                        <span className="text-[10px] font-mono text-white/40">
                                            {Math.floor(video.duration / 60)}:
                                            {(video.duration % 60).toString().padStart(2, "0")}
                                        </span>
                                    </div>
                                </div>

                                {/* Active indicator */}
                                {isActive && (
                                    <div className="absolute inset-0 border-2 border-lens-gold rounded-lg pointer-events-none" />
                                )}
                            </div>
                        </motion.div>
                    );
                })}

                {/* Add Reference */}
                <div
                    className="shrink-0 rounded-lg border border-dashed border-lens-border/40 flex items-center justify-center cursor-pointer hover:border-lens-blue/40 hover:bg-lens-blue/5 transition-all group"
                    style={{ width: 120, aspectRatio: "16/9" }}
                >
                    <div className="text-center">
                        <Plus
                            size={18}
                            className="text-lens-muted/40 group-hover:text-lens-blue mx-auto transition-colors"
                        />
                        <span className="text-[10px] text-lens-muted/40 group-hover:text-lens-blue block mt-0.5 transition-colors">
                            Add More
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
