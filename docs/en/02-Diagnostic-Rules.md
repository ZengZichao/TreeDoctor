# TreeDoctor Diagnostic Rules System

This document defines all quality diagnostic rules for TreeDoctor. Each rule includes: diagnostic dimension, evaluation metric, data source, grading criteria, interpretation text, and recommended actions. All rules are grouped by dimension, forming a multi-layered phylogenetic analysis quality assessment system.

---

## 1. Diagnostic Dimensions Overview

| ID | Dimension | Core Question | Rules |
|----|-----------|---------------|-------|
| D1 | Alignment Quality | Are there quality issues with the sequence data itself? | 6 |
| D2 | Model Selection | Is the substitution model selection reasonable? | 5 |
| D3 | Likelihood & Information Criteria | Are likelihood values and information criteria normal? | 4 |
| D4 | Tree Topology & Branch Lengths | Is the tree shape reasonable? | 6 |
| D5 | Branch Support Values | Is node support sufficient? | 5 |
| D6 | Bootstrap Convergence | Has bootstrap sufficiently converged? | 4 |
| D7 | Consensus vs ML Tree Consistency | Are the ML tree and consensus tree consistent? | 3 |
| D8 | Runtime Parameters & Efficiency | Are runtime configuration settings reasonable? | 3 |

**Total: 36 diagnostic rules.**

---

## 2. Grading Criteria

Each diagnostic dimension and the overall analysis uses a unified grading system:

| Grade | Label | Color | Meaning |
|-------|-------|-------|---------|
| A | Excellent | Green | Quality is very good, no issues |
| B | Good | Light Green | Quality is good, with minor caveats |
| C | Fair | Yellow | Moderate issues exist, attention recommended |
| D | Warning | Orange | Notable issues exist, correction recommended |
| F | Critical | Red | Serious issues exist, results may be unreliable |

**Overall grading rule**: The lowest grade across all dimensions becomes the overall grade. If any dimension is F, the overall grade is F.

---

## 3. Dimension D1: Alignment Quality

### D1-R1: Sequence Composition Chi-Square Test

- **Data Source**: Composition test table in `.log` file
- **Metric**: Number and proportion of sequences failing the composition chi-square test (p < 0.05)
- **Grading**:

| Condition | Grade | Description |
|-----------|-------|-------------|
| Failed sequences = 0 | A | All sequences pass composition test |
| Failed proportion < 10% | B | Few sequences fail, limited impact |
| Failed proportion 10%-30% | C | Moderate proportion with composition deviation |
| Failed proportion 30%-50% | D | Many sequences with composition deviation |
| Failed proportion > 50% | F | Widespread test failure, data may be unsuitable for ML |

**Boundary handling**: At exactly 10%, use higher grade (B); at exactly 30%, use C; at exactly 50%, use D.

### D1-R2: Gap/Ambiguity Character Ratio

- **Data Source**: Gap/Ambiguity column in `.log` file
- **Metric**: Per-sequence and overall gap ratio
- **Grading**:

| Condition | Grade |
|-----------|-------|
| All sequences gap < 5% | A |
| Some sequences gap 5%-20% | B |
| Some sequences gap 20%-50% | C |
| Some sequences gap > 50% | D |
| Overall gap > 20% | F |

### D1-R3: Sequence Count Adequacy

- **Data Source**: SEQUENCE ALIGNMENT section in `.iqtree` file
- **Metric**: Number of sequences (taxa)
- **Grading**:

| Condition | Grade |
|-----------|-------|
| Sequences ≥ 50 | A |
| Sequences 20-49 | B |
| Sequences 10-19 | C |
| Sequences 4-9 | D |
| Sequences < 4 | F |

### D1-R4: Informative Sites Adequacy

- **Data Source**: SEQUENCE ALIGNMENT section in `.iqtree` file
- **Metric**: Number and proportion of informative sites
- **Grading**:

| Condition | Grade |
|-----------|-------|
| Proportion > 30% and count > 500 | A |
| Proportion 15%-30% or count 100-500 | B |
| Proportion 5%-15% or count 50-100 | C |
| Proportion < 5% or count < 50 | D |
| Count < 10 | F |

### D1-R5: Constant Sites Proportion

