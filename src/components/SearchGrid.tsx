"use client";

import React, { useRef, useState, useCallback } from "react";
import { useStore } from "@/lib/store";
import { motion } from "framer-motion";
import {
    Play,
    ArrowLeft,
    TrendingUp,
    MousePointerClick,
    X,
    Search,
    Heart,
    Plus,
    Clapperboard,
} from "lucide-react";
import { VideoItem } from "@/lib/mockData";

const platformColors: Record<string, { bg: string; text: string }> = {
    meta: { bg: "bg-[#9D8DF1]/15", text: "text-[#9D8DF1]" },
    tiktok: { bg: "bg-[#FF3E3E]/15", text: "text-[#FF3E3E]" },
    youtube: { bg: "bg-red-500/15", text: "text-red-400" },
};

const tierBadge: Record<string, { bg: string; text: string; label: string }> = {
    top: { bg: "bg-[#CCFF00]/15", text: "text-[#CCFF00]", label: "⚡ Top" },
    high: { bg: "bg-[#9D8DF1]/15", text: "text-[#9D8DF1]", label: "High" },
    mid: { bg: "bg-white/10", text: "text-current opacity-50", label: "Mid" },
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
            className="absolute inset-0 z-30 bg-[var(--background)] flex flex-col"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleClearSearch}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card)] transition-all"
                    >
                        <ArrowLeft size={14} />
                        <span>Feed</span>
                    </button>
                    <div className="h-4 w-px bg-[var(--border)]" />
                    <div className="flex items-center gap-2">
                        <Search size={12} className="text-[#CCFF00]/60" />
                        <span className="text-xs text-[var(--foreground)] font-medium">
                            &ldquo;{state.searchQuery}&rdquo;
                        </span>
                        <span className="text-[9px] text-[#CCFF00] bg-[#CCFF00]/10 px-1.5 py-0.5 rounded-full font-bold">
                            {results.length}
                        </span>
                    </div>
                </div>
                <button
                    onClick={handleClearSearch}
                    className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card)] transition-all"
                >
                    <X size={16} />
                </button>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                {results.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                        <Search size={32} className="text-[var(--border)]" />
                        <p className="text-[var(--muted)] text-sm">
                            No ads found for &ldquo;{state.searchQuery}&rdquo;
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
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
    const [videoReady, setVideoReady] = useState(false);
    const [imgError, setImgError] = useState(false);

    const isLiked = brief?.likedVideoIds?.includes(video.id);
    const isInBrief = brief?.referenceVideoIds?.includes(video.id);

    const handleMouseEnter = useCallback(() => {
        setIsHovering(true);
        const vid = videoRef.current;
        if (vid) {
            // Load the video if not loaded yet
            if (vid.readyState === 0) {
                vid.load();
            }
            vid.currentTime = 0;
            vid.play().catch(() => { });
        }
    }, []);

    const handleMouseLeave = useCallback(() => {
        setIsHovering(false);
        setVideoReady(false);
        const vid = videoRef.current;
        if (vid) {
            vid.pause();
            vid.currentTime = 0;
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
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="group relative flex flex-col rounded-lg overflow-hidden bg-[var(--card)] border border-[var(--border)] hover:border-[#9D8DF1]/30 transition-all duration-200 hover:shadow-lg cursor-pointer"
            onClick={onClick}
        >
            {/* Thumbnail / Video area — compact 4:3 landscape */}
            <div className="relative aspect-[4/3] overflow-hidden bg-neutral-900">
                {/* Video element — uses poster for thumbnail, plays on hover */}
                <video
                    ref={videoRef}
                    src={video.videoUrl}
                    poster={video.thumbnail || undefined}
                    muted
                    playsInline
                    preload="metadata"
                    onCanPlay={() => setVideoReady(true)}
                    className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Thumbnail image fallback */}
                {video.thumbnail && !imgError && !(isHovering && videoReady) && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                        src={video.thumbnail}
                        alt={video.title}
                        onError={() => setImgError(true)}
                        className="absolute inset-0 w-full h-full object-cover z-[1]"
                    />
                )}

                {/* Fallback placeholder if image error or missing */}
                {(!video.thumbnail || imgError) && !(isHovering && videoReady) && (
                    <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center bg-[#1A1A1A] gap-2 p-4 text-center">
                        <Clapperboard size={24} className="text-[#CCFF00]/40" />
                        <span className="text-[10px] text-[var(--muted)] font-medium uppercase tracking-wider">
                            {video.brand}
                        </span>
                    </div>
                )}

                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 z-[2]" />

                {/* Play icon — shows on hover if video isn't ready yet */}
                {isHovering && !videoReady && (
                    <div className="absolute inset-0 z-[3] flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center animate-pulse">
                            <Play size={12} className="text-white ml-0.5" fill="white" />
                        </div>
                    </div>
                )}

                {/* Platform badge */}
                <div className={`absolute top-1.5 left-1.5 z-[4] px-1.5 py-px rounded text-[8px] font-bold uppercase tracking-wider backdrop-blur-sm ${platform.bg} ${platform.text}`}>
                    {video.platform}
                </div>

                {/* Tier */}
                {tier && (
                    <div className={`absolute top-1.5 right-1.5 z-[4] px-1.5 py-px rounded text-[8px] font-semibold backdrop-blur-sm ${tier.bg} ${tier.text}`}>
                        {tier.label}
                    </div>
                )}

                {/* Duration badge */}
                <div className="absolute bottom-1.5 right-1.5 z-[4] px-1.5 py-px rounded bg-black/60 text-[9px] text-white/80 font-mono backdrop-blur-sm">
                    {video.duration}s
                </div>

                {/* Quick action buttons on hover */}
                <div className={`absolute bottom-1.5 left-1.5 z-[4] flex items-center gap-1 transition-opacity duration-150 ${isHovering ? "opacity-100" : "opacity-0"}`}>
                    <button
                        onClick={handleLike}
                        className={`p-1 rounded backdrop-blur-sm transition-all ${isLiked
                            ? "text-[#FF3E3E] bg-[#FF3E3E]/20"
                            : "text-white/70 bg-black/40 hover:text-[#FF3E3E]"}`}
                        title={isLiked ? "Unlike" : "Love"}
                    >
                        <Heart size={11} fill={isLiked ? "currentColor" : "none"} />
                    </button>
                    <button
                        onClick={handleAddToBrief}
                        className={`p-1 rounded backdrop-blur-sm transition-all ${isInBrief
                            ? "text-[#CCFF00] bg-[#CCFF00]/20"
                            : "text-white/70 bg-black/40 hover:text-[#CCFF00]"}`}
                        title={isInBrief ? "Remove from brief" : "Add to brief"}
                    >
                        <Plus size={11} className={isInBrief ? "rotate-45" : ""} />
                    </button>
                </div>
            </div>

            {/* Card info — compact text below thumbnail */}
            <div className="px-2.5 py-2 flex flex-col gap-0.5">
                <p className="text-[11px] font-medium text-[var(--foreground)] leading-tight line-clamp-1">{video.title}</p>
                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#CCFF00] font-semibold">{video.brand}</span>
                    <div className="flex items-center gap-2">
                        {video.spend && (
                            <span className="flex items-center gap-0.5 text-[9px] text-[var(--muted)]">
                                <TrendingUp size={8} /> {video.spend}
                            </span>
                        )}
                        {video.ctr && (
                            <span className="flex items-center gap-0.5 text-[9px] text-[var(--muted)]">
                                <MousePointerClick size={8} /> {video.ctr}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
