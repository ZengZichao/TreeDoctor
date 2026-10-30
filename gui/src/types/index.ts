// TypeScript 类型定义 - 与 Rust 核心库 serde 序列化数据模型完全对应
// 注意：字段名必须与 Rust 结构体的 serde 序列化名一致

export type Grade = "A" | "B" | "C" | "D" | "F" | "N";

export interface GradeInfo {
  letter: string;
  color: string;
  textColor: string;
}

// 评级配色方案：所有色值均为「语义 token」，
// 具体色值由 index.css 按主题（亮/暗）分别定义。
// - GRADE_BG_COLORS / GRADE_BORDER_COLORS：已按主题合成的不透明值，
//   不再使用 alpha color-mix，彻底避免暗色主题下「深底深字」失效。
// - 亮色：22% 底 + 40% 边 + 深字（≥4.5:1）
// - 暗色：基于 #161616 的 22% 底 + 亮字（实测 8.6–9.9:1）
export const GRADE_BG_COLORS: Record<Grade, string> = {
  A: "var(--td-grade-a-bg)",
  B: "var(--td-grade-b-bg)",
  C: "var(--td-grade-c-bg)",
  D: "var(--td-grade-d-bg)",
  F: "var(--td-grade-f-bg)",
  N: "var(--td-grade-n-bg)",
};

export const GRADE_COLORS: Record<Grade, string> = {
  A: "var(--td-grade-a-base)",
  B: "var(--td-grade-b-base)",
  C: "var(--td-grade-c-base)",
  D: "var(--td-grade-d-base)",
  F: "var(--td-grade-f-base)",
  N: "var(--td-grade-n-base)",
};

// 评级文字颜色 — 文本色随主题切换
export const GRADE_TEXT_COLORS: Record<Grade, string> = {
  A: "var(--td-grade-a-fg)",
  B: "var(--td-grade-b-fg)",
  C: "var(--td-grade-c-fg)",
  D: "var(--td-grade-d-fg)",
  F: "var(--td-grade-f-fg)",
  N: "var(--td-grade-n-fg)",
};

// 边框颜色 — 同色系 token，随主题切换
export const GRADE_BORDER_COLORS: Record<Grade, string> = {
  A: "var(--td-grade-a-border)",
  B: "var(--td-grade-b-border)",
  C: "var(--td-grade-c-border)",
  D: "var(--td-grade-d-border)",
  F: "var(--td-grade-f-border)",
  N: "var(--td-grade-n-border)",
};

// Kept for backwards compatibility — use GRADE_COLORS instead
export const GRADE_INFO: Record<Grade, GradeInfo> = {
  A: { letter: "A", color: GRADE_COLORS.A, textColor: GRADE_TEXT_COLORS.A },
  B: { letter: "B", color: GRADE_COLORS.B, textColor: GRADE_TEXT_COLORS.B },
  C: { letter: "C", color: GRADE_COLORS.C, textColor: GRADE_TEXT_COLORS.C },
  D: { letter: "D", color: GRADE_COLORS.D, textColor: GRADE_TEXT_COLORS.D },
  F: { letter: "F", color: GRADE_COLORS.F, textColor: GRADE_TEXT_COLORS.F },
  N: { letter: "N", color: GRADE_COLORS.N, textColor: GRADE_TEXT_COLORS.N },
};

// 序列类型 — 对应 Rust 的 SeqType enum
export type SeqType = "DNA" | "RNA" | "Protein" | "Codon" | "Binary" | "Morphological" | "PoMo" | "Unknown";

// 对齐信息 — 对应 Rust AlignmentInfo
export interface AlignmentInfo {
  n_sequences: number;
  n_sites: number;
  seq_type: SeqType | null;
  n_constant_sites: number;
  frac_constant: number;
  n_invariant_sites: number;
  n_informative_sites: number;
  n_patterns: number;
  n_singleton_sites?: number;
}

// 组成检验单条序列结果 — 对应 Rust SeqCompositionTest
export interface SeqCompositionTest {
  seq_name: string;
  gap_percentage: number;
  passed: boolean;
  p_value: number;
}

// 组成检验汇总 — 对应 Rust CompositionTestSummary
export interface CompositionTestSummary {
  sequences: SeqCompositionTest[];
  total_gap_percentage: number;
  n_failed: number;
  significance_level: number;
  degrees_of_freedom: number;
}

// 运行时间信息 — 对应 Rust RuntimeInfo
export interface RuntimeInfo {
  cpu_time: number;
  wall_clock_time: number;
  n_threads: number;
  n_cpu_cores: number;
  random_seed: number;
  completion_date: string;
}

// 距离矩阵 — 对应 Rust DistanceMatrix
export interface DistanceMatrix {
  names: string[];
  matrix: number[][];
}

// 模型条目 — 对应 Rust ModelEntry
export interface ModelEntry {
  name: string;
  logl: number;
  n_params: number;
  aic: number;
  aic_weight: number;
  aic_in_confidence_set: boolean;
  aicc: number;
  aicc_weight: number;
  aicc_in_confidence_set: boolean;
  bic: number;
  bic_weight: number;
  bic_in_confidence_set: boolean;
}

// ModelFinder 结果 — 对应 Rust ModelFinderResult
export interface ModelFinderResult {
  criterion: string;
  best_model: string;
  best_aic: string | null;
  best_aicc: string | null;
  best_bic: string | null;
  models: ModelEntry[];
}

// 速率异质性类型
export type RateHeterogeneity =
  | "None"
  | { Gamma: { n_categories: number } }
  | "Invariant"
  | { InvariantGamma: { n_categories: number } }
  | { FreeRate: { n_categories: number } }
  | { Heterotachy: { n_categories: number } };