- **Data Source**: SEQUENCE ALIGNMENT section in `.iqtree` file
- **Metric**: Constant sites proportion
- **Grading**:

| Condition | Grade |
|-----------|-------|
| Constant proportion < 50% | A |
| 50%-70% | B |
| 70%-85% | C |
| > 85% | D |
| > 95% | F |

### D1-R6: Sequence Length Adequacy

- **Data Source**: SEQUENCE ALIGNMENT section in `.iqtree` file
- **Metric**: Alignment length (number of sites)
- **Grading**:

| Condition | Grade |
|-----------|-------|
| Length ≥ 1000 | A |
| Length 500-999 | B |
| Length 200-499 | C |
| Length 50-199 | D |
| Length < 50 | F |

---

## 4. Dimension D2: Model Selection

### D2-R1: ModelFinder Usage

- **Data Source**: Type of analysis line and ModelFinder section in `.iqtree` file
- **Metric**: Whether ModelFinder was used (`-m MFP` or `TEST`)
- **Grading**:

| Condition | Grade |
|-----------|-------|
| ModelFinder used | A |
| Manual model but reasonable | B |
| Default/inappropriate model (e.g., JC) | D |

### D2-R2: Model Complexity Reasonableness

- **Data Source**: ModelFinder and ML TREE sections in `.iqtree` file
- **Metric**: Ratio of model free parameters (K) to sample size (n, number of patterns)
- **Grading**:

| Condition | Grade | Description |
|-----------|-------|-------------|
| n > 40K | A | Sample size far exceeds parameters |
| 40K ≥ n > K | B | Sample size exceeds parameters |
| n ≤ K | F | Parameters equal or exceed sample size, overfitting |

### D2-R3: Information Criterion Consistency

- **Data Source**: ModelFinder section in `.iqtree` file
- **Metric**: Whether AIC, AICc, and BIC select the same best model
- **Grading**:

| Condition | Grade |
|-----------|-------|
| All three criteria select same model | A |
| AIC and AICc agree but BIC differs | B |
| AIC/AICc vs BIC select different models | C |

### D2-R4: Rate Heterogeneity Assessment

- **Data Source**: SUBSTITUTION PROCESS section in `.iqtree` file
- **Metric**: Gamma shape alpha value
- **Grading**:

| Condition | Grade |
|-----------|-------|
| alpha > 0.5 | A |
| alpha 0.1-0.5 | B |
| alpha < 0.1 | D |
| No +G used | C |

### D2-R5: Invariable Sites Proportion Assessment

- **Data Source**: SUBSTITUTION PROCESS section in `.iqtree` file
- **Metric**: Proportion of invariable sites (pinv)
- **Grading**:

| Condition | Grade |
|-----------|-------|
| pinv roughly matches constant sites proportion | A |
| pinv notably lower than constant sites | B |
| pinv ≈ 0 and alpha low | C |
| pinv ≈ 1 | F |

---

## 5. Dimension D3: Likelihood & Information Criteria

### D3-R1: Log-Likelihood Reasonableness
- **Data Source**: MAXIMUM LIKELIHOOD TREE section in `.iqtree` file
- **Metric**: Final ML log-likelihood
- **Grading**: Combined with D3-R2

### D3-R2: Likelihood Ratio (Constrained vs Unconstrained)
- **Data Source**: `.iqtree` file
- **Metric**: Difference `tree_lh - unconstrained_lh`
- **Grading**:

| Condition | Grade |
|-----------|-------|
| Difference < -100 | A |
| Difference -100 to -10 | B |
| Difference -10 to -1 | C |
| Difference > -1 | D |

### D3-R3: Likelihood Standard Error
- **Data Source**: `Log-likelihood of the tree: X (s.e. Y)` in `.iqtree` file
- **Metric**: Ratio of standard error to absolute likelihood value
- **Grading**:

| Condition | Grade |
|-----------|-------|
| s.e. / |lnL| < 1% | A |
| 1%-5% | B |
| > 5% | D |

### D3-R4: Information Criterion Trends
- **Data Source**: ModelFinder section in `.iqtree` file
- **Metric**: BIC/AICc difference and weight ratio between best and second-best models
- **Grading**:

