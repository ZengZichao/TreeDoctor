# IQ-TREE 输出文件格式详细规范

本文档详细记录 IQ-TREE（v2.4.0 / v3.1.4）生成的所有输出文件的格式规范，作为 TreeDoctor 解析器的开发依据。所有格式说明均基于实际运行 IQ-TREE 生成的真实输出文件。

---

## 1. 主报告文件：`prefix.iqtree`

### 1.1 文件概述

主报告文件是纯文本格式，包含 IQ-TREE 分析的完整摘要信息。这是 TreeDoctor 最核心的解析对象。

### 1.2 文件结构（按节划分）

主报告文件由以下"节"（Section）组成，每节以全大写标题开头，后跟短横线分隔线：

```
IQ-TREE 2.4.0 built Feb  7 2025

Input file name: ...
Type of analysis: ModelFinder + tree reconstruction + ultrafast bootstrap (1000 replicates)
Random seed number: 496837

REFERENCES
----------

SEQUENCE ALIGNMENT
------------------

ModelFinder
-----------

SUBSTITUTION PROCESS
--------------------

MAXIMUM LIKELIHOOD TREE
-----------------------

CONSENSUS TREE
--------------

ALISIM COMMAND
--------------

TIME STAMP
----------
```

### 1.3 各节详细字段

#### 1.3.1 文件头（Header）

| 字段 | 格式 | 示例 | 解析说明 |
|------|------|------|----------|
| IQ-TREE 版本 | `IQ-TREE {major}.{minor}.{patch} built {date}` | `IQ-TREE 2.4.0 built Feb  7 2025` | 正则：`^IQ-TREE (\d+\.\d+\.\d+) built (.+)$` |
| 输入文件名 | `Input file name: {path}` | `Input file name: example.phy` | |
| 用户树文件 | `User tree file name: {path}` | （可选，仅指定用户树时出现） | |
| 分析类型 | `Type of analysis: {description}` | `ModelFinder + tree reconstruction + ultrafast bootstrap (1000 replicates)` | 解析是否包含 ModelFinder、建树、bootstrap |
| 随机种子 | `Random seed number: {number}` | `Random seed number: 496837` | |

#### 1.3.2 REFERENCES 节

此节列出参考文献，不包含需解析的量化数据，TreeDoctor 可跳过或用于展示引用信息。

#### 1.3.3 SEQUENCE ALIGNMENT 节

**非分区分析的格式：**

```
Input data: 17 sequences with 1998 nucleotide sites
Number of constant sites: 686 (= 34.3343% of all sites)
Number of invariant (constant or ambiguous constant) sites: 686 (= 34.3343% of all sites)
Number of parsimony informative sites: 1009
Number of distinct site patterns: 1152
```

| 字段 | 正则模式 | 数据类型 | 说明 |
|------|----------|----------|------|
| 序列数 | `Input data: (\d+) sequences` | int | |
| 位点数 | `with (\d+) ` | int | 总位点数 |
| 序列类型 | `(\w+) sites$` | string | "nucleotide"/"amino-acid"/"codon"/"binary" |
| 恒定位点数 | `Number of constant sites: (\d+) ` | int | |
| 恒定位点比例 | `\(= ([\d.]+)% of all sites\)` | float | 百分比 |
| 不变位点数 | `Number of invariant.*sites: (\d+)` | int | |
| 信息位点数 | `Number of parsimony informative sites: (\d+)` | int | |
| 不同模式数 | `Number of distinct site patterns: (\d+)` | int | |

**分区分析的格式：**

```
Input data: 10 taxa with 5 partitions and 5000 total sites (12.5% missing data)

  ID  Type  Seq  Site  Unique  Infor  Invar  Const  Name
   1  DNA   10   1000  800     500    200    150    gene1
   2  AA    10   1000  900     600    100    100    gene2
   ...
```

分区表各列含义：

| 列名 | 含义 |
|------|------|
| ID | 分区编号 |
| Type | 序列类型（DNA/AA/CODON/BIN/MORPH/POMO） |
| Seq | 序列数 |
| Site | 位点数 |
| Unique | 不同模式数 |
| Infor | 信息位点数 |
| Invar | 不变位点数 |
| Const | 恒定位点数 |
| Name | 分区名称 |

