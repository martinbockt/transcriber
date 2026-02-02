# Content Security Policy (CSP) Requirements

## Overview

This document outlines the Content Security Policy requirements for the Voice Assistant Tauri application. The CSP must balance security against XSS attacks while allowing all necessary functionality.

## Current State

The application currently has CSP **completely disabled** (`csp: null` in `src-tauri/tauri.conf.json`), leaving it vulnerable to XSS attacks, particularly when rendering AI-generated content through react-markdown.

## Application Architecture Analysis

### Technology Stack
- **Frontend**: Next.js 16.1.6 (static export) + React 19.2.4
- **Desktop**: Tauri 2.x
- **AI Services**: OpenAI Whisper API + GPT-4o via @ai-sdk/openai
- **UI Components**: Radix UI primitives + Tailwind CSS
- **Markdown**: react-markdown with remark-gfm plugin

### Critical Features Requiring CSP Consideration

#### 1. React/Next.js Rendering
- **Requirement**: Client-side JavaScript execution
- **Files**: All `.tsx` components with "use client" directive
- **CSP Directives Needed**:
  - `script-src`: Allow JavaScript execution
  - `default-src`: Base policy for React rendering

#### 2. OpenAI API Calls
- **Requirement**: External API communication
- **Files**: `lib/ai.ts` (lines 67-87, 91-134)
- **Endpoints**:
  - `https://api.openai.com/v1/audio/transcriptions` (Whisper)
  - `https://api.openai.com/v1/chat/completions` (via @ai-sdk/openai for GPT-4o)
- **CSP Directives Needed**:
  - `connect-src`: Allow fetch/XHR to OpenAI API
  - Must include `https://api.openai.com`

#### 3. Audio Recording/Playback
- **Requirement**: MediaRecorder API and blob URL generation
- **Files**: `hooks/useAudioRecorder.ts`, `hooks/useAudioPlayer.ts`
- **Features**:
  - Records audio via `navigator.mediaDevices.getUserMedia()`
  - Creates blob URLs for audio playback: `URL.createObjectURL(blob)`
  - Uses AudioContext for real-time visualization
  - Stores base64-encoded audio in localStorage
- **CSP Directives Needed**:
  - `media-src`: Allow blob: URLs for audio playback
  - `connect-src`: Allow blob: URLs (for fetch operations on blobs)

#### 4. localStorage Access
- **Requirement**: Local data persistence
- **Files**: `app/page.tsx` (lines 95-133)
- **Data Stored**:
  - Voice item history (including base64 audio data)
  - OpenAI API key (fallback for web mode)
- **CSP Impact**: No CSP restrictions needed (same-origin storage)

#### 5. react-markdown Rendering
- **Requirement**: Safe rendering of AI-generated markdown
- **Files**: `components/MarkdownRenderer.tsx`
- **Security Risk**: **HIGH** - Renders user/AI-controlled content
- **Content Sources**:
  - `researchAnswer` field (AI-generated research responses)
  - `draftContent` field (AI-generated drafts)
- **CSP Directives Needed**:
  - **Must NOT** include `unsafe-inline` for script-src
  - react-markdown uses React's built-in XSS protection
  - External links open in new tabs (`target="_blank"`)
- **Mitigation**: react-markdown escapes HTML by default, preventing script injection

#### 6. Inline Styles from Tailwind
- **Requirement**: CSS class-based styling
- **Files**: All `.tsx` components
- **Analysis**:
  - Uses Tailwind utility classes via `className` prop
  - No inline `style` attributes detected in codebase
  - CSS is bundled and served from same origin
- **CSP Directives Needed**:
  - `style-src 'self'` (no `unsafe-inline` required)
  - If Next.js injects style tags during development, may need special handling

#### 7. Tauri-Specific Requirements
- **Requirement**: Tauri API bridge communication
- **Files**: `lib/ai.ts` (Tauri secure storage), Tauri runtime
- **CSP Directives Needed**:
  - Tauri uses custom protocol schemes (`tauri://`, `asset://`, `http://tauri.localhost`)
  - Must allow Tauri's internal communication protocols
  - Development mode uses `http://localhost:3000`

#### 8. Web Fonts
- **Requirement**: Inter font loading
- **Files**: `app/layout.tsx` (line 4)
- **Implementation**: Uses `next/font` which bundles fonts locally
- **CSP Impact**: No external font sources needed (self-hosted)

