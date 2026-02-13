"use client";

import React, { useRef, useState, useCallback } from "react";
import { useStore } from "@/lib/store";
import { motion } from "framer-motion";
import {
    Play,
    ArrowLeft,
    TrendingUp,
    Eye,
    MousePointerClick,
    X,
    Search,
} from "lucide-react";
import { VideoItem } from "@/lib/mockData";

const platformColors: Record<string, { bg: string; text: string }> = {
    meta: { bg: "bg-[#2D82B7]/20", text: "text-[#2D82B7]" },
    tiktok: { bg: "bg-[#EB8A90]/20", text: "text-[#EB8A90]" },
    youtube: { bg: "bg-red-500/20", text: "text-red-400" },
};

const tierBadge: Record<string, { bg: string; text: string; label: string }> = {
    top: { bg: "bg-[#42E2B8]/15", text: "text-[#42E2B8]", label: "Top" },
    high: { bg: "bg-[#2D82B7]/15", text: "text-[#2D82B7]", label: "High" },
    mid: { bg: "bg-[#F3DFBF]/15", text: "text-[#F3DFBF]", label: "Mid" },
    low: { bg: "bg-[#EB8A90]/15", text: "text-[#EB8A90]", label: "Low" },
};

interface SearchGridProps {
    onSelectVideo: (videoId: string) => void;
    onClose: () => void;
}

export default function SearchGrid({ onSelectVideo, onClose }: SearchGridProps) {
    const { state, dispatch } = useStore();

    const results = state.searchResults.length > 0 ? state.searchResults : state.videos;

    const handleClearSearch = () => {
        dispatch({ type: "CLEAR_SEARCH" });
        onClose();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-30 bg-lens-bg flex flex-col"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-lens-border/30">
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleClearSearch}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-lens-muted hover:text-lens-text hover:bg-[#2D82B7]/10 transition-all"
                    >
                        <ArrowLeft size={16} />
                        <span>Back to feed</span>
                    </button>
                    <div className="h-5 w-px bg-lens-border/30" />
                    <div className="flex items-center gap-2">
                        <Search size={14} className="text-[#42E2B8]/60" />
                        <span className="text-sm text-lens-text">
                            &ldquo;{state.searchQuery}&rdquo;
                        </span>
                        <span className="text-xs text-lens-muted/60 bg-[#2D82B7]/10 px-2 py-0.5 rounded-full">
                            {results.length} result{results.length !== 1 ? "s" : ""}
                        </span>
                    </div>
                </div>
                <button
                    onClick={handleClearSearch}
                    className="p-2 rounded-lg text-lens-muted hover:text-lens-text hover:bg-[#2D82B7]/10 transition-all"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                {results.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                        <Search size={40} className="text-[#2D82B7]/20" />
                        <p className="text-lens-muted text-sm">
                            No ads found for &ldquo;{state.searchQuery}&rdquo;
                        </p>
                        <p className="text-lens-muted/50 text-xs">
                            Try searching by brand, category, or platform
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {results.map((video, i) => (
                            <VideoCard
                                key={video.id}
                                video={video}
                                index={i}
                                onClick={() => onSelectVideo(video.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

function VideoCard({
    video,
    index,
    onClick,
}: {
    video: VideoItem;
    index: number;
    onClick: () => void;
}) {
    const platform = platformColors[video.platform] || platformColors.meta;
    const tier = video.performanceTier ? tierBadge[video.performanceTier] : null;
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [isHovering, setIsHovering] = useState(false);

    const handleMouseEnter = useCallback(() => {
        setIsHovering(true);
        if (videoRef.current) {
            videoRef.current.muted = true;
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(() => { });
        }
    }, []);

    const handleMouseLeave = useCallback(() => {
        setIsHovering(false);
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
    }, []);

    return (
        <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.35) }}
            onClick={onClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="group relative flex flex-col rounded-2xl overflow-hidden bg-lens-surface border border-[#2D82B7]/15 hover:border-[#42E2B8]/30 transition-all duration-300 text-left hover:shadow-xl hover:shadow-[#07004D]/40 hover:scale-[1.02] active:scale-[0.98]"
        >
            {/* Video preview area */}
            <div className="relative aspect-[9/16] bg-[#07004D] overflow-hidden">
                {/* Actual video — plays on hover */}
                <video
                    ref={videoRef}
                    src={video.videoUrl}
                    muted
                    playsInline
                    preload="metadata"
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isHovering ? "opacity-100" : "opacity-0"}`}
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#07004D]/90 via-transparent to-[#07004D]/30 z-10" />

                {/* Placeholder when not hovering */}
                <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#0d0860] to-[#07004D] transition-opacity duration-300 ${isHovering ? "opacity-0" : "opacity-100"}`}>
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-[#2D82B7]/15 flex items-center justify-center border border-[#2D82B7]/20">
                            <Play size={20} className="text-[#42E2B8]/60 ml-0.5" />
                        </div>
                        <span className="text-[10px] text-lens-muted/50 font-medium">{video.duration}s</span>
                    </div>
                </div>

                {/* Play overlay on hover */}
                <div className={`absolute inset-0 z-20 flex items-center justify-center transition-opacity duration-200 ${isHovering ? "opacity-100" : "opacity-0"}`}>
                    <div className="w-14 h-14 rounded-full bg-[#42E2B8]/20 backdrop-blur-sm flex items-center justify-center border border-[#42E2B8]/30 shadow-lg shadow-[#42E2B8]/10">
                        <Play size={22} className="text-white ml-0.5" fill="white" />
                    </div>
                </div>

                {/* Platform badge — top left */}
                <div className={`absolute top-2.5 left-2.5 z-20 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider backdrop-blur-sm ${platform.bg} ${platform.text}`}>
                    {video.platform}
                </div>

                {/* Performance tier — top right */}
                {tier && (
                    <div className={`absolute top-2.5 right-2.5 z-20 px-2 py-0.5 rounded-full text-[9px] font-semibold backdrop-blur-sm ${tier.bg} ${tier.text}`}>
                        {tier.label}
                    </div>
                )}

                {/* Title + Brand overlay — bottom */}
                <div className="absolute bottom-0 left-0 right-0 z-20 p-3">
                    <p className="text-white text-xs font-medium leading-snug line-clamp-2">
                        {video.title}
                    </p>
                    <p className="text-[#42E2B8]/70 text-[11px] font-medium mt-0.5">{video.brand}</p>
                </div>
            </div>

            {/* Metrics bar */}
            <div className="px-3 py-2.5 flex items-center gap-3 border-t border-[#2D82B7]/10 bg-lens-surface">
                {video.spend && (
                    <div className="flex items-center gap-1">
                        <TrendingUp size={10} className="text-[#42E2B8]/40" />
                        <span className="text-[10px] text-lens-muted font-medium">{video.spend}</span>
                    </div>
                )}
                {video.impressions && (
                    <div className="flex items-center gap-1">
                        <Eye size={10} className="text-[#2D82B7]/60" />
                        <span className="text-[10px] text-lens-muted font-medium">{video.impressions}</span>
                    </div>
                )}
                {video.ctr && (
                    <div className="flex items-center gap-1 ml-auto">
                        <MousePointerClick size={10} className="text-[#EB8A90]/50" />
                        <span className="text-[10px] text-lens-muted font-medium">{video.ctr}</span>
                    </div>
                )}
            </div>
        </motion.button>
    );
}
