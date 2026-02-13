"use client";

import React, { useRef, useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import {
    Play,
    Volume2,
    VolumeX,
    Scissors,
    MessageSquareText,
    BookmarkPlus,
    Check,
    Heart,
    ThumbsDown,
    X,
    TrendingUp,
    MousePointerClick,
    Share2,
    Maximize2
} from "lucide-react";
import { VideoItem } from "@/lib/mockData";
import HlsVideo from "./HlsVideo";

interface VideoModalProps {
    video: VideoItem;
    onClose: () => void;
}

export default function VideoModal({ video, onClose }: VideoModalProps) {
    const { dispatch, getActiveBrief, snipHook } = useStore();
    const brief = getActiveBrief();

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const progressRef = useRef<HTMLDivElement>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showTranscript, setShowTranscript] = useState(false);
    const [snipFeedback, setSnipFeedback] = useState(false);
    const [addedFeedback, setAddedFeedback] = useState(false);

    // Initial play
    useEffect(() => {
        const vid = videoRef.current;
        if (vid) {
            vid.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        }
    }, []);

    // Keyboard controls
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === " " && !e.repeat) {
                e.preventDefault();
                togglePlay();
            }
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [onClose]);

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
        if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) setDuration(videoRef.current.duration);
    };

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const vid = videoRef.current;
        const bar = progressRef.current;
        if (!vid || !bar) return;
        const rect = bar.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pct = x / rect.width;
        vid.currentTime = pct * vid.duration;
    };

    const handleSnip = () => {
        snipHook(video.id);
        setSnipFeedback(true);
        setTimeout(() => setSnipFeedback(false), 2000);
    };

    const handleAddToBrief = () => {
        if (!brief) return;
        const isReferenced = brief.referenceVideoIds.includes(video.id);
        if (isReferenced) {
            dispatch({ type: "REMOVE_REFERENCE_VIDEO", payload: { briefId: brief.id, videoId: video.id } });
        } else {
            dispatch({ type: "ADD_REFERENCE_VIDEO", payload: { briefId: brief.id, videoId: video.id } });
            setAddedFeedback(true);
            setTimeout(() => setAddedFeedback(false), 2000);
        }
    };

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, "0")}`;
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    const isReferenced = brief?.referenceVideoIds.includes(video.id);
    const isLiked = brief?.likedVideoIds.includes(video.id);
    const isDisliked = brief?.dislikedVideoIds.includes(video.id);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#14213D]/60 backdrop-blur-md p-4 md:p-8"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[85vh] md:h-auto md:aspect-video"
            >
                {/* CLOSE BUTTON */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/10 hover:bg-black/20 text-[#14213D] transition-colors"
                >
                    <X size={20} />
                </button>

                {/* LEFT: VIDEO PLAYER (Taking up 65-70% of space) */}
                <div className="flex-1 bg-black relative group flex items-center justify-center">
                    <HlsVideo
                        ref={videoRef}
                        src={video.videoUrl}
                        className="w-full h-full max-h-[85vh] object-contain"
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        onClick={togglePlay}
                        playsInline
                    />

                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Play/Pause Center Trigger */}
                    {!isPlaying && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-20 h-20 rounded-full bg-lens-primary/90 flex items-center justify-center shadow-lg backdrop-blur-sm">
                                <Play size={32} className="text-[#14213D] ml-1 fill-[#14213D]" />
                            </div>
                        </div>
                    )}

                    {/* Bottom Controls */}
                    <div className="absolute bottom-0 inset-x-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {/* Progress Bar */}
                        <div
                            ref={progressRef}
                            className="relative h-1.5 bg-white/20 rounded-full cursor-pointer mb-4 group/bar"
                            onClick={handleProgressClick}
                        >
                            {/* Heatmap Zones */}
                            {video.heatmapZones.map((zone, i) => (
                                <div
                                    key={i}
                                    className="absolute h-full opacity-50 hover:opacity-100 transition-opacity"
                                    style={{
                                        left: `${zone.start}%`,
                                        width: `${zone.end - zone.start}%`,
                                        backgroundColor: zone.type === 'hook' ? '#FCA311' : zone.type === 'proof' ? '#14213D' : '#FF3E3E'
                                    }}
                                />
                            ))}
                            <div
                                className="absolute h-full bg-lens-primary rounded-full"
                                style={{ width: `${progress}%` }}
                            />
                            <div
                                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md scale-0 group-hover/bar:scale-100 transition-transform"
                                style={{ left: `${progress}%` }}
                            />
                        </div>

                        <div className="flex items-center justify-between text-white">
                            <div className="flex items-center gap-4">
                                <button onClick={togglePlay} className="hover:text-lens-primary transition-colors">
                                    {isPlaying ? <span className="font-bold text-xs uppercase tracking-widest">Pause</span> : <Play size={20} fill="currentColor" />}
                                </button>
                                <div className="flex items-center gap-2 group/vol">
                                    <button onClick={toggleMute} className="hover:text-lens-primary transition-colors">
                                        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                                    </button>
                                </div>
                                <span className="text-xs font-mono opacity-70">
                                    {formatTime(currentTime)} / {formatTime(duration)}
                                </span>
                            </div>

                            <button className="hover:text-lens-primary transition-colors">
                                <Maximize2 size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* RIGHT: INFO & ACTIONS (30-35% of space, White bg) */}
                <div className="w-full md:w-[400px] bg-white border-l border-[#E5E5E5] flex flex-col">
                    {/* Header Info */}
                    <div className="p-6 border-b border-lens-border">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-lens-primary/10 text-lens-primary font-bold uppercase tracking-wider">
                                {video.platform}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-lens-secondary/10 text-lens-secondary font-bold uppercase tracking-wider">
                                {video.performanceTier}
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold font-heading text-lens-secondary leading-tight mb-1">
                            {video.title}
                        </h2>
                        <p className="text-sm text-gray-500 font-medium">{video.brand}</p>

                        <div className="flex items-center gap-6 mt-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Spend</span>
                                <div className="flex items-center gap-1.5 text-lens-secondary font-bold">
                                    <TrendingUp size={14} className="text-lens-primary" />
                                    {video.spend || "N/A"}
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">CTR</span>
                                <div className="flex items-center gap-1.5 text-lens-secondary font-bold">
                                    <MousePointerClick size={14} className="text-lens-primary" />
                                    {video.ctr || "N/A"}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions Grid - The "Then and There" controls */}
                    <div className="p-6 grid grid-cols-2 gap-3">
                        <button
                            onClick={handleSnip}
                            className="col-span-2 flex items-center justify-center gap-2 py-3 bg-lens-secondary text-white rounded-lg hover:bg-[#0A1120] transition-all shadow-lg active:scale-[0.98]"
                        >
                            <Scissors size={18} className="text-lens-primary" />
                            <span className="font-medium">Snip Hook (3s)</span>
                        </button>

                        <button
                            onClick={handleAddToBrief}
                            className={`flex items-center justify-center gap-2 py-3 rounded-lg border transition-all active:scale-[0.98] ${isReferenced
                                ? "bg-lens-primary/10 border-lens-primary text-lens-primary"
                                : "border-gray-200 text-lens-secondary hover:border-lens-primary hover:text-lens-primary"
                                }`}
                        >
                            {isReferenced ? <Check size={18} /> : <BookmarkPlus size={18} />}
                            <span className="font-medium font-body text-sm">{isReferenced ? "Saved" : "Add to Brief"}</span>
                        </button>

                        <button
                            onClick={() => setShowTranscript(!showTranscript)}
                            className={`flex items-center justify-center gap-2 py-3 rounded-lg border transition-all active:scale-[0.98] ${showTranscript
                                ? "bg-lens-primary/10 border-lens-primary text-lens-primary"
                                : "border-gray-200 text-lens-secondary hover:border-lens-primary hover:text-lens-primary"
                                }`}
                        >
                            <MessageSquareText size={18} />
                            <span className="font-medium font-body text-sm">Transcript</span>
                        </button>

                        <div className="col-span-2 flex gap-2 mt-2">
                            <button
                                onClick={() => dispatch({ type: brief?.likedVideoIds.includes(video.id) ? "UNLIKE_VIDEO" : "LIKE_VIDEO", payload: { briefId: brief?.id || "", videoId: video.id } })}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border transition-colors ${isLiked ? "bg-[#FF3E3E]/10 border-[#FF3E3E] text-[#FF3E3E]" : "border-gray-100 text-gray-400 hover:border-gray-300 hover:text-gray-600"
                                    }`}
                            >
                                <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                            </button>
                            <button
                                onClick={() => dispatch({ type: brief?.dislikedVideoIds.includes(video.id) ? "UNLIKE_VIDEO" : "DISLIKE_VIDEO", payload: { briefId: brief?.id || "", videoId: video.id } })}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border transition-colors ${isDisliked ? "bg-gray-800 text-white border-gray-800" : "border-gray-100 text-gray-400 hover:border-gray-300 hover:text-gray-600"
                                    }`}
                            >
                                <ThumbsDown size={18} />
                            </button>
                            <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-gray-100 text-gray-400 hover:border-gray-300 hover:text-gray-600 transition-colors">
                                <Share2 size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Transcript / Content Area */}
                    <div className="flex-1 overflow-y-auto px-6 pb-6 border-t border-lens-border">
                        {showTranscript ? (
                            <div className="pt-4 space-y-4">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-lens-primary">Transcript</h3>
                                <div className="space-y-3">
                                    {video.transcript.map((seg, i) => (
                                        <div
                                            key={i}
                                            className={`p-3 rounded-lg text-sm leading-relaxed transition-colors ${currentTime >= seg.time && currentTime < (video.transcript[i + 1]?.time || duration)
                                                ? "bg-lens-primary/10 text-lens-secondary border border-lens-primary/20"
                                                : "text-gray-500 hover:bg-gray-50"
                                                }`}
                                            onClick={() => { if (videoRef.current) videoRef.current.currentTime = seg.time }}
                                        >
                                            <span className="text-xs font-mono text-gray-400 mb-1 block">{formatTime(seg.time)}</span>
                                            {seg.text}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="pt-4 flex flex-col gap-4 text-center items-center justify-center h-full text-gray-400">
                                <MessageSquareText size={32} className="opacity-20" />
                                <p className="text-sm">Select &ldquo;Transcript&rdquo; to view the script breakdown.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Feedback Toasts (Absolute to modal) */}
                <AnimatePresence>
                    {(snipFeedback || addedFeedback) && (
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 20, opacity: 0 }}
                            className="absolute bottom-6 left-1/2 -translate-x-1/2 md:left-6 md:translate-x-0 bg-lens-secondary text-white px-4 py-2 rounded-lg shadow-xl flex items-center gap-2 z-50"
                        >
                            <Check size={16} className="text-lens-primary" />
                            <span className="text-sm font-medium">{snipFeedback ? "Hook Snipped!" : "Added to Brief"}</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
}
