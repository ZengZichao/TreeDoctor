# TreeDoctor CLI Design Specification

This document defines the complete design specification for the TreeDoctor command-line interface (CLI), including command structure, argument definitions, output formats, and usage examples.

---

## 1. CLI Tool Name

```
treedoctor
```

Alias: `td`

---

## 2. Command Structure

TreeDoctor CLI uses a subcommand pattern:

```
treedoctor <COMMAND> [OPTIONS]
```

### 2.1 Subcommand List

| Subcommand | Function | Description |
|-----------|---------|-------------|
| `analyze` | Analyze IQ-TREE output and generate diagnostic report | Main command, default |
| `check` | Quick file completeness check and basic stats | Lightweight, no deep diagnostics |
| `rules` | List all diagnostic rules | View available rules |
| `version` | Display version info | |
| `help` | Display help | |

**Default behavior**: Without a subcommand, defaults to `analyze`.

---

## 3. `analyze` Command

### 3.1 Usage

```
treedoctor analyze [OPTIONS] <INPUT>
```

### 3.2 Arguments

| Argument | Short | Type | Required | Default | Description |
|----------|-------|------|----------|---------|-------------|
| `INPUT` | - | path | Yes | - | IQ-TREE output directory or file |
| `--prefix` | `-p` | string | No | auto | File prefix |
| `--format` | `-f` | enum | No | text | Output format: text/json/markdown |
| `--output` | `-o` | path | No | stdout | Output file path |
| `--dimensions` | `-d` | list | No | all | Filter by dimension (D1,D2,...) |
| `--min-grade` | `-g` | enum | No | A | Show results >= specified grade |
| `--verbose` | `-v` | flag | No | false | Show detailed metrics |
| `--quiet` | `-q` | flag | No | false | Show only overall grade and key findings |
| `--no-color` | - | flag | No | false | Disable colored output |

### 3.3 Usage Examples

```bash
# Basic analysis with text output
treedoctor analyze ./test-data/example/

# Generate JSON report
treedoctor analyze ./test-data/example/ -f json -o report.json

# Only show D1 and D5 dimensions, grade C or below
treedoctor analyze ./data/ -d D1,D5 -g C

# Quiet mode - just the grade and key findings
treedoctor analyze ./data/ -q

# Specify prefix explicitly
treedoctor analyze ./data/ -p my_analysis
```

---

## 4. `check` Command

### 4.1 Usage

```
treedoctor check [OPTIONS] <INPUT>
```

### 4.2 Output

Shows found/missing files with status indicators:

```
TreeDoctor File Check: iqtree_output_example

Found Files:
  ✅ iqtree_output_example.iqtree (Main Report) [P0]
  ✅ iqtree_output_example.log (Run Log) [P0]
  ✅ iqtree_output_example.treefile (ML Tree) [P0]
  ❌ iqtree_output_example.contree (Consensus Tree) [P1]
  ...

Basic Statistics:
  IQ-TREE Version: 2.4.0
  Sequences: 17
  Sites: 1998
  Best Model: TIM2+F+I+G4
  Log-likelihood: -21152.5219

File Completeness: Partial
```

---

## 5. `rules` Command

### 5.1 Usage

```
treedoctor rules [--dimension <DIM>]
```

### 5.2 Output

Lists all 36 diagnostic rules grouped by dimension:

```
TreeDoctor Diagnostic Rules (36 total)

D1: Alignment Quality (6 rules)
  D1-R1  Sequence Composition Chi-Square Test
  D1-R2  Gap/Ambiguity Character Ratio
  ...
```

---

## 6. Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success, quality grade A or B |
| 1 | Success, quality grade C |
| 2 | Success, quality grade D or F |
| 3 | Partial analysis (missing critical files) |
| 4 | File integrity check failed |
| 5 | Fatal error |

---

## 7. Output Format Details

### 7.1 Text Format (Default)

Human-readable text with sections for each dimension, color-coded grades, and recommendations.

### 7.2 JSON Format

Structured JSON with complete data model serialization, suitable for pipeline integration.

### 7.3 Markdown Format

GitHub-flavored Markdown with tables, collapsible sections, and formatted output for documentation or sharing.
