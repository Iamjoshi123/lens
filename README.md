# LENS 🔍

**Ad Creative Discovery & Brief-Building Platform**

LENS helps marketing teams discover high-performing ad creatives, build creative briefs, and collaborate — all in one TikTok-style vertical feed experience.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss)

---

## ✨ Features

- **🎬 Vertical Video Feed** — Browse ads in a TikTok/Reels-style 9:16 player with infinite scroll
- **✂️ Hook Snipper** — Snip the first 3 seconds of any ad to your Hook Bank for reference
- **📋 Creative Brief Builder** — Markdown-powered brief editor with campaign & angle tracking
- **👍 React & Curate** — Like/pass on ads to build a curated collection inside each brief
- **👥 Team Collaboration** — Invite collaborators with role-based access (owner/editor/viewer)
- **🔍 Ad Search** — Full-text search across titles, brands, categories, and platforms
- **📊 Performance Metrics** — View spend, impressions, CTR, engagement rate, and hook rate
- **🗂️ Archive & Organize** — Archive old briefs, manage multiple campaigns simultaneously
- **🌡️ Engagement Heatmap** — Visual heat zones showing hook, proof, and CTA segments on the progress bar
- **📜 Ghost Script** — AI-generated transcript overlay synced with video playback

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([download](https://nodejs.org/))
- **npm** (comes with Node.js)

### Installation

```bash
# Clone the repo
git clone https://github.com/Iamjoshi123/lens.git
cd lens

# Install dependencies
npm install

# Start development server
npm run dev
```

Open **http://localhost:3000/workspace** in your browser.

### Build for Production

```bash
npm run build
npm start
```

---

## 🏗️ Project Structure

```
lens/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── workspace/page.tsx    # Main workspace (video feed + brief)
│   │   ├── layout.tsx            # Root layout with fonts & providers
│   │   └── globals.css           # Global styles & design tokens
│   ├── components/
│   │   ├── HeroPlayer.tsx        # Vertical video player (9:16)
│   │   ├── BriefSidebar.tsx      # Brief editor sidebar
│   │   ├── ReferenceRail.tsx     # Saved video thumbnails rail
│   │   └── TopBar.tsx            # Navigation bar with search
│   └── lib/
│       ├── mockData.ts           # Data models & sample ad data
│       └── store.tsx             # Global state (React Context + useReducer)
├── docs/
│   └── BACKEND_SPEC.md           # Full backend & architecture spec
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🎮 Usage

### Browsing Ads

| Action | Input |
|--------|-------|
| Next ad | Scroll down / ↓ arrow |
| Previous ad | Scroll up / ↑ arrow |
| Play/Pause | Click video or Spacebar |
| Mute/Unmute | 🔊 button (top-right) |

### Building a Brief

1. Browse the video feed
2. **Like** (👍) ads you want to save
3. **Snip Hook** (✂️) to capture the first 3 seconds
4. **Add to Brief** (📋) to save as a reference
5. Open the **sidebar** to edit your brief content
6. **Invite collaborators** from the Team section

---

## 📡 Backend & Architecture

> **For the backend team**: See the full specification at [`docs/BACKEND_SPEC.md`](docs/BACKEND_SPEC.md)

The backend spec covers:

| Section | Description |
|---------|-------------|
| **Data Models** | 10 entities with ER diagram (User, Video, Brief, HookSnippet, etc.) |
| **REST API** | 25+ endpoints with request/response examples |
| **Database Schema** | PostgreSQL DDL with indexes |
| **Video Pipeline** | Ingestion from Meta/TikTok → processing → CDN |
| **Auth & RBAC** | JWT + Google OAuth, 3-role permission matrix |
| **Architecture** | System diagram, recommended stack, deployment topology |
| **Migration Map** | Frontend action → API endpoint mapping (17 actions) |
| **NFRs** | Performance targets, security, observability |
| **Delivery Plan** | 3-phase roadmap (MVP → Ingestion → Collaboration) |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 14](https://nextjs.org/) (App Router) |
| UI | [React 18](https://react.dev/) + [TypeScript 5](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS 3](https://tailwindcss.com/) |
| Animations | [Framer Motion](https://www.framer.com/motion/) |
| State | React Context + useReducer (localStorage persistence) |
| Icons | [Lucide React](https://lucide.dev/) |

---

## 🗺️ Roadmap

- [x] Vertical video feed with autoplay
- [x] Creative brief builder with markdown
- [x] Hook snipper & reference rail
- [x] Like/dislike reactions
- [x] Team collaboration (invite/remove)
- [x] Brief archiving
- [x] Ad search & filtering
- [ ] Backend API (see [spec](docs/BACKEND_SPEC.md))
- [ ] User authentication (JWT + OAuth)
- [ ] Video ingestion pipeline (Meta, TikTok)
- [ ] AI transcript generation
- [ ] Real-time collaboration sync
- [ ] Brief export (PDF)

---

## 📄 License

MIT

---

<p align="center">Built with ❤️ for creative teams</p>
