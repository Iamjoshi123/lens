"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { useStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import {
    Play,
    Volume2,
    VolumeX,
    Scissors,
    MessageSquareText,
    BookmarkPlus,
    ChevronUp,
    ChevronDown,
    Check,
    Heart,
    ThumbsDown,
    Eye,
    Grid2X2,
    ArrowLeft,
} from "lucide-react";

interface HeroPlayerProps {
    showBackToGrid?: boolean;
    onBackToGrid?: () => void;
}

export default function HeroPlayer({ showBackToGrid = false, onBackToGrid }: HeroPlayerProps) {
    const { state, dispatch, getActiveVideo, getActiveBrief, snipHook } = useStore();
    const video = getActiveVideo();
    const brief = getActiveBrief();

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showTranscript, setShowTranscript] = useState(false);
    const [snipFeedback, setSnipFeedback] = useState(false);
    const [addedFeedback, setAddedFeedback] = useState(false);
    const [transitioning, setTransitioning] = useState(false);
    const [transitionDir, setTransitionDir] = useState<"up" | "down">("down");

    // Video list: search results or all videos
    const videoList = state.searchResults.length > 0 ? state.searchResults : state.videos;
    const currentIndex = videoList.findIndex((v) => v.id === state.activeVideoId);
    const canGoUp = currentIndex > 0;
    const canGoDown = currentIndex < videoList.length - 1;

    const navigateTo = useCallback(
        (dir: "up" | "down") => {
            const nextIndex = dir === "down" ? currentIndex + 1 : currentIndex - 1;
            if (nextIndex < 0 || nextIndex >= videoList.length) return;
            setTransitioning(true);
            setTransitionDir(dir);
            // Pause current video
            if (videoRef.current) {
                videoRef.current.pause();
            }
            dispatch({ type: "SET_ACTIVE_VIDEO", payload: videoList[nextIndex].id });
            setTimeout(() => setTransitioning(false), 300);
        },
        [currentIndex, videoList, dispatch]
    );

    // Keyboard navigation
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (e.key === "ArrowDown" || e.key === "j") navigateTo("down");
            if (e.key === "ArrowUp" || e.key === "k") navigateTo("up");
            if (e.key === " ") {
                e.preventDefault();
                togglePlay();
            }
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [navigateTo]);

    // Wheel scroll for reel navigation
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        let scrollCooldown = false;
        const handleWheel = (e: WheelEvent) => {
            if (scrollCooldown) return;
            if (Math.abs(e.deltaY) < 40) return;
            scrollCooldown = true;
            if (e.deltaY > 0) navigateTo("down");
            else navigateTo("up");
            setTimeout(() => (scrollCooldown = false), 600);
        };
        el.addEventListener("wheel", handleWheel, { passive: true });
        return () => el.removeEventListener("wheel", handleWheel);
    }, [navigateTo]);

    // Ref callback — fires every time AnimatePresence re-mounts the <video>
    const videoRefCallback = useCallback(
        (el: HTMLVideoElement | null) => {
            videoRef.current = el;
            if (!el) return;

            // MUST set muted before play for autoplay policy
            el.muted = true;
            el.defaultMuted = true;

            // Force load the source
            el.load();

            const tryPlay = () => {
                el.muted = true;
                el.play()
                    .then(() => {
                        setIsPlaying(true);
                        setIsMuted(true);
                    })
                    .catch(() => {
                        setIsPlaying(false);
                    });
            };

            if (el.readyState >= 3) {
                tryPlay();
            } else {
                el.addEventListener("canplay", tryPlay, { once: true });
            }
        },
        []
    );

    const togglePlay = () => {
        const vid = videoRef.current;
        if (!vid) return;
        if (vid.paused) {
            vid.play();
            setIsPlaying(true);
        } else {
            vid.pause();
            setIsPlaying(false);
        }
    };

    const toggleMute = () => {
        const vid = videoRef.current;
        if (!vid) return;
        vid.muted = !vid.muted;
        setIsMuted(vid.muted);
    };

    const handleTimeUpdate = () => {
        const vid = videoRef.current;
        if (!vid) return;
        setCurrentTime(vid.currentTime);
    };

    const handleLoadedMetadata = () => {
        const vid = videoRef.current;
        if (!vid) return;
        setDuration(vid.duration);
    };

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const vid = videoRef.current;
        const bar = progressRef.current;
        if (!vid || !bar) return;
        const rect = bar.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const pct = y / rect.height;
        vid.currentTime = pct * vid.duration;
    };

    const handleSnip = () => {
        if (!video) return;
        snipHook(video.id);
        setSnipFeedback(true);
        setTimeout(() => setSnipFeedback(false), 1500);
    };

    const handleAddToBrief = () => {
        if (!video || !brief) return;
        dispatch({ type: "ADD_REFERENCE_VIDEO", payload: { briefId: brief.id, videoId: video.id } });
        setAddedFeedback(true);
        setTimeout(() => setAddedFeedback(false), 1500);
    };

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, "0")}`;
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    const currentTranscript = video?.transcript.filter((seg) => seg.time <= currentTime).pop();
    const isReferenced = brief?.referenceVideoIds.includes(video?.id || "");

    const platformColors: Record<string, string> = {
        meta: "bg-blue-500/30 text-blue-300",
        tiktok: "bg-pink-500/30 text-pink-300",
        youtube: "bg-red-500/30 text-red-300",
    };

    if (!video) {
        return (
            <div className="flex-1 flex items-center justify-center bg-lens-bg">
                <div className="text-center space-y-3">
                    <div className="w-16 h-16 rounded-full bg-lens-card flex items-center justify-center mx-auto">
                        <Play size={24} className="text-lens-muted ml-1" />
                    </div>
                    <p className="text-lens-muted text-sm">Search for ads above to start browsing</p>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="flex-1 flex items-center justify-center bg-black relative overflow-hidden"
        >
            {/* ===== BACK TO GRID BUTTON ===== */}
            {showBackToGrid && onBackToGrid && (
                <button
                    onClick={onBackToGrid}
                    className="absolute top-4 left-4 z-40 flex items-center gap-2 px-3 py-2 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 text-white/80 text-sm hover:bg-black/80 hover:text-white transition-all"
                >
                    <ArrowLeft size={14} />
                    <Grid2X2 size={14} />
                    <span>Results</span>
                </button>
            )}

            {/* ===== VERTICAL VIDEO (9:16) ===== */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={video.id}
                    initial={{
                        opacity: 0,
                        y: transitioning ? (transitionDir === "down" ? 60 : -60) : 0,
                    }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{
                        opacity: 0,
                        y: transitionDir === "down" ? -60 : 60,
                    }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="relative flex items-center justify-center"
                    style={{ height: "100%", maxHeight: "calc(100vh - 60px)" }}
                >
                    <div
                        className="relative rounded-xl overflow-hidden bg-black shadow-2xl shadow-black/50"
                        style={{
                            aspectRatio: "9/16",
                            height: "100%",
                            maxHeight: "calc(100vh - 80px)",
                        }}
                    >
                        <video
                            ref={videoRefCallback}
                            src={video.videoUrl}
                            className="w-full h-full object-cover"
                            onTimeUpdate={handleTimeUpdate}
                            onLoadedMetadata={handleLoadedMetadata}
                            onEnded={() => {
                                setIsPlaying(false);
                                if (canGoDown) {
                                    setTimeout(() => navigateTo("down"), 500);
                                }
                            }}
                            onClick={togglePlay}
                            playsInline
                            loop={false}
                        />

                        {/* Video info overlay (bottom) */}
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-4 pb-4 pt-16 pointer-events-none">
                            <div className="flex items-center gap-2 mb-1.5">
                                <span
                                    className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${platformColors[video.platform] || "bg-gray-500/30 text-gray-300"
                                        }`}
                                >
                                    {video.platform}
                                </span>
                                {video.spend && (
                                    <span className="text-[10px] text-lens-gold font-medium">
                                        ${video.spend}
                                    </span>
                                )}
                            </div>
                            <p className="text-white font-semibold text-sm leading-snug">{video.title}</p>
                            <p className="text-white/50 text-xs mt-0.5">{video.brand}</p>
                            {video.impressions && (
                                <div className="flex items-center gap-1 mt-1.5 text-white/40 text-[11px]">
                                    <Eye size={11} />
                                    <span>{video.impressions}</span>
                                </div>
                            )}
                        </div>

                        {/* Vertical progress bar (right edge inside video) */}
                        <div
                            ref={progressRef}
                            className="absolute right-0 top-0 bottom-0 w-1 cursor-pointer group/prog z-20"
                            onClick={handleProgressClick}
                        >
                            <div className="absolute inset-0 bg-white/10" />
                            {video.heatmapZones.map((zone, i) => (
                                <div
                                    key={i}
                                    className="absolute w-full opacity-60"
                                    style={{
                                        top: `${zone.start}%`,
                                        height: `${zone.end - zone.start}%`,
                                        backgroundColor:
                                            zone.type === "hook"
                                                ? "#F5A623"
                                                : zone.type === "proof"
                                                    ? "#3B82F6"
                                                    : "#EF4444",
                                    }}
                                    title={zone.label}
                                />
                            ))}
                            <div
                                className="absolute w-full bg-white/80 transition-all duration-100"
                                style={{ top: 0, height: `${progress}%` }}
                            />
                            <div
                                className="absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-lg transition-all duration-100 opacity-0 group-hover/prog:opacity-100"
                                style={{ top: `calc(${progress}% - 5px)` }}
                            />
                        </div>

                        {/* Ghost Script Overlay */}
                        <AnimatePresence>
                            {showTranscript && currentTranscript && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 8 }}
                                    className="absolute bottom-32 left-3 right-3 z-10"
                                >
                                    <div className="bg-black/70 backdrop-blur-md rounded-lg px-4 py-2.5 text-center">
                                        <p className="text-white text-sm font-medium leading-relaxed">
                                            {currentTranscript.text}
                                        </p>
                                        <p className="text-lens-gold/70 text-[10px] mt-1 font-mono">
                                            {formatTime(currentTranscript.time)}
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Center play icon */}
                        <AnimatePresence>
                            {!isPlaying && (
                                <motion.button
                                    initial={{ scale: 0.6, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.6, opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    onClick={togglePlay}
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center z-10"
                                >
                                    <Play size={28} className="text-white ml-1" />
                                </motion.button>
                            )}
                        </AnimatePresence>

                        {/* Time + mute (top-right inside video) */}
                        <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                            <span className="text-[11px] font-mono text-white/50 bg-black/40 backdrop-blur-sm px-2 py-1 rounded">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </span>
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                                className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white transition-colors"
                            >
                                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* ===== RIGHT ACTION BAR (TikTok-style) ===== */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 z-30">
                {/* Snip Hook — PRIMARY */}
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleSnip}
                    className="relative flex flex-col items-center gap-1 group"
                    title="Capture first 3s as a Hook"
                >
                    <div className="w-12 h-12 rounded-full bg-lens-gold flex items-center justify-center shadow-lg shadow-lens-gold/30 group-hover:shadow-lens-gold/50 transition-all group-active:scale-95">
                        <Scissors size={20} className="text-lens-bg" />
                    </div>
                    <span className="text-[10px] text-white/70 font-medium">Snip</span>
                </motion.button>

                {/* Save to Brief */}
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleAddToBrief}
                    className="relative flex flex-col items-center gap-1 group"
                    title="Add to creative brief"
                >
                    <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all group-active:scale-95 ${isReferenced
                            ? "bg-green-500/20 border border-green-500/40"
                            : "bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20"
                            }`}
                    >
                        {isReferenced ? (
                            <Check size={20} className="text-green-400" />
                        ) : (
                            <BookmarkPlus size={20} className="text-white" />
                        )}
                    </div>
                    <span className="text-[10px] text-white/70 font-medium">
                        {isReferenced ? "Saved" : "Save"}
                    </span>
                </motion.button>

                {/* Transcript */}
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowTranscript(!showTranscript)}
                    className="relative flex flex-col items-center gap-1 group"
                    title="Show AI transcript"
                >
                    <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all group-active:scale-95 ${showTranscript
                            ? "bg-lens-blue/30 border border-lens-blue/50"
                            : "bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20"
                            }`}
                    >
                        <MessageSquareText size={20} className={showTranscript ? "text-lens-blue" : "text-white"} />
                    </div>
                    <span className="text-[10px] text-white/70 font-medium">Script</span>
                </motion.button>

                {/* Like */}
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                        if (!video || !brief) return;
                        if (brief.likedVideoIds.includes(video.id)) {
                            dispatch({ type: "UNLIKE_VIDEO", payload: { briefId: brief.id, videoId: video.id } });
                        } else {
                            dispatch({ type: "LIKE_VIDEO", payload: { briefId: brief.id, videoId: video.id } });
                        }
                    }}
                    className="relative flex flex-col items-center gap-1 group"
                    title="Like this ad"
                >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all group-active:scale-95 ${brief?.likedVideoIds.includes(video?.id || "")
                        ? "bg-red-500/20 border border-red-500/40"
                        : "bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20"
                        }`}>
                        <Heart size={20} className={brief?.likedVideoIds.includes(video?.id || "") ? "text-red-400 fill-red-400" : "text-white"} />
                    </div>
                    <span className="text-[10px] text-white/70 font-medium">
                        {brief?.likedVideoIds.includes(video?.id || "") ? "Liked" : "Like"}
                    </span>
                </motion.button>

                {/* Dislike */}
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                        if (!video || !brief) return;
                        if (brief.dislikedVideoIds.includes(video.id)) {
                            dispatch({ type: "UNLIKE_VIDEO", payload: { briefId: brief.id, videoId: video.id } });
                        } else {
                            dispatch({ type: "DISLIKE_VIDEO", payload: { briefId: brief.id, videoId: video.id } });
                        }
                    }}
                    className="relative flex flex-col items-center gap-1 group"
                    title="Dislike this ad"
                >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all group-active:scale-95 ${brief?.dislikedVideoIds.includes(video?.id || "")
                        ? "bg-neutral-500/20 border border-neutral-500/40"
                        : "bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20"
                        }`}>
                        <ThumbsDown size={18} className={brief?.dislikedVideoIds.includes(video?.id || "") ? "text-neutral-400" : "text-white"} />
                    </div>
                    <span className="text-[10px] text-white/70 font-medium">Pass</span>
                </motion.button>

                {/* Divider */}
                <div className="w-px h-3 bg-white/10" />

                {/* Video position indicator */}
                <div className="text-[10px] text-white/30 font-mono">
                    {currentIndex + 1}/{videoList.length}
                </div>
            </div>

            {/* ===== NAV ARROWS (up/down, right edge bottom) ===== */}
            <div className="absolute right-6 bottom-6 flex flex-col gap-2 z-30">
                <button
                    onClick={() => navigateTo("up")}
                    disabled={!canGoUp}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${canGoUp
                        ? "bg-white/15 hover:bg-white/25 text-white"
                        : "bg-white/5 text-white/20 cursor-not-allowed"
                        }`}
                >
                    <ChevronUp size={20} />
                </button>
                <button
                    onClick={() => navigateTo("down")}
                    disabled={!canGoDown}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${canGoDown
                        ? "bg-white/15 hover:bg-white/25 text-white"
                        : "bg-white/5 text-white/20 cursor-not-allowed"
                        }`}
                >
                    <ChevronDown size={20} />
                </button>
            </div>

            {/* ===== HEATMAP LEGEND (bottom-left) ===== */}
            <div className="absolute bottom-6 left-6 flex items-center gap-3 z-10">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-sm bg-lens-hook" />
                    <span className="text-[9px] text-white/30 font-medium uppercase">Hook</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-sm bg-lens-proof" />
                    <span className="text-[9px] text-white/30 font-medium uppercase">Proof</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-sm bg-lens-cta" />
                    <span className="text-[9px] text-white/30 font-medium uppercase">CTA</span>
                </div>
            </div>

            {/* ===== SCROLL HINT (shows briefly) ===== */}
            <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ delay: 3, duration: 1 }}
                className="absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/30 z-10 pointer-events-none"
            >
                <ChevronDown size={20} className="animate-bounce" />
                <span className="text-[10px]">Scroll for next ad</span>
            </motion.div>

            {/* ===== SNIP FEEDBACK ===== */}
            <AnimatePresence>
                {snipFeedback && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
                    >
                        <div className="bg-lens-gold/20 border border-lens-gold/40 rounded-2xl px-8 py-4 backdrop-blur-lg">
                            <div className="flex items-center gap-3">
                                <Scissors size={24} className="text-lens-gold" />
                                <div>
                                    <p className="text-lens-gold font-semibold text-lg">Hook Snipped!</p>
                                    <p className="text-lens-gold/70 text-sm">First 3s saved to Hook Bank</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ===== SAVE FEEDBACK ===== */}
            <AnimatePresence>
                {addedFeedback && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
                    >
                        <div className="bg-green-500/20 border border-green-500/40 rounded-2xl px-8 py-4 backdrop-blur-lg">
                            <div className="flex items-center gap-3">
                                <BookmarkPlus size={24} className="text-green-400" />
                                <div>
                                    <p className="text-green-400 font-semibold text-lg">Added to Brief!</p>
                                    <p className="text-green-400/70 text-sm">Video saved as reference</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