#### 1.3.4 ModelFinder 节

```
Best-fit model according to BIC: TIM2+F+I+G4

List of models sorted by BIC scores: 

Model                  LogL         AIC      w-AIC        AICc     w-AICc         BIC      w-BIC
TIM2+F+I+G4      -21152.612   42383.224 +    0.069   42384.818 +   0.0791   42601.620 +    0.945
TIM2+F+G4        -21159.731   42395.462 - 0.000152   42396.975 - 0.000181   42608.259 -   0.0342
...
```

**关键解析字段：**

| 字段 | 正则模式 | 说明 |
|------|----------|------|
| 最优模型 | `Best-fit model according to (\w+): (\S+)` | 准则 + 模型名 |
| 模型表行 | `^(\S+)\s+(-?[\d.]+)\s+([\d.]+)\s+([+-])\s+([\d.e-]+)\s+([\d.]+)\s+([+-])\s+([\d.e-]+)\s+([\d.]+)\s+([+-])\s+([\d.e-]+)` | 逐行解析模型对比表 |

模型表各列：

| 列 | 含义 |
|----|------|
| Model | 模型名称 |
| LogL | 对数似然值 |
| AIC | AIC 分数 |
| w-AIC | AIC 权重（`+`号表示在95%置信集中，`-`号表示被显著排除） |
| AICc | 校正 AIC 分数 |
| w-AICc | 校正 AIC 权重 |
| BIC | BIC 分数 |
| w-BIC | BIC 权重 |

#### 1.3.5 SUBSTITUTION PROCESS 节

```
Model of substitution: TIM2+F+I+G4

Rate parameter R:

  A-C: 5.6922
  A-G: 7.7983
  A-T: 5.6922
  C-G: 1.0000
  C-T: 22.9838
  G-T: 1.0000

State frequencies: (empirical counts from alignment)

  pi(A) = 0.3547
  pi(C) = 0.2282
  pi(G) = 0.1919
  pi(T) = 0.2252

Rate matrix Q:

  A   -0.7511    0.2393    0.2757    0.2361
  C    0.3719    -1.361   0.03535    0.9533
  G    0.5095   0.04204    -0.593   0.04148
  T    0.3719    0.9663   0.03535    -1.374

Model of rate heterogeneity: Invar+Gamma with 4 categories
Proportion of invariable sites: 0.1687
Gamma shape alpha: 0.7648

 Category  Relative_rate  Proportion
  0         0              0.1687
  1         0.1059         0.2078
  2         0.4722         0.2078
  3         1.139          0.2078
  4         3.095          0.2078
```

**关键解析字段：**

| 字段 | 正则模式 | 说明 |
|------|----------|------|
| 替换模型 | `Model of substitution: (\S+)` | |
| 速率参数 | `([A-Z]-[A-Z]): ([\d.]+)` | 6个替换速率 |
| 状态频率 | `pi\(([A-Z])\) = ([\d.]+)` | 4个碱基/氨基酸频率 |
| 速率异质性模型 | `Model of rate heterogeneity: (.+)` | |
| 不变位点比例 | `Proportion of invariable sites: ([\d.]+)` | |
| Gamma shape | `Gamma shape alpha: ([\d.]+)` | |
| 速率类别 | `^(\d+)\s+([\d.]+)\s+([\d.]+)$` | 类别号、相对速率、比例 |

#### 1.3.6 MAXIMUM LIKELIHOOD TREE 节

```
Log-likelihood of the tree: -21152.5219 (s.e. 336.2931)
Unconstrained log-likelihood (without tree): -11402.5956
Number of free parameters (#branches + #model parameters): 39
Akaike information criterion (AIC) score: 42383.0439
Corrected Akaike information criterion (AICc) score: 42384.6373
Bayesian information criterion (BIC) score: 42601.4400

Total tree length (sum of branch lengths): 4.2180
Sum of internal branch lengths: 0.9934 (23.5513% of tree length)

NOTE: Tree is UNROOTED although outgroup taxon 'LngfishAu' is drawn at root
Numbers in parentheses are SH-aLRT support (%) / ultrafast bootstrap support (%)

[ASCII 树图]

Tree in newick format:

(Newick 字符串);
```

