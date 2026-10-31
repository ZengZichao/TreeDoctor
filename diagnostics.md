---
layout: page
title: Diagnostics
permalink: /diagnostics/
nav_order: 3
---

## Diagnostic Rule System

TreeDoctor implements a comprehensive quality assessment framework consisting of
**36 diagnostic rules** across **8 dimensions**, plus **7 cross-validation rules**.
Each rule is defined with explicit data sources, grading criteria, explanatory text,
and actionable recommendations.

---

### D1 · Alignment Quality

> *Does the sequence data itself have quality issues?*

| Rule | Indicator | Key Threshold |
|------|-----------|---------------|
| D1-R1 | Sequence composition chi-square test | > 30% sequences fail → grade D |
| D1-R2 | Gap / ambiguity character ratio | Single seq > 50% gap → grade D |
| D1-R3 | Taxon count adequacy | < 4 taxa → grade F |
| D1-R4 | Informative site proportion | < 20% informative → grade C |
| D1-R5 | Codon position compositional bias | Significant bias across codon positions → grade C |
| D1-R6 | Missing data pattern analysis | Structured missingness suggesting misalignment → grade D |

### D2 · Model Selection

> *Is the substitution model selection appropriate?*

| Rule | Indicator | Key Threshold |
|------|-----------|---------------|
| D2-R1 | Selection criterion appropriateness | BIC for n < 40; AICc otherwise |
| D2-R2 | Parameter count vs. data size | Parameters / sites > 0.1 → grade D |
| D2-R3 | Gamma shape parameter estimation | alpha < 0.05 or > 10 → grade C |
| D2-R4 | Invariant site proportion | Proportion invariant > 0.9 → grade C |
| D2-R5 | Model comparison delta | Top model weight < 0.5 → grade C |

### D3 · Likelihood & Information Criteria

> *Are the likelihood values and information criteria normal?*

| Rule | Indicator | Key Threshold |
|------|-----------|---------------|
| D3-R1 | Log-likelihood sanity | Positive or extremely close to zero → grade F |
| D3-R2 | AIC/BIC consistency | AIC and BIC select different models → grade C |
| D3-R3 | Model weight dominance | No model with weight > 0.5 → grade C |
| D3-R4 | Likelihood saturation | Tree length excessively long → grade D |

### D4 · Tree Topology & Branch Lengths

> *Is the tree topology reasonable?*

| Rule | Indicator | Key Threshold |
|------|-----------|---------------|
| D4-R1 | Near-zero internal branches | Internal branch < 1e-6 → grade C |
| D4-R2 | Excessively long branches | Branch > 10× median → grade D |
| D4-R3 | Total tree length | Extremely short or long total length → grade C |
| D4-R4 | Tree ladderization | Asymmetry ratio > 0.9 → grade C |
| D4-R5 | Polytomy detection | Hard polytomies present → grade C |
| D4-R6 | Branch length distribution | Bimodal or skewed distribution → grade C |

### D5 · Branch Support

> *Is node support sufficient?*

| Rule | Indicator | Key Threshold |
|------|-----------|---------------|
| D5-R1 | Low-support node count | UFBoot < 95% on internal branches → grade C/D |
| D5-R2 | Ultra-low support nodes | UFBoot < 50% → grade F |
| D5-R3 | SH-aLRT vs. UFBoot consistency | Disagreement rate > 30% → grade C |
| D5-R4 | Backbone support | Deep nodes with low support → grade D |
| D5-R5 | Rogue taxon detection | Taxon unstable across bootstrap → grade C |

### D6 · Bootstrap Convergence

> *Has bootstrap converged adequately?*

| Rule | Indicator | Key Threshold |
|------|-----------|---------------|
| D6-R1 | UFBoot convergence (max delta) | max delta > 0.05 → grade D |
| D6-R2 | Bootstrap replicate adequacy | < 500 replicates → grade C |
| D6-R3 | Correlation among replicate trees | Low correlation → grade D |
| D6-R4 | Convergence trend | Non-monotonic convergence → grade C |

### D7 · Consensus Consistency

> *Are the ML tree and consensus tree consistent?*

| Rule | Indicator | Key Threshold |
|------|-----------|---------------|
| D7-R1 | ML vs. consensus agreement | > 20% conflict → grade D |
| D7-R2 | Split frequency analysis | Non-dominant splits with high frequency → grade C |
| D7-R3 | Conflict detection | Hard conflicts (both > 70%) → grade F |

### D8 · Runtime & Efficiency

> *Is the run configuration reasonable?*

| Rule | Indicator | Key Threshold |
|------|-----------|---------------|
| D8-R1 | Thread utilization | Single thread on multi-core system → grade B |
| D8-R2 | Runtime reasonableness | Runtime vs. data size outliers → grade C |
| D8-R3 | Memory usage patterns | Excessive memory usage → grade C |

---

### Cross-Validation Rules

These rules check **inter-file consistency** — catching contradictions that would
be invisible when inspecting any single file in isolation:

| Rule | Check | Data Sources |
|------|-------|-------------|
| X1 | Taxon count consistency | `.iqtree`, `.log`, `.mldist` |
| X2 | Model name consistency | `.iqtree` (ModelFinder section), `.log` (substitution process) |
| X3 | Likelihood value consistency | `.iqtree`, `.log` |
| X4 | Tree topology consistency | `.treefile`, `.iqtree` (embedded Newick) |
| X5 | Support value consistency | `.treefile`, `.splits.nex` |
| X6 | Bootstrap replicate count consistency | `.iqtree` (analysis type), `.contree` |
| X7 | Consensus tree Newick consistency | `.contree`, `.iqtree` (embedded consensus) |

---

### Grading Rules

The **overall grade** is determined by the lowest-scoring dimension:

- If any dimension is graded **F**, the overall grade is **F**
- Otherwise, the overall grade equals the minimum (worst) dimension grade

Each rule includes a **template recommendation** explaining the issue and suggesting
concrete next steps — from minor notes (grade B) to strong corrections (grade D/F).

For the full rule definitions with complete grading criteria and recommendation
templates, see the [diagnostic rules specification](https://github.com/TreeDoctor/TreeDoctor/blob/main/TreeDoctor-开发方案/02-质量诊断规则体系.md).
