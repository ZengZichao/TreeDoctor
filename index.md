---
layout: home
title: TreeDoctor — IQ-TREE Analysis Quality Diagnostic Tool
---

<div class="hero">

  <img src="{{ '/assets/img/logo.svg' | relative_url }}" alt="TreeDoctor Logo" class="hero-logo" />

  <h1 class="hero-title">TreeDoctor</h1>

  <p class="hero-subtitle">IQ-TREE 分析质量诊断工具</p>
  <p class="hero-tagline">Automated quality assessment for phylogenetic inference</p>

  <div class="hero-badges">
    <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" />
    <img src="https://img.shields.io/badge/version-0.1.0-green.svg" alt="Version 0.1.0" />
    <img src="https://img.shields.io/badge/IQ--TREE-2.x%20%26%203.x-teal.svg" alt="IQ-TREE 2.x & 3.x" />
    <img src="https://img.shields.io/badge/Rust-2021%20edition-orange.svg" alt="Rust 2021 edition" />
    <img src="https://img.shields.io/badge/Platform-Win%20%7C%20macOS%20%7C%20Linux-lightgrey.svg" alt="Cross-platform" />
  </div>

  <div class="hero-actions">
    <a href="{{ '/download' | relative_url }}" class="btn btn-primary">Download</a>
    <a href="{{ '/features' | relative_url }}" class="btn btn-secondary">Features</a>
    <a href="https://github.com/TreeDoctor/TreeDoctor" class="btn btn-secondary">GitHub</a>
  </div>

</div>

---

## Overview

**TreeDoctor** is a quality diagnostic tool designed for phylogeneticists using
[IQ-TREE](http://www.iqtree.org/), one of the most widely used maximum-likelihood
phylogenetic inference software packages.

A typical IQ-TREE analysis produces **9+ output files** — `.iqtree`, `.log`,
`.treefile`, `.contree`, `.splits.nex`, `.mldist`, `.model.gz`, `.bionj`,
`.ckp.gz` — each containing a fragment of the full picture. Assessing analysis
quality requires manually cross-referencing across all of them, a process that
is tedious, error-prone, and easy to overlook critical issues.

TreeDoctor automates this workflow: it **parses every IQ-TREE output file**,
performs **multi-dimensional quality assessment** and **cross-validation** across
files, and generates a clear, actionable **quality diagnostic report** — reducing
the risk of misinterpreting phylogenetic results.

---

## Key Features

<div class="feature-grid">

  <div class="feature-card">
    <h3>Full File Parsing</h3>
    <p>Automatically recognizes and parses all 9 IQ-TREE output file types, extracting every piece of relevant information.</p>
  </div>

  <div class="feature-card">
    <h3>36 Diagnostic Rules</h3>
    <p>36 rules across 8 quality dimensions — from alignment composition to bootstrap convergence — each with a clear grade and recommendation.</p>
  </div>

  <div class="feature-card">
    <h3>Cross-Validation</h3>
    <p>7 cross-validation rules check data consistency across files, catching contradictions that single-file inspection would miss.</p>
  </div>

  <div class="feature-card">
    <h3>Dual Interface</h3>
    <p>Both a CLI (for pipelines and batch processing) and a GUI desktop application (for interactive exploration).</p>
  </div>

  <div class="feature-card">
    <h3>Version Compatible</h3>
    <p>Works with both IQ-TREE 2.x (v2.4.0) and IQ-TREE 3.x (v3.1.4) output formats.</p>
  </div>

  <div class="feature-card">
    <h3>Multiple Output Formats</h3>
    <p>Reports in Text, JSON, Markdown, and HTML — for human reading, pipeline integration, and publication-ready export.</p>
  </div>

</div>

---

## Quality Dimensions

TreeDoctor evaluates phylogenetic analyses across **8 quality dimensions**, each
addressing a distinct aspect of analysis reliability:

| Dimension | Core Question | Rules |
|-----------|---------------|-------|
| D1 — Alignment Quality | Are there quality issues in the sequence data itself? | 6 |
| D2 — Model Selection | Is the substitution model choice appropriate? | 5 |
| D3 — Likelihood & IC | Are likelihood values and information criteria normal? | 4 |
| D4 — Topology & Branch Lengths | Is the tree topology reasonable? | 6 |
| D5 — Branch Support | Is node support sufficient? | 5 |
| D6 — Bootstrap Convergence | Has bootstrap converged adequately? | 4 |
| D7 — Consensus Consistency | Are the ML tree and consensus tree consistent? | 3 |
| D8 — Runtime & Efficiency | Is the run configuration reasonable? | 3 |

Each dimension and the overall analysis receive a letter grade:
<span class="grade-A">A</span> (Excellent) ·
<span class="grade-B">B</span> (Good) ·
<span class="grade-C">C</span> (Fair) ·
<span class="grade-D">D</span> (Warning) ·
<span class="grade-F">F</span> (Critical).

---

## Quick Start

```bash
# Analyze IQ-TREE output (CLI)
treedoctor analyze ./iqtree_output/

# Generate a JSON report for pipeline integration
treedoctor analyze ./iqtree_output/ -f json -o report.json

# Check file completeness
treedoctor check ./iqtree_output/

# List all diagnostic rules
treedoctor rules
```

Or simply launch the GUI application, select the IQ-TREE output directory,
and get an interactive diagnostic dashboard with tree visualization.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Core engine | Rust (2021 edition, 1.75+) |
| CLI | clap 4.5 |
| GUI framework | Tauri 2.x |
| Frontend | React 18 + TypeScript 5 |
| Styling | TailwindCSS 3.x |
| State management | Zustand 4.x |
| Charts | Recharts 2.x |

---

## Citation

If TreeDoctor contributes to your research, please cite:

> *TreeDoctor: A Quality Diagnostic Tool for IQ-TREE Phylogenetic Analyses.*
> Version 0.1.0. MIT License.

---

## License

[MIT License](https://github.com/TreeDoctor/TreeDoctor/blob/main/LICENSE)
