"use client";

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from "react";
import { Brief, Collaborator, HookSnippet, VideoItem, MOCK_BRIEFS, MOCK_VIDEOS } from "./mockData";

interface AppState {
    briefs: Brief[];
    activeBriefId: string | null;
    activeVideoId: string | null;
    videos: VideoItem[];
    searchQuery: string;
    searchResults: VideoItem[];
    sidebarOpen: boolean;
    isSearching: boolean;
}

type Action =
    | { type: "SET_SEARCH_QUERY"; payload: string }
    | { type: "SET_SEARCH_RESULTS"; payload: VideoItem[] }
    | { type: "SET_SEARCHING"; payload: boolean }
    | { type: "SET_ACTIVE_VIDEO"; payload: string }
    | { type: "SET_ACTIVE_BRIEF"; payload: string }
    | { type: "TOGGLE_SIDEBAR" }
    | { type: "SET_SIDEBAR"; payload: boolean }
    | { type: "ADD_HOOK"; payload: { briefId: string; hook: HookSnippet } }
    | { type: "REMOVE_HOOK"; payload: { briefId: string; hookId: string } }
    | { type: "UPDATE_BRIEF_CONTENT"; payload: { briefId: string; content: string } }
    | { type: "UPDATE_BRIEF_META"; payload: { briefId: string; title?: string; campaign?: string; angle?: string } }
    | { type: "CREATE_BRIEF"; payload: Brief }
    | { type: "ADD_REFERENCE_VIDEO"; payload: { briefId: string; videoId: string } }
    | { type: "REMOVE_REFERENCE_VIDEO"; payload: { briefId: string; videoId: string } }
    | { type: "LIKE_VIDEO"; payload: { briefId: string; videoId: string } }
    | { type: "DISLIKE_VIDEO"; payload: { briefId: string; videoId: string } }
    | { type: "UNLIKE_VIDEO"; payload: { briefId: string; videoId: string } }
    | { type: "ARCHIVE_BRIEF"; payload: string }
    | { type: "UNARCHIVE_BRIEF"; payload: string }
    | { type: "ADD_COLLABORATOR"; payload: { briefId: string; collaborator: Collaborator } }
    | { type: "REMOVE_COLLABORATOR"; payload: { briefId: string; collaboratorId: string } }
    | { type: "CLEAR_SEARCH" }
    | { type: "LOAD_STATE"; payload: Partial<AppState> };