| Condition | Grade |
|-----------|-------|
| Best model weight > 0.9 | A |
| Weight 0.5-0.9 | B |
| Weight 0.1-0.5 | C |
| Weight < 0.1 | D |

---

## 6. Dimension D4: Tree Topology & Branch Lengths

### D4-R1: Near-Zero Internal Branches
- **Data Source**: WARNING lines in ML TREE section of `.iqtree` file
- **Grading**:

| Condition | Grade |
|-----------|-------|
| Near-zero internal branches = 0 | A |
| 1-2 | C |
| > 2 | D |

### D4-R2: Overly Long Branches
- **Data Source**: WARNING lines in ML TREE section of `.iqtree` file
- **Grading**:

| Condition | Grade |
|-----------|-------|
| Long branches = 0 | A |
| 1-2 | C |
| > 2 | D |

### D4-R3: Total Tree Length Reasonableness
- **Data Source**: `.iqtree` file
- **Grading**:

| Condition | Grade |
|-----------|-------|
| 0.1 ≤ tree length ≤ 10 | A |
| < 0.1 or > 10 | C |

### D4-R4: Internal Branch Proportion
- **Data Source**: `.iqtree` file
- **Grading**:

| Condition | Grade |
|-----------|-------|
| Internal branch proportion > 30% | A |
| 15%-30% | B |
| 5%-15% | C |
| < 5% | D |

### D4-R5: Negative Branch Length Detection
- **Data Source**: `prefix.treefile` Newick parsing
- **Grading**:

| Condition | Grade |
|-----------|-------|
| No negative branch lengths | A |
| Negative branch lengths exist | F |

### D4-R6: Outlier Sequence Distance Detection
- **Data Source**: `prefix.mldist` distance matrix
- **Grading**:

| Condition | Grade |
|-----------|-------|
| No outlier sequences | A |
| 1 outlier sequence | C |
| > 1 outlier sequence | D |

---

## 7. Dimension D5: Branch Support Values

### D5-R1: Low-Support Node Count
- **Data Source**: `prefix.treefile` Newick parsing (support values)
- **Metric**: Internal branches with SH-aLRT < 80% or UFBoot < 95%
- **Grading** (UFBoot as primary):

| Condition | Grade |
|-----------|-------|
| All internal branches UFBoot ≥ 95% | A |
| Low-support ≤ 10% of internal branches | B |
| 10%-30% | C |
| 30%-50% | D |
| > 50% | F |

### D5-R2: Completely Unsupported Nodes
- **Data Source**: `prefix.treefile`
- **Metric**: Branches with UFBoot < 50%
- **Grading**:

| Condition | Grade |
|-----------|-------|
| None | A |
| 1-2 | C |
| > 2 | F |

### D5-R3: SH-aLRT and UFBoot Consistency
- **Data Source**: `SH-aLRT/UFBoot` format in `prefix.treefile`
- **Grading**:

| Condition | Grade |
|-----------|-------|
| Both agree (both high or both low) | A |
| Discordant nodes exist | C |

### D5-R4: Support Value Distribution
- **Data Source**: `prefix.splits.nex`
- **Grading**:

| Condition | Grade |
|-----------|-------|
| Most splits support > 75% | A |
| Even distribution | B |
| Most splits support < 50% | D |

### D5-R5: Bootstrap Replicate Count
- **Data Source**: Type of analysis line in `.iqtree` file
- **Grading**:

| Condition | Grade |
|-----------|-------|
| UFBoot ≥ 1000 | A |
| 500-999 | B |
| 100-499 | C |
| < 100 | D |
| No bootstrap | F (if support expected) |

---

## 8. Dimension D6: Bootstrap Convergence

### D6-R1: Bootstrap Correlation Coefficient
- **Data Source**: `.log` file
- **Grading**:

| Condition | Grade |
|-----------|-------|
| Correlation ≥ 0.99 | A |
| 0.95-0.99 | B |
| 0.90-0.95 | C |
| < 0.90 | D |

### D6-R2: Likelihood Cutoff Variation
- **Data Source**: Multiple `Log-likelihood cutoff` lines in `.log` file
- **Grading**:

| Condition | Grade |
|-----------|-------|
| Cutoff change < 1% | A |
| 1%-5% | B |
| > 5% | C |

