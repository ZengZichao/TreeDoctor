# TreeDoctor CLI 设计规范

本文档定义 TreeDoctor 命令行界面（CLI）的完整设计规范，包括命令结构、参数定义、输出格式和使用示例。

---

## 1. CLI 工具名称

```
treedoctor
```

简称 `td`，作为别名提供。

---

## 2. 命令结构

TreeDoctor CLI 采用子命令模式：

```
treedoctor <COMMAND> [OPTIONS]
```

### 2.1 子命令列表

| 子命令 | 功能 | 说明 |
|--------|------|------|
| `analyze` | 分析 IQ-TREE 输出并生成诊断报告 | 主命令，默认命令 |
| `check` | 快速检查文件完整性和基本统计 | 轻量级检查，不做深度诊断 |
| `rules` | 列出所有诊断规则 | 查看可用规则及其说明 |
| `version` | 显示版本信息 | |
| `help` | 显示帮助 | |

**默认行为**：不带子命令时等同于 `analyze`。

---

## 3. `analyze` 命令详细设计

### 3.1 用法

```
treedoctor analyze [OPTIONS] <INPUT>
```

### 3.2 参数

| 参数 | 短选项 | 类型 | 必填 | 默认值 | 说明 |
|------|--------|------|------|--------|------|
| `<INPUT>` | | path | ✅ | | IQ-TREE 输出文件目录或 `.iqtree` 文件路径 |
| `--prefix` | `-p` | string | ❌ | 自动检测 | 文件前缀（如 `example`） |
| `--format` | `-f` | enum | ❌ | `text` | 输出格式：`text`/`json`/`markdown` |
| `--output` | `-o` | path | ❌ | stdout | 输出文件路径 |
| `--dimensions` | `-d` | string[] | ❌ | 全部 | 只显示指定维度（如 `D1,D5`） |
| `--min-grade` | `-g` | enum | ❌ | 无 | 只显示指定评级及更差的结果（如 `C` 显示 C/D/F） |
| `--verbose` | `-v` | flag | ❌ | false | 显示详细诊断细节 |
| `--quiet` | `-q` | flag | ❌ | false | 仅显示总体评级和摘要（与 `--min-grade` 互斥） |
| `--no-color` | | flag | ❌ | false | 禁用彩色输出 |
| `--config` | `-c` | path | ❌ | 无 | 自定义配置文件路径 |

### 3.2.1 参数详细说明

#### INPUT

- 可以是目录路径或 `.iqtree` 文件路径
- 若为目录，自动扫描其中的 IQ-TREE 输出文件
- 若为 `.iqtree` 文件，自动推断目录和前缀

#### --prefix

- 当目录中有多个分析结果时，需要指定前缀来区分
- 前缀是 IQ-TREE `--prefix` 参数指定的值，也是所有输出文件的公共前缀
- 若不指定，且目录中只有一个分析结果，则自动检测

#### --format

- `text`：人类可读的彩色文本（终端输出）
- `json`：结构化 JSON（适合管道处理和程序集成）
- `markdown`：Markdown 格式（适合写入文档）

#### --dimensions

- 逗号分隔的维度 ID 列表
- 有效值：`D1`-`D8`
- 示例：`--dimensions D1,D5` 只显示对齐质量和分支支持值

#### --min-grade

- 只显示评级等于或低于指定等级的诊断结果
- 有效值：`A`/`B`/`C`/`D`/`F`
- 示例：`--min-grade C` 只显示评级为 C、D 或 F 的结果
- 与 `--quiet` 互斥

#### --verbose

- 显示每条诊断规则的完整细节，包括所有数值指标
- 默认模式只显示摘要和建议

#### --quiet

- 最简输出：仅一行总体评级和关键发现列表
- 适合快速判断是否需要进一步检查

### 3.3 文本输出格式设计

#### 3.3.1 标准模式输出

