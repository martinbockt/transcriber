# Voice Assistant - Second Brain

An AI-powered desktop application for voice recording, transcription, and intelligent content processing built with Tauri 2.0 and Next.js.

## Features

- 🎤 **Voice Recording**: Record audio directly from your microphone with real-time audio level visualization
- 📝 **AI Transcription**: Automatic transcription using OpenAI Whisper API
- 🤖 **Intelligent Processing**: AI-powered intent classification and content extraction using GPT-4o
- 🏷️ **Smart Categorization**: Automatic tagging, summarization, and key fact extraction
- ✅ **Task Management**: Extract and manage to-do items with checkboxes
- 🔍 **Research Mode**: Get AI-generated answers to your questions
- ✍️ **Draft Mode**: Generate polished, ready-to-use content
- 💾 **Local Storage**: All data stored locally with localStorage persistence

## Intent Types

The app automatically classifies your voice input into four categories:

1. **TODO**: Action items and tasks to be completed
2. **RESEARCH**: Questions requiring information or analysis
3. **DRAFT**: Requests to write emails, messages, or documents
4. **NOTE**: General information, observations, or thoughts

## Tech Stack

- **Frontend**: Next.js 16+ (App Router, Static Export)
- **UI Framework**: Tailwind CSS + Shadcn UI (Radix Primitives)
- **Desktop**: Tauri 2.0 (Rust + Webview)
- **AI**: OpenAI API (Whisper for STT, GPT-4o for processing)
- **Language**: TypeScript
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- Rust and Cargo ([Install here](https://rustup.rs/))
- OpenAI API Key ([Get one here](https://platform.openai.com/api-keys))

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd voice-assistant
```

2. Install dependencies:

```bash
pnpm install
```

3. Configure environment variables:

```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:

```
NEXT_PUBLIC_OPENAI_API_KEY=your_actual_api_key_here
```

### Development

#### Option 1: Web Development Mode

Run the Next.js development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Option 2: Tauri Desktop Development Mode

Run the desktop application:

```bash
pnpm tauri:dev
```

This will:

1. Start the Next.js dev server automatically
2. Launch the Tauri desktop window
3. Enable hot-reload for both frontend and Rust code
4. Open DevTools automatically in debug mode

### Building for Production

#### Option 1: Build Web App Only

```bash
pnpm build
```

The static export will be created in the `out/` directory.

#### Option 2: Build Desktop Application

```bash
pnpm tauri:build
```

This will:

1. Build the Next.js app for production
2. Compile the Rust backend
3. Create a native executable for your platform
4. Output the installer in `src-tauri/target/release/bundle/`

The bundle will include:

- **macOS**: `.app` and `.dmg` files
- **Windows**: `.exe` and `.msi` installers
- **Linux**: `.deb`, `.AppImage`, or other formats

## Project Structure

```
├── app/
│   ├── globals.css          # Global styles and Tailwind config
│   ├── layout.tsx            # Root layout component
│   └── page.tsx              # Main application page
├── components/
│   ├── ui/                   # Shadcn UI components
│   ├── Sidebar.tsx           # Sidebar with recording history
│   ├── DetailView.tsx        # Main content detail view
│   ├── TodoView.tsx          # Todo list view
│   ├── ResearchView.tsx      # Research answer view
│   └── DraftView.tsx         # Draft content view
├── hooks/
│   └── useAudioRecorder.ts   # Audio recording hook
├── lib/
│   ├── ai.ts                 # OpenAI API integration
│   ├── mock-data.ts          # Sample data for testing
│   └── utils.ts              # Utility functions
├── src-tauri/
│   ├── Cargo.toml            # Rust dependencies
│   ├── tauri.conf.json       # Tauri configuration
│   ├── build.rs              # Rust build script
│   ├── icons/                # Application icons
│   └── src/
│       ├── main.rs           # Rust entry point
│       └── lib.rs            # Tauri application logic
└── types/
    └── voice-item.ts         # TypeScript interfaces
```

## Usage

1. **Record Audio**: Click the "New Recording" button in the sidebar
2. **Stop Recording**: Click the button again to stop and process
3. **View Results**: The AI will transcribe and process your audio, displaying:
   - Title and summary
   - Extracted tags and key facts
   - Intent-specific content (todos, research answers, or drafts)
   - Original transcript (collapsible)

## Mock Data

The app comes with sample data for testing the UI. Once you start recording, your actual recordings will be stored in localStorage and persist between sessions.

## Privacy & Security

- All recordings are processed through OpenAI's API
- API key is stored in environment variables (not in code)
- Data is stored locally in your browser's localStorage
- No data is sent to any server except OpenAI for processing

## Future Enhancements

- [x] Add Tauri desktop app integration ✅ **COMPLETE**
- [ ] Export functionality (Markdown, JSON, CSV)
- [ ] Search and filter capabilities
- [ ] Audio playback for original recordings
- [ ] Dark mode support
- [ ] Multi-language support

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
