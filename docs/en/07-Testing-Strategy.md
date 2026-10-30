# TreeDoctor Testing Strategy

This document defines TreeDoctor's complete testing strategy, including test levels, coverage targets, test data management, and CI/CD integration.

---

## 1. Test Pyramid

```
            /----------\
           /   E2E       \          ~5% (GUI end-to-end)
          /  Tests        \
         /----------------\
        /  Integration     \       ~15% (cross-module)
       /     Tests           \
      /------------------------\
     /    Unit Tests            \    ~80% (per-function/module)
    /                            \
   /------------------------------\
```

---

## 2. Test Level Details

### 2.1 Unit Tests

**Goal**: Test independent correctness of each function and module.

#### 2.1.1 Parser Unit Tests

Each parser needs tests for:

| Test Dimension | Description | Example |
|---------------|-------------|---------|
| Normal input | Typical valid input | Standard `.iqtree` file content |
| Boundary cases | Extreme but valid input | Minimal input with 3 sequences |
| Missing sections | Optional sections absent | No ModelFinder section |
| Missing fields | Some fields absent | No standard error `s.e.` |
| Format variants | Same field, different formats | Scientific notation vs float |
| Empty file | Completely empty input | Empty string |
| Truncated input | Incomplete input | File second half missing |
| Invalid input | Malformed input | Non-IQ-TREE output file |

#### 2.1.2 Test Case Template

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_normal() {
        let content = include_str!("test_data/example.iqtree");
        let result = parse_iqtree_report(content).unwrap();
        assert_eq!(result.version, "2.4.0");
        // ... more assertions
    }

    #[test]
    fn test_parse_empty() {
        let result = parse_iqtree_report("");
        assert!(result.is_err());
    }
}
```

#### 2.1.3 Diagnostic Rule Tests

Each rule needs at least 2 test cases:
- **Pass case**: Data that should get grade A or B
- **Fail case**: Data that should get grade D or F

---

## 2.2 Integration Tests

**Goal**: Test cross-module interactions.

### Key Integration Scenarios:

1. Full analysis pipeline: directory → parse → diagnose → report
2. Missing file handling: only `.iqtree` present
3. Version compatibility: 2.x and 3.x outputs
4. Report format consistency: text, JSON, markdown outputs

---

## 2.3 End-to-End Tests (GUI)

**Goal**: Test complete user workflows.

### Key E2E Scenarios:

1. Launch app → select directory → analyze → view results
2. Navigate between pages
3. Export report in different formats
4. Switch themes

---

## 3. Coverage Targets

| Level | Target |
|-------|--------|
| Unit test coverage | > 90% |
| Integration test coverage | > 80% |
| E2E test coverage | ~5% (key flows only) |
| Total coverage | > 85% |

---

## 4. Test Data Management

### 4.1 Test Datasets

| Dataset | Description | Use Case |
|---------|-------------|----------|
| example.phy | 17 sequences, 1998 sites, DNA | Benchmark testing |
| Large dataset | 100+ sequences, 10000+ sites | Performance testing |
| Protein dataset | AA sequences | Type coverage |
| Partitioned dataset | Multi-gene partitions | Partition analysis |
| IQ-TREE 2 output | v2.4.0 | Version compatibility |
| IQ-TREE 3 output | v3.1.4 | Version compatibility |
| Anomalous data | Problematic outputs | Diagnostic rule testing |
| No-bootstrap output | Tree only | Missing file testing |

### 4.2 Test Data Location

```
test-data/
└── example/
    ├── iqtree_output_example.iqtree
    ├── iqtree_output_example.log
    ├── iqtree_output_example.treefile
    ├── iqtree_output_example.contree
    ├── iqtree_output_example.splits.nex
    ├── iqtree_output_example.mldist
    ├── iqtree_output_example.model.gz
    ├── iqtree_output_example.bionj
    └── iqtree_output_example.ckp.gz
```

---

## 5. CI/CD Integration

### 5.1 GitHub Actions Workflow

```yaml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - run: cargo test
      - run: cargo clippy -- -D warnings
      - run: cargo fmt --check

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: cd gui && npm ci && npx tsc --noEmit
```

### 5.2 Quality Gates

| Gate | Requirement |
|------|-------------|
| Compilation | `cargo build` no warnings |
| Lint | `cargo clippy` no warnings |
| Format | `cargo fmt --check` passes |
| Tests | `cargo test` all pass |
| Frontend types | `npx tsc --noEmit` passes |