**关键解析字段：**

| 字段 | 正则模式 | 说明 |
|------|----------|------|
| 对数似然值 | `Log-likelihood of the tree: (-?[\d.]+)` | |
| 标准误 | `\(s\.e\. ([\d.]+)\)` | 可选，可能不存在 |
| 无约束对数似然 | `Unconstrained log-likelihood.*: (-?[\d.]+)` | |
| 自由参数数 | `Number of free parameters.*: (\d+)` | |
| AIC | `Akaike information criterion \(AIC\) score: ([\d.]+)` | |
| AICc | `Corrected Akaike.*\(AICc\) score: ([\d.]+)` | |
| BIC | `Bayesian information criterion \(BIC\) score: ([\d.]+)` | |
| 总树长 | `Total tree length.*: ([\d.]+)` | |
| 内部分支总长 | `Sum of internal branch lengths: ([\d.]+)` | |
| 内部分支比例 | `\(([\d.]+)% of tree length\)` | |
| 是否有根 | `Tree is (ROOTED|UNROOTED)` | |
| 支持值类型 | `Numbers in parentheses are (.+)` | 可能有多种组合 |
| Newick 树 | 位于 `Tree in newick format:` 之后 | 独立行 |

**支持值类型解析：**

支持值注释行 `Numbers in parentheses are ...` 可以包含以下组合（以 `/` 分隔）：
- `SH-aLRT support (%)` — SH-aLRT 检验
- `local bootstrap support (%)` — 局部 bootstrap
- `parametric aLRT support` — 参数化 aLRT
- `aBayes support` — aBayes 检验
- `standard bootstrap support (%)` — 标准 bootstrap
- `ultrafast bootstrap support (%)` — 超快 bootstrap

Newick 树中的支持值格式为 `SH-aLRT/UFBoot`，如 `100/100` 或 `85.5/71`。

#### 1.3.7 CONSENSUS TREE 节

```
Consensus tree is constructed from 1000 bootstrap trees
Log-likelihood of consensus tree: -21152.522112
Robinson-Foulds distance between ML tree and consensus tree: 0

Branches with support >0.000000% are kept (extended consensus)
Branch lengths are optimized by maximum likelihood on original alignment
Numbers in parentheses are bootstrap supports (%)

[ASCII 树图]

Consensus tree in newick format: 

(Newick 字符串);
```

**关键解析字段：**

| 字段 | 正则模式 | 说明 |
|------|----------|------|
| Bootstrap 次数 | `constructed from (\d+) bootstrap trees` | |
| 一致性树似然 | `Log-likelihood of consensus tree: (-?[\d.]+)` | |
| RF 距离 | `Robinson-Foulds distance.*: (\d+)` | ML树与一致性树的RF距离 |
| 一致性阈值 | `support >([\d.]+)%` | 一致性树的分支保留阈值 |
| Newick 一致性树 | 位于 `Consensus tree in newick format:` 之后 | |

#### 1.3.8 TIME STAMP 节

```
Date and time: Mon Oct 26 21:16:52 2026
Total CPU time used: 13.015625 seconds (0h:0m:13s)
Total wall-clock time used: 12.7092178 seconds (0h:0m:12s)
```

| 字段 | 正则模式 | 说明 |
|------|----------|------|
| 完成时间 | `Date and time: (.+)` | |
| CPU 时间 | `Total CPU time used: ([\d.]+) seconds` | |
| Wall-clock 时间 | `Total wall-clock time used: ([\d.]+) seconds` | |

#### 1.3.9 警告信息

主报告中可能出现的警告（需要 TreeDoctor 识别和归类）：