```
╔══════════════════════════════════════════════════════════════════╗
║                     TreeDoctor 质量诊断报告                       ║
╠══════════════════════════════════════════════════════════════════╣
║  IQ-TREE 版本: 2.4.0                                            ║
║  输入文件前缀: example                                          ║
║  分析类型: ModelFinder + tree reconstruction + UFBoot (1000)    ║
║  分析时间: Mon Oct 26 21:16:52 2026                             ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  总体评级: B  良好                                               ║
║                                                                  ║
║  ┌──────────────────────────┬──────┬─────────────────────────┐  ║
║  │ 诊断维度                 │ 评级 │ 关键发现                 │  ║
║  ├──────────────────────────┼──────┼─────────────────────────┤  ║
║  │ D1 对齐质量              │  B   │ 8条序列未通过组成检验    │  ║
║  │ D2 模型选择              │  A   │ ModelFinder自动选择      │  ║
║  │ D3 似然与信息准则        │  A   │ 似然值合理               │  ║
║  │ D4 树拓扑与分支长度      │  A   │ 无异常分支               │  ║
║  │ D5 分支支持值            │  C   │ 2个低支持节点            │  ║
║  │ D6 Bootstrap收敛性       │  A   │ 相关系数1.000            │  ║
║  │ D7 一致性树一致性        │  A   │ RF距离=0                 │  ║
║  │ D8 运行参数              │  B   │ 单线程运行               │  ║
║  └──────────────────────────┴──────┴─────────────────────────┘  ║
║                                                                  ║
╠══════════════════════════════════════════════════════════════════╣
║  详细诊断结果                                                    ║
╠══════════════════════════════════════════════════════════════════╣

── D1: 对齐质量 ────────────────────────────────────────────── 评级: B ──

  [D1-R1] 序列组成卡方检验                                     B
  8 条序列（47.1%）未通过组成卡方检验（p < 0.05）
  失败序列: LngfishSA, LngfishAf, Crocodile, Bird, Human, Mouse, Platypus, Opossum
  建议: 建议检查这些序列是否存在测序错误或组成偏移。可考虑使用
  组成异质性模型或排除问题序列。

  [D1-R2] Gap/歧义字符比例                                     A
  所有序列 gap 比例均在合理范围内（< 5%）
  总体 gap 比例: 0.11%

  [D1-R3] 序列数量充分性                                      B
  当前数据集包含 17 条序列，建议至少使用 20 条以上序列。

  [D1-R4] 信息位点充分性                                      A
  信息位点占比 50.5%（1009 个），系统发育信号充分。

  [D1-R5] 恒定位点比例                                        A
  恒定位点占比 34.3%，变异位点充分。

  [D1-R6] 序列长度充分性                                      A
  序列长度 1998 位点，长度充足。

── D5: 分支支持值 ──────────────────────────────────────────── 评级: C ──

  [D5-R1] 低支持值节点数                                      C
  共有 2 个内部分支的 UFBoot 支持值 < 95%
  低支持分支:
    - Turtle + (Crocodile, Bird) 群组: SH-aLRT=85.5%, UFBoot=71%
    - Sphenodon 位置: SH-aLRT=37.6%, UFBoot=46%
  建议: 这些节点的拓扑关系不可靠。建议增加 bootstrap 重复次数
  或增加序列数据。

  [D5-R5] Bootstrap 重复次数                                  A
  UFBoot 重复次数: 1000，符合推荐标准。

── 交叉验证结果 ─────────────────────────────────────────────────────────

  ✅ [X1] 序列数一致性: 通过（17 条序列在所有文件中一致）
  ✅ [X2] 模型名称一致性: 通过（TIM2+F+I+G4）
  ✅ [X3] 似然值一致性: 通过（-21152.522）
  ✅ [X4] 树拓扑一致性: 通过
  ✅ [X5] 支持值一致性: 通过
  ✅ [X6] bootstrap 次数一致性: 通过（1000 次）
  ✅ [X7] 一致性树 Newick 一致性: 通过

╚══════════════════════════════════════════════════════════════════╝
```

#### 3.3.2 Quiet 模式输出

```
TreeDoctor: B (良好) - example
关键发现:
  • D1: 8条序列未通过组成检验 (47.1%)
  • D5: 2个低支持节点 (UFBoot < 95%)
  • D8: 单线程运行，建议使用多线程
```

#### 3.3.3 Verbose 模式输出

在标准模式基础上，每条诊断结果追加：

```
  [D1-R1] 序列组成卡方检验                                     B
  8 条序列（47.1%）未通过组成卡方检验（p < 0.05）
  
  详细数据:
    序列         Gap%    组成检验    p-value
    LngfishAu    0.15%   passed      6.20%
    LngfishSA    0.00%   failed      0.62%
    LngfishAf    0.05%   failed      1.60%
    ...
  
  数值指标:
    n_sequences: 17
    n_failed: 8
    failed_percentage: 47.1
    significance_level: 0.05
    degrees_of_freedom: 3
  
  建议: 建议检查这些序列是否存在测序错误或组成偏移...
```

### 3.4 JSON 输出格式设计

