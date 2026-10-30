# TreeDoctor Core Architecture

This document defines TreeDoctor's overall architecture, module division, data models, and interface specifications.

---

## 1. Architecture Overview

TreeDoctor uses a **core library + dual frontend** architecture:

```
                        ┌─────────────────────────────────────┐
                        │         User Interface Layer         │
                        ├──────────────┬──────────────────────┤
                        │  CLI Frontend│  GUI Frontend(Tauri) │
                        │   (clap)     │  (React + WebView)   │
                        └──────┬──────┴──────────┬───────────┘
                               │                  │
                               │    Tauri IPC     │
                               │                  │
                        ┌──────▼──────────────────▼───────────┐
                        │       Core Library (Rust crate)     │
                        │          "treedoctor-core"          │
                        ├─────────────────────────────────────┤
                        │  File Discovery → Parsers → Models  │
                        │          → Cross-Validation         │
                        │          → Diagnostic Engine         │
                        │          → Report Generator         │
                        └─────────────────────────────────────┘
```

**Design Principles**:
1. All core logic is implemented in the Rust core library; CLI and GUI share the same parsing and diagnostic engine
2. The core library is a pure library (no I/O); file paths are passed by the caller
3. Diagnostic rules are registered as plugins for extensibility
4. All intermediate data uses strongly-typed data models to avoid runtime errors

---

## 2. Core Library Module Division

### 2.1 Module Tree

```
treedoctor-core/
├── src/
│   ├── lib.rs                  # Library entry, public API
│   ├── error.rs                # Unified error types
│   ├── models/                 # Data models (strongly typed)
│   │   ├── mod.rs
│   │   ├── alignment.rs        # Alignment data model
│   │   ├── model_result.rs     # Model selection results
│   │   ├── tree.rs             # Tree data model
│   │   ├── bootstrap.rs        # Bootstrap-related data
│   │   ├── diagnostics.rs      # Diagnostic result data model
│   │   └── report.rs           # Complete report data model
│   ├── parsers/                # File parsers
│   │   ├── mod.rs              # Parser registration and dispatch
│   │   ├── iqtree_report.rs    # .iqtree file parsing
│   │   ├── log.rs              # .log file parsing
│   │   ├── newick.rs           # Newick tree parsing (.treefile/.contree/.bionj)
│   │   ├── nexus.rs            # NEXUS splits parsing (.splits.nex)
│   │   ├── mldist.rs           # Distance matrix parsing (.mldist)
│   │   ├── model_gz.rs         # Model details parsing (.model.gz)
│   │   └── checkpoint.rs       # Checkpoint parsing (.ckp.gz)
│   ├── diagnostics/            # Diagnostic rule engine
│   │   ├── mod.rs              # Engine entry
│   │   ├── rule.rs             # Rule trait definition
│   │   ├── registry.rs         # Rule registry
│   │   ├── alignment_diag.rs   # D1: Alignment quality
│   │   ├── model_diag.rs       # D2: Model selection
│   │   ├── likelihood_diag.rs  # D3: Likelihood & information criteria
│   │   ├── topology_diag.rs    # D4: Tree topology & branch lengths
│   │   ├── support_diag.rs     # D5: Branch support values
│   │   ├── bootstrap_diag.rs   # D6: Bootstrap convergence
│   │   ├── consensus_diag.rs   # D7: Consensus tree consistency
│   │   └── runtime_diag.rs     # D8: Runtime parameters
│   ├── crosscheck/             # Cross-validation
│   │   ├── mod.rs
│   │   └── rules.rs            # 7 cross-validation rules
│   └── report/                 # Report generation
│       ├── mod.rs
│       ├── text.rs             # Plain text report format
│       ├── json.rs             # JSON structured output
│       └── markdown.rs         # Markdown format output
```

### 2.2 Module Dependencies

```
parsers ──depends on──→ models
diagnostics ──depends on──→ models
crosscheck ──depends on──→ models
report ──depends on──→ models, diagnostics

lib.rs public API:
  ├── analyze(input_dir) → Report
  ├── analyze_files(file_map) → Report
  ├── parse_file(path) → ParsedFile
  └── get_diagnostic_rules() → Vec<RuleInfo>
```

---

## 3. Core Data Models

### 3.1 File Discovery and Type Identification

```rust
/// IQ-TREE output file types
#[derive(Debug, Clone, PartialEq)]
pub enum FileType {
    IqtreeReport,    // Main report (.iqtree)
    Log,             // Run log (.log)
    Treefile,        // ML tree (.treefile)
    Contree,         // Consensus tree (.contree)
    SplitsNex,       // Split network (.splits.nex)
    Mldist,          // Distance matrix (.mldist)
    ModelGz,         // Model details (.model.gz)
    Bionj,           // BIONJ tree (.bionj)
    Checkpoint,      // Checkpoint (.ckp.gz)
    PartTrees,       // Partition trees (.parttrees)
    Unknown,
}

/// File discovery result
pub struct DiscoveredFiles {
    pub prefix: String,
    pub files: HashMap<FileType, PathBuf>,
    pub missing_critical: Vec<FileType>,
    pub missing_optional: Vec<FileType>,
}
```

