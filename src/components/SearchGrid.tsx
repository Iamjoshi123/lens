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
    Heart,
    Plus,
} from "lucide-react";
import { VideoItem } from "@/lib/mockData";

const platformColors: Record<string, { bg: string; text: string }> = {
    meta: { bg: "bg-[#9D8DF1]/15", text: "text-[#9D8DF1]" },
    tiktok: { bg: "bg-[#FF3E3E]/15", text: "text-[#FF3E3E]" },
    youtube: { bg: "bg-red-500/15", text: "text-red-400" },
};

const tierBadge: Record<string, { bg: string; text: string; label: string }> = {
    top: { bg: "bg-[#CCFF00]/15", text: "text-[#CCFF00]", label: "Top" },
    high: { bg: "bg-[#9D8DF1]/15", text: "text-[#9D8DF1]", label: "High" },
    mid: { bg: "bg-[#F2F2F2]/10", text: "text-[#F2F2F2]/70", label: "Mid" },
    low: { bg: "bg-[#FF3E3E]/10", text: "text-[#FF3E3E]/70", label: "Low" },
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
            <div className="flex items-center justify-between px-6 py-4 border-b border-lens-border">
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleClearSearch}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-lens-muted hover:text-lens-text hover:bg-white/[0.04] transition-all"
                    >
                        <ArrowLeft size={16} />
                        <span>Back to feed</span>
                    </button>
                    <div className="h-5 w-px bg-lens-border" />
                    <div className="flex items-center gap-2">
                        <Search size={14} className="text-[#CCFF00]/50" />
                        <span className="text-sm text-lens-text">
                            &ldquo;{state.searchQuery}&rdquo;
                        </span>
                        <span className="text-[10px] text-[#CCFF00] bg-[#CCFF00]/10 px-2 py-0.5 rounded-full font-semibold">
                            {results.length} result{results.length !== 1 ? "s" : ""}
                        </span>
                    </div>
                </div>
                <button
                    onClick={handleClearSearch}
                    className="p-2 rounded-lg text-lens-muted hover:text-lens-text hover:bg-white/[0.04] transition-all"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                {results.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                        <Search size={40} className="text-lens-border" />
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
    const { dispatch, getActiveBrief } = useStore();
    const brief = getActiveBrief();
    const platform = platformColors[video.platform] || platformColors.meta;
    const tier = video.performanceTier ? tierBadge[video.performanceTier] : null;
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [isHovering, setIsHovering] = useState(false);

    const isLiked = brief?.likedVideoIds?.includes(video.id);
    const isInBrief = brief?.referenceVideoIds?.includes(video.id);

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

    const handleLike = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!brief) return;
        if (isLiked) {
            dispatch({ type: "UNLIKE_VIDEO", payload: { briefId: brief.id, videoId: video.id } });
        } else {
            dispatch({ type: "LIKE_VIDEO", payload: { briefId: brief.id, videoId: video.id } });
        }
    };

    const handleAddToBrief = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!brief) return;
        if (isInBrief) {
            dispatch({ type: "REMOVE_REFERENCE_VIDEO", payload: { briefId: brief.id, videoId: video.id } });
        } else {
            dispatch({ type: "ADD_REFERENCE_VIDEO", payload: { briefId: brief.id, videoId: video.id } });
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.35) }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="group relative flex flex-col rounded-xl overflow-hidden bg-lens-surface border border-lens-border hover:border-[#9D8DF1]/30 transition-all duration-300 hover:shadow-xl hover:shadow-black/30"
        >
            {/* Clickable video preview area */}
            <button
                onClick={onClick}
                className="relative aspect-[9/14] bg-lens-bg overflow-hidden w-full text-left"
            >
                {/* Actual video — plays on hover */}
                <video
                    ref={videoRef}
                    src={video.videoUrl}
                    muted
                    playsInline
                    preload="metadata"
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isHovering ? "opacity-100" : "opacity-0"}`}
                />

                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 z-10" />

                {/* Placeholder when not hovering */}
                <div className={`absolute inset-0 flex items-center justify-center bg-lens-card transition-opacity duration-300 ${isHovering ? "opacity-0" : "opacity-100"}`}>
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-11 h-11 rounded-full bg-[#CCFF00]/10 flex items-center justify-center border border-[#CCFF00]/20">
                            <Play size={18} className="text-[#CCFF00]/70 ml-0.5" />
                        </div>
                        <span className="text-[10px] text-lens-muted/50 font-medium">{video.duration}s</span>
                    </div>
                </div>

                {/* Play overlay on hover */}
                <div className={`absolute inset-0 z-20 flex items-center justify-center transition-opacity duration-200 ${isHovering ? "opacity-100" : "opacity-0"}`}>
                    <div className="w-12 h-12 rounded-full bg-[#CCFF00]/20 backdrop-blur-sm flex items-center justify-center border border-[#CCFF00]/30">
                        <Play size={20} className="text-white ml-0.5" fill="white" />
                    </div>
                </div>

                {/* Platform badge */}
                <div className={`absolute top-2.5 left-2.5 z-20 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider backdrop-blur-sm ${platform.bg} ${platform.text}`}>
                    {video.platform}
                </div>

                {/* Performance tier */}
                {tier && (
                    <div className={`absolute top-2.5 right-2.5 z-20 px-2 py-0.5 rounded-full text-[9px] font-semibold backdrop-blur-sm ${tier.bg} ${tier.text}`}>
                        {tier.label}
                    </div>
                )}

                {/* Title + Brand overlay — bottom */}
                <div className="absolute bottom-0 left-0 right-0 z-20 p-3">
                    <p className="text-white text-xs font-medium leading-snug line-clamp-2">{video.title}</p>
                    <p className="text-[#CCFF00]/80 text-[11px] font-semibold mt-0.5">{video.brand}</p>
                </div>
            </button>

            {/* Bottom bar with actions */}
            <div className="px-3 py-2 flex items-center gap-2 border-t border-lens-border bg-lens-surface">
                {/* Metrics */}
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    {video.spend && (
                        <div className="flex items-center gap-1">
                            <TrendingUp size={10} className="text-[#CCFF00]/40" />
                            <span className="text-[10px] text-lens-muted">{video.spend}</span>
                        </div>
                    )}
                    {video.impressions && (
                        <div className="flex items-center gap-1">
                            <Eye size={10} className="text-[#9D8DF1]/50" />
                            <span className="text-[10px] text-lens-muted">{video.impressions}</span>
                        </div>
                    )}
                    {video.ctr && (
                        <div className="flex items-center gap-1">
                            <MousePointerClick size={10} className="text-lens-muted/40" />
                            <span className="text-[10px] text-lens-muted">{video.ctr}</span>
                        </div>
                    )}
                </div>

                {/* Actions: Love + Add to brief */}
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={handleLike}
                        className={`p-1.5 rounded-md transition-all ${isLiked
                            ? "text-[#FF3E3E] bg-[#FF3E3E]/10"
                            : "text-lens-muted/40 hover:text-[#FF3E3E] hover:bg-[#FF3E3E]/5"}`}
                        title={isLiked ? "Unlike" : "Love this ad"}
                    >
                        <Heart size={13} fill={isLiked ? "currentColor" : "none"} />
                    </button>
                    <button
                        onClick={handleAddToBrief}
                        className={`p-1.5 rounded-md transition-all ${isInBrief
                            ? "text-[#CCFF00] bg-[#CCFF00]/10"
                            : "text-lens-muted/40 hover:text-[#CCFF00] hover:bg-[#CCFF00]/5"}`}
                        title={isInBrief ? "Remove from brief" : "Add to brief"}
                    >
                        <Plus size={13} className={isInBrief ? "rotate-45" : ""} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
