"use client";

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from "react";
import { Brief, Collaborator, HookSnippet, VideoItem } from "./mockData";
import * as api from "./api";

interface AppState {
    briefs: Brief[];
    activeBriefId: string | null;
    activeVideoId: string | null;
    videos: VideoItem[];
    searchQuery: string;
    searchResults: VideoItem[];
    sidebarOpen: boolean;
    isSearching: boolean;
    // Track loading state for initial data fetch
    isLoadingVideos: boolean;
    isLoadingBriefs: boolean;
}

type Action =
    | { type: "SET_SEARCH_QUERY"; payload: string }
    | { type: "SET_SEARCH_RESULTS"; payload: VideoItem[] }
    | { type: "SET_SEARCHING"; payload: boolean }
    | { type: "SET_ACTIVE_VIDEO"; payload: string }
    | { type: "SET_ACTIVE_BRIEF"; payload: string }
    | { type: "TOGGLE_SIDEBAR" }
    | { type: "SET_SIDEBAR"; payload: boolean }
    | { type: "SET_VIDEOS"; payload: VideoItem[] }
    | { type: "SET_LOADING_VIDEOS"; payload: boolean }
    | { type: "SET_LOADING_BRIEFS"; payload: boolean }
    | { type: "ADD_HOOK"; payload: { briefId: string; hook: HookSnippet } }
    | { type: "REMOVE_HOOK"; payload: { briefId: string; hookId: string } }
    | { type: "UPDATE_BRIEF_CONTENT"; payload: { briefId: string; content: string } }
    | { type: "UPDATE_BRIEF_META"; payload: { briefId: string; title?: string; campaign?: string; angle?: string } }
    | { type: "CREATE_BRIEF"; payload: Brief }
    | { type: "SET_BRIEFS"; payload: Brief[] }
    | { type: "UPDATE_BRIEF"; payload: Brief }
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
        case "SET_VIDEOS":
            return { ...state, videos: action.payload };
        case "SET_LOADING_VIDEOS":
            return { ...state, isLoadingVideos: action.payload };
        case "SET_LOADING_BRIEFS":
            return { ...state, isLoadingBriefs: action.payload };
        case "SET_BRIEFS":
            return {
                ...state,
                briefs: action.payload,
                activeBriefId: state.activeBriefId ?? action.payload[0]?.id ?? null,
                isLoadingBriefs: false,
            };
        case "UPDATE_BRIEF": {
            const briefs = state.briefs.map((b) => (b.id === action.payload.id ? action.payload : b));
            return { ...state, briefs };
        }
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
    briefs: [],
    activeBriefId: null,
    activeVideoId: null,
    videos: [],
    searchQuery: "",
    searchResults: [],
    sidebarOpen: true,
    isSearching: false,
    isLoadingVideos: true,
    isLoadingBriefs: true,
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

