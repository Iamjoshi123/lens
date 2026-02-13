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

// Public domain / Creative Commons sample videos
export const MOCK_VIDEOS: VideoItem[] = [
    {
        id: "v1",
        title: "Glowing Skin Serum – Social Proof UGC",
        brand: "LumiSkin",
        platform: "meta",
        category: "Skincare",
        thumbnail: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        duration: 15,
        heatmapZones: [
            { start: 0, end: 20, type: "hook", label: "Attention Hook" },
            { start: 35, end: 60, type: "proof", label: "Social Proof" },
            { start: 80, end: 100, type: "cta", label: "Call to Action" },
        ],
        transcript: [
            { time: 0, text: "POV: You finally found the serum everyone's been talking about..." },
            { time: 2, text: "I've been using this for 3 weeks and the glow is REAL" },
            { time: 5, text: "Look at my skin before vs. after" },
            { time: 8, text: "Over 50,000 five-star reviews can't be wrong" },
            { time: 11, text: "Use code GLOW20 for 20% off your first order" },
            { time: 13, text: "Link in bio – your skin will thank you ✨" },
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
        title: "Unboxing – Premium Pet Supplements",
        brand: "PawVitals",
        platform: "tiktok",
        category: "Pet Care",
        thumbnail: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        duration: 15,
        heatmapZones: [
            { start: 0, end: 18, type: "hook", label: "Curiosity Hook" },
            { start: 40, end: 65, type: "proof", label: "Ingredient Breakdown" },
            { start: 85, end: 100, type: "cta", label: "Shop Now CTA" },
        ],
        transcript: [
            { time: 0, text: "My vet said I needed to try these for my senior dog..." },
            { time: 3, text: "Opening up the PawVitals starter kit" },
            { time: 5, text: "Each chew has glucosamine, omega-3, and probiotics" },
            { time: 8, text: "Cooper has been so much more active since we started" },
            { time: 11, text: "Seriously, look at him running again at age 12!" },
            { time: 13, text: "Get 30% off your first order today" },
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
        title: "Morning Routine – Matcha Focus Blend",
        brand: "ZenBrew",
        platform: "meta",
        category: "Beverages",
        thumbnail: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerFun.jpg",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
        duration: 60,
        heatmapZones: [
            { start: 0, end: 15, type: "hook", label: "ASMR Hook" },
            { start: 25, end: 50, type: "proof", label: "Benefits Walkthrough" },
            { start: 75, end: 100, type: "cta", label: "Limited Offer CTA" },
        ],
        transcript: [
            { time: 0, text: "5 AM. No coffee. Just this." },
            { time: 3, text: "*whisking sounds* Ceremonial grade matcha + lion's mane" },
            { time: 8, text: "No jitters. No crash. Just clean 6-hour focus." },
            { time: 15, text: "I switched from coffee 6 months ago and haven't looked back" },
            { time: 25, text: "Each serving has 137x more antioxidants than green tea" },
            { time: 40, text: "Thousands of professionals are making the switch" },
            { time: 50, text: "First 100 orders get a free bamboo whisk set" },
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
        title: "Skit – Gym Supplements Nobody Tells You About",
        brand: "IronFuel",
        platform: "tiktok",
        category: "Fitness",
        thumbnail: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerJoyrides.jpg",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
        duration: 15,
        heatmapZones: [
            { start: 0, end: 22, type: "hook", label: "Comedy Hook" },
            { start: 30, end: 55, type: "proof", label: "Product Demo" },
            { start: 70, end: 100, type: "cta", label: "Discount CTA" },
        ],
        transcript: [
            { time: 0, text: "Me explaining to my gym bro why I take creatine HCL..." },
            { time: 3, text: "Him: 'Bro isn't that just fancy creatine?'" },
            { time: 5, text: "Me: *pulls out the research*" },
            { time: 8, text: "Better absorption, no bloating, proven results" },
            { time: 11, text: "His face when he sees my 3-month transformation" },
            { time: 13, text: "Code IRON40 for 40% off – link in bio" },
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
        title: "Founder Story – Sustainable Fashion Brand",
        brand: "ThreadEarth",
        platform: "youtube",
        category: "Fashion",
        thumbnail: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerMeltdowns.jpg",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
        duration: 15,
        heatmapZones: [
            { start: 0, end: 12, type: "hook", label: "Emotional Hook" },
            { start: 20, end: 50, type: "proof", label: "Mission Story" },
            { start: 60, end: 80, type: "proof", label: "Impact Stats" },
            { start: 85, end: 100, type: "cta", label: "Join Movement CTA" },
        ],
        transcript: [
            { time: 0, text: "I quit my job at a fast-fashion giant to build this" },
            { time: 3, text: "Every piece is made from recycled ocean plastic" },
            { time: 6, text: "We've cleaned over 2 million pounds of waste" },
            { time: 9, text: "Fashion shouldn't cost the earth" },
            { time: 12, text: "Join 80,000+ people wearing change – Shop now" },
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
        title: "ASMR – Luxury Candle Unboxing",
        brand: "AuraLux",
        platform: "meta",
        category: "Home & Living",
        thumbnail: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        duration: 52,
        heatmapZones: [
            { start: 0, end: 15, type: "hook", label: "ASMR Visual Hook" },
            { start: 30, end: 55, type: "proof", label: "Scent Description" },
            { start: 80, end: 100, type: "cta", label: "Gift Set CTA" },
        ],
        transcript: [
            { time: 0, text: "*gentle unwrapping sounds* This is the most beautiful candle I've ever seen" },
            { time: 5, text: "Hand-poured soy wax, 60 hour burn time" },
            { time: 10, text: "The scent notes: bergamot, cedar, and vanilla" },
            { time: 20, text: "Look at that amber glass... this is art" },
            { time: 35, text: "Their gift set comes with a match cloche and snuffer" },
            { time: 45, text: "Perfect for Valentine's Day – ships in 2 days" },
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
        title: "Quick Meal Prep – Protein Bowl Kit",
        brand: "FuelPlate",
        platform: "tiktok",
        category: "Food & Beverage",
        thumbnail: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/SubaruOutbackOnStreetAndDirt.jpg",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        duration: 60,
        heatmapZones: [
            { start: 0, end: 15, type: "hook", label: "Speed Hook" },
            { start: 30, end: 55, type: "proof", label: "Nutrition Breakdown" },
            { start: 80, end: 100, type: "cta", label: "Subscribe CTA" },
        ],
        transcript: [
            { time: 0, text: "POV: You meal prep in under 5 minutes..." },
            { time: 3, text: "Everything comes pre-portioned in this box" },
            { time: 8, text: "42g of protein, zero prep, zero mess" },
            { time: 15, text: "I've been eating these every day for a month" },
            { time: 30, text: "Each bowl is chef-designed and macro-balanced" },
            { time: 45, text: "Subscribe and save 25% on your first month" },
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
        title: "Sleep Tech – Smart Cooling Pillow",
        brand: "DreamLayer",
        platform: "meta",
        category: "Sleep & Wellness",
        thumbnail: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/TearsOfSteel.jpg",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
        duration: 60,
        heatmapZones: [
            { start: 0, end: 12, type: "hook", label: "Problem Hook" },
            { start: 25, end: 50, type: "proof", label: "Tech Demo" },
            { start: 75, end: 100, type: "cta", label: "Risk-Free CTA" },
        ],
        transcript: [
            { time: 0, text: "If you wake up sweating, watch this" },
            { time: 4, text: "This pillow has actual cooling gel channels" },
            { time: 10, text: "It maintains 68°F all night — I tested it" },
            { time: 20, text: "NASA-grade memory foam adapts to your neck curve" },
            { time: 40, text: "100-night risk-free trial, free returns" },
            { time: 50, text: "Use code SLEEP30 for $30 off" },
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
        title: "Before/After – Teeth Whitening Strips",
        brand: "BrightByte",
        platform: "tiktok",
        category: "Personal Care",
        thumbnail: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/VolkswagenGTIReview.jpg",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
        duration: 15,
        heatmapZones: [
            { start: 0, end: 20, type: "hook", label: "Transformation Hook" },
            { start: 35, end: 60, type: "proof", label: "Before/After" },
            { start: 80, end: 100, type: "cta", label: "Discount CTA" },
        ],
        transcript: [
            { time: 0, text: "Day 1 vs Day 7 — I can't believe this worked" },
            { time: 3, text: "These strips dissolve in 15 minutes, no sensitivity" },
            { time: 6, text: "Look at the difference *shows teeth*" },
            { time: 9, text: "The enamel-safe formula is dentist approved" },
            { time: 12, text: "Link in bio — buy 2 get 1 free this week" },
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
        title: "Day in My Life – Remote Work Desk Setup",
        brand: "DeskCraft",
        platform: "youtube",
        category: "Office & Productivity",
        thumbnail: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/WeAreGoingOnBullrun.jpg",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
        duration: 60,
        heatmapZones: [
            { start: 0, end: 10, type: "hook", label: "Lifestyle Hook" },
            { start: 20, end: 45, type: "proof", label: "Product Showcase" },
            { start: 70, end: 100, type: "cta", label: "Bundle CTA" },
        ],
        transcript: [
            { time: 0, text: "How I built the perfect WFH setup under $500" },
            { time: 5, text: "This standing desk converts in 3 seconds" },
            { time: 15, text: "Cable management tray hides everything" },
            { time: 30, text: "The monitor arm saves so much desk space" },
            { time: 45, text: "My productivity is up 40% since switching" },
            { time: 55, text: "Full bundle link in description — 20% off" },
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
        title: "Listicle – 5 Running Shoes Under $100",
        brand: "StrideMax",
        platform: "meta",
        category: "Fitness",
        thumbnail: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/WhatCarCanYouGetForAGrand.jpg",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        duration: 15,
        heatmapZones: [
            { start: 0, end: 18, type: "hook", label: "Listicle Hook" },
            { start: 25, end: 55, type: "proof", label: "Product Comparisons" },
            { start: 75, end: 100, type: "cta", label: "Shop CTA" },
        ],
        transcript: [
            { time: 0, text: "5 running shoes that outperform $200 pairs" },
            { time: 2, text: "Number 5 will surprise you..." },
            { time: 5, text: "CloudStep Pro — 280g, responsive foam, $79" },
            { time: 8, text: "StrideMax Air — my daily driver, $89" },
            { time: 11, text: "All links in bio — which one are you grabbing?" },
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
        title: "Emotional – Rescue Dog Adoption Story",
        brand: "PawHaven",
        platform: "meta",
        category: "Non-Profit",
        thumbnail: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        duration: 15,
        heatmapZones: [
            { start: 0, end: 15, type: "hook", label: "Emotional Hook" },
            { start: 20, end: 55, type: "proof", label: "Story Arc" },
            { start: 80, end: 100, type: "cta", label: "Donate CTA" },
        ],
        transcript: [
            { time: 0, text: "This is Max. He was found in a parking lot, alone." },
            { time: 3, text: "Today is his 1-year adoption anniversary" },
            { time: 6, text: "Look at him now — healthy, happy, loved" },
            { time: 9, text: "Every $25 helps rescue another dog like Max" },
            { time: 12, text: "Tap to donate — every share helps too" },
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
