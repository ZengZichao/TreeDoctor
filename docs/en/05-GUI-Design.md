# TreeDoctor GUI Design Specification

This document defines the complete UI/UX design specification for the TreeDoctor desktop application (based on Tauri 2.x), including page structure, interaction flows, component design, and visual standards.

---

## 1. Tech Stack

| Layer | Technology | Version | Description |
|-------|-----------|---------|-------------|
| Desktop framework | Tauri | 2.x | Cross-platform desktop shell |
| Backend language | Rust | 1.75+ | Shared with core library |
| Frontend framework | React | 18.x | Component-based UI |
| Frontend language | TypeScript | 5.x | Type safety |
| CSS framework | TailwindCSS | 3.x | Atomic CSS |
| Chart library | Recharts | 2.x | Data visualization |
| Icon library | lucide-react | 0.451+ | Lightweight SVG icons |
| Tree visualization | Custom component | Built-in | Newick tree SVG rendering (responsive + topology mode) |
| State management | Zustand | 4.x | Lightweight state management |
| Router | Custom routing | Built-in | useState-based lightweight routing (desktop app) |
| Export dialog | @tauri-apps/plugin-dialog | 2.x | Native save dialog |
| File system | @tauri-apps/plugin-fs | 2.x | File writing |

---

## 2. Application Window

### 2.1 Window Specifications

| Property | Value |
|----------|-------|
| Min width | 900px |
| Min height | 600px |
| Default width | 1280px |
| Default height | 800px |
| Title | "TreeDoctor - IQ-TREE Analysis Quality Diagnostics" |
| Icon | TreeDoctor icon |

### 2.2 Theme

- Default theme: Light
- Optional themes: Dark, System
- Primary color: Green (consistent with phylogenetic tree theme)

---

## 3. Page Structure

### 3.1 Overall Layout

```
┌─────────────────────────────────────────────────────────┐
│  TopBar: Title | Toggle Sidebar | Export               │
├──────────┬──────────────────────────────────────────────┤
│          │                                              │
│  Sidebar │  Main Content Area                           │
│          │                                              │
│  - Home  │  (changes based on selected page)            │
│  - Over- │                                              │
│    view  │                                              │
│  - D1    │                                              │
│  - D2    │                                              │
│  ...     │                                              │
│  - Rules │                                              │
│          │                                              │
└──────────┴──────────────────────────────────────────────┘
```

### 3.2 Page List

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | File selection, drag-drop |
| Overview | `/overview` | Quality dashboard with overall grade |
| D1: Alignment | `/alignment` | Alignment quality details |
| D2: Model | `/model` | Model selection details |
| D3: Likelihood | `/likelihood` | Likelihood & information criteria |
| D4: Topology | `/topology` | Tree topology & branch lengths |
| D5: Support | `/support` | Branch support values |
| D6: Bootstrap | `/bootstrap` | Bootstrap convergence |
| D7: Consensus | `/consensus` | Consensus tree consistency |
| D8: Runtime | `/runtime` | Runtime parameters |
| Cross-Check | `/cross-check` | Cross-validation results |
| Raw Data | `/raw-data` | Raw parsed data viewer |
| Rules | `/rules` | Diagnostic rules list |

---

## 4. Key Pages

### 4.1 Home Page

- File selection via drag-drop or directory picker
- Auto-detection of IQ-TREE output prefix
- Shows found files with status indicators
- "Analyze" button to start analysis

### 4.2 Overview Page

- Overall grade badge (A-F) with color
- Dimension grade cards (8 cards in grid)
- Key findings list
- Cross-validation summary

### 4.3 Dimension Pages (D1-D8)

Each dimension page contains:
- Dimension header with grade badge
- Individual diagnostic rule results
- Expandable detail sections
- Metrics visualization (charts where applicable)
- Recommendation text

### 4.4 Cross-Check Page

- List of 7 cross-validation checks
- Pass/fail status for each
- Detailed message for failures

