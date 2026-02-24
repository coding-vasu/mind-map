# 🧠 MindMap - Futuristic Mind Mapping Tool

A high-performance, futuristic, and premium mind-mapping application built with **React Flow**, **Zustand**, and **Immer**. Designed with a glassmorphic aesthetic and geared towards speed and productivity.

![GitHub License](https://img.shields.io/github/license/coding-vasu/mind-map)
![React Version](https://img.shields.io/badge/react-19.0-blue)
![Vite Version](https://img.shields.io/badge/vite-7.0-purple)

## ✨ Features

- **🚀 High Performance**: Built with `@xyflow/react` for smooth interaction with large maps.
- **🎨 Glassmorphic UI**: A premium, futuristic look with light and dark mode support.
- **📂 Space Management**: Organize your thoughts into multiple distinct workspaces (Spaces).
- **⚡ Keyboard Centric**: Full support for keyboard shortcuts to maximize productivity.
- **🛠 Semantic Styling**: Automatic node coloring based on branch or depth, with mood-based semantic icons.
- **🔄 Auto-Layout**: Built-in Dagre layout engine for automatic organization (Horizontal, Vertical, Radial).
- **📝 Rich Editing**: Tiptap-powered rich text editing within nodes.
- **💾 Offline Ready**: Local-first persistence using IndexedDB (via `idb-keyval`).
- **📥 Import/Export**: Save maps as JSON or export them as high-quality PNG images.
- **🧠 Brainstorming Mode**: Rapidly add multiple topics in one go.

## ⌨️ Keyboard Shortcuts

| Shortcut                 | Action                    |
| :----------------------- | :------------------------ |
| `Tab`                    | Add Child Node            |
| `Enter`                  | Add Sibling Node          |
| `Space` / `Double Click` | Edit Node Content         |
| `Backspace` / `Delete`   | Delete Node (and subtree) |
| `B`                      | Toggle Brainstorm Mode    |
| `Cmd/Ctrl + Z`           | Undo                      |
| `Cmd/Ctrl + Shift + Z`   | Redo                      |
| `Arrow Keys`             | Navigate between nodes    |

## 🛠 Tech Stack

- **Framework**: [React 19](https://reactjs.org/)
- **Node Engine**: [React Flow (v12)](https://reactflow.dev/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) with [Immer](https://immerjs.github.io/immer/) and [Zundo](https://github.com/charkour/zundo)
- **Styling**: Vanilla CSS with futuristic glassmorphism tokens
- **Icons**: [Lucide React](https://lucide.dev/)
- **Rich Text**: [Tiptap](https://tiptap.dev/)
- **Layout**: [Dagre](https://github.com/dagrejs/dagre)
- **Persistence**: IndexedDB via [idb-keyval](https://github.com/jakearchibald/idb-keyval)

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/coding-vasu/mind-map.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 🤝 Contributing

Contributions are welcome! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