| 警告文本模式 | 含义 | 严重程度 |
|--------------|------|----------|
| `WARNING: ... near-zero internal branches (<...) should be treated with caution` | 近零内部分支 | 中 |
| `WARNING: ... too long branches (>...) should be treated with caution!` | 过长分支 | 中 |
| `WARNING: This model has ... parameters that may be overfitting` | 模型过拟合 | 高 |
| `WARNING: K>=n, ... parameter estimates might be inaccurate` | 参数过多 | 高 |
| `**NOTE**: Consensus tree has higher likelihood than ML tree found!` | 一致性树似然更高 | 高 |
| `NOTE: Tree is UNROOTED` | 树无根（信息提示，非警告） | 信息 |
| `NOTE: The branch lengths of PoMo measure mutations and frequency shifts.` | PoMo 模型说明 | 信息 |

---

## 2. 运行日志文件：`prefix.log`

### 2.1 文件概述

日志文件记录 IQ-TREE 运行的完整过程，包含主报告文件中没有的详细信息，特别是序列组成检验表。

### 2.2 关键解析内容

#### 2.2.1 序列组成卡方检验表

```
           Gap/Ambiguity  Composition  p-value
Analyzing sequences: done in 5.93e-005 secs
   1  LngfishAu    0.15%    passed      6.20%
   2  LngfishSA    0.00%    failed      0.62%
   ...
****  TOTAL        0.11%  8 sequences failed composition chi2 test (p-value<5%; df=3)
```

**逐行解析：**

每行格式为：`序号  序列名  Gap%  passed/failed  p-value%`

| 字段 | 格式 | 正则模式 | 说明 |
|------|------|----------|------|
| 序列编号 | 整数 | `^\s*(\d+)` | 行首可能有前导空格 |
| 序列名 | 字符串 | `^\s*\d+\s+(\S+)` | |
| Gap/歧义比例 | 百分比 | 第1个 `([\d.]+)%` | 如 `0.15%`、`0.00%` |
| 组成检验结果 | passed/failed | `(passed|failed)` | |
| p-value | 百分比 | 第2个 `([\d.]+)%` | 如 `6.20%`、`0.00%` |

**注意**：p-value 列以百分比形式给出（如 `0.62%` 表示 p=0.0062），而非小数形式。

**总计行解析：**

```
****  TOTAL        0.11%  8 sequences failed composition chi2 test (p-value<5%; df=3)
```

| 字段 | 正则模式 | 说明 |
|------|----------|------|
| 总 Gap 比例 | `TOTAL\s+([\d.]+)%` | |
| 失败序列数 | `(\d+) sequences failed` | |
| 显著性阈值 | `p-value<(\d+)%` | 注意是 `5%` 而非 `0.05` |
| 自由度 | `df=(\d+)` | DNA 数据自由度通常为 3 |

#### 2.2.2 对齐基本信息

```
Reading alignment file example.phy ... Phylip format detected
Alignment most likely contains DNA/RNA sequences
Alignment has 17 sequences with 1998 columns, 1152 distinct patterns
1009 parsimony-informative, 303 singleton sites, 686 constant sites
```

| 字段 | 正则模式 | 说明 |
|------|----------|------|
| 文件格式 | `(Phylip|FASTA|Nexus|Clustal|MSF) format detected` | |
| 序列类型 | `most likely contains (DNA/RNA|protein)` | |
| 序列数 | `Alignment has (\d+) sequences` | |
| 列数 | `with (\d+) columns` | |
| 模式数 | `(\d+) distinct patterns` | |
| 信息位点数 | `(\d+) parsimony-informative` | 注意是 `parsimony`（IQ-TREE 的拼写） |
| 单态位点数 | `(\d+) singleton sites` | |
| 恒定位点数 | `(\d+) constant sites` | |

**注意**：`.iqtree` 主报告中拼写为 `parsimony informative`，`.log` 中拼写为 `parsimony-informative`，两者均为 IQ-TREE 的实际拼写（非标准英文 `parsimony` 应为 `parsimony`），解析器需兼容。

#### 2.2.3 Bootstrap 收敛性指标

```
NOTE: Bootstrap correlation coefficient of split occurrence frequencies: 1.000
```

