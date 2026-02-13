

export interface HeatmapZone {
    start: number; // percentage 0-100
    end: number;
    type: "hook" | "proof" | "cta";
    label: string;
}

export interface TranscriptSegment {
    time: number; // seconds
    text: string;
}

export interface VideoItem {
    id: string;
    title: string;
    brand: string;
    platform: "meta" | "tiktok" | "youtube";
    category: string;
    thumbnail: string;
    videoUrl: string;
    duration: number; // seconds
    heatmapZones: HeatmapZone[];
    transcript: TranscriptSegment[];
    spend?: string;
    impressions?: string;
    ctr?: string;        // click-through rate
    engagementRate?: string;
    hookRate?: string;   // % of viewers retained past hook
    performanceTier?: "top" | "high" | "mid" | "low";
}

export interface HookSnippet {
    id: string;
    videoId: string;
    videoTitle: string;
    thumbnail: string;
    timestamp: string;
    notes: string;
}

export interface Collaborator {
    id: string;
    name: string;
    email: string;
    initials: string;
    color: string;
}

export interface Brief {
    id: string;
    title: string;
    campaign: string;
    angle: string;
    content: string;
    hooks: HookSnippet[];
    referenceVideoIds: string[];
    likedVideoIds: string[];
    dislikedVideoIds: string[];
    collaborators: Collaborator[];
    archived: boolean;
    createdAt: string;
    updatedAt: string;
}

// Reliable public domain videos to ensure playback works
const ASSETS = {
    bbb: {
        video: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/av1/360/Big_Buck_Bunny_360_10s_1MB.mp4",
        thumb: "https://upload.wikimedia.org/wikipedia/commons/7/70/Big.Buck.Bunny.-.Opening.Screen.png"
    },
    sintel: {
        video: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
        thumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Sintel_poster.jpg/640px-Sintel_poster.jpg"
    },
    flower: {
        video: "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8",
        thumb: "https://interactive-examples.mdn.mozilla.net/media/cc0-images/flower.jpg"
    }
};

