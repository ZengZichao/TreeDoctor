---
layout: page
title: About
permalink: /about/
nav_order: 1
---

## About TreeDoctor

### Background

[IQ-TREE](http://www.iqtree.org/) is among the most widely used maximum-likelihood
phylogenetic inference software packages, supporting both IQ-TREE 2 (v2.4.0) and
IQ-TREE 3 (v3.1.4). A single IQ-TREE analysis run produces multiple output files
containing critical information: model selection results, likelihood values,
branch support statistics, sequence quality metrics, and more.

However, this information is **scattered across** `.iqtree`, `.log`, `.treefile`,
`.contree`, `.splits.nex`, `.mldist`, `.model.gz`, `.bionj`, and `.ckp.gz` files.
Researchers must manually cross-reference across all of them to judge analysis
quality — a process that is both tedious and prone to overlooking critical issues.

### The Problem

Phylogenetic analysis quality is not a single number. It encompasses:

- **Data quality** — Are the sequences compositionally homogeneous?
- **Model adequacy** — Was the best-fitting substitution model selected?
- **Tree reliability** — Are branch lengths reasonable? Are support values adequate?
- **Bootstrap convergence** — Has the bootstrap analysis truly converged?
- **Internal consistency** — Do the different output files tell the same story?

Without a systematic diagnostic framework, these questions are answered
inconsistently — or not at all — leading to potential misinterpretation of
phylogenetic results.

### The Solution

**TreeDoctor** automates this entire assessment process:

1. **Parse** — Automatically detect and parse all IQ-TREE output files
2. **Diagnose** — Apply 36 rules across 8 quality dimensions, each with clear grading
3. **Cross-validate** — Run 7 cross-file consistency checks to catch contradictions
4. **Report** — Generate an actionable quality diagnostic report in your preferred format

### Design Principles

- **Do not re-run IQ-TREE.** TreeDoctor analyzes output files only; it is a diagnostic
  companion, not a replacement for IQ-TREE.
- **Do not modify output files.** TreeDoctor is strictly read-only.
- **Do not perform new inference.** No new phylogenetic trees are inferred; no new
  models are computed.
- **Not a tree visualization tool.** While TreeDoctor includes lightweight tree
  rendering for context, it is not a general-purpose tree viewer.

### Who Is It For?

| User Type | Typical Scenario | Recommended Interface |
|-----------|-----------------|----------------------|
| Bioinformatics researchers | Batch-check multiple analysis results | CLI |
| Evolutionary biologists | Interactively explore single analysis quality | GUI |
| Teaching scenarios | Explain phylogenetic analysis metrics to students | GUI |
| Pipeline integration | Embed quality checks in automated workflows | CLI (JSON output) |
