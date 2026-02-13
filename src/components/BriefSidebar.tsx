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
    Trash2,
    ChevronDown,
    FileText,
    Users,
    UserPlus,
    Play,
    Zap,
    Bookmark,
} from "lucide-react";

type SidebarTab = "brief" | "saved" | "team";

export default function BriefSidebar() {
    const { state, dispatch, getActiveBrief, createNewBrief } = useStore();
    const brief = getActiveBrief();

    const [activeTab, setActiveTab] = useState<SidebarTab>("brief");
    const [isPreview, setIsPreview] = useState(false);
    const [showNewBrief, setShowNewBrief] = useState(false);
    const [newBriefTitle, setNewBriefTitle] = useState("");
    const [newBriefCampaign, setNewBriefCampaign] = useState("");
    const [showBriefSelect, setShowBriefSelect] = useState(false);
    const [showAddCollab, setShowAddCollab] = useState(false);
    const [collabName, setCollabName] = useState("");
    const [collabEmail, setCollabEmail] = useState("");


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
        // Luxury palette for avatars
        const colors = ["#FCA311", "#14213D", "#E5E5E5", "#000000"];
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

    // Separate active and archived briefs (archived hidden for now)
    const activeBriefs = state.briefs.filter((b) => !b.archived);

    // Referenced videos with performance data
    const referencedVideos = brief
        ? state.videos.filter((v) => brief.referenceVideoIds.includes(v.id))
        : [];

    // Liked / disliked videos
    const likedVideos = brief
        ? state.videos.filter((v) => brief.likedVideoIds.includes(v.id))
        : [];

    // Badge counts
    const savedCount = (brief?.hooks.length || 0) + referencedVideos.length + likedVideos.length;
    const teamCount = brief?.collaborators.length || 0;

    const tabs: { key: SidebarTab; label: string; icon: React.ReactNode; badge?: number }[] = [
        { key: "brief", label: "Brief", icon: <PenLine size={14} /> },
        { key: "saved", label: "Saved", icon: <Bookmark size={14} />, badge: savedCount > 0 ? savedCount : undefined },
        { key: "team", label: "Team", icon: <Users size={14} />, badge: teamCount > 1 ? teamCount : undefined },
    ];

    return (
        <AnimatePresence>
            {state.sidebarOpen && (
                <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 380, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="h-full border-l border-gray-200 bg-white flex flex-col overflow-hidden text-lens-secondary shadow-xl z-10"
                >
                    {/* ===== BRIEF SELECTOR (always visible) ===== */}
                    <div className="p-4 border-b border-gray-100">
                        <div className="relative">
                            <button
                                onClick={() => setShowBriefSelect(!showBriefSelect)}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-100 hover:border-lens-primary/30 transition-all text-left group`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm text-lens-primary">
                                        <FileText size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold truncate text-lens-secondary group-hover:text-lens-primary transition-colors">
                                            {brief?.title || "Select a Brief"}
                                        </p>
                                        {brief && (
                                            <p className="text-[10px] text-gray-400 truncate uppercase tracking-wider font-semibold">{brief.campaign}</p>
                                        )}
                                    </div>
                                </div>
                                <ChevronDown
                                    size={14}
                                    className={`text-gray-400 transition-transform ${showBriefSelect ? "rotate-180" : ""}`}
                                />
                            </button>

                            <AnimatePresence>
                                {showBriefSelect && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl z-50 overflow-hidden max-h-80 overflow-y-auto custom-scrollbar"
                                    >
                                        {activeBriefs.map((b) => (
                                            <button
                                                key={b.id}
                                                onClick={() => {
                                                    dispatch({ type: "SET_ACTIVE_BRIEF", payload: b.id });
                                                    setShowBriefSelect(false);
                                                }}
                                                className={`w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${b.id === state.activeBriefId ? "bg-lens-primary/5 border-l-4 border-lens-primary" : "border-l-4 border-transparent"}`}
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className={`text-sm font-medium ${b.id === state.activeBriefId ? "text-lens-primary" : "text-gray-700"}`}>{b.title}</p>
                                                    <p className="text-[10px] text-gray-400">{b.angle || b.campaign}</p>
                                                </div>
                                            </button>
                                        ))}

                                        <button
                                            onClick={() => {
                                                setShowBriefSelect(false);
                                                setShowNewBrief(true);
                                            }}
                                            className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-t border-gray-100 text-lens-primary font-medium text-sm"
                                        >
                                            <Plus size={14} />
                                            <span>Create New Brief</span>
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
                                className="border-b border-gray-100 overflow-hidden bg-gray-50"
                            >
                                <div className="p-4 space-y-3">
                                    <input
                                        type="text"
                                        value={newBriefTitle}
                                        onChange={(e) => setNewBriefTitle(e.target.value)}
                                        placeholder="Brief title..."
                                        className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm focus:border-lens-primary outline-none"
                                        autoFocus
                                    />
                                    <input
                                        type="text"
                                        value={newBriefCampaign}
                                        onChange={(e) => setNewBriefCampaign(e.target.value)}
                                        placeholder="Campaign name..."
                                        className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm focus:border-lens-primary outline-none"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleCreateBrief}
                                            className="flex-1 py-1.5 rounded-lg bg-lens-secondary text-white text-sm font-medium hover:bg-lens-secondary/90 transition-colors"
                                        >
                                            Create
                                        </button>
                                        <button
                                            onClick={() => setShowNewBrief(false)}
                                            className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 text-sm hover:bg-white transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ===== TAB BAR ===== */}
                    <div className="flex border-b border-gray-100 bg-white sticky top-0 px-2 pt-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-all relative rounded-t-lg ${activeTab === tab.key
                                    ? "text-lens-secondary bg-gray-50"
                                    : "text-gray-400 hover:text-lens-secondary hover:bg-gray-50/50"
                                    }`}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                                {tab.badge && (
                                    <span className="min-w-[16px] h-[16px] rounded-full bg-lens-primary text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
                                        {tab.badge}
                                    </span>
                                )}
                                {activeTab === tab.key && (
                                    <motion.div
                                        layoutId="sidebar-tab"
                                        className="absolute top-0 left-0 right-0 h-[2px] bg-lens-primary rounded-t-full"
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* ===== TAB CONTENT ===== */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/30">
                        {brief ? (
                            <>
                                {/* ─── TAB: BRIEF ─── */}
                                {activeTab === "brief" && (
                                    <div className="flex flex-col h-full">
                                        {/* Toolbar */}
                                        <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-100">
                                            <div className="flex items-center gap-2">
                                                <Zap size={12} className="text-gray-400" />
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Editor</span>
                                            </div>
                                            <div className="flex bg-gray-100 rounded-lg p-0.5">
                                                <button
                                                    onClick={() => setIsPreview(false)}
                                                    className={`p-1.5 rounded text-xs transition-all ${!isPreview ? "bg-white shadow-sm text-lens-secondary" : "text-gray-400 hover:text-gray-600"}`}
                                                    title="Edit"
                                                >
                                                    <PenLine size={12} />
                                                </button>
                                                <button
                                                    onClick={() => setIsPreview(true)}
                                                    className={`p-1.5 rounded text-xs transition-all ${isPreview ? "bg-white shadow-sm text-lens-secondary" : "text-gray-400 hover:text-gray-600"}`}
                                                    title="Preview"
                                                >
                                                    <Eye size={12} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex-1 p-4">
                                            {isPreview ? (
                                                <div className="markdown-preview text-sm text-gray-700">
                                                    <ReactMarkdown>{brief.content}</ReactMarkdown>
                                                </div>
                                            ) : (
                                                <textarea
                                                    value={brief.content}
                                                    onChange={handleContentChange}
                                                    className="w-full h-full min-h-[300px] bg-transparent text-gray-800 text-sm font-mono leading-relaxed resize-none outline-none placeholder:text-gray-300"
                                                    placeholder="# Creative Brief\n\nStart typing..."
                                                    spellCheck={false}
                                                />
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* ─── TAB: SAVED ─── */}
                                {activeTab === "saved" && (
                                    <div className="p-4 space-y-6">
                                        {/* Hook Bank */}
                                        <div>
                                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                <Scissors size={12} /> Hook Bank
                                            </h3>
                                            {brief.hooks.length === 0 ? (
                                                <div className="text-center py-6 border border-dashed border-gray-200 rounded-lg">
                                                    <p className="text-xs text-gray-400">No hooks snipped yet</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {brief.hooks.map((hook) => (
                                                        <div key={hook.id} className="bg-white border border-gray-100 p-2 rounded-lg shadow-sm flex items-center justify-between group">
                                                            <div className="flex items-center gap-2 overflow-hidden">
                                                                <div className="w-8 h-8 rounded bg-lens-primary/10 flex items-center justify-center text-lens-primary shrink-0">
                                                                    <Play size={10} fill="currentColor" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-medium truncate">{hook.videoTitle}</p>
                                                                    <p className="text-[9px] text-gray-400 font-mono">{hook.timestamp}</p>
                                                                </div>
                                                            </div>
                                                            <button onClick={() => handleRemoveHook(hook.id)} className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* References */}
                                        <div>
                                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                <Bookmark size={12} /> References
                                            </h3>
                                            <div className="space-y-2">
                                                {referencedVideos.map((vid) => (
                                                    <div key={vid.id} className="bg-white border border-gray-100 p-2 rounded-lg shadow-sm flex items-center gap-2 hover:border-lens-primary/30 transition-colors cursor-pointer" onClick={() => dispatch({ type: "SET_ACTIVE_VIDEO", payload: vid.id })}>
                                                        <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                                                            <Bookmark size={12} />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs font-medium truncate text-lens-secondary">{vid.title}</p>
                                                            <p className="text-[9px] text-gray-400">{vid.platform}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                                {referencedVideos.length === 0 && (
                                                    <p className="text-xs text-gray-400 italic">No references saved</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ─── TAB: TEAM ─── */}
                                {activeTab === "team" && (
                                    <div className="p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                                <Users size={12} /> Team Members
                                            </h3>
                                            <button onClick={() => setShowAddCollab(!showAddCollab)} className="text-xs text-lens-primary font-medium hover:underline flex items-center gap-1">
                                                <UserPlus size={12} /> Invite
                                            </button>
                                        </div>

                                        <div className="space-y-2">
                                            {brief.collaborators.map((c) => (
                                                <div key={c.id} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm" style={{ backgroundColor: c.color || "#14213D" }}>
                                                        {c.initials}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-lens-secondary">{c.name}</p>
                                                        <p className="text-[10px] text-gray-400 truncate">{c.email}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {showAddCollab && (
                                            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-2 animate-in fade-in slide-in-from-top-2">
                                                <input
                                                    type="text"
                                                    placeholder="Name"
                                                    className="w-full text-xs p-2 rounded border border-gray-200 outline-none focus:border-lens-primary"
                                                    value={collabName}
                                                    onChange={e => setCollabName(e.target.value)}
                                                />
                                                <input
                                                    type="email"
                                                    placeholder="Email"
                                                    className="w-full text-xs p-2 rounded border border-gray-200 outline-none focus:border-lens-primary"
                                                    value={collabEmail}
                                                    onChange={e => setCollabEmail(e.target.value)}
                                                />
                                                <button onClick={handleAddCollaborator} className="w-full py-1.5 bg-lens-secondary text-white text-xs font-bold rounded hover:bg-lens-secondary/90">
                                                    Send Invite
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                                <FileText size={24} className="opacity-20" />
                                <p className="text-xs">No brief selected</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