export const MOCK_VIDEOS: VideoItem[] = [
    {
        id: "v1",
        title: "Big Buck Bunny - Animated Story",
        brand: "Blender Inc",
        platform: "meta",
        category: "Animation",
        thumbnail: ASSETS.bbb.thumb,
        videoUrl: ASSETS.bbb.video,
        duration: 596,
        heatmapZones: [
            { start: 0, end: 10, type: "hook", label: "Intro Hook" },
            { start: 20, end: 40, type: "proof", label: "Story Arc" },
            { start: 80, end: 100, type: "cta", label: "Credits" },
        ],
        transcript: [
            { time: 0, text: "A giant rabbit with a heart bigger than himself." },
            { time: 10, text: "The rodents are harassing him." },
            { time: 30, text: "Revenge time!" },
        ],
        spend: "$45K",
        impressions: "2.3M",
        ctr: "2.8%",
        engagementRate: "6.4%",
        hookRate: "78%",
        performanceTier: "top",
    },
    {
        id: "v2",
        title: "Sintel - Fantasy Story",
        brand: "Blender Inc",
        platform: "tiktok",
        category: "Sci-Fi",
        thumbnail: ASSETS.sintel.thumb,
        videoUrl: ASSETS.sintel.video,
        duration: 653,
        heatmapZones: [
            { start: 0, end: 15, type: "hook", label: "Visual Hook" },
            { start: 30, end: 60, type: "proof", label: "Action Sequence" },
            { start: 90, end: 100, type: "cta", label: "Visit Site" },
        ],
        transcript: [
            { time: 0, text: "The first Blender Open Movie from 2006" },
            { time: 20, text: "Exploring the machine..." },
            { time: 60, text: "Conflict arises." },
        ],
        spend: "$28K",
        impressions: "1.8M",
        ctr: "2.1%",
        engagementRate: "5.2%",
        hookRate: "65%",
        performanceTier: "high",
    },
    {
        id: "v3",
        title: "Nature - Blooming Flower",
        brand: "MDN",
        platform: "meta",
        category: "Nature",
        thumbnail: ASSETS.flower.thumb,
        videoUrl: ASSETS.flower.video,
        duration: 15,
        heatmapZones: [
            { start: 0, end: 20, type: "hook", label: "Feature Hook" },
            { start: 40, end: 60, type: "proof", label: "Demo" },
            { start: 80, end: 100, type: "cta", label: "Shop Now" },
        ],
        transcript: [
            { time: 0, text: "Watch nature unfold." },
            { time: 5, text: "A beautiful bloom in seconds." },
            { time: 10, text: "Nature is amazing." },
        ],
        spend: "$62K",
        impressions: "4.1M",
        ctr: "3.4%",
        engagementRate: "8.1%",
        hookRate: "82%",
        performanceTier: "top",
    },
    {
        id: "v4",
        title: "Big Buck Bunny - Short",
        brand: "Blender Inc",
        platform: "tiktok",
        category: "Animation",
        thumbnail: ASSETS.bbb.thumb,
        videoUrl: ASSETS.bbb.video,
        duration: 15,
        heatmapZones: [
            { start: 0, end: 20, type: "hook", label: "Adventure Hook" },
            { start: 40, end: 60, type: "proof", label: "Feature Demo" },
            { start: 80, end: 100, type: "cta", label: "Learn More" },
        ],
        transcript: [
            { time: 0, text: "The bunny creates a trap." },
            { time: 5, text: "But will it work?" },
            { time: 10, text: "Watch the full movie." },
        ],
        spend: "$33K",
        impressions: "2.9M",
        ctr: "1.9%",
        engagementRate: "7.3%",
        hookRate: "71%",
        performanceTier: "high",
    },
    {
        id: "v5",
        title: "Sintel - Trailer",
        brand: "Blender Inc",
        platform: "youtube",
        category: "Sci-Fi",
        thumbnail: ASSETS.sintel.thumb,
        videoUrl: ASSETS.sintel.video,
        duration: 60,
        heatmapZones: [
            { start: 0, end: 15, type: "hook", label: "Fun Hook" },
            { start: 30, end: 60, type: "proof", label: "Experience" },
            { start: 80, end: 100, type: "cta", label: "Get Yours" },
        ],
        transcript: [
            { time: 0, text: "A girl on a journey." },
            { time: 5, text: "Searching for her dragon." },
            { time: 10, text: "Against all odds." },
        ],
        spend: "$55K",
        impressions: "3.7M",
        ctr: "1.5%",
        engagementRate: "4.8%",
        hookRate: "58%",
        performanceTier: "mid",
    },
    {
        id: "v6",
        title: "Nature - Springtime",
        brand: "MDN",
        platform: "meta",
        category: "Nature",
        thumbnail: ASSETS.flower.thumb,
        videoUrl: ASSETS.flower.video,
        duration: 15,
        heatmapZones: [
            { start: 0, end: 20, type: "hook", label: "Joyride Hook" },
            { start: 40, end: 60, type: "proof", label: "Car Feature" },
            { start: 80, end: 100, type: "cta", label: "Drive Now" },
        ],
        transcript: [
            { time: 0, text: "Colors of spring." },
            { time: 5, text: "Vibrant and full of life." },
            { time: 10, text: "Enjoy the view." },
        ],
        spend: "$19K",
        impressions: "1.2M",
        ctr: "1.2%",
        engagementRate: "3.5%",
        hookRate: "52%",
        performanceTier: "mid",
    },
    {
        id: "v7",
        title: "Big Buck Bunny - Chase",
        brand: "Blender Inc",
        platform: "tiktok",
        category: "Animation",
        thumbnail: ASSETS.bbb.thumb,
        videoUrl: ASSETS.bbb.video,
        duration: 15,
        heatmapZones: [
            { start: 0, end: 20, type: "hook", label: "Drama Hook" },
            { start: 40, end: 60, type: "proof", label: "Solution" },
            { start: 80, end: 100, type: "cta", label: "Watch Now" },
        ],
        transcript: [
            { time: 0, text: "The chase is on." },
            { time: 5, text: "Running through the forest." },
            { time: 10, text: "Who will win?" },
        ],
        spend: "$41K",
        impressions: "3.2M",
        ctr: "2.5%",
        engagementRate: "6.8%",
        hookRate: "74%",
        performanceTier: "high",
    },
    {
        id: "v8",
        title: "Sintel - The Search",
        brand: "Blender Inc",
        platform: "meta",
        category: "Animation",
        thumbnail: ASSETS.sintel.thumb,
        videoUrl: ASSETS.sintel.video,
        duration: 888,
        heatmapZones: [
            { start: 0, end: 10, type: "hook", label: "Opening Scene" },
            { start: 20, end: 50, type: "proof", label: "Journey" },
            { start: 80, end: 100, type: "cta", label: "Donate" },
        ],
        transcript: [
            { time: 0, text: "Walking through the snow." },
            { time: 20, text: "Finding clues." },
            { time: 60, text: "The dragon is near." },
        ],
        spend: "$72K",
        impressions: "5.8M",
        ctr: "3.1%",
        engagementRate: "7.9%",
        hookRate: "81%",
        performanceTier: "top",
    },
    {
        id: "v9",
        title: "Nature - Growth",
        brand: "MDN",
        platform: "tiktok",
        category: "Nature",
        thumbnail: ASSETS.flower.thumb,
        videoUrl: ASSETS.flower.video,
        duration: 15,
        heatmapZones: [
            { start: 0, end: 20, type: "hook", label: "Action Hook" },
            { start: 40, end: 60, type: "proof", label: "Off-road Demo" },
            { start: 80, end: 100, type: "cta", label: "Test Drive" },
        ],
        transcript: [
            { time: 0, text: "From seed to flower." },
            { time: 5, text: "The power of sun and water." },
            { time: 10, text: "Life finds a way." },
        ],
        spend: "$38K",
        impressions: "4.5M",
        ctr: "3.6%",
        engagementRate: "9.2%",
        hookRate: "85%",
        performanceTier: "top",
    },
    {
        id: "v10",
        title: "Big Buck Bunny - Final",
        brand: "Blender Inc",
        platform: "youtube",
        category: "Animation",
        thumbnail: ASSETS.bbb.thumb,
        videoUrl: ASSETS.bbb.video,
        duration: 734,
        heatmapZones: [
            { start: 0, end: 15, type: "hook", label: "VFX Hook" },
            { start: 30, end: 60, type: "proof", label: "Bot Action" },
            { start: 85, end: 100, type: "cta", label: "Behind the Scenes" },
        ],
        transcript: [
            { time: 0, text: "The end of the story." },
            { time: 10, text: "Peace returns to the forest." },
            { time: 20, text: "Or does it?" },
        ],
        spend: "$25K",
        impressions: "1.9M",
        ctr: "1.8%",
        engagementRate: "5.1%",
        hookRate: "62%",
        performanceTier: "mid",
    },
    {
        id: "v11",
        title: "Sintel - Epilogue",
        brand: "Volkswagen",
        platform: "meta",
        category: "Animation",
        thumbnail: ASSETS.sintel.thumb,
        videoUrl: ASSETS.sintel.video,
        duration: 15,
        heatmapZones: [
            { start: 0, end: 20, type: "hook", label: "Review Hook" },
            { start: 40, end: 60, type: "proof", label: "Driving" },
            { start: 80, end: 100, type: "cta", label: "Specs" },
        ],
        transcript: [
            { time: 0, text: "Years later." },
            { time: 5, text: "The dragon remembers." },
            { time: 10, text: "A touching reunion." },
        ],
        spend: "$51K",
        impressions: "3.9M",
        ctr: "2.7%",
        engagementRate: "6.5%",
        hookRate: "73%",
        performanceTier: "high",
    },
    {
        id: "v12",
        title: "Nature - Full Bloom",
        brand: "MDN",
        platform: "meta",
        category: "Nature",
        thumbnail: ASSETS.flower.thumb,
        videoUrl: ASSETS.flower.video,
        duration: 15,
        heatmapZones: [
            { start: 0, end: 15, type: "hook", label: "Rally Hook" },
            { start: 30, end: 60, type: "proof", label: "Road Trip" },
            { start: 80, end: 100, type: "cta", label: "Follow Us" },
        ],
        transcript: [
            { time: 0, text: "Maximum beauty." },
            { time: 5, text: "Colors everywhere." },
            { time: 10, text: "Spring is here." },
        ],
        spend: "$12K",
        impressions: "6.2M",
        ctr: "1.1%",
        engagementRate: "12.4%",
        hookRate: "88%",
        performanceTier: "top",
    },
];

