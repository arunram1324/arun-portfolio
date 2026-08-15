# Arun K R — UX/UI Portfolio (Angular 19 Standalone Architecture)

A modular, production-ready Angular application designed with clean standalone components, Angular Signals, isolated SCSS styling, and a Voice & Chat **Virtual Twin AI** assistant.

---

## 📁 Architecture & Folder Structure

```
arun-portfolio/
├── angular.json                    # Angular workspace configuration
├── package.json                    # Dependencies & scripts
├── tsconfig.json                   # TypeScript configuration
├── tsconfig.app.json               # Application TS target configuration
│
└── src/
    ├── index.html                  # Single root HTML with Google Fonts & meta tags
    ├── main.ts                     # Standalone application bootstrap entry
    ├── styles.scss                 # Main SCSS bundle
    │
    ├── styles/                     # Modular SCSS design system
    │   ├── _variables.scss         # Theme tokens (Light / Dark mode, colors, dimensions)
    │   ├── _typography.scss        # Font pairings (Big Shoulders Display & DM Sans)
    │   ├── _mixins.scss            # Glassmorphism, scrollbars, responsive mixins
    │   └── _reset.scss             # Animations (@keyframes) & global CSS resets
    │
    └── app/
        ├── app.component.ts        # Root layout shell
        ├── app.component.html      # Responsive layout template
        ├── app.component.scss      # Layout shell styling
        ├── app.config.ts           # Application providers & animations
        │
        ├── core/                   # Single-source-of-truth services & types
        │   ├── models/
        │   │   ├── portfolio.model.ts  # Types for Projects, Work Exp, Tools, Messages
        │   │   └── theme.model.ts      # 'light' | 'dark' mode types
        │   └── services/
        │       ├── theme.service.ts              # Theme signals & localStorage persistence
        │       ├── navigation.service.ts         # Active view signals & title computed
        │       ├── portfolio-data.service.ts     # Work experience, case studies & tools
        │       ├── speech-recognition.service.ts # Web Speech Recognition API wrapper
        │       ├── speech-synthesis.service.ts   # Web Speech Synthesis with natural voices
        │       └── virtual-twin.service.ts       # AI fallback & query answering engine
        │
        ├── shared/                 # Reusable UI components & services
        │   ├── services/
        │   │   └── toast.service.ts              # Global clipboard copy alerts
        │   └── components/
        │       ├── toast/                        # Toast notification banner
        │       └── panel-card/                   # Split-card layout with accent monogram
        │
        ├── layout/                 # Shell navigation components
        │   ├── sidebar/                          # Desktop & tablet drawer sidebar
        │   ├── topbar/                           # Header bar with theme toggle & title
        │   └── bottom-nav/                       # Mobile 5-item thumb navigation
        │
        └── features/               # Independent feature view components
            ├── virtual-twin/                     # Voice AI + Chat AI container
            │   └── components/
            │       ├── voice-stage/              # Morphing voice blob + mic session
            │       └── chat-stage/               # Chat UI with quick prompts & typing
            ├── self-intro/                       # Bio, hero figure & industry tags
            ├── work-experience/                  # Timeline with quantified UX metrics
            ├── projects/                         # 2-column case study grid + pagination
            ├── tools/                            # Design & dev toolkit chip grid
            ├── skills/                           # Core competencies chip grid
            └── contact/                          # Direct contact links with 1-click copy
```

---

## 🚀 How to Run Locally

1. **Navigate to the project directory**:
   ```bash
   cd /Users/arunkr/.gemini/antigravity/scratch/arun-portfolio
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start Development Server**:
   ```bash
   npm start
   # or
   npx ng serve
   ```

4. **Open in Browser**:
   Open [http://localhost:4200](http://localhost:4200)

5. **Build for Production**:
   ```bash
   npm run build
   ```
   The compiled bundle will be available in the `dist/arun-portfolio` directory ready for deployment on Vercel, Netlify, or Firebase Hosting.

---

## ✨ Features & Upgrades

1. **Virtual Twin Voice & Chat AI**:
   - Web Speech API integration with **acoustic feedback prevention** (mic automatically pauses while AI voice speaks).
   - Natural voice selection (Google US English, Samantha, etc.).
   - Interactive morphing glowing blob animations (`listening`, `speaking`, `idle`).
2. **Modular SCSS Architecture**:
   - Zero inline CSS.
   - Clean SCSS modules with CSS custom properties for instant Light/Dark mode switching.
3. **Data-Driven Architecture**:
   - All projects, experiences, tools, and links are managed centrally in `PortfolioDataService`.
4. **WCAG & Responsive First**:
   - Semantic buttons, ARIA labels, keyboard focus states, and fluid responsive layouts for mobile, tablet, and desktop.