### 3.2 Alignment Data Model

```rust
pub struct AlignmentInfo {
    pub n_sequences: usize,
    pub n_sites: usize,
    pub seq_type: SeqType,
    pub n_constant_sites: usize,
    pub frac_constant: f64,
    pub n_invariant_sites: usize,
    pub n_informative_sites: usize,
    pub n_patterns: usize,
    pub n_singleton_sites: Option<usize>,
}

pub enum SeqType { Dna, Rna, Protein, Codon, Binary, Morphological, Pomo, Unknown }

pub struct SeqCompositionTest {
    pub seq_name: String,
    pub gap_percentage: f64,
    pub passed: bool,
    pub p_value: f64,
}

pub struct CompositionTestSummary {
    pub sequences: Vec<SeqCompositionTest>,
    pub total_gap_percentage: f64,
    pub n_failed: usize,
    pub significance_level: f64,
    pub degrees_of_freedom: usize,
}
```

### 3.3-3.6 Model Selection, Tree, Bootstrap, and Diagnostic Result Models

*(See Chinese documentation for complete Rust struct definitions — the data models are language-agnostic and the code is identical)*

---

## 4. Public API

### 4.1 Main Analysis Interface

```rust
/// Main analysis entry: discover IQ-TREE output files from directory and analyze
pub fn analyze_directory(input_dir: &Path, prefix: Option<&str>) -> Result<AnalysisReport, TreeDoctorError>;

/// Analyze from specified file set
pub fn analyze_files(files: &DiscoveredFiles) -> Result<AnalysisReport, TreeDoctorError>;

/// Parse a single file
pub fn parse_file(file_type: FileType, path: &Path) -> Result<ParsedFile, TreeDoctorError>;

/// Get metadata for all diagnostic rules
pub fn list_diagnostic_rules() -> Vec<RuleInfo>;
```

### 4.2 Report Output Interface

```rust
pub enum ReportFormat { Text, Json, Markdown }

pub fn generate_report(report: &AnalysisReport, format: ReportFormat) -> Result<String, TreeDoctorError>;
```

---

## 5. Error Handling

### 5.1 Error Types

```rust
#[derive(Debug, thiserror::Error)]
pub enum TreeDoctorError {
    #[error("File not found: {path}")]
    FileNotFound { path: String },
    #[error("Unknown file type: {path}")]
    UnknownFileType { path: String },
    #[error("Parse error: {file_type} - {message}")]
    ParseError { file_type: String, message: String },
    #[error("Missing critical file: {file_type}")]
    MissingCriticalFile { file_type: String },
    #[error("Data inconsistency: {message}")]
    DataInconsistency { message: String },
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Regex error: {0}")]
    Regex(#[from] regex::Error),
    #[error("JSON serialization error: {0}")]
    Json(#[from] serde_json::Error),
}
```

### 5.2 Error Handling Strategy

| Error Type | Strategy |
|-----------|----------|
| Missing critical file | Degraded operation: parse available files, flag missing in report |
| Single file parse failure | Continue parsing other files, flag failure in report |
| Data inconsistency | Record as cross-validation warning, don't interrupt |
| Fatal error | Return error with actionable fix suggestions |

---

## 6. Performance Design

| Metric | Target |
|--------|--------|
| File parsing time | < 500ms (17 sequences, 2000 sites) |
| Diagnostic execution | < 200ms |
| Report generation | < 100ms |
| Memory usage | < 50 MB |
| CLI total startup + run | < 1 second |

### Optimization Strategies

1. **Parallel parsing**: Each file type parsed independently (using `rayon`)
2. **Lazy parsing**: Only parse data when diagnostic rules need it
3. **Regex precompilation**: All regexes precompiled using `once_cell`
4. **Zero-copy**: Newick parsing uses string slices where possible
5. **Streaming**: Large files (e.g., `.model.gz`) read as streams

---

## 7. Extensibility Design

### 7.1 Diagnostic Rule Plugin System

```rust
pub trait DiagnosticRule: Send + Sync {
    fn id(&self) -> &str;
    fn name(&self) -> &str;
    fn dimension(&self) -> &str;
    fn evaluate(&self, data: &AnalysisData) -> DiagnosticResult;
    fn required_files(&self) -> Vec<FileType>;
}
```

New diagnostic rules only need to implement the `DiagnosticRule` trait and register with the `Registry`.

### 7.2 Parser Plugin System

```rust
pub trait FileParser: Send + Sync {
    fn file_type(&self) -> FileType;
    fn parse(&self, content: &str) -> Result<ParsedFile, TreeDoctorError>;
    fn supported_versions(&self) -> Vec<VersionRange>;
}
```

### 7.3 Future Extension Directions

| Direction | Description |
|-----------|-------------|
| IQ-TREE 4.x compatibility | Via version detection and conditional parsing |
| Custom diagnostic rules | Allow users to define rules via YAML/JSON |
| Batch analysis | Support analyzing multiple output directories |
| Historical comparison | Compare with previous analysis results |
| RAxML/PhyML compatibility | Extend parsers for other tree-building software |