export const MOCK_BRIEFS: Brief[] = [
    {
        id: "b1",
        title: "Skincare UGC – Q1 Campaign",
        campaign: "LumiSkin Spring Launch",
        angle: "Social Proof / Before-After",
        content: `# Skincare UGC Brief

## Objective
Create 3 UGC-style video ads showcasing real customer transformations.

## Key Messages
- **Hook:** "POV: You finally found..." pattern
- **Proof:** Before/after visuals + review count
- **CTA:** Discount code with urgency

## Script Framework
1. **0-3s:** Relatable POV hook (face-to-camera)
2. **3-8s:** Personal testimony with B-roll
3. **8-12s:** Social proof overlay (reviews, stats)
4. **12-15s:** Clear CTA with code

## Notes
- Keep lighting natural/warm
- Use trending audio for TikTok version
- Film in bathroom/vanity setting for authenticity`,
        hooks: [],
        referenceVideoIds: ["v1", "v3"],
        likedVideoIds: ["v1"],
        dislikedVideoIds: [],
        collaborators: [
            { id: "u1", name: "You", email: "you@team.co", initials: "Y", color: "#5090f0" },
            { id: "u2", name: "Arjun M", email: "arjun@team.co", initials: "AM", color: "#e8a838" },
        ],
        archived: false,
        createdAt: "2026-02-10T10:30:00Z",
        updatedAt: "2026-02-11T14:22:00Z",
    },
    {
        id: "b2",
        title: "Pet Supplements – Unboxing Angle",
        campaign: "PawVitals DTC Push",
        angle: "Unboxing / Emotional",
        content: `# Pet Supplements Brief

## Concept
Authentic unboxing + emotional pet reaction content.

## Target
Dog owners 25-45, concerned about senior pet health.

## Script Notes
- Show packaging details (premium feel)
- Include pet's genuine reaction
- Vet endorsement mention is key differentiator`,
        hooks: [],
        referenceVideoIds: ["v2"],
        likedVideoIds: ["v2"],
        dislikedVideoIds: [],
        collaborators: [
            { id: "u1", name: "You", email: "you@team.co", initials: "Y", color: "#5090f0" },
        ],
        archived: false,
        createdAt: "2026-02-08T09:00:00Z",
        updatedAt: "2026-02-09T16:45:00Z",
    },
];

export const TRENDING_SEARCHES = [
    "UGC hooks for skincare brands",
    "High-converting TikTok ads fitness",
    "Pet supplement video ads",
    "DTC fashion founder stories",
    "ASMR product unboxing templates",
    "Subscription box ad creatives",
];