### D6-R3: Iteration Count Adequacy
- **Data Source**: `.log` file
- **Grading**:

| Condition | Grade |
|-----------|-------|
| Iterations ≥ 100 | A |
| 50-99 | C |
| < 50 | D |

### D6-R4: Consensus vs ML Tree Likelihood
- **Data Source**: `.iqtree` file
- **Grading**:

| Condition | Grade |
|-----------|-------|
| ML tree likelihood > consensus | A |
| Consensus > ML (diff < 0.1) | B |
| Consensus > ML (diff ≥ 0.1) | F |

---

## 9. Dimension D7: Consensus vs ML Tree Consistency

### D7-R1: Robinson-Foulds Distance
- **Data Source**: CONSENSUS TREE section in `.iqtree` file
- **Grading**:

| Condition | Grade |
|-----------|-------|
| RF distance = 0 | A |
| 1-2 | B |
| 3-5 | C |
| > 5 | D |

### D7-R2: Consensus Branch Retention Threshold
- **Data Source**: `.iqtree` file
- **Grading**:

| Condition | Grade |
|-----------|-------|
| Threshold ≥ 50% (majority rule) | A |
| > 0% (extended majority rule) | B |
| = 0% (extended consensus) | C |

### D7-R3: Low-Support Split Proportion
- **Data Source**: `prefix.splits.nex`
- **Grading**:

| Condition | Grade |
|-----------|-------|
| Proportion < 10% | A |
| 10%-30% | B |
| 30%-50% | C |
| > 50% | D |

---

## 10. Dimension D8: Runtime Parameters & Efficiency

### D8-R1: Thread Usage
- **Data Source**: `Kernel:` line in `.log` file header
- **Grading**:

| Condition | Grade |
|-----------|-------|
| Multi-threaded, ≤ cores | A |
| Single-threaded, cores > 1 | B |
| Threads > cores | C |

### D8-R2: Runtime Reasonableness
- **Data Source**: TIME STAMP section in `.iqtree` file
- **Note**: Informational only, does not directly affect grading

### D8-R3: Partition Analysis Configuration (partitioned analyses only)
- **Data Source**: `.iqtree` file
- **Grading**:

| Condition | Grade |
|-----------|-------|
| Reasonable partition model | A |
| Too many partitions, overly simple model | C |

---

## 11. Diagnostic Rule Execution Flow

```
Input Files
    │
    ▼
┌──────────────┐
│  File        │ ── Scan directory, identify all IQ-TREE output files
│  Discovery   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Parallel    │ ── Parse each file type independently
│  Parsers     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Data Model  │ ── Unify parsed results into internal data model
│  Building    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Cross-Check │ ── Cross-file data consistency verification
│              │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Diagnostic  │ ── Execute 36 diagnostic rules
│  Engine      │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Grading     │ ── Aggregate by dimension, compute overall grade
│  Summary     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Report      │ ── Generate human-readable report / JSON output
│  Generator   │
└──────────────┘
```

## 12. Cross-Validation Rules

In addition to diagnostic rules, TreeDoctor performs the following cross-file consistency checks:

| ID | Check Item | Files Involved | Description |
|----|-----------|----------------|-------------|
| X1 | Sequence count consistency | `.iqtree` vs `.log` vs `.mldist` | Sequence count should be consistent across files |
| X2 | Model name consistency | `.iqtree` ModelFinder vs SUBSTITUTION PROCESS | Best model should be consistent |
| X3 | Likelihood consistency | `.iqtree` ML TREE vs `.log` BEST SCORE | Final likelihood should match |
| X4 | Tree topology consistency | `.treefile` vs `.iqtree` embedded Newick | Tree strings should match |
| X5 | Support value consistency | `.treefile` supports vs `.splits.nex` | ML tree supports should correspond to splits |
| X6 | Bootstrap count consistency | `.iqtree` Type of analysis vs CONSENSUS TREE | Bootstrap replicates should match |
| X7 | Consensus Newick consistency | `.contree` vs `.iqtree` embedded consensus Newick | Should match |

Each cross-validation failure produces a **data consistency warning** (does not affect grading, but is flagged separately).