#### 9. SVG Icons
- **Requirement**: Lucide React icons
- **Files**: Various components using `lucide-react`
- **Implementation**: Icons are React components (inline SVG)
- **CSP Impact**: No external image sources needed
- **CSP Directives Needed**:
  - `img-src 'self' data:` (for potential data URIs in SVGs)

## Recommended CSP Policy

### Production CSP (Tauri Desktop App)

```json
{
  "default-src": ["'self'", "tauri://localhost", "asset:", "http://tauri.localhost"],
  "script-src": ["'self'", "'wasm-unsafe-eval'"],
  "style-src": ["'self'", "'unsafe-inline'"],
  "connect-src": ["'self'", "https://api.openai.com", "tauri://localhost"],
  "img-src": ["'self'", "data:", "blob:"],
  "media-src": ["'self'", "blob:", "data:"],
  "font-src": ["'self'"],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'none'"]
}
```

### Development CSP (Next.js Dev Server)

```json
{
  "default-src": ["'self'", "http://localhost:3000"],
  "script-src": ["'self'", "'unsafe-eval'", "http://localhost:3000"],
  "style-src": ["'self'", "'unsafe-inline'", "http://localhost:3000"],
  "connect-src": ["'self'", "https://api.openai.com", "http://localhost:3000", "ws://localhost:3000"],
  "img-src": ["'self'", "data:", "blob:", "http://localhost:3000"],
  "media-src": ["'self'", "blob:", "data:"],
  "font-src": ["'self'", "http://localhost:3000"],
  "object-src": ["'none'"],
  "base-uri": ["'self'"]
}
```

**Note**: Development mode requires:
- `'unsafe-eval'` for React Fast Refresh and hot module replacement
- `ws://localhost:3000` in connect-src for webpack dev server WebSocket
- `'unsafe-inline'` for style-src due to Next.js dev mode style injection

## Directive Explanations

### default-src
- **Production**: `'self' tauri://localhost asset: http://tauri.localhost`
- **Purpose**: Default policy for resources not covered by other directives
- **Rationale**: Allow loading from app bundle and Tauri protocols

### script-src
- **Production**: `'self' 'wasm-unsafe-eval'`
- **Purpose**: Control JavaScript execution sources
- **Rationale**:
  - `'self'`: Allow bundled JavaScript from app
  - `'wasm-unsafe-eval'`: Required for WebAssembly (future-proofing, may be needed by dependencies)
  - **NO `'unsafe-inline'`**: Critical for XSS protection
  - **NO `'unsafe-eval'`**: Prevents arbitrary code execution

### style-src
- **Production**: `'self' 'unsafe-inline'`
- **Purpose**: Control CSS sources
- **Rationale**:
  - `'self'`: Allow bundled Tailwind CSS
  - `'unsafe-inline'`: **Required** for:
    - Radix UI components (inject inline styles for positioning)
    - Potential React inline styles
    - Component library internal styling
- **Security Impact**: Low risk (CSS injection is less severe than script injection)

### connect-src
- **Production**: `'self' https://api.openai.com tauri://localhost`
- **Purpose**: Control fetch/XHR/WebSocket destinations
- **Rationale**:
  - `https://api.openai.com`: Required for AI processing (Whisper + GPT-4o)
  - `tauri://localhost`: Tauri IPC communication
  - `blob:`: NOT needed here (blob URLs are data: scheme, covered by media-src)

### img-src
- **Production**: `'self' data: blob:`
- **Purpose**: Control image loading sources
- **Rationale**:
  - `'self'`: App icons and assets
  - `data:`: Data URIs in SVG icons
  - `blob:`: Potential blob-based images (future-proofing)

### media-src
- **Production**: `'self' blob: data:`
- **Purpose**: Control audio/video sources
- **Rationale**:
  - `blob:`: **CRITICAL** - Required for audio playback (`URL.createObjectURL`)
  - `data:`: Base64-encoded audio (used in localStorage)

### font-src
- **Production**: `'self'`
- **Purpose**: Control web font sources
- **Rationale**: Fonts are bundled via next/font (no external sources)

### object-src
- **Production**: `'none'`
- **Purpose**: Block `<object>`, `<embed>`, `<applet>` elements
- **Rationale**: Not used in app, strong security posture

### base-uri
- **Production**: `'self'`
- **Purpose**: Restrict `<base>` tag URLs
- **Rationale**: Prevent base tag hijacking attacks