### 4.5 Raw Data Page

- JSON tree view of complete AnalysisReport
- Collapsible sections for each data type
- Copy-to-clipboard functionality

---

## 5. Component Design

### 5.1 GradeBadge

Displays A-F grade with appropriate color:
- A: Green (#28a745)
- B: Light Green (#6ec06e)
- C: Yellow (#ffc107)
- D: Orange (#fd7e14)
- F: Red (#dc3545)

### 5.2 DiagnosticCard

Shows individual diagnostic rule results:
- Rule ID and name
- Grade badge
- Summary text
- Expandable detail and recommendation
- Metrics display

### 5.3 StatCard

Displays key statistics with icon and value.

### 5.4 TreeView

Renders Newick tree with:
- Branch lengths proportional (cumulative branch length on x-axis)
- Support values displayed
- Color-coded by support level
- Zoom and pan support
- Responsive width via ResizeObserver
- Topology mode (no branch lengths) with badge indicator
- Zero branch length handled correctly (Number.isFinite)

### 5.5 CollapsibleSection

Expandable/collapsible content sections for organizing detailed information.

---

## 6. Visual Standards

### 6.1 Color Palette

| Usage | Color | Hex |
|-------|-------|-----|
| Primary | Green | #16a34a |
| Grade A | Green | #22c55e |
| Grade B | Light Green | #84cc16 |
| Grade C | Yellow | #eab308 |
| Grade D | Orange | #f97316 |
| Grade F | Red | #ef4444 |
| Grade N | Gray | #9ca3af (Not Evaluated) |
| Background | Slate-50 | #f8fafc |
| Text | Slate-900 | #0f172a |
| Border | Slate-200 | #e2e8f0 |

### 6.2 Typography

- Font family: System UI fonts (San Francisco, Segoe UI, etc.)
- Heading sizes: 1.875rem (h1), 1.5rem (h2), 1.25rem (h3)
- Body text: 0.875rem (14px)

---

## 7. Interaction Design

### 7.1 File Selection Flow

1. User drags directory or clicks "Select Directory"
2. App scans for IQ-TREE output files
3. Shows found files with checkmarks
4. User clicks "Analyze"
5. Progress indicator while parsing
6. Results displayed in Overview page

### 7.2 Navigation

- Sidebar for page navigation
- Breadcrumb not needed (single-level navigation)
- Browser back/forward supported via state routing

### 7.3 Export

- Export as Markdown, JSON, or Text
- File save dialog for choosing output location
- Toast notifications for success/failure
- Example data export is blocked with toast warning

### 7.4 Accessibility

- All color combinations meet WCAG AA contrast standards (≥4.5:1)
- Grade badges have `role="img"` and `aria-label` attributes
- Interactive elements have `aria-expanded`, `aria-haspopup`, `aria-label`
- Toast notifications use `role="status"` and `aria-live="polite"`
- Tree visualization has `role="figure"` and `aria-label`
- All clickable elements support keyboard operation (Enter / Space)
- Site-wide `td-focus-ring` focus ring styles

### 7.5 Internationalization

- Default language: Chinese (zh-CN)
- Optional language: English (en)
- Custom translation table (`lib/i18n.ts`) with type-safe `Translation` interface
- Language switch syncs `<html lang>` and `document.title`
- Date formatting uses locale-aware `toLocaleString()`

---

## 8. Packaging

### 8.1 Build Output

| Platform | Format | Size |
|----------|--------|------|
| Windows | `.msi` + `.exe` (NSIS) | 4.09 MB (msi) / 2.76 MB (nsis) |
| macOS | `.dmg` | Universal Binary |
| Linux | `.AppImage` + `.deb` | Portable + Debian |

### 8.2 Build Command

```bash
# Prerequisites: Rust 1.75+, Node.js 18+
cd gui
npm install
npm run tauri build
# Output: target/release/TreeDoctor.exe
```