```json
{
  "tool": "TreeDoctor",
  "version": "0.1.0",
  "timestamp": "2026-10-26T21:20:00Z",
  
  "input": {
    "prefix": "example",
    "directory": "/path/to/output",
    "files_found": ["iqtree", "log", "treefile", "contree", "splits.nex", "mldist"],
    "files_missing": ["model.gz", "bionj"]
  },
  
  "analysis_info": {
    "iqtree_version": "2.4.0",
    "analysis_type": "ModelFinder + tree reconstruction + ultrafast bootstrap (1000 replicates)",
    "random_seed": 496837,
    "completion_time": "Mon Oct 26 21:16:52 2026"
  },
  
  "overall_grade": "B",
  
  "alignment": {
    "n_sequences": 17,
    "n_sites": 1998,
    "seq_type": "DNA",
    "n_constant_sites": 686,
    "frac_constant": 0.3433,
    "n_informative_sites": 1009,
    "frac_informative": 0.5050,
    "n_patterns": 1152
  },
  
  "composition_test": {
    "n_total": 17,
    "n_failed": 8,
    "failed_percentage": 47.1,
    "failed_sequences": ["LngfishSA", "LngfishAf", "Crocodile", "Bird", "Human", "Mouse", "Platypus", "Opossum"],
    "total_gap_percentage": 0.11,
    "significance_level": 0.05,
    "degrees_of_freedom": 3
  },
  
  "model": {
    "best_model": "TIM2+F+I+G4",
    "criterion": "BIC",
    "best_aic": "GTR+F+I+G4",
    "best_aicc": "GTR+F+I+G4",
    "best_bic": "TIM2+F+I+G4",
    "alpha": 0.7648,
    "pinv": 0.1687,
    "n_free_parameters": 39
  },
  
  "likelihood": {
    "log_likelihood": -21152.5219,
    "se": 336.2931,
    "unconstrained_logl": -11402.5956,
    "aic": 42383.0439,
    "aicc": 42384.6373,
    "bic": 42601.4400
  },
  
  "tree": {
    "n_taxa": 17,
    "total_tree_length": 4.2180,
    "internal_branch_length": 0.9934,
    "internal_branch_percentage": 23.55,
    "has_negative_branches": false,
    "near_zero_branches": 0,
    "long_branches": 0,
    "support_type": "SH-aLRT/UFBoot"
  },
  
  "bootstrap": {
    "type": "ultrafast",
    "n_replicates": 1000,
    "correlation_coefficient": 1.0,
    "n_iterations": 102,
    "consensus_logl": -21152.522112,
    "rf_distance": 0
  },
  
  "diagnostics": [
    {
      "rule_id": "D1-R1",
      "dimension_id": "D1",
      "dimension_name": "对齐质量",
      "rule_name": "序列组成卡方检验",
      "grade": "B",
      "summary": "8条序列（47.1%）未通过组成卡方检验",
      "detail": "...",
      "recommendation": "...",
      "metrics": {
        "n_failed": 8,
        "failed_percentage": 47.1
      }
    },
    ...
  ],
  
  "dimensions": [
    {
      "dimension_id": "D1",
      "dimension_name": "对齐质量",
      "grade": "B"
    },
    ...
  ],
  
  "cross_checks": [
    {
      "check_id": "X1",
      "check_name": "序列数一致性",
      "passed": true,
      "message": "17条序列在所有文件中一致"
    },
    ...
  ]
}
```

### 3.5 Markdown 输出格式设计

```markdown
# TreeDoctor 质量诊断报告

**文件前缀**: example  
**IQ-TREE 版本**: 2.4.0  
**分析类型**: ModelFinder + tree reconstruction + ultrafast bootstrap (1000 replicates)  
**分析时间**: Mon Oct 26 21:16:52 2026  

## 总体评级: B (良好)

| 维度 | 评级 | 关键发现 |
|------|------|----------|
| D1 对齐质量 | B | 8条序列未通过组成检验 |
| D2 模型选择 | A | ModelFinder自动选择 |
| D3 似然与信息准则 | A | 似然值合理 |
| D4 树拓扑与分支长度 | A | 无异常分支 |
| D5 分支支持值 | C | 2个低支持节点 |
| D6 Bootstrap收敛性 | A | 相关系数1.000 |
| D7 一致性树一致性 | A | RF距离=0 |
| D8 运行参数 | B | 单线程运行 |

## 详细诊断结果

### D1: 对齐质量 — 评级: B

#### D1-R1: 序列组成卡方检验 — 评级: B

8 条序列（47.1%）未通过组成卡方检验（p < 0.05）。

失败序列: LngfishSA, LngfishAf, Crocodile, Bird, Human, Mouse, Platypus, Opossum

**建议**: 建议检查这些序列是否存在测序错误或组成偏移...

...

## 交叉验证结果

| 检查项 | 结果 | 说明 |
|--------|------|------|
| X1 序列数一致性 | ✅ 通过 | 17条序列在所有文件中一致 |
| X2 模型名称一致性 | ✅ 通过 | TIM2+F+I+G4 |
| ... | ... | ... |
```

