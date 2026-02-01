# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Tauri 2.0 + Next.js 14 hybrid desktop application for AI-powered voice recording, transcription, and intelligent content processing. The app uses OpenAI Whisper for speech-to-text and GPT-4o for intent classification and content extraction.

## Common Development Commands

### Frontend Development
```bash
pnpm dev              # Start Next.js dev server at localhost:3000
pnpm build            # Build Next.js for production (static export to out/)
pnpm lint             # Run ESLint
```

### Desktop Development
```bash
pnpm tauri:dev        # Run Tauri + Next.js in desktop mode (auto-opens DevTools)
pnpm tauri:build      # Build production desktop app (creates native installers)
pnpm tauri <command>  # Run any Tauri CLI command
```

### Dependency Management
```bash
pnpm install          # Install all dependencies
```

**Note**: This project uses `pnpm` as the package manager, not npm or yarn.

## Architecture

### Hybrid Desktop/Web Application

The app can run as both a web application (via Next.js) and a native desktop application (via Tauri). The architecture accommodates both modes:

- **Web Mode**: Next.js dev server runs standalone at `localhost:3000`
- **Desktop Mode**: Tauri wraps the Next.js frontend in a native window
- **Build Output**: Next.js builds to static files (`output: 'export'`) which Tauri bundles into the desktop app

### Two-Stage AI Processing Pipeline

The core processing flow has two distinct stages:

1. **Transcription Stage** ([lib/ai.ts:24](lib/ai.ts#L24)):
   - Audio blob → OpenAI Whisper API
   - Returns plain text transcript
   - Direct API call using `fetch`

2. **Content Processing Stage** ([lib/ai.ts:57](lib/ai.ts#L57)):
   - Transcript → OpenAI GPT-4o with structured output
   - Uses `@ai-sdk/openai` with `generateObject` for type-safe responses
   - Extracts: title, tags, summary, key facts, intent, and intent-specific data
   - Schema validation via Zod

The two-stage approach separates transcription concerns from content analysis, making it easier to swap AI providers or adjust processing logic independently.

### Intent-Based Content Classification

The app automatically classifies voice inputs into 4 intent types ([types/voice-item.ts:1](types/voice-item.ts#L1)):

- **TODO**: Extracts action items with task descriptions and optional due dates
- **RESEARCH**: Generates AI answers to questions
- **DRAFT**: Creates polished, ready-to-use content (emails, messages, documents)
- **NOTE**: General information storage (no special processing)

Each intent determines which fields in the `data` object are populated. The UI conditionally renders intent-specific views ([components/DetailView.tsx](components/DetailView.tsx)) based on the intent type.

### State Management & Persistence

- **No State Management Library**: Uses React's built-in `useState` and `useEffect`
- **Single Source of Truth**: Main state lives in [app/page.tsx](app/page.tsx#L16)
- **localStorage Persistence** ([app/page.tsx:13](app/page.tsx#L13)):
  - All `VoiceItem[]` data persists to localStorage under key `voice-assistant-history`
  - Loaded on mount, saved on every change
  - Includes base64-encoded audio data for playback
- **Mock Data Fallback**: [lib/mock-data.ts](lib/mock-data.ts) provides sample data for first-time users

### Custom Hooks Architecture

Three custom hooks encapsulate complex stateful logic:

1. **useAudioRecorder** ([hooks/useAudioRecorder.ts](hooks/useAudioRecorder.ts)):
   - Manages `MediaRecorder` API and `AudioContext` for visualization
   - Returns audio blob when recording stops
   - Provides real-time audio level for UI feedback

2. **useAudioPlayer** ([hooks/useAudioPlayer.ts](hooks/useAudioPlayer.ts)):
   - Handles playback of base64-encoded audio data
   - Manages play/pause state and audio element lifecycle

3. **useKeyboardShortcuts** ([hooks/useKeyboardShortcuts.ts](hooks/useKeyboardShortcuts.ts)):
   - Implements global keyboard shortcuts (Cmd+N, Cmd+D, Cmd+/, Escape)
   - Prevents shortcuts during text input

### Component Structure

- **Main Layout** ([app/page.tsx](app/page.tsx)): Orchestrates all state and renders Sidebar + DetailView
- **Sidebar** ([components/Sidebar.tsx](components/Sidebar.tsx)): Lists all voice items, shows recording state
- **DetailView** ([components/DetailView.tsx](components/DetailView.tsx)): Renders active item with intent-specific views
- **Intent-Specific Views**: TodoView, ResearchView, DraftView for specialized content rendering
- **UI Components** ([components/ui/](components/ui/)): Shadcn UI components (Radix primitives + Tailwind)

### Tauri Integration

The Rust backend ([src-tauri/src/lib.rs](src-tauri/src/lib.rs)) is minimal:
- Initializes Tauri with shell plugin
- Auto-opens DevTools in debug mode
- No custom commands or backend logic (all processing happens in frontend via API calls)

Tauri configuration ([src-tauri/tauri.conf.json](src-tauri/tauri.conf.json)):
- Points to Next.js dev server in dev mode (`devUrl: http://localhost:3000`)
- Uses static export (`frontendDist: ../out`) for production builds
- Window config: 1400x900 default, 1000x600 minimum

### TypeScript Configuration

- Path alias: `@/*` maps to project root ([tsconfig.json:20](tsconfig.json#L20))
- Strict mode enabled
- All imports use `@/` prefix (e.g., `@/components/Sidebar`)

## Environment Variables

Required environment variable:
- `NEXT_PUBLIC_OPENAI_API_KEY`: OpenAI API key for Whisper and GPT-4o

Copy `.env.example` to `.env` and add your API key. The `NEXT_PUBLIC_` prefix makes it available in the browser (Next.js requirement for client-side API calls).

## Key Data Flows

### Recording → Processing Flow

1. User clicks "New Recording" button in Sidebar
2. `useAudioRecorder.start()` requests microphone access and begins recording
3. User clicks button again to stop
4. `useAudioRecorder.stop()` produces audio Blob
5. [app/page.tsx:55](app/page.tsx#L55) `useEffect` detects blob and calls `handleProcessAudio`
6. `processVoiceRecording` (lib/ai.ts) executes two-stage pipeline
7. New `VoiceItem` added to state array (prepended to list)
8. Item auto-selected and rendered in DetailView
9. State change triggers localStorage save

### Todo Toggle Flow

1. User clicks checkbox in TodoView
2. Event bubbles to [app/page.tsx:87](app/page.tsx#L87) `handleToggleTodo`
3. Immutable state update toggles `done` flag for specific todo
4. React re-renders with updated state
5. localStorage automatically syncs

## Testing Notes

- No formal test suite currently exists
- Manual testing via `pnpm dev` or `pnpm tauri:dev`
- Mock data in [lib/mock-data.ts](lib/mock-data.ts) can be used to test UI without API calls

## Build Artifacts

- **Web**: `out/` directory contains static HTML/CSS/JS
- **Desktop**: `src-tauri/target/release/bundle/` contains platform-specific installers:
  - macOS: `.app` and `.dmg`
  - Windows: `.exe` and `.msi`
  - Linux: `.deb`, `.AppImage`, etc.