| 字段 | 正则模式 | 说明 |
|------|----------|------|
| Bootstrap 相关系数 | `Bootstrap correlation coefficient.*: ([\d.]+)` | 接近1.0表示收敛 |

```
Log-likelihood cutoff on original alignment: -21183.131
```

| 字段 | 正则模式 | 说明 |
|------|----------|------|
| 似然截止值 | `Log-likelihood cutoff on original alignment: (-?[\d.]+)` | 可出现多次，取最后一次的值 |

#### 2.2.4 迭代信息

```
Iteration 10 / LogL: -21152.627 / Time: 0h:0m:6s
...
Iteration 60 / LogL: -21153.134 / Time: 0h:0m:9s (0h:0m:3s left)
...
TREE SEARCH COMPLETED AFTER 102 ITERATIONS / Time: 0h:0m:11s
```

| 字段 | 正则模式 | 说明 |
|------|----------|------|
| 迭代号 | `Iteration (\d+)` | |
| LogL | `LogL: (-?[\d.]+)` | |
| 时间 | `Time: (\S+)` | 已用时间 |
| 剩余时间 | `\((\S+) left\)` | 可选，部分迭代行包含剩余时间估计 |
| 总迭代数 | `COMPLETED AFTER (\d+) ITERATIONS` | |

#### 2.2.5 似然优化过程

```
BETTER TREE FOUND at iteration 1: -21152.595
BEST SCORE FOUND : -21152.522
```

| 字段 | 正则模式 | 说明 |
|------|----------|------|
| 更优树似然 | `BETTER TREE FOUND at iteration (\d+): (-?[\d.]+)` | |
| 最佳似然 | `BEST SCORE FOUND : (-?[\d.]+)` | 最终最优似然值 |

#### 2.2.6 模型选择过程

```
Akaike Information Criterion:           GTR+F+I+G4
Corrected Akaike Information Criterion: GTR+F+I+G4
Bayesian Information Criterion:         TIM2+F+I+G4
Best-fit model: TIM2+F+I+G4 chosen according to BIC
```

| 字段 | 正则模式 | 说明 |
|------|----------|------|
| AIC 最优模型 | `Akaike Information Criterion:\s+(\S+)` | |
| AICc 最优模型 | `Corrected Akaike Information Criterion:\s+(\S+)` | |
| BIC 最优模型 | `Bayesian Information Criterion:\s+(\S+)` | |
| 最终最优模型 | `Best-fit model: (\S+) chosen according to (\w+)` | 模型名 + 准则 |

**注意**：AIC/AICc 选出的模型可能与 BIC 选出的不同。在此示例中，AIC/AICc 选出 `GTR+F+I+G4`，而 BIC 选出 `TIM2+F+I+G4`。

---

## 3. ML 树文件：`prefix.treefile`

### 3.1 格式

Newick 格式，单行，末尾有分号。支持值以 `SH-aLRT/UFBoot` 格式嵌入分支名位置。

### 3.2 示例

```
(LngfishAu:0.1710870825,(LngfishSA:0.1883807809,LngfishAf:0.1649399635)100/100:0.1072996568,...);
```

### 3.3 解析要点

- 分支长度以 `:` 后的浮点数表示
- 支持值以 `SH-aLRT/UFBoot` 格式出现在内部分支名位置（无引号）
- 支持值为浮点数（如 `85.5/71`）
- 根节点无分支长度
- 末尾以 `;` 结束

---

## 4. 一致性树文件：`prefix.contree`

### 4.1 格式

Newick 格式，单行。支持值为纯 bootstrap 百分比（无 SH-aLRT）。

### 4.2 示例

```
(LngfishAu:0.1709947097,(LngfishSA:0.1883013207,LngfishAf:0.1648516204)100:0.1072583025,...);
```

### 4.3 注意事项

- 一致性树仅在启用 bootstrap 时产生
- 一致性树的支持值格式为单个数字（bootstrap 支持百分比），不带 `/`
- 分支长度已重新优化

---

## 5. 分裂网络文件：`prefix.splits.nex`