// 速率类别 — 对应 Rust RateCategory
export interface RateCategory {
  index: number;
  relative_rate: number;
  proportion: number;
}

// 替换过程 — 对应 Rust SubstitutionProcess
export interface SubstitutionProcess {
  model_name: string;
  rate_params: Record<string, number>;
  state_frequencies: Record<string, number>;
  rate_matrix: number[][] | null;
  rate_heterogeneity: RateHeterogeneity;
  pinv: number | null;
  alpha: number | null;
  rate_categories: RateCategory[];
}

// 似然信息 — 对应 Rust LikelihoodInfo
export interface LikelihoodInfo {
  log_likelihood: number;
  se: number | null;
  unconstrained_logl: number;
  n_free_parameters: number;
  aic: number;
  aicc: number;
  bic: number;
}

// 树节点 — 对应 Rust TreeNode
export interface TreeNode {
  name: string | null;
  branch_length: number | null;
  support: number | null;
  secondary_support: number | null;
  children: TreeNode[];
}

// 支持值类型 — 对应 Rust SupportType
export type SupportType =
  | "None"
  | "ShAlrtUfboot"
  | "ShAlrtLocalBpUfboot"
  | "StandardBootstrap"
  | "UfbootOnly"
  | { Custom: string[] };

// 解析后的 Newick 树 — 对应 Rust ParsedTree
export interface ParsedTree {
  newick_string: string;
  root: TreeNode;
  n_taxa: number;
  n_internal_branches: number;
  total_tree_length: number;
  internal_branch_length: number;
  internal_branch_percentage: number;
  support_type: SupportType;
  has_negative_branches: boolean;
  min_branch_length: number;
  max_branch_length: number;
  near_zero_branches: number[];
  long_branches: number[];
}

// Bootstrap 类型 — 对应 Rust BootstrapType
export type BootstrapType = "Ultrafast" | "Standard" | "None";

// Bootstrap 信息 — 对应 Rust BootstrapInfo
export interface BootstrapInfo {
  enabled: boolean;
  bootstrap_type: BootstrapType;
  n_replicates: number;
  consensus_logl: number | null;
  rf_distance: number | null;
  correlation_coefficient: number | null;
  lh_cutoffs: number[];
  n_iterations: number;
}

// 分裂 — 对应 Rust Split
export interface Split {
  support: number;
  taxon_ids: number[];
}

// 分裂信息 — 对应 Rust SplitsInfo
export interface SplitsInfo {
  n_taxa: number;
  n_splits: number;
  splits: Split[];
}

// 单条诊断结果 — 对应 Rust DiagnosticResult
export interface DiagnosticResult {
  rule_id: string;
  dimension_id: string;
  rule_name: string;
  grade: Grade | null;
  summary: string;
  detail: string;
  recommendation: string;
  metrics: Record<string, number>;
  // evaluated 为 false 时表示因数据缺失而未实际执行检查
  evaluated?: boolean;
}

// 维度诊断汇总 — 对应 Rust DimensionSummary
export interface DimensionSummary {
  dimension_id: string;
  dimension_name: string;
  grade: Grade;
  results: DiagnosticResult[];
}

// 交叉验证结果 — 对应 Rust CrossCheckResult
export interface CrossCheckResult {
  check_id: string;
  check_name: string;
  passed: boolean;
  message: string;
  severity: string;
  // evaluated 为 false 时表示因数据缺失而未实际执行检查
  evaluated?: boolean;
}

// 完整诊断报告 — 对应 Rust AnalysisReport
export interface AnalysisReport {
  prefix: string;
  iqtree_version: string | null;
  analysis_type: string | null;
  alignment: AlignmentInfo | null;
  composition_test: CompositionTestSummary | null;
  model_finder: ModelFinderResult | null;
  substitution: SubstitutionProcess | null;
  likelihood: LikelihoodInfo | null;
  ml_tree: ParsedTree | null;
  consensus_tree: ParsedTree | null;
  bootstrap: BootstrapInfo | null;
  splits: SplitsInfo | null;
  distance_matrix: DistanceMatrix | null;
  dimensions: DimensionSummary[];
  cross_checks: CrossCheckResult[];
  overall_grade: Grade;
  timestamp: string;
  runtime: RuntimeInfo | null;
  files_found: string[];
  files_missing: string[];
  // 分析时的源目录路径
  source_dir?: string | null;
}

// 仪表盘数据 — 对应 Rust DashboardData
export interface DashboardData {
  overall_grade: Grade;
  dimensions: DimensionSummary[];
  cross_checks: CrossCheckResult[];
  key_findings: string[];
}

// 诊断规则信息 — 对应 Rust RuleInfo
export interface RuleInfo {
  rule_id: string;
  rule_name: string;
  dimension_id: string;
  dimension_name: string;
  description: string;
}

// 维度信息
export const DIMENSIONS = [
  { id: "D1", name: "对齐质量", icon: "align", path: "/alignment" },
  { id: "D2", name: "模型选择", icon: "model", path: "/model" },
  { id: "D3", name: "似然与信息准则", icon: "likelihood", path: "/likelihood" },
  { id: "D4", name: "树拓扑与分支长度", icon: "topology", path: "/topology" },
  { id: "D5", name: "分支支持值", icon: "support", path: "/support" },
  { id: "D6", name: "Bootstrap 收敛性", icon: "bootstrap", path: "/bootstrap" },
  { id: "D7", name: "一致性树一致性", icon: "consensus", path: "/consensus" },
  { id: "D8", name: "运行参数与效率", icon: "runtime", path: "/runtime" },
] as const;