export function StoreProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState);
    const stateRef = useRef(state);
    stateRef.current = state;

    // ── Fetch videos from API on mount ──────────────────────────────────────
    useEffect(() => {
        dispatch({ type: "SET_LOADING_VIDEOS", payload: true });
        api.fetchVideos({ limit: 50 })
            .then(({ videos }) => {
                dispatch({ type: "SET_VIDEOS", payload: videos });
                dispatch({ type: "SET_LOADING_VIDEOS", payload: false });
            })
            .catch((err) => {
                console.error("Failed to load videos:", err);
                dispatch({ type: "SET_LOADING_VIDEOS", payload: false });
            });
    }, []);

    // ── Fetch briefs from API on mount ──────────────────────────────────────
    useEffect(() => {
        dispatch({ type: "SET_LOADING_BRIEFS", payload: true });
        api.fetchBriefs()
            .then((briefs) => {
                dispatch({ type: "SET_BRIEFS", payload: briefs });
            })
            .catch((err) => {
                console.error("Failed to load briefs:", err);
                dispatch({ type: "SET_LOADING_BRIEFS", payload: false });
            });
    }, []);

    // ── Restore active brief preference from localStorage ───────────────────
    useEffect(() => {
        try {
            const saved = localStorage.getItem("lens-active-brief");
            if (saved) dispatch({ type: "SET_ACTIVE_BRIEF", payload: saved });
        } catch { /* ignore */ }
    }, []);

    // ── Persist active brief to localStorage ────────────────────────────────
    useEffect(() => {
        try {
            if (state.activeBriefId) localStorage.setItem("lens-active-brief", state.activeBriefId);
        } catch { /* ignore */ }
    }, [state.activeBriefId]);

    const getActiveBrief = useCallback(() => {
        return state.briefs.find((b) => b.id === state.activeBriefId);
    }, [state.briefs, state.activeBriefId]);

    const getActiveVideo = useCallback(() => {
        return state.videos.find((v) => v.id === state.activeVideoId);
    }, [state.videos, state.activeVideoId]);

    // ── Search — scrapes Meta Ad Library via Firecrawl, then falls back to DB ──
    const searchVideos = useCallback((query: string) => {
        dispatch({ type: "SET_SEARCH_QUERY", payload: query });
        dispatch({ type: "SET_SEARCHING", payload: true });

        if (!query.trim()) {
            // Empty query — clear results and show the full feed
            dispatch({ type: "SET_SEARCH_RESULTS", payload: [] });
            return;
        }

        // 1. Call the Firecrawl scraper — this ingests fresh ads then returns them
        api.searchAds(query, "META", { limit: 20 })
            .then(({ results }) => {
                const scraped = results.map(api.adResultToVideoItem);
                dispatch({ type: "SET_SEARCH_RESULTS", payload: scraped });
                // Also merge scraped items into the main videos list so VideoModal works
                dispatch({ type: "SET_VIDEOS", payload: [...scraped, ...stateRef.current.videos.filter(v => !scraped.find(s => s.id === v.id))] });
            })
            .catch((err) => {
                console.error("Scraper search failed, falling back to DB:", err);
                // Fallback: search the already-seeded videos table
                api.fetchVideos({ q: query, limit: 50 })
                    .then(({ videos }) => {
                        dispatch({ type: "SET_SEARCH_RESULTS", payload: videos });
                    })
                    .catch((err2) => {
                        console.error("DB search also failed:", err2);
                        dispatch({ type: "SET_SEARCH_RESULTS", payload: stateRef.current.videos });
                    });
            });
    }, []);

    // ── Snip hook — calls real API ───────────────────────────────────────────
    const snipHook = useCallback((videoId: string) => {
        const video = stateRef.current.videos.find((v) => v.id === videoId);
        const briefId = stateRef.current.activeBriefId;
        if (!video || !briefId) return;

        // Optimistic update
        const tempHook: HookSnippet = {
            id: `hook-${Date.now()}`,
            videoId: video.id,
            videoTitle: video.title,
            thumbnail: video.thumbnail,
            timestamp: "0:00 – 0:03",
            notes: "",
        };
        dispatch({ type: "ADD_HOOK", payload: { briefId, hook: tempHook } });
        dispatch({ type: "ADD_REFERENCE_VIDEO", payload: { briefId, videoId } });

        // Persist to API
        api.addHook(briefId, videoId, 0, 3, "").then((realHook) => {
            // Replace temp hook with the real one from API
            dispatch({ type: "REMOVE_HOOK", payload: { briefId, hookId: tempHook.id } });
            dispatch({ type: "ADD_HOOK", payload: { briefId, hook: realHook } });
        }).catch((err) => {
            console.error("Failed to save hook:", err);
            // Rollback
            dispatch({ type: "REMOVE_HOOK", payload: { briefId, hookId: tempHook.id } });
        });

        api.addReference(briefId, videoId).catch((err) => {
            console.error("Failed to save reference:", err);
        });
    }, []);

    // ── Create brief — calls real API ────────────────────────────────────────
    const createNewBrief = useCallback((title: string, campaign: string) => {
        api.createBrief({ title, campaign })
            .then((brief) => {
                dispatch({ type: "CREATE_BRIEF", payload: brief });
            })
            .catch((err) => {
                console.error("Failed to create brief:", err);
            });
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