function reducer(state: AppState, action: Action): AppState {
    switch (action.type) {
        case "SET_SEARCH_QUERY":
            return { ...state, searchQuery: action.payload };
        case "SET_SEARCH_RESULTS":
            return { ...state, searchResults: action.payload, isSearching: false };
        case "SET_SEARCHING":
            return { ...state, isSearching: action.payload };
        case "CLEAR_SEARCH":
            return { ...state, searchQuery: "", searchResults: [], isSearching: false };
        case "SET_ACTIVE_VIDEO":
            return { ...state, activeVideoId: action.payload };
        case "SET_ACTIVE_BRIEF":
            return { ...state, activeBriefId: action.payload };
        case "TOGGLE_SIDEBAR":
            return { ...state, sidebarOpen: !state.sidebarOpen };
        case "SET_SIDEBAR":
            return { ...state, sidebarOpen: action.payload };
        case "ADD_HOOK": {
            const briefs = state.briefs.map((b) =>
                b.id === action.payload.briefId
                    ? { ...b, hooks: [...b.hooks, action.payload.hook], updatedAt: new Date().toISOString() }
                    : b
            );
            return { ...state, briefs };
        }
        case "REMOVE_HOOK": {
            const briefs = state.briefs.map((b) =>
                b.id === action.payload.briefId
                    ? { ...b, hooks: b.hooks.filter((h) => h.id !== action.payload.hookId), updatedAt: new Date().toISOString() }
                    : b
            );
            return { ...state, briefs };
        }
        case "UPDATE_BRIEF_CONTENT": {
            const briefs = state.briefs.map((b) =>
                b.id === action.payload.briefId
                    ? { ...b, content: action.payload.content, updatedAt: new Date().toISOString() }
                    : b
            );
            return { ...state, briefs };
        }
        case "UPDATE_BRIEF_META": {
            const briefs = state.briefs.map((b) =>
                b.id === action.payload.briefId
                    ? {
                        ...b,
                        ...(action.payload.title !== undefined && { title: action.payload.title }),
                        ...(action.payload.campaign !== undefined && { campaign: action.payload.campaign }),
                        ...(action.payload.angle !== undefined && { angle: action.payload.angle }),
                        updatedAt: new Date().toISOString(),
                    }
                    : b
            );
            return { ...state, briefs };
        }
        case "CREATE_BRIEF":
            return { ...state, briefs: [...state.briefs, action.payload], activeBriefId: action.payload.id };
        case "ADD_REFERENCE_VIDEO": {
            const briefs = state.briefs.map((b) =>
                b.id === action.payload.briefId && !b.referenceVideoIds.includes(action.payload.videoId)
                    ? { ...b, referenceVideoIds: [...b.referenceVideoIds, action.payload.videoId], updatedAt: new Date().toISOString() }
                    : b
            );
            return { ...state, briefs };
        }
        case "REMOVE_REFERENCE_VIDEO": {
            const briefs = state.briefs.map((b) =>
                b.id === action.payload.briefId
                    ? { ...b, referenceVideoIds: b.referenceVideoIds.filter((id) => id !== action.payload.videoId), updatedAt: new Date().toISOString() }
                    : b
            );
            return { ...state, briefs };
        }
        case "LIKE_VIDEO": {
            const briefs = state.briefs.map((b) =>
                b.id === action.payload.briefId
                    ? {
                        ...b,
                        likedVideoIds: b.likedVideoIds.includes(action.payload.videoId)
                            ? b.likedVideoIds
                            : [...b.likedVideoIds, action.payload.videoId],
                        dislikedVideoIds: b.dislikedVideoIds.filter((id) => id !== action.payload.videoId),
                        updatedAt: new Date().toISOString(),
                    }
                    : b
            );
            return { ...state, briefs };
        }
        case "DISLIKE_VIDEO": {
            const briefs = state.briefs.map((b) =>
                b.id === action.payload.briefId
                    ? {
                        ...b,
                        dislikedVideoIds: b.dislikedVideoIds.includes(action.payload.videoId)
                            ? b.dislikedVideoIds
                            : [...b.dislikedVideoIds, action.payload.videoId],
                        likedVideoIds: b.likedVideoIds.filter((id) => id !== action.payload.videoId),
                        updatedAt: new Date().toISOString(),
                    }
                    : b
            );
            return { ...state, briefs };
        }
        case "UNLIKE_VIDEO": {
            const briefs = state.briefs.map((b) =>
                b.id === action.payload.briefId
                    ? {
                        ...b,
                        likedVideoIds: b.likedVideoIds.filter((id) => id !== action.payload.videoId),
                        dislikedVideoIds: b.dislikedVideoIds.filter((id) => id !== action.payload.videoId),
                        updatedAt: new Date().toISOString(),
                    }
                    : b
            );
            return { ...state, briefs };
        }
        case "ARCHIVE_BRIEF": {
            const briefs = state.briefs.map((b) =>
                b.id === action.payload ? { ...b, archived: true, updatedAt: new Date().toISOString() } : b
            );
            // If archiving the active brief, switch to first non-archived
            let activeBriefId = state.activeBriefId;
            if (activeBriefId === action.payload) {
                const next = briefs.find((b) => !b.archived);
                activeBriefId = next?.id || null;
            }
            return { ...state, briefs, activeBriefId };
        }
        case "UNARCHIVE_BRIEF": {
            const briefs = state.briefs.map((b) =>
                b.id === action.payload ? { ...b, archived: false, updatedAt: new Date().toISOString() } : b
            );
            return { ...state, briefs };
        }
        case "ADD_COLLABORATOR": {
            const briefs = state.briefs.map((b) =>
                b.id === action.payload.briefId && !b.collaborators.find((c) => c.email === action.payload.collaborator.email)
                    ? { ...b, collaborators: [...b.collaborators, action.payload.collaborator], updatedAt: new Date().toISOString() }
                    : b
            );
            return { ...state, briefs };
        }
        case "REMOVE_COLLABORATOR": {
            const briefs = state.briefs.map((b) =>
                b.id === action.payload.briefId
                    ? { ...b, collaborators: b.collaborators.filter((c) => c.id !== action.payload.collaboratorId), updatedAt: new Date().toISOString() }
                    : b
            );
            return { ...state, briefs };
        }
        case "LOAD_STATE":
            return { ...state, ...action.payload };
        default:
            return state;
    }
}

