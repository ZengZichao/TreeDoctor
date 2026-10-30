# TreeDoctor Tech Stack & Dependencies

This document lists all technology choices, third-party dependencies, version requirements, and selection rationale for TreeDoctor.

---

## 1. Rust Core Library Dependencies

### 1.1 Core Dependencies

| Crate | Version | Purpose | Rationale |
|-------|---------|---------|----------|
| `regex` | ^1.10 | Regex matching | Core tool for IQ-TREE output parsing, good performance |
| `serde` | ^1.0 | Serialization/deserialization | Universal, JSON/YAML/TOML compatible |
| `serde_json` | ^1.0 | JSON serialization | CLI JSON output, Tauri IPC |
| `flate2` | ^1.0 | gzip decompression | Decompress `.model.gz` and `.ckp.gz` |
| `thiserror` | ^1.0 | Error type definition | Derive macro for error types |
| `anyhow` | ^1.0 | General error handling | Application-level error propagation |
| `once_cell` | ^1.19 | Lazy initialization | Regex precompilation cache |

### 1.2 Tree Parsing

| Crate | Version | Purpose |
|-------|---------|---------|
| `newick` | ^0.9 or custom | Newick tree parsing |

**Newick Parser Evaluation**:

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Use `newick` crate | Mature, no reinvention | May not support IQ-TREE's `support/ufboot` format | Evaluate first |
| Custom parser | Full control, support IQ-TREE special format | Extra development time | **Recommended**: IQ-TREE Newick has special `SH-aLRT/UFBoot` format |

### 1.3 CLI Dependencies

| Crate | Version | Purpose |
|-------|---------|---------|
| `clap` | ^4.5 | CLI argument parsing | Feature-rich, derive macro |

### 1.4 Tauri Dependencies

| Crate | Version | Purpose |
|-------|---------|---------|
| `tauri` | ^2.0 | Desktop application framework | Small bundle, system WebView |
| `tauri-plugin-dialog` | ^2.0 | File dialog | Directory picker |
| `tauri-plugin-fs` | ^2.0 | File system access | Read directories |

---

## 2. Frontend Dependencies

### 2.1 Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^18.3 | UI framework |
| `react-dom` | ^18.3 | React DOM renderer |
| `react-router-dom` | ^6.26 | Page routing |
| `@tauri-apps/api` | ^2.0 | Tauri JavaScript API |
| `@tauri-apps/plugin-dialog` | ^2.0 | File dialog plugin |
| `@tauri-apps/plugin-fs` | ^2.0 | File system plugin |
| `recharts` | ^2.12 | Data visualization charts |
| `zustand` | ^4.5 | State management |
| `lucide-react` | ^0.451 | Icon library |
| `clsx` | ^2.1 | Class name utility |
| `tailwind-merge` | ^2.5 | TailwindCSS class merging |

### 2.2 Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@tauri-apps/cli` | ^2.0 | Tauri CLI |
| `@types/react` | ^18.3 | React TypeScript types |
| `@types/react-dom` | ^18.3 | ReactDOM TypeScript types |
| `@vitejs/plugin-react` | ^4.3 | Vite React plugin |
| `typescript` | ^5.6 | TypeScript compiler |
| `vite` | ^5.4 | Build tool |
| `tailwindcss` | ^3.4 | CSS framework |
| `postcss` | ^8.4 | CSS processor |
| `autoprefixer` | ^10.4 | CSS autoprefixer |

---

## 3. Toolchain Requirements

### 3.1 Rust Toolchain

| Tool | Version | Purpose |
|------|---------|---------|
| Rust | 1.75+ | Core library, CLI, Tauri backend |
| Cargo | (bundled with Rust) | Package manager, build tool |
| rustup | latest | Rust version manager |

### 3.2 Node.js Toolchain

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 18+ | Frontend build |
| npm | 9+ | Frontend dependency management |

### 3.3 Tauri

| Tool | Version | Purpose |
|------|---------|---------|
| Tauri CLI | 2.x | Tauri build and dev tools |

---

## 4. Project Directory Structure

```
TreeDoctor/
├── Cargo.toml                # Rust workspace config
├── Cargo.lock                # Rust lock file
├── core/                     # Rust core library
│   ├── Cargo.toml
│   └── src/
│       ├── lib.rs            # Library entry
│       ├── error.rs          # Error types
│       ├── models/           # Data models
│       ├── parsers/          # File parsers
│       ├── diagnostics/      # Diagnostic rules
│       ├── crosscheck/       # Cross-validation
│       └── report/           # Report generators
├── cli/                      # CLI tool
│   ├── Cargo.toml
│   └── src/
│       └── main.rs           # CLI entry
├── gui/                      # Tauri GUI application
│   ├── package.json          # Node.js config
│   ├── vite.config.ts        # Vite config
│   ├── tailwind.config.js    # TailwindCSS config
│   ├── tsconfig.json         # TypeScript config
│   ├── src/                  # React frontend source
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── components/       # UI components
│   │   ├── pages/            # Page components
│   │   ├── stores/           # State management
│   │   ├── lib/              # Utilities
│   │   └── types/             # TypeScript types
│   └── src-tauri/            # Tauri backend
│       ├── Cargo.toml
│       ├── tauri.conf.json   # Tauri config
│       ├── build.rs          # Build script
│       ├── src/
│       │   └── main.rs       # Tauri entry
│       ├── capabilities/     # Tauri permissions
│       └── icons/            # App icons
├── test-data/               # Test data
│   └── example/             # IQ-TREE output sample
├── docs/                    # Documentation
│   ├── zh-CN/               # Chinese docs
│   └── en/                  # English docs
├── .github/                 # GitHub config
│   └── ISSUE_TEMPLATE/      # Issue templates
├── .gitignore
├── README.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
└── LICENSE
```

---

## 5. Version Configuration

### 5.1 Current Version: 0.1.0

| Location | Config |
|----------|--------|
| `Cargo.toml` (workspace) | `version = "0.1.0"` |
| `gui/package.json` | `"version": "0.1.0"` |
| `gui/src-tauri/tauri.conf.json` | `"version": "0.1.0"` |
| CLI (`cli/src/main.rs`) | `#[command(version = "0.1.0")]` |

### 5.2 Version Tag Convention

- Tags: `v0.1.0`
- Follow [Semantic Versioning](https://semver.org/)
- Pre-release: `v0.1.0-alpha.1`, `v0.1.0-beta.1`
