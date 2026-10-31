---
layout: page
title: Features
permalink: /features/
nav_order: 2
---

## Features

### Full File Parsing

TreeDoctor automatically detects and parses all 9 IQ-TREE output file types:

| File | Format | Content | Priority |
|------|--------|---------|----------|
| `prefix.iqtree` | Plain text | **Main report**: alignment stats, model selection, likelihood, tree info, consensus tree | P0 |
| `prefix.log` | Plain text | **Run log**: full run record including composition tests, iteration logs | P0 |
| `prefix.treefile` | Newick | **ML tree**: maximum-likelihood tree with branch lengths and support values | P0 |
| `prefix.contree` | Newick | **Consensus tree**: bootstrap consensus tree | P1 |
| `prefix.splits.nex` | NEXUS | **Split network**: bootstrap split support values | P1 |
| `prefix.mldist` | Plain text | **Likelihood distance matrix**: pairwise ML-based distances | P2 |
| `prefix.model.gz` | gzipped text | **Model details**: full ModelFinder candidate model parameters | P2 |
| `prefix.bionj` | Newick | **BIONJ tree**: initial neighbor-joining tree (for comparison) | P3 |
| `prefix.ckp.gz` | gzipped text | **Checkpoint**: analysis state checkpoint with iteration info | P3 |

### Multi-Dimensional Diagnostics

36 diagnostic rules across 8 quality dimensions:

<div class="feature-grid">

  <div class="feature-card">
    <h3>D1 · Alignment Quality</h3>
    <p>Sequence composition chi-square test, gap/ambiguity ratio, taxon sampling adequacy, informative site proportion, codon position bias, missing data patterns. <strong>6 rules.</strong></p>
  </div>

  <div class="feature-card">
    <h3>D2 · Model Selection</h3>
    <p>Model selection criterion appropriateness, parameter count vs. data size, gamma shape estimation, invariant site proportion, model comparison delta. <strong>5 rules.</strong></p>
  </div>

  <div class="feature-card">
    <h3>D3 · Likelihood & IC</h3>
    <p>Log-likelihood sanity, AIC/BIC consistency, model weight dominance, likelihood saturation. <strong>4 rules.</strong></p>
  </div>

  <div class="feature-card">
    <h3>D4 · Topology & Branches</h3>
    <p>Near-zero internal branches, excessively long branches, total tree length, ladderization, polytomy detection, branch length distribution. <strong>6 rules.</strong></p>
  </div>

  <div class="feature-card">
    <h3>D5 · Branch Support</h3>
    <p>Low-support node count, SH-aLRT vs. UFBoot consistency, support value distribution, backbone support, rogue taxon detection. <strong>5 rules.</strong></p>
  </div>

  <div class="feature-card">
    <h3>D6 · Bootstrap Convergence</h3>
    <p>UFBoot convergence diagnostic (max delta), bootstrap replicate adequacy, correlation among replicate trees, convergence trend. <strong>4 rules.</strong></p>
  </div>

  <div class="feature-card">
    <h3>D7 · Consensus Consistency</h3>
    <p>ML tree vs. consensus tree agreement, split frequency analysis, conflict detection. <strong>3 rules.</strong></p>
  </div>

  <div class="feature-card">
    <h3>D8 · Runtime & Efficiency</h3>
    <p>Thread utilization, runtime reasonableness, memory usage patterns. <strong>3 rules.</strong></p>
  </div>

</div>

### Cross-Validation

7 cross-file consistency checks that verify data agreement across all output files:

1. **Taxon count consistency** — same number of sequences across `.iqtree`, `.log`, `.mldist`
2. **Model name consistency** — ModelFinder section matches substitution process section
3. **Likelihood value consistency** — log-likelihood in `.iqtree` matches `.log`
4. **Tree topology consistency** — Newick in `.treefile` matches embedded tree in `.iqtree`
5. **Support value consistency** — `.treefile` support values match `.splits.nex`
6. **Bootstrap replicate consistency** — analysis type and `.contree` agree on replicate count
7. **Consensus tree consistency** — `.contree` matches embedded consensus in `.iqtree`

### Grading System

Each dimension and the overall analysis receive a unified letter grade:

| Grade | Label | Meaning |
|-------|-------|---------|
| <span class="grade-A">A</span> | Excellent | No issues detected |
| <span class="grade-B">B</span> | Good | Minor points to note |
| <span class="grade-C">C</span> | Fair | Moderate issues; attention recommended |
| <span class="grade-D">D</span> | Warning | Significant issues; correction recommended |
| <span class="grade-F">F</span> | Critical | Severe issues; results may be unreliable |

The **overall grade** is the lowest across all dimensions. If any dimension is graded F,
the overall grade is F.

### Dual Interface

**CLI** — for pipelines, batch processing, and automation:

```bash
# Basic analysis
treedoctor analyze ./iqtree_output/

# JSON output for pipeline integration
treedoctor analyze ./iqtree_output/ -f json -o report.json

# File completeness check
treedoctor check ./iqtree_output/

# List all diagnostic rules
treedoctor rules
```

**GUI** — for interactive exploration and teaching:

- Drag-and-drop file loading
- Interactive phylogenetic tree visualization (rectangular / radial / circular layouts)
- Quality dashboard with grade indicators
- Per-dimension detailed diagnostic cards
- Cross-validation summary
- Report export (Text / Markdown / HTML / PDF)

### Version Compatibility

TreeDoctor is tested against real output from:
- IQ-TREE **2.4.0** (`iqtree2`)
- IQ-TREE **3.1.4** (`iqtree3`)

Both versions are widely used in the phylogenetics community, and TreeDoctor handles
their format differences automatically.

### Performance

On a test dataset of 17 vertebrate mitochondrial DNA sequences (1,998 sites),
the full parse-and-diagnose pipeline completes in **under 1 second**.