const initialState: AppState = {
    briefs: MOCK_BRIEFS,
    activeBriefId: MOCK_BRIEFS[0]?.id || null,
    activeVideoId: MOCK_VIDEOS[0]?.id || null,
    videos: MOCK_VIDEOS,
    searchQuery: "",
    searchResults: [],
    sidebarOpen: true,
    isSearching: false,
};

interface StoreContextType {
    state: AppState;
    dispatch: React.Dispatch<Action>;
    getActiveBrief: () => Brief | undefined;
    getActiveVideo: () => VideoItem | undefined;
    searchVideos: (query: string) => void;
    snipHook: (videoId: string) => void;
    createNewBrief: (title: string, campaign: string) => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

const STORAGE_KEY = "lens-app-state";

export function StoreProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState);
    const stateRef = useRef(state);
    stateRef.current = state;

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Migrate old briefs that may lack new fields
                const briefs = (parsed.briefs || MOCK_BRIEFS).map((b: Brief) => ({
                    ...b,
                    likedVideoIds: b.likedVideoIds || [],
                    dislikedVideoIds: b.dislikedVideoIds || [],
                    collaborators: b.collaborators || [],
                    archived: b.archived || false,
                }));
                dispatch({
                    type: "LOAD_STATE",
                    payload: {
                        briefs,
                        activeBriefId: parsed.activeBriefId || MOCK_BRIEFS[0]?.id,
                    },
                });
            }
        } catch {
            // Ignore parse errors
        }
    }, []);

    // Save on brief changes
    useEffect(() => {
        try {
            const toSave = {
                briefs: state.briefs,
                activeBriefId: state.activeBriefId,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
        } catch {
            // Ignore
        }
    }, [state.briefs, state.activeBriefId]);

    const getActiveBrief = useCallback(() => {
        return state.briefs.find((b) => b.id === state.activeBriefId);
    }, [state.briefs, state.activeBriefId]);

    const getActiveVideo = useCallback(() => {
        return state.videos.find((v) => v.id === state.activeVideoId);
    }, [state.videos, state.activeVideoId]);

    const searchVideos = useCallback(
        (query: string) => {
            dispatch({ type: "SET_SEARCH_QUERY", payload: query });
            dispatch({ type: "SET_SEARCHING", payload: true });

            setTimeout(() => {
                const q = query.toLowerCase();
                const results = state.videos.filter(
                    (v) =>
                        v.title.toLowerCase().includes(q) ||
                        v.brand.toLowerCase().includes(q) ||
                        v.category.toLowerCase().includes(q) ||
                        v.platform.toLowerCase().includes(q)
                );
                dispatch({
                    type: "SET_SEARCH_RESULTS",
                    payload: results.length > 0 ? results : state.videos,
                });
            }, 800);
        },
        [state.videos]
    );

    const snipHook = useCallback(
        (videoId: string) => {
            const video = state.videos.find((v) => v.id === videoId);
            const briefId = state.activeBriefId;
            if (!video || !briefId) return;

            const hook: HookSnippet = {
                id: `hook-${Date.now()}`,
                videoId: video.id,
                videoTitle: video.title,
                thumbnail: video.thumbnail,
                timestamp: "0:00 – 0:03",
                notes: "",
            };

            dispatch({ type: "ADD_HOOK", payload: { briefId, hook } });
            dispatch({ type: "ADD_REFERENCE_VIDEO", payload: { briefId, videoId } });
        },
        [state.videos, state.activeBriefId]
    );

    const createNewBrief = useCallback((title: string, campaign: string) => {
        const brief: Brief = {
            id: `b-${Date.now()}`,
            title,
            campaign,
            angle: "",
            content: `# ${title}\n\nStart writing your creative brief here...\n`,
            hooks: [],
            referenceVideoIds: [],
            likedVideoIds: [],
            dislikedVideoIds: [],
            collaborators: [
                { id: "u1", name: "You", email: "you@team.co", initials: "Y", color: "#5090f0" },
            ],
            archived: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        dispatch({ type: "CREATE_BRIEF", payload: brief });
    }, []);

    return (
        <StoreContext.Provider
            value={{ state, dispatch, getActiveBrief, getActiveVideo, searchVideos, snipHook, createNewBrief }}
        >
            {children}
        </StoreContext.Provider>
    );
}

export function useStore() {
    const ctx = useContext(StoreContext);
    if (!ctx) throw new Error("useStore must be used within StoreProvider");
    return ctx;
}