### form-action
- **Production**: `'self'`
- **Purpose**: Restrict form submission destinations
- **Rationale**: No forms in app, but restricting for security

### frame-ancestors
- **Production**: `'none'`
- **Purpose**: Prevent app from being embedded in iframes
- **Rationale**: Desktop app should never be framed

## Security Considerations

### XSS Attack Vectors

1. **AI-Generated Content** (HIGH RISK)
   - **Threat**: GPT-4o could potentially generate malicious markdown
   - **Mitigation**: react-markdown escapes HTML by default
   - **CSP Protection**: No `unsafe-inline` in script-src prevents injected scripts
   - **Additional Protection**: Structured output validation via Zod schema

2. **User Transcript Input** (MEDIUM RISK)
   - **Threat**: Voice transcripts rendered in UI
   - **Mitigation**: React's JSX auto-escaping
   - **CSP Protection**: Same as above

3. **localStorage Data** (LOW RISK)
   - **Threat**: Malicious data persisted to localStorage
   - **Mitigation**: Data is JSON-serialized and validated on load
   - **CSP Protection**: CSP doesn't affect localStorage, but no code execution possible

### CSP Violations to Monitor

Once CSP is enabled, monitor console for violations to identify:
1. Unexpected inline scripts (would indicate injection attempt)
2. Unauthorized external resource loads
3. Eval-based code execution attempts

### Upgrade Path

**Phase 1**: Implement permissive CSP (report-only mode)
```json
"csp": {
  "mode": "report-only",
  "directives": { ... }
}
```

**Phase 2**: Test thoroughly, fix violations

**Phase 3**: Enable enforcement mode
```json
"csp": {
  "mode": "enforce",
  "directives": { ... }
}
```

## Testing Checklist

After implementing CSP, verify these features still work:

- [ ] New recording button creates recording
- [ ] Audio playback works for existing recordings
- [ ] OpenAI API calls succeed (transcription + processing)
- [ ] Markdown rendering displays correctly (research answers, drafts)
- [ ] localStorage persists and loads data
- [ ] Theme switching works (dark/light mode)
- [ ] Keyboard shortcuts function
- [ ] Export dialog generates files
- [ ] Settings dialog allows API key entry
- [ ] No CSP violations in browser console (in Tauri dev mode)

## References

- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Tauri CSP Documentation](https://tauri.app/v2/reference/config/#securityconfig)
- [Next.js Security Headers](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)
- [OWASP CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)

## Implementation Notes

### Why Tauri CSP, Not Next.js Headers?

The CSP must be configured in `src-tauri/tauri.conf.json` rather than Next.js because:
1. Tauri wraps the Next.js static export in a native window
2. Next.js headers are ignored in static export mode (`output: 'export'`)
3. Tauri's CSP applies to the webview container
4. Tauri enforces CSP at the platform level (Chromium webview)

### Tauri CSP Format

Tauri expects CSP as a JSON object with directive arrays:
```json
"security": {
  "csp": {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'wasm-unsafe-eval'"]
  }
}
```

**NOT** as a single string like HTTP headers:
```
❌ "default-src 'self'; script-src 'self' 'wasm-unsafe-eval';"
```

### Development vs Production

- **Development**: More permissive CSP to allow HMR and dev tools
- **Production**: Strict CSP with minimal unsafe-* directives
- Tauri CLI automatically uses dev URL in `tauri dev` mode
- Production build uses static export from `out/` directory

## Open Questions

1. **Does @ai-sdk/openai require WebSocket connections?**
   - Initial analysis suggests no (uses fetch API)
   - May need `wss://` in connect-src if streaming responses are added

2. **Do any Radix UI components require unsafe-eval?**
   - Current analysis: No
   - Radix uses inline styles (unsafe-inline in style-src) but not eval

3. **Is blob: needed in connect-src?**
   - Blob URLs are typically used in src attributes, not fetch()
   - Including in connect-src for safety (low security risk)

## Future Considerations

1. **Streaming Responses**: If GPT-4o streaming is added, may need WebSocket support
2. **Image Generation**: If DALL-E integration added, needs `https://oaidalleapiprodscus.blob.core.windows.net`
3. **Plugin System**: Any future plugin architecture would need CSP adjustments
4. **Embedded Browser**: If app adds WebView component, needs frame-src policy
