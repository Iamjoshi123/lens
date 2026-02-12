"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
    PenLine,
    Eye,
    Scissors,
    Plus,
    FileText,
    Tag,
    Clapperboard,
    ChevronDown,
    Trash2,
    BarChart3,
    Zap,
    Play,
    Heart,
    ThumbsDown,
    Archive,
    UserPlus,
    Users,
    X,
} from "lucide-react";

const tierColors: Record<string, { bg: string; text: string; label: string }> = {
    top: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Top" },
    high: { bg: "bg-sky-500/10", text: "text-sky-400", label: "High" },
    mid: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Mid" },
    low: { bg: "bg-neutral-500/10", text: "text-neutral-400", label: "Low" },
};

export default function BriefSidebar() {
    const { state, dispatch, getActiveBrief, getActiveVideo, createNewBrief } = useStore();
    const brief = getActiveBrief();
    const currentVideo = getActiveVideo();

    const [isPreview, setIsPreview] = useState(false);
    const [showNewBrief, setShowNewBrief] = useState(false);
    const [newBriefTitle, setNewBriefTitle] = useState("");
    const [newBriefCampaign, setNewBriefCampaign] = useState("");
    const [showBriefSelect, setShowBriefSelect] = useState(false);
    const [showAddCollab, setShowAddCollab] = useState(false);
    const [collabName, setCollabName] = useState("");
    const [collabEmail, setCollabEmail] = useState("");
    const [showArchived, setShowArchived] = useState(false);

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (brief) {
            dispatch({
                type: "UPDATE_BRIEF_CONTENT",
                payload: { briefId: brief.id, content: e.target.value },
            });
        }
    };

    const handleCreateBrief = () => {
        if (newBriefTitle.trim()) {
            createNewBrief(newBriefTitle.trim(), newBriefCampaign.trim() || "Untitled Campaign");
            setNewBriefTitle("");
            setNewBriefCampaign("");
            setShowNewBrief(false);
        }
    };

    const handleRemoveHook = (hookId: string) => {
        if (brief) {
            dispatch({ type: "REMOVE_HOOK", payload: { briefId: brief.id, hookId } });
        }
    };

    const handleAddCollaborator = () => {
        if (!brief || !collabName.trim() || !collabEmail.trim()) return;
        const initials = collabName
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
        const colors = ["#e8a838", "#5090f0", "#40c070", "#e06060", "#a080e0"];
        const color = colors[brief.collaborators.length % colors.length];
        dispatch({
            type: "ADD_COLLABORATOR",
            payload: {
                briefId: brief.id,
                collaborator: {
                    id: `u-${Date.now()}`,
                    name: collabName.trim(),
                    email: collabEmail.trim(),
                    initials,
                    color,
                },
            },
        });
        setCollabName("");
        setCollabEmail("");
        setShowAddCollab(false);
    };

    // Separate active and archived briefs
    const activeBriefs = state.briefs.filter((b) => !b.archived);
    const archivedBriefs = state.briefs.filter((b) => b.archived);

    // Referenced videos with performance data
    const referencedVideos = brief
        ? state.videos.filter((v) => brief.referenceVideoIds.includes(v.id))
        : [];

    // Liked / disliked videos
    const likedVideos = brief
        ? state.videos.filter((v) => brief.likedVideoIds.includes(v.id))
        : [];
    const dislikedVideos = brief
        ? state.videos.filter((v) => brief.dislikedVideoIds.includes(v.id))
        : [];

    return (
        <AnimatePresence>
            {state.sidebarOpen && (
                <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 380, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="h-full border-l border-lens-border/50 bg-lens-surface flex flex-col overflow-hidden"
                >
                    {/* ===== BRIEF SELECTOR ===== */}
                    <div className="p-3 border-b border-lens-border/50">
                        <div className="relative">
                            <button
                                onClick={() => setShowBriefSelect(!showBriefSelect)}
                                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-lens-card border border-lens-border/50 hover:border-white/10 transition-all text-left"
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <FileText size={14} className="text-lens-muted shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-sm text-lens-text font-medium truncate">
                                            {brief?.title || "Select a Brief"}
                                        </p>
                                        {brief && (
                                            <p className="text-[11px] text-lens-muted truncate">{brief.campaign}</p>
                                        )}
                                    </div>
                                </div>
                                <ChevronDown
                                    size={14}
                                    className={`text-lens-muted transition-transform ${showBriefSelect ? "rotate-180" : ""}`}
                                />
                            </button>

                            <AnimatePresence>
                                {showBriefSelect && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        className="absolute top-full left-0 right-0 mt-1 bg-lens-card border border-lens-border rounded-lg shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto custom-scrollbar"
                                    >
                                        {/* Active briefs */}
                                        {activeBriefs.map((b) => (
                                            <button
                                                key={b.id}
                                                onClick={() => {
                                                    dispatch({ type: "SET_ACTIVE_BRIEF", payload: b.id });
                                                    setShowBriefSelect(false);
                                                }}
                                                className={`w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-white/[0.03] transition-colors ${b.id === state.activeBriefId
                                                        ? "bg-white/[0.04] border-l-2 border-lens-text"
                                                        : ""
                                                    }`}
                                            >
                                                <FileText
                                                    size={13}
                                                    className={b.id === state.activeBriefId ? "text-lens-text" : "text-lens-muted"}
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm text-lens-text truncate">{b.title}</p>
                                                    <p className="text-[11px] text-lens-muted">{b.angle || b.campaign}</p>
                                                </div>
                                                {/* Collaborator dots */}
                                                <div className="flex -space-x-1">
                                                    {b.collaborators.slice(0, 3).map((c) => (
                                                        <div
                                                            key={c.id}
                                                            className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white border border-lens-card"
                                                            style={{ backgroundColor: c.color }}
                                                            title={c.name}
                                                        >
                                                            {c.initials}
                                                        </div>
                                                    ))}
                                                </div>
                                            </button>
                                        ))}

                                        {/* Archived briefs toggle */}
                                        {archivedBriefs.length > 0 && (
                                            <>
                                                <button
                                                    onClick={() => setShowArchived(!showArchived)}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/[0.03] transition-colors border-t border-lens-border/30"
                                                >
                                                    <Archive size={12} className="text-lens-muted/50" />
                                                    <span className="text-[11px] text-lens-muted/50">
                                                        Archived ({archivedBriefs.length})
                                                    </span>
                                                    <ChevronDown
                                                        size={11}
                                                        className={`text-lens-muted/40 ml-auto transition-transform ${showArchived ? "rotate-180" : ""}`}
                                                    />
                                                </button>
                                                {showArchived &&
                                                    archivedBriefs.map((b) => (
                                                        <div
                                                            key={b.id}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-left opacity-50"
                                                        >
                                                            <FileText size={13} className="text-lens-muted/50" />
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-sm text-lens-muted truncate">{b.title}</p>
                                                            </div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    dispatch({ type: "UNARCHIVE_BRIEF", payload: b.id });
                                                                }}
                                                                className="text-[10px] text-lens-muted hover:text-lens-text px-1.5 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
                                                            >
                                                                Restore
                                                            </button>
                                                        </div>
                                                    ))}
                                            </>
                                        )}

                                        {/* New brief button */}
                                        <button
                                            onClick={() => {
                                                setShowBriefSelect(false);
                                                setShowNewBrief(true);
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-white/[0.03] transition-colors border-t border-lens-border/50"
                                        >
                                            <Plus size={13} className="text-lens-muted" />
                                            <span className="text-sm text-lens-muted">New Brief</span>
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* ===== NEW BRIEF FORM ===== */}
                    <AnimatePresence>
                        {showNewBrief && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-b border-lens-border/50 overflow-hidden"
                            >
                                <div className="p-3 space-y-2">
                                    <input
                                        type="text"
                                        value={newBriefTitle}
                                        onChange={(e) => setNewBriefTitle(e.target.value)}
                                        placeholder="Brief title..."
                                        className="w-full px-3 py-2 rounded-lg bg-lens-bg border border-lens-border/50 text-lens-text text-sm placeholder:text-lens-muted/40 focus:border-white/15 transition-colors outline-none"
                                        autoFocus
                                    />
                                    <input
                                        type="text"
                                        value={newBriefCampaign}
                                        onChange={(e) => setNewBriefCampaign(e.target.value)}
                                        placeholder="Campaign name..."
                                        className="w-full px-3 py-2 rounded-lg bg-lens-bg border border-lens-border/50 text-lens-text text-sm placeholder:text-lens-muted/40 focus:border-white/15 transition-colors outline-none"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleCreateBrief}
                                            className="flex-1 py-2 rounded-lg bg-white/[0.06] text-lens-text text-sm font-medium hover:bg-white/[0.1] transition-colors"
                                        >
                                            Create
                                        </button>
                                        <button
                                            onClick={() => setShowNewBrief(false)}
                                            className="px-3 py-2 rounded-lg bg-lens-card text-lens-muted text-sm hover:text-lens-text transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ===== SCROLLABLE CONTENT ===== */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {brief ? (
                            <>
                                {/* -- COLLABORATORS -- */}
                                <div className="px-3 py-2.5 border-b border-lens-border/30">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-1.5">
                                            <Users size={12} className="text-lens-muted/50" />
                                            <span className="text-[10px] text-lens-muted/50 font-medium uppercase tracking-wider">
                                                Team
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => setShowAddCollab(!showAddCollab)}
                                            className="flex items-center gap-1 text-[10px] text-lens-muted/50 hover:text-lens-text px-1.5 py-0.5 rounded hover:bg-white/[0.04] transition-all"
                                        >
                                            <UserPlus size={10} />
                                            <span>Invite</span>
                                        </button>
                                    </div>

                                    {/* Collaborator avatars */}
                                    <div className="flex items-center gap-1.5">
                                        {brief.collaborators.map((c) => (
                                            <div
                                                key={c.id}
                                                className="group relative flex items-center"
                                            >
                                                <div
                                                    className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-semibold text-white cursor-default"
                                                    style={{ backgroundColor: c.color }}
                                                    title={`${c.name} (${c.email})`}
                                                >
                                                    {c.initials}
                                                </div>
                                                {c.id !== "u1" && (
                                                    <button
                                                        onClick={() =>
                                                            dispatch({
                                                                type: "REMOVE_COLLABORATOR",
                                                                payload: { briefId: brief.id, collaboratorId: c.id },
                                                            })
                                                        }
                                                        className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-lens-bg border border-lens-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X size={7} className="text-lens-muted" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        {brief.collaborators.length === 1 && (
                                            <span className="text-[10px] text-lens-muted/30 ml-1">
                                                Only you — invite others to collaborate
                                            </span>
                                        )}
                                    </div>

                                    {/* Add collaborator form */}
                                    <AnimatePresence>
                                        {showAddCollab && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden mt-2"
                                            >
                                                <div className="flex gap-1.5">
                                                    <input
                                                        type="text"
                                                        value={collabName}
                                                        onChange={(e) => setCollabName(e.target.value)}
                                                        placeholder="Name"
                                                        className="flex-1 px-2 py-1.5 rounded bg-lens-bg border border-lens-border/50 text-lens-text text-[11px] placeholder:text-lens-muted/30 outline-none focus:border-white/15 transition-colors"
                                                        autoFocus
                                                    />
                                                    <input
                                                        type="email"
                                                        value={collabEmail}
                                                        onChange={(e) => setCollabEmail(e.target.value)}
                                                        placeholder="Email"
                                                        className="flex-1 px-2 py-1.5 rounded bg-lens-bg border border-lens-border/50 text-lens-text text-[11px] placeholder:text-lens-muted/30 outline-none focus:border-white/15 transition-colors"
                                                    />
                                                    <button
                                                        onClick={handleAddCollaborator}
                                                        className="px-2.5 py-1.5 rounded bg-white/[0.06] text-lens-text text-[11px] font-medium hover:bg-white/[0.1] transition-colors"
                                                    >
                                                        Add
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* -- CURRENT AD PERFORMANCE -- */}
                                {currentVideo && (
                                    <div className="p-3 border-b border-lens-border/30">
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <BarChart3 size={12} className="text-lens-muted/50" />
                                            <span className="text-[10px] text-lens-muted/50 font-medium uppercase tracking-wider">
                                                Current Ad
                                            </span>
                                        </div>
                                        <div className="rounded-lg bg-lens-card/50 border border-lens-border/30 p-2.5">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-[11px] text-lens-text font-medium truncate flex-1 pr-2">
                                                    {currentVideo.title}
                                                </p>
                                                {currentVideo.performanceTier && (
                                                    <span
                                                        className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${tierColors[currentVideo.performanceTier].bg
                                                            } ${tierColors[currentVideo.performanceTier].text}`}
                                                    >
                                                        {tierColors[currentVideo.performanceTier].label}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-4 gap-2">
                                                <div>
                                                    <p className="text-[9px] text-lens-muted/40">Spend</p>
                                                    <p className="text-[11px] text-lens-text font-semibold">{currentVideo.spend || "—"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] text-lens-muted/40">Impr.</p>
                                                    <p className="text-[11px] text-lens-text font-semibold">{currentVideo.impressions || "—"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] text-lens-muted/40">CTR</p>
                                                    <p className="text-[11px] text-lens-text font-semibold">{currentVideo.ctr || "—"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] text-lens-muted/40">Hook %</p>
                                                    <p className="text-[11px] text-lens-text font-semibold">{currentVideo.hookRate || "—"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* -- LIKED / PASSED ADS -- */}
                                {(likedVideos.length > 0 || dislikedVideos.length > 0) && (
                                    <div className="p-3 border-b border-lens-border/30">
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <Heart size={12} className="text-lens-muted/50" />
                                            <span className="text-[10px] text-lens-muted/50 font-medium uppercase tracking-wider">
                                                Reactions
                                            </span>
                                            <span className="text-[10px] text-lens-muted/30 ml-auto">
                                                {likedVideos.length} liked · {dislikedVideos.length} passed
                                            </span>
                                        </div>
                                        {likedVideos.length > 0 && (
                                            <div className="space-y-1 mb-2">
                                                {likedVideos.map((vid) => (
                                                    <div
                                                        key={vid.id}
                                                        onClick={() => dispatch({ type: "SET_ACTIVE_VIDEO", payload: vid.id })}
                                                        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/[0.03] cursor-pointer transition-colors group"
                                                    >
                                                        <Heart size={10} className="text-red-400/60 fill-red-400/60 shrink-0" />
                                                        <p className="text-[11px] text-lens-text truncate flex-1">{vid.title}</p>
                                                        <span className="text-[9px] text-lens-muted/30">{vid.impressions}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {dislikedVideos.length > 0 && (
                                            <div className="space-y-1">
                                                {dislikedVideos.map((vid) => (
                                                    <div
                                                        key={vid.id}
                                                        onClick={() => dispatch({ type: "SET_ACTIVE_VIDEO", payload: vid.id })}
                                                        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/[0.03] cursor-pointer transition-colors group opacity-50"
                                                    >
                                                        <ThumbsDown size={10} className="text-neutral-400/60 shrink-0" />
                                                        <p className="text-[11px] text-lens-muted truncate flex-1 line-through">{vid.title}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* -- HOOK BANK -- */}
                                <div className="p-3 border-b border-lens-border/30">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-1.5">
                                            <Scissors size={12} className="text-lens-muted/50" />
                                            <span className="text-[10px] text-lens-muted/50 font-medium uppercase tracking-wider">
                                                Hook Bank
                                            </span>
                                            {brief.hooks.length > 0 && (
                                                <span className="min-w-[16px] h-[16px] rounded-full bg-white/[0.08] text-lens-text text-[9px] font-semibold flex items-center justify-center">
                                                    {brief.hooks.length}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {brief.hooks.length === 0 ? (
                                        <div className="text-center py-3 rounded-lg border border-dashed border-lens-border/20">
                                            <p className="text-[10px] text-lens-muted/30">
                                                Snip hooks from ads to collect them here
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            {brief.hooks.map((hook) => (
                                                <div
                                                    key={hook.id}
                                                    className="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/[0.03] transition-colors"
                                                >
                                                    <div className="w-6 h-6 rounded bg-white/[0.04] flex items-center justify-center shrink-0">
                                                        <Play size={8} className="text-lens-muted ml-0.5" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[11px] text-lens-text truncate">{hook.videoTitle}</p>
                                                        <p className="text-[9px] text-lens-muted/40 font-mono">{hook.timestamp}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveHook(hook.id)}
                                                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-lens-muted hover:text-red-400 transition-all"
                                                    >
                                                        <Trash2 size={10} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* -- SAVED REFERENCES -- */}
                                {referencedVideos.length > 0 && (
                                    <div className="p-3 border-b border-lens-border/30">
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <span className="text-[10px] text-lens-muted/50 font-medium uppercase tracking-wider">
                                                References ({referencedVideos.length})
                                            </span>
                                        </div>
                                        <div className="space-y-1">
                                            {referencedVideos.map((vid) => (
                                                <div
                                                    key={vid.id}
                                                    onClick={() => dispatch({ type: "SET_ACTIVE_VIDEO", payload: vid.id })}
                                                    className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/[0.03] cursor-pointer transition-colors"
                                                >
                                                    <div className="w-6 h-6 rounded bg-white/[0.04] flex items-center justify-center shrink-0">
                                                        {vid.performanceTier && (
                                                            <div className={`w-1.5 h-1.5 rounded-full ${vid.performanceTier === "top" ? "bg-emerald-400" :
                                                                    vid.performanceTier === "high" ? "bg-sky-400" :
                                                                        "bg-amber-400"
                                                                }`} />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[11px] text-lens-text truncate">{vid.title}</p>
                                                        <div className="flex items-center gap-2 text-[9px] text-lens-muted/30">
                                                            <span>{vid.platform}</span>
                                                            <span>·</span>
                                                            <span>{vid.impressions}</span>
                                                            <span>·</span>
                                                            <span>{vid.ctr} CTR</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* -- BRIEF METADATA -- */}
                                <div className="px-3 py-2 border-b border-lens-border/30">
                                    <div className="flex items-center gap-3 text-[11px] text-lens-muted/40">
                                        <div className="flex items-center gap-1">
                                            <Clapperboard size={10} />
                                            <span>{brief.campaign}</span>
                                        </div>
                                        {brief.angle && (
                                            <div className="flex items-center gap-1">
                                                <Tag size={10} />
                                                <span>{brief.angle}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* -- BRIEF EDITOR -- */}
                                <div className="flex flex-col flex-1">
                                    <div className="flex items-center justify-between px-3 py-1.5 border-b border-lens-border/20">
                                        <div className="flex items-center gap-1.5">
                                            <Zap size={10} className="text-lens-muted/40" />
                                            <span className="text-[10px] text-lens-muted/40 font-medium uppercase tracking-wider">
                                                Brief
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => setIsPreview(false)}
                                                className={`p-1.5 rounded text-xs transition-colors ${!isPreview ? "text-lens-text" : "text-lens-muted/40 hover:text-lens-text"
                                                    }`}
                                                title="Edit"
                                            >
                                                <PenLine size={12} />
                                            </button>
                                            <button
                                                onClick={() => setIsPreview(true)}
                                                className={`p-1.5 rounded text-xs transition-colors ${isPreview ? "text-lens-text" : "text-lens-muted/40 hover:text-lens-text"
                                                    }`}
                                                title="Preview"
                                            >
                                                <Eye size={12} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex-1 px-3 py-2">
                                        {isPreview ? (
                                            <div className="markdown-preview text-sm">
                                                <ReactMarkdown>{brief.content}</ReactMarkdown>
                                            </div>
                                        ) : (
                                            <textarea
                                                value={brief.content}
                                                onChange={handleContentChange}
                                                className="w-full h-full min-h-[180px] bg-transparent text-lens-text text-sm font-mono leading-relaxed resize-none outline-none placeholder:text-lens-muted/30"
                                                placeholder="Write your creative brief in Markdown..."
                                                spellCheck={false}
                                            />
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-lens-muted/40 text-sm">No brief selected</p>
                            </div>
                        )}
                    </div>

                    {/* ===== FOOTER — EXPORT + ARCHIVE ===== */}
                    {brief && (
                        <div className="p-3 border-t border-lens-border/50 space-y-1.5">
                            <button className="w-full py-2.5 rounded-lg bg-white/[0.06] text-lens-text font-medium text-sm hover:bg-white/[0.1] transition-all active:scale-[0.98]">
                                Export Brief
                            </button>
                            <button
                                onClick={() => dispatch({ type: "ARCHIVE_BRIEF", payload: brief.id })}
                                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-lens-muted/40 text-[11px] hover:text-lens-muted hover:bg-white/[0.02] transition-all"
                            >
                                <Archive size={12} />
                                <span>Archive this brief</span>
                            </button>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