---

## 4. `check` 命令设计

### 4.1 用法

```
treedoctor check [OPTIONS] <INPUT>
```

### 4.2 功能

快速检查 IQ-TREE 输出文件的完整性和基本统计信息，不做深度诊断。

### 4.3 输出示例

```
TreeDoctor 文件检查: example

找到的文件:
  ✅ example.iqtree        (主报告)      [P0]
  ✅ example.log           (运行日志)      [P0]
  ✅ example.treefile      (ML树)          [P0]
  ✅ example.contree       (一致性树)      [P1]
  ✅ example.splits.nex    (分裂网络)      [P1]
  ✅ example.mldist        (距离矩阵)      [P2]
  ✅ example.model.gz      (模型详情)      [P2]
  ✅ example.bionj         (BIONJ树)       [P3]
  ✅ example.ckp.gz        (检查点)        [P3]

基本统计:
  IQ-TREE 版本: 2.4.0
  序列数: 17
  位点数: 1998
  最优模型: TIM2+F+I+G4
  对数似然: -21152.522
  Bootstrap: UFBoot 1000次
  运行时间: 12.7秒

文件完整性: 通过
```

**注意**：`[P0]`-`[P3]` 标签表示解析优先级，与 01 文档中的定义一致。实际输出中文件名和大小取决于具体分析。

---

## 5. `rules` 命令设计

### 5.1 用法

```
treedoctor rules [--dimension <ID>]
```

### 5.2 输出示例

```
TreeDoctor 诊断规则列表 (共36条)

D1: 对齐质量 (6条)
  D1-R1  序列组成卡方检验
  D1-R2  Gap/歧义字符比例
  D1-R3  序列数量充分性
  D1-R4  信息位点充分性
  D1-R5  恒定位点比例
  D1-R6  序列长度充分性

D2: 模型选择 (5条)
  D2-R1  ModelFinder自动选择
  D2-R2  模型复杂性合理性
  D2-R3  信息准则一致性
  D2-R4  速率异质性评估
  D2-R5  不变位点比例评估

...
```

---

## 6. 退出码

| 退出码 | 含义 |
|--------|------|
| 0 | 分析成功，总体评级 A 或 B |
| 1 | 分析成功，总体评级 C |
| 2 | 分析成功，总体评级 D 或 F |
| 3 | 文件解析错误（部分或全部文件无法解析） |
| 4 | 关键文件缺失（`.iqtree` 或 `.log` 等必须文件未找到） |
| 5 | 内部错误（不应发生的程序错误） |

**设计说明**：退出码设计使得可以在 shell 脚本中通过退出码判断分析质量，便于流水线集成。

---

## 7. 配置文件

TreeDoctor 支持可选的 YAML 配置文件（`~/.treedoctor.yml` 或 `--config` 指定）：

```yaml
# 默认输出格式
default_format: text

# 默认显示的最小评级
default_min_grade: B

# 是否启用彩色输出
color: true

# 自定义评级阈值（覆盖默认规则）
thresholds:
  D1-R1:
    n_failed_percentage:
      A: 0
      B: 10
      C: 30
      D: 50
  D1-R3:
    n_sequences:
      A: 50
      B: 20
      C: 10
      D: 4

# 排除的诊断规则
exclude_rules:
  - D8-R3  # 不检查分区配置

# 自定义规则文件目录
custom_rules_dir: ~/.treedoctor/rules
```

---

## 8. 使用示例

### 8.1 基本用法

```bash
# 分析目录中的 IQ-TREE 输出
treedoctor analyze /path/to/iqtree/output

# 指定文件前缀
treedoctor analyze /path/to/output --prefix my_analysis

# 直接指定 .iqtree 文件
treedoctor analyze /path/to/output/example.iqtree

# JSON 输出到文件
treedoctor analyze /path/to/output -f json -o report.json

# 只显示警告及以上
treedoctor analyze /path/to/output --min-grade C

# 只检查对齐质量和分支支持
treedoctor analyze /path/to/output -d D1,D5

# 快速检查
treedoctor analyze /path/to/output -q
```

### 8.2 流水线集成

```bash
# 在 shell 脚本中使用退出码
if treedoctor analyze /path/to/output -q; then
    echo "质量检查通过"
elif [ $? -eq 1 ]; then
    echo "质量一般，请查看报告"
else
    echo "质量警告！请检查报告"
    exit 1
fi

# 提取 JSON 字段
treedoctor analyze /path/to/output -f json | jq '.overall_grade'

# 批量检查
for dir in /data/*/; do
    echo "=== $dir ==="
    treedoctor analyze "$dir" -q
done
```