### 5.1 格式

NEXUS 格式，包含 Taxa 块和 Splits 块。

### 5.2 结构

```
#nexus

BEGIN Taxa;
DIMENSIONS ntax=17;
TAXLABELS
[1] 'LngfishAu'
[2] 'LngfishSA'
...
;
END; [Taxa]

BEGIN Splits;
DIMENSIONS ntax=17 nsplits=59;
FORMAT labels=no weights=yes confidences=no intervals=no;
MATRIX
	100	 2,
	100	 3,
	100	 2 3,
	...
	0	 7 8,
;
END; [Splits]
```

### 5.3 关键字段

| 字段 | 说明 |
|------|------|
| ntax | 分类群数量 |
| nsplits | 分裂总数 |
| 矩阵行 | 每行格式为 `\t支持值\t 分类群编号1 分类群编号2 ...`，以逗号结尾。第一个数字为支持值（百分比），后续数字为分类群编号 |
| 支持值为 0 | 表示该分裂在 bootstrap 中未出现 |
| 支持值为 100 | 表示该分裂在所有 bootstrap 树中均出现 |

### 5.4 解析要点

- 支持值 > 0 的分裂数量可用于评估树拓扑的可靠性
- 支持值低的分裂（< 50%）需特别关注
- 可与 ML 树拓扑交叉验证

---

## 6. 似然距离矩阵：`prefix.mldist`

### 6.1 格式

Phylip 距离矩阵格式。

### 6.2 结构

```
17
LngfishAu  0.0000000 0.4565546 0.4414905 ...
LngfishSA  0.4565546 0.0000000 0.3487336 ...
...
```

### 6.3 解析要点

- 第一行为序列数
- 后续每行：序列名 + 各序列间距离（空格分隔）
- 距离为 ML 模型下的校正距离
- 对角线为 0.0
- 可用于检测异常序列（距离过远或过近）

---

## 7. 模型详情文件：`prefix.model.gz`

### 7.1 格式

gzip 压缩的纯文本文件，包含 ModelFinder 测试的所有模型的完整参数。

### 7.2 解析要点

- 需先解压
- 包含每个模型的速率矩阵、频率、似然值等完整参数
- 用于深度模型比较和分析

---

## 8. 初始 NJ 树：`prefix.bionj`

### 8.1 格式

Newick 格式，包含分支长度但不包含支持值。

### 8.2 用途

- 可与 ML 树比较拓扑差异
- 用于评估搜索过程的改进程度

### 8.3 注意事项

- BIONJ 树可能包含负分支长度（如 `-0.0098774508`），这是正常现象
- BIONJ 树不包含支持值

---

## 9. 检查点文件：`prefix.ckp.gz`

### 9.1 格式

gzip 压缩的纯文本文件，记录分析状态。

### 9.2 内容

- 包含当前迭代状态
- 候选树集合
- 用于中断后恢复

---

## 10. IQ-TREE 3.x 额外特性

### 10.1 神经网络模型

IQ-TREE 3 引入了基于 ONNX 的神经网络模型：
- `lanfear_alpha_lstm.onnx` — 用于 alpha 预测的 LSTM 模型
- `resnet_modelfinder.onnx` — 用于模型选择的 ResNet 模型

### 10.2 输出格式差异

IQ-TREE 3.x 的主报告文件结构与 2.x 基本一致，但可能有以下额外字段：
- 神经网络辅助的模型选择信息
- 序列类型自动检测说明 (`NOTE: Alignment sequence type is auto-detected`)
- 可能的 tree mixture model (MAST) 相关信息
- concordance factor 相关信息

**注意**：IQ-TREE 3.x 的 `.log` 文件头部格式为 `IQ-TREE multicore version 3.1.4 ...`，版本检测时应兼容此格式。

### 10.3 版本检测

通过 `.iqtree` 文件第一行的版本号检测 IQ-TREE 版本：
- 正则：`^IQ-TREE (\d+)\.(\d+)\.(\d+)`
- major version 2 → IQ-TREE 2.x
- major version 3 → IQ-TREE 3.x
