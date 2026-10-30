# TreeDoctor Project Overview

## 1. Background

IQ-TREE is one of the most widely used maximum-likelihood phylogenetic tree inference software, supporting IQ-TREE 2 (v2.4.0) and IQ-TREE 3 (v3.1.4). A typical IQ-TREE analysis produces multiple output files containing model selection results, likelihood values, branch support values, sequence quality statistics, and other key information. However, this information is scattered across `.iqtree`, `.log`, `.treefile`, `.contree`, `.splits.nex`, `.mldist`, `.model.gz`, and other files. Researchers must manually cross-check these files to assess analysis quality—a tedious process prone to missing critical issues.

**TreeDoctor** aims to automate this process: parse all IQ-TREE output files, perform comprehensive cross-validation, and generate a clear, actionable quality diagnostic report to help researchers quickly identify potential problems and reduce the risk of misinterpreting phylogenetic analyses.

## 2. Project Goals

### 2.1 Core Goals

| ID | Goal | Description |
|----|------|-------------|
| G1 | Full File Parsing | Automatically recognize and parse all IQ-TREE output file types |
| G2 | Quality Diagnostics | Perform multi-dimensional quality assessment for each analysis stage, outputting grades and recommendations |
| G3 | Cross-Validation | Cross-check data consistency across files to discover potential contradictions |
| G4 | Dual Interface | Provide both CLI (command-line) and GUI (desktop) interfaces |
| G5 | Version Compatibility | Support output format differences between IQ-TREE 2.x and 3.x |

### 2.2 Non-Goals (Explicitly Not Doing)

- TreeDoctor **does not re-run** IQ-TREE analyses; it does not replace IQ-TREE itself
- TreeDoctor **does not modify** IQ-TREE output files
- TreeDoctor **does not perform** new phylogenetic inference or model computation
- TreeDoctor **is not** a tree visualization tool (but may use external tools or embed lightweight visualization)

## 3. Target Users

| User Type | Typical Scenario | Recommended Interface |
|-----------|-----------------|----------------------|
| Bioinformatics researchers | Batch-checking multiple analysis results | CLI |
| Evolutionary biologists | Interactively viewing single analysis quality | GUI |
| Teaching scenarios | Explaining phylogenetic analysis metrics to students | GUI |
| Pipeline integration | Embedding quality checks in automated workflows | CLI (JSON output) |

## 4. Technology Overview

### 4.1 GUI Framework: Tauri

| Dimension | Tauri | Electron |
|-----------|-------|----------|
| Bundle size | ~3-10 MB | ~50-150 MB |
| Memory usage | Low (uses system WebView) | High (bundles Chromium) |
| Backend language | Rust (high performance, memory safe) | Node.js |
| Security | Stronger (least privilege by default) | Requires extra configuration |
| Cross-platform | Windows / macOS / Linux | Windows / macOS / Linux |

**Decision**: Chose **Tauri 2.x** because:
1. Parsing IQ-TREE output files involves heavy text parsing and data cross-validation; Rust backend provides high performance and reliability
2. Small bundle size, suitable for distribution to researchers
3. Tauri 2.x supports IPC and plugin systems for future extensibility

### 4.2 Tech Stack Overview

```
+-------------------------------------------+
|                TreeDoctor                  |
+----------------+--------------------------+
|  Core Engine    |    Frontend Layer        |
|  (Rust crate)   |  (Tauri WebView)         |
+----------------+--------------------------+
| File Parsers    | React + TypeScript       |
| Diagnostics     | TailwindCSS + Components |
| Cross-Validation| Tree Visualization      |
| Report Gen      | Charts (Recharts)        |
| CLI Entry       | Tauri IPC                |
+----------------+--------------------------+
```

### 4.3 Project Structure

```
TreeDoctor/
├── core/                    # Rust core library (parsing + diagnostics)
│   ├── Cargo.toml
│   ├── src/
│   │   ├── lib.rs           # Library entry
│   │   ├── parsers/         # File type parsers
│   │   ├── diagnostics/     # Quality diagnostic modules
│   │   ├── models/          # Data model definitions
│   │   ├── report/          # Report generators
│   │   └── error.rs         # Error type definitions
│   └── tests/               # Unit and integration tests
│
├── cli/                     # CLI frontend
│   ├── Cargo.toml
│   └── src/
│       └── main.rs          # CLI entry point
│
├── gui/                     # Tauri GUI frontend
│   ├── src-tauri/           # Tauri Rust backend
│   ├── src/                 # React frontend source
│   ├── package.json
│   └── tauri.conf.json
│
├── docs/                    # Documentation
└── test-data/               # Test IQ-TREE output samples
```

## 5. IQ-TREE Output Files

TreeDoctor processes the following IQ-TREE output files (where `prefix` is the file prefix):

| File | Format | Content | Priority |
|------|--------|---------|----------|
| `prefix.iqtree` | Plain text | **Main report**: alignment stats, model selection, likelihoods, tree info, consensus tree, timestamps | P0 (required) |
| `prefix.log` | Plain text | **Run log**: complete run record, including composition test table, model selection process, iteration logs | P0 (required) |
| `prefix.treefile` | Newick | **ML tree**: Newick format maximum-likelihood tree with branch lengths and support values | P0 (required) |
| `prefix.contree` | Newick | **Consensus tree**: bootstrap consensus tree (only when bootstrap is enabled) | P1 |
| `prefix.splits.nex` | NEXUS | **Split network**: bootstrap split support values | P1 |
| `prefix.mldist` | Plain text | **ML distance matrix**: pairwise distances based on ML model | P2 |
| `prefix.model.gz` | gzip text | **Model details**: complete parameters for all ModelFinder candidate models | P2 |
| `prefix.bionj` | Newick | **BIONJ tree**: initial neighbor-joining tree (for comparison) | P3 |
| `prefix.ckp.gz` | gzip text | **Checkpoint**: analysis state checkpoint with iteration info | P3 |
| `prefix.parttrees` | Newick | **Partition trees** (partitioned analyses only): subtree for each partition | P3 |

## 6. Success Criteria

1. Can correctly parse all standard output files from IQ-TREE 2.4.0 and 3.1.4
2. Diagnostic report covers at least 8 quality dimensions (see diagnostic rules document)
3. CLI supports both text and JSON output formats
4. GUI provides interactive tree visualization and quality dashboard
5. Total parsing + diagnostics time < 1 second on test data (17 sequences, 1998 sites)
