"use client";

import React, { useRef, useState, useCallback } from "react";
import { useStore } from "@/lib/store";
import { motion } from "framer-motion";
import {
    TrendingUp,
    MousePointerClick,
    Heart,
    Plus,
    Clapperboard,
    Search,
    X,
    Filter
} from "lucide-react";
import { VideoItem } from "@/lib/mockData";
import HlsVideo from "./HlsVideo";

// Luxury Theme Colors

// Overriding platform colors for Meta/TikTok to fit the "Luxury" vibe if I want, but let's keep them recognizable for now but subtle.
// Actually, let's try to unify them into the Gold/Navy scheme if we want true luxury.
// User said: "Brand: Gold/Navy". Let's use Navy for tags.


const tierBadge: Record<string, { bg: string; text: string; label: string }> = {
    top: { bg: "bg-lens-primary/20", text: "text-lens-primary-dark", label: "⚡ Top" }, // Gold
    high: { bg: "bg-lens-secondary/10", text: "text-lens-secondary", label: "High" }, // Navy
    mid: { bg: "bg-gray-100", text: "text-gray-500", label: "Mid" },
    low: { bg: "bg-red-50", text: "text-red-400", label: "Low" },
};

interface SearchGridProps {
    onSelectVideo: (videoId: string) => void;
    onClose: () => void;
}

export default function SearchGrid({ onSelectVideo }: SearchGridProps) {
    const { state, dispatch } = useStore();

    // If searching, show results. If not, show all videos (Feed).
    // The previous logic had "results" separate. Now we just show what needs to be shown.
    const results = state.searchResults.length > 0 ? state.searchResults : state.videos;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col h-full bg-lens-bg"
        >
            {/* Status Bar / Filter Row (Minimalist) */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-lens-border bg-white sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-heading font-medium text-lens-secondary">
                        {state.searchQuery ? `Results for "${state.searchQuery}"` : "Discover Ads"}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-lens-bg-subtle text-xs font-semibold text-lens-muted">
                        {results.length}
                    </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {state.searchQuery && (
                        <button
                            onClick={() => dispatch({ type: "CLEAR_SEARCH" })}
                            className="text-xs text-gray-400 hover:text-lens-secondary flex items-center gap-1 transition-colors"
                        >
                            <X size={14} /> Clear Search
                        </button>
                    )}
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-lens-border text-lens-muted text-xs hover:border-lens-primary hover:text-lens-primary transition-all">
                        <Filter size={14} />
                        <span>Filter</span>
                    </button>
                </div>
            </div>

            {/* Grid Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-lens-surface">
                {results.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                            <Search size={24} className="text-gray-400" />
                        </div>
                        <p className="text-lens-muted font-medium">No ads found</p>
                        <button
                            onClick={() => dispatch({ type: "CLEAR_SEARCH" })}
                            className="text-lens-primary text-sm hover:underline"
                        >
                            Clear filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
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
            if (vid.readyState === 0) vid.load();
            vid.currentTime = 0;
            vid.play().catch(() => { });
        }
    }, []);

    const handleMouseLeave = useCallback(() => {
        setIsHovering(false);
        const vid = videoRef.current;
        if (vid) {
            vid.pause();
            vid.currentTime = 0;
        }
        setVideoReady(false);
    }, []);

    const handleLike = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!brief) return;
        dispatch({ type: isLiked ? "UNLIKE_VIDEO" : "LIKE_VIDEO", payload: { briefId: brief.id, videoId: video.id } });
    };

    const handleAddToBrief = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!brief) return;
        dispatch({ type: isInBrief ? "REMOVE_REFERENCE_VIDEO" : "ADD_REFERENCE_VIDEO", payload: { briefId: brief.id, videoId: video.id } });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            className="group relative flex flex-col bg-white rounded-xl overflow-hidden cursor-pointer border border-transparent hover:border-lens-primary shadow-sm hover:shadow-card transition-all duration-300"
        >
            {/* Thumbnail/Video Container (4:3) */}
            <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                <HlsVideo
                    ref={videoRef}
                    src={video.videoUrl}
                    poster={video.thumbnail || undefined}
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onReady={() => setVideoReady(true)}
                />

                {/* Thumbnail Fallback */}
                {video.thumbnail && !imgError && !(isHovering && videoReady) && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                        src={video.thumbnail}
                        onError={() => setImgError(true)}
                        alt={video.title}
                        className="absolute inset-0 w-full h-full object-cover z-[1]"
                    />
                )}

                {/* Error Fallback */}
                {(!video.thumbnail || imgError) && !(isHovering && videoReady) && (
                    <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center bg-lens-secondary gap-2 p-4 text-center">
                        <Clapperboard size={24} className="text-lens-primary/50" />
                        <span className="text-[10px] text-white/50 font-medium uppercase tracking-wider">{video.brand}</span>
                    </div>
                )}

                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 z-[2]" />

                {/* Badges */}
                <div className="absolute top-2 left-2 z-[3] flex gap-1">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider backdrop-blur-md bg-white/90 text-lens-secondary`}>
                        {video.platform}
                    </span>
                    {tier && (
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider backdrop-blur-md bg-lens-primary text-lens-secondary shadow-sm`}>
                            {tier.label}
                        </span>
                    )}
                </div>

                {/* Hover Actions */}
                <div className={`absolute bottom-2 left-2 right-2 z-[4] flex items-center justify-between transition-opacity duration-200 ${isHovering ? "opacity-100" : "opacity-0"}`}>
                    <div className="flex gap-1">
                        <button onClick={handleLike} className={`p-1.5 rounded-full backdrop-blur-md transition-colors ${isLiked ? "bg-[#FF3E3E] text-white" : "bg-black/50 text-white hover:bg-black/70"}`}>
                            <Heart size={12} fill={isLiked ? "currentColor" : "none"} />
                        </button>
                        <button onClick={handleAddToBrief} className={`p-1.5 rounded-full backdrop-blur-md transition-colors ${isInBrief ? "bg-lens-primary text-lens-secondary" : "bg-black/50 text-white hover:bg-black/70"}`}>
                            <Plus size={12} className={isInBrief ? "rotate-45" : ""} />
                        </button>
                    </div>
                    <span className="text-[10px] font-mono text-white/90 bg-black/50 px-1.5 py-0.5 rounded backdrop-blur-md">
                        {video.duration}s
                    </span>
                </div>
            </div>

            {/* Info Section */}
            <div className="p-3 flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-lens-secondary leading-snug line-clamp-1 group-hover:text-lens-primary transition-colors">
                    {video.title}
                </h3>
                <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500 font-medium">{video.brand}</span>
                    <div className="flex items-center gap-3">
                        {video.spend && (
                            <span className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                                <TrendingUp size={10} /> {video.spend}
                            </span>
                        )}
                        {video.ctr && (
                            <span className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                                <MousePointerClick size={10} /> {video.ctr}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
