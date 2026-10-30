export type Language = "zh" | "en";

export interface Translation {
  // App
  appName: string;
  appTagline: string;

  // Navigation / Pages
  nav: {
    home: string;
    overview: string;
    alignment: string;
    model: string;
    likelihood: string;
    topology: string;
    support: string;
    bootstrap: string;
    consensus: string;
    runtime: string;
    crossCheck: string;
    rawData: string;
    rules: string;
    settings: string;
  };

  // Page titles
  pageTitles: {
    home: string;
    overview: string;
    alignment: string;
    model: string;
    likelihood: string;
    topology: string;
    support: string;
    bootstrap: string;
    consensus: string;
    runtime: string;
    crossCheck: string;
    rawData: string;
    rules: string;
    settings: string;
  };

  // HomePage
  home: {
    selectDir: string;
    browse: string;
    inputPlaceholder: string;
    startAnalysis: string;
    analyzing: string;
    dragHint: string;
    loadExample: string;
    exampleHint: string;
    selectDirLabel: string;
    backToHome: string;
    exampleData: string;
    exampleWarning: string;
    /** 分析状态机 */
    cancel: string;
    copyError: string;
    retry: string;
    validating: string;
    filesDetected: string;
    noFilesDetected: string;
    dirNotFound: string;
    stageRead: string;
    stageParse: string;
    stageCross: string;
    stageGrade: string;
    /** 最近分析 */
    recentTitle: string;
    recentEmpty: string;
    reopen: string;
    remove: string;
  };

  // OverviewPage
  overview: {
    overview?: string;
    overallGrade: string;
    analysisInfo: string;
    iqtreeVersion: string;
    analysisType: string;
    nSequences: string;
    nSites: string;
    bestModel: string;
    logLikelihood: string;
    runtime: string;
    filePrefix: string;
    unknown: string;
    keyFindings: string;
    crossCheck: string;
    passed: string;
    notEvaluated: string;
    dimDashboard: string;
    noReport: string;
    sourceDir: string;
    generatedAt: string;
    filesFound: string;
    filesMissing: string;
    noChecks: string;
    evaluatedRules: string;
    /** 结论 + 行动 */
    verdictA: string;
    verdictB: string;
    verdictC: string;
    verdictD: string;
    verdictF: string;
    verdictN: string;
    gradeBasis: string;
    mustHandle: string;
    allGood: string;
    viewDetail: string;
    dataIntegrity: string;
    dimsAffected: string;
    analysisParams: string;
    verdictPrefix: string;
    findCount: string;
  };

  // DimensionPage
  dimension: {
    noReport: string;
    dimUnavailable: string;
    nSequences: string;
    nSites: string;
    informativeSites: string;
    constantSites: string;
    compositionTest: string;
    seqName: string;
    testResult: string;
    pValue: string;
    failed: string;
    bestModel: string;
    criterion: string;
    freeParams: string;
    gammaShape: string;
    modelComparison: string;
    model: string;
    logl: string;
    df: string;
    aic: string;
    aicc: string;
    bic: string;
    weight: string;
    confidenceSet: string;
    totalTreeLength: string;
    internalBranches: string;
    minBranch: string;
    maxBranch: string;
    nearZeroBranches: string;
    longBranches: string;
    bootstrapType: string;
    nReplicates: string;
    correlationCoeff: string;
    nIterations: string;
    nThreads: string;
    nCpuCores: string;
    cpuTime: string;
    wallClock: string;
    supportDistribution: string;
    parseTreeError: string;
    topologyMode: string;
    branchLengthMode: string;
    weightColumn: string;
    deltaColumn: string;
    ciColumn: string;
    sortedBy: string;
    showing: string;
    of: string;
    mlTree: string;
    consensusTree: string;
    rfDistance: string;
    passed: string;
    significanceLevel: string;
    /** 上下篇导航 */
    prevDim: string;
    nextDim: string;
    dimNavHint: string;
    failedRules: string;
  };

  // TreeView
  tree: {
    reset: string;
    parseError: string;
    support: string;
    taxa: string;
    treeLabel: string;
    /** 布局 / 密度 / 导出 */
    layout: string;
    layoutRect: string;
    layoutRadial: string;
    layoutCircular: string;
    density: string;
    densityTopology: string;
    densitySupport: string;
    densityAll: string;
    exportTree: string;
    exportPng: string;
    exportSvg: string;
    exportNewick: string;
    highlightLow: string;
    treeHeight: string;
    lowSupportBranches: string;
    keyboardHint: string;
    exportSuccess: string;
    exportFailed: string;
  };

  // DiagnosticCard
  diagnostic: {
    recommendation: string;
    expand?: string;
    collapse?: string;
    metrics: string;
    notEvaluated: string;
  };

  // CrossCheckPage
  crossCheck: {
    title: string;
    noReport: string;
    passed: string;
    allPassed: string;
    checksFailed: string;
    noChecks: string;
    info: string;
    warning: string;
    error: string;
  };

  // RawDataPage
  rawData: {
    noReport: string;
    fullReport: string;
    alignmentData: string;
    modelData: string;
    treeData: string;
    bootstrapData: string;
    filter: string;
    copy: string;
    copied: string;
    jsonViewer: string;
    lines: string;
    /** 搜索高亮（不破坏 JSON 结构） */
    matches: string;
    copyAlwaysFull: string;
  };

  // RulesPage
  rules: {
    loading: string;
    title: string;
    rules: string;
    fetchError: string;
    retry: string;
    exampleRules: string;
  };

  // TopBar
  topBar: {
    exportReport: string;
    exportDisabled: string;
    textFormat: string;
    markdownFormat: string;
    jsonFormat: string;
    htmlFormat: string;
    pdfFormat: string;
    settings: string;
    back: string;
    language: string;
    theme: string;
    lightTheme: string;
    darkTheme: string;
    reportInfo: string;
    exampleMode: string;
  };

  // SettingsPage
  settings: {
    title: string;
    appearance: string;
    theme: string;
    themeLight: string;
    themeDark: string;
    themeSystem: string;
    language: string;
    languageZh: string;
    languageEn: string;
    historySection: string;
    historyEmpty: string;
    clearHistory: string;
    confirmClear: string;
    open: string;
    remove: string;
    vsCurrent: string;
    about: string;
    versionLabel: string;
    shortcuts: string;
    shortcutOpen: string;
    shortcutExport: string;
    shortcutDims: string;
    shortcutSettings: string;
    shortcutSearch: string;
    shortcutPrevNext: string;
    shortcutTree: string;
    desc: string;
  };

  // Sidebar
  sidebar: {
    overallGrade: string;
    collapse?: string;
    expand?: string;
    dimensions?: string;
    tools?: string;
  };

  // Grades
  grades: {
    A: string;
    B: string;
    C: string;
    D: string;
    F: string;
    N: string;
  };

  // Empty state
  empty: {
    noReport: string;
    backToHome: string;
  };

  // Export
  export: {
    saveTitle: string;
    saveFailed: string;
    saveSuccess: string;
    exampleBlocked: string;
  };
}

const zh: Translation = {
  appName: "TreeDoctor",
  appTagline: "IQ-TREE 分析质量诊断工具",

  nav: {
    home: "首页",
    overview: "概览仪表盘",
    alignment: "对齐质量",
    model: "模型选择",
    likelihood: "似然准则",
    topology: "树拓扑",
    support: "分支支持",
    bootstrap: "Bootstrap",
    consensus: "一致性树",
    runtime: "运行参数",
    crossCheck: "交叉验证",
    rawData: "原始数据",
    rules: "诊断规则",
    settings: "设置",
  },

  pageTitles: {
    home: "首页",
    overview: "分析概览",
    alignment: "对齐质量",
    model: "模型选择",
    likelihood: "似然与信息准则",
    topology: "树拓扑与分支长度",
    support: "分支支持值",
    bootstrap: "Bootstrap 收敛性",
    consensus: "一致性树一致性",
    runtime: "运行参数与效率",
    crossCheck: "交叉验证结果",
    rawData: "原始数据",
    rules: "诊断规则列表",
    settings: "设置",
  },

  home: {
    selectDir: "选择 IQ-TREE 输出目录",
    browse: "浏览",
    inputPlaceholder: "点击浏览或直接输入路径...",
    startAnalysis: "开始诊断",
    analyzing: "正在分析...",
    dragHint: "拖放 IQ-TREE 输出目录或 .iqtree 文件到窗口可直接开始分析",
    loadExample: "加载示例数据",
    exampleHint: "无需安装 IQ-TREE，点击查看示例分析结果",
    selectDirLabel: "选择 IQ-TREE 输出目录",
    backToHome: "返回首页",
    exampleData: "示例数据",
    exampleWarning: "当前为示例数据，仅供演示，不可作为正式报告使用",
    cancel: "取消",
    copyError: "复制错误详情",
    retry: "重试",
    validating: "正在检查目录…",
    filesDetected: "目录存在 · 检测到 {n} 个文件",
    noFilesDetected: "目录为空或无法读取",
    dirNotFound: "目录不存在或不可访问",
    stageRead: "读取文件",
    stageParse: "解析",
    stageCross: "交叉验证",
    stageGrade: "生成评级",
    recentTitle: "最近分析",
    recentEmpty: "暂无历史记录",
    reopen: "重新分析",
    remove: "删除",
  },

  overview: {
    overview: "分析概览",
    overallGrade: "总体评级",
    analysisInfo: "分析信息",
    iqtreeVersion: "IQ-TREE 版本",
    analysisType: "分析类型",
    nSequences: "序列数",
    nSites: "位点数",
    bestModel: "最优模型",
    logLikelihood: "对数似然",
    runtime: "运行时间",
    filePrefix: "文件前缀",
    unknown: "未知",
    keyFindings: "关键发现",
    crossCheck: "交叉验证",
    passed: "通过",
    notEvaluated: "未评估",
    dimDashboard: "诊断维度仪表盘",
    noReport: "请先选择 IQ-TREE 输出目录进行分析",
    sourceDir: "数据来源",
    generatedAt: "生成时间",
    filesFound: "已找到文件",
    filesMissing: "缺失文件",
    noChecks: "无检查数据",
    evaluatedRules: "已评估规则",
    verdictA: "质量优秀，未发现需要处理的问题",
    verdictB: "总体可靠，{n} 处建议复核",
    verdictC: "可以使用，但 {n} 处需要复核",
    verdictD: "存在明显问题，{n} 处必须处理后才能使用",
    verdictF: "不建议使用，{n} 处严重问题必须处理",
    verdictN: "数据不足，无法给出可靠评级",
    gradeBasis: "评级依据",
    mustHandle: "必须处理",
    allGood: "未发现需要处理的发现",
    viewDetail: "查看",
    dataIntegrity: "数据完整性",
    dimsAffected: "受影响维度",
    analysisParams: "分析参数",
    verdictPrefix: "这次分析：",
    findCount: "{n} 项待处理",
  },

  dimension: {
    noReport: "请先选择 IQ-TREE 输出目录进行分析",
    dimUnavailable: "维度数据不可用",
    nSequences: "序列数",
    nSites: "位点数",
    informativeSites: "信息位点",
    constantSites: "恒定位点",
    compositionTest: "序列组成卡方检验表",
    seqName: "序列名",
    testResult: "检验结果",
    pValue: "p-value",
    failed: "失败",
    bestModel: "最优模型",
    criterion: "选择准则",
    freeParams: "自由参数",
    gammaShape: "Gamma shape",
    modelComparison: "模型比较表",
    model: "模型",
    logl: "LogL",
    df: "df",
    aic: "AIC",
    aicc: "AICc",
    bic: "BIC",
    weight: "权重",
    confidenceSet: "置信集",
    totalTreeLength: "总树长",
    internalBranches: "内部分支数",
    minBranch: "最小分支",
    maxBranch: "最大分支",
    nearZeroBranches: "近零分支",
    longBranches: "过长分支",
    bootstrapType: "Bootstrap 类型",
    nReplicates: "重复次数",
    correlationCoeff: "相关系数",
    nIterations: "迭代次数",
    nThreads: "线程数",
    nCpuCores: "CPU 核心数",
    cpuTime: "CPU 时间",
    wallClock: "Wall-clock",
    supportDistribution: "支持值分布",
    parseTreeError: "无法解析树数据",
    topologyMode: "拓扑模式（无分支长度）",
    branchLengthMode: "分支长度模式",
    weightColumn: "权重",
    deltaColumn: "Δ",
    ciColumn: "置信集",
    sortedBy: "按",
    showing: "显示",
    of: "共",
    mlTree: "ML 树",
    consensusTree: "一致性树",
    rfDistance: "RF 距离",
    passed: "通过",
    significanceLevel: "显著性水平",
    prevDim: "上一维度",
    nextDim: "下一维度",
    dimNavHint: "Ctrl + ←/→ 切换维度",
    failedRules: "未通过",
  },

  tree: {
    reset: "重置",
    parseError: "无法解析树数据",
    support: "支持值",
    taxa: "分类群",
    treeLabel: "系统发育树",
    layout: "布局",
    layoutRect: "矩形",
    layoutRadial: "辐射",
    layoutCircular: "圆形",
    density: "显示密度",
    densityTopology: "仅拓扑",
    densitySupport: "仅支持值",
    densityAll: "全部",
    exportTree: "导出",
    exportPng: "PNG 图片",
    exportSvg: "SVG 矢量图",
    exportNewick: "Newick 树文件",
    highlightLow: "高亮低支持分支",
    treeHeight: "树高",
    lowSupportBranches: "个低支持分支",
    keyboardHint: "获得焦点后：+/- 缩放 · 方向键平移 · R 重置 · T 切换布局",
    exportSuccess: "已导出",
    exportFailed: "导出失败",
  },

  diagnostic: {
    recommendation: "建议",
    expand: "展开详情",
    collapse: "收起",
    metrics: "指标",
    notEvaluated: "未评估",
  },

  crossCheck: {
    title: "交叉验证结果",
    noReport: "请先选择 IQ-TREE 输出目录进行分析",
    passed: "通过",
    allPassed: "全部检查通过",
    checksFailed: "项检查未通过",
    noChecks: "无检查数据（未检测到相关文件）",
    info: "信息",
    warning: "警告",
    error: "错误",
  },

  rawData: {
    noReport: "请先选择 IQ-TREE 输出目录进行分析",
    fullReport: "完整报告 (JSON)",
    alignmentData: "对齐数据",
    modelData: "模型数据",
    treeData: "树数据",
    bootstrapData: "Bootstrap",
    filter: "筛选...",
    copy: "复制",
    copied: "已复制",
    jsonViewer: "JSON 数据查看器",
    lines: "行",
    matches: "{n} 处匹配（高亮显示，复制仍为完整数据）",
    copyAlwaysFull: "复制完整数据",
  },

  rules: {
    loading: "加载中...",
    title: "诊断规则列表",
    rules: "条",
    fetchError: "无法从后端获取规则列表",
    retry: "重试",
    exampleRules: "示例规则",
  },

  topBar: {
    exportReport: "导出报告",
    exportDisabled: "示例数据不可导出",
    textFormat: "Text 格式",
    markdownFormat: "Markdown 格式",
    jsonFormat: "JSON 格式",
    htmlFormat: "HTML 格式",
    pdfFormat: "PDF（打印）",
    settings: "设置",
    back: "返回",
    language: "语言",
    theme: "主题",
    lightTheme: "明亮主题",
    darkTheme: "暗黑主题",
    reportInfo: "报告信息",
    exampleMode: "示例模式",
  },

  settings: {
    title: "设置",
    appearance: "外观",
    theme: "主题",
    themeLight: "浅色",
    themeDark: "深色",
    themeSystem: "跟随系统",
    language: "语言",
    languageZh: "简体中文",
    languageEn: "English",
    historySection: "历史记录与对比",
    historyEmpty: "暂无历史分析记录",
    clearHistory: "清空历史",
    confirmClear: "确认清空？",
    open: "重新分析",
    remove: "删除",
    vsCurrent: "与当前报告对比",
    about: "关于",
    versionLabel: "版本",
    shortcuts: "键盘快捷键",
    shortcutOpen: "打开目录",
    shortcutExport: "导出报告",
    shortcutDims: "跳转 D1–D8",
    shortcutSettings: "打开设置",
    shortcutSearch: "搜索/过滤",
    shortcutPrevNext: "维度上/下篇",
    shortcutTree: "树视图（获得焦点时）",
    desc: "IQ-TREE 分析质量诊断工具",
  },

  sidebar: {
    overallGrade: "总体评级",
    collapse: "收起侧栏",
    expand: "展开侧栏",
    dimensions: "诊断维度",
    tools: "工具",
  },

  grades: {
    A: "优秀",
    B: "良好",
    C: "一般",
    D: "警告",
    F: "严重",
    N: "未评估",
  },

  empty: {
    noReport: "暂无数据",
    backToHome: "返回首页选择目录",
  },

  export: {
    saveTitle: "保存报告",
    saveFailed: "导出失败，请重试",
    saveSuccess: "报告已保存",
    exampleBlocked: "示例数据不可导出为正式报告",
  },
};

const en: Translation = {
  appName: "TreeDoctor",
  appTagline: "IQ-TREE Analysis Quality Diagnostics",

  nav: {
    home: "Home",
    overview: "Overview",
    alignment: "Alignment",
    model: "Model",
    likelihood: "Likelihood",
    topology: "Topology",
    support: "Support",
    bootstrap: "Bootstrap",
    consensus: "Consensus",
    runtime: "Runtime",
    crossCheck: "Cross-Check",
    rawData: "Raw Data",
    rules: "Rules",
    settings: "Settings",
  },

  pageTitles: {
    home: "Home",
    overview: "Analysis Overview",
    alignment: "Alignment Quality",
    model: "Model Selection",
    likelihood: "Likelihood & Information Criteria",
    topology: "Tree Topology & Branch Lengths",
    support: "Branch Support Values",
    bootstrap: "Bootstrap Convergence",
    consensus: "Consensus Tree Consistency",
    runtime: "Runtime Parameters & Efficiency",
    crossCheck: "Cross-Check Results",
    rawData: "Raw Data",
    rules: "Diagnostic Rules",
    settings: "Settings",
  },

  home: {
    selectDir: "Select IQ-TREE output directory",
    browse: "Browse",
    inputPlaceholder: "Click browse or enter path...",
    startAnalysis: "Start Analysis",
    analyzing: "Analyzing...",
    dragHint: "Drag and drop IQ-TREE output directory or .iqtree file to start analysis",
    loadExample: "Load Example Data",
    exampleHint: "No IQ-TREE installation needed — view sample analysis results",
    selectDirLabel: "Select IQ-TREE output directory",
    backToHome: "Back to Home",
    exampleData: "Example Data",
    exampleWarning: "This is example data for demonstration only — not a real analysis report",
    cancel: "Cancel",
    copyError: "Copy error details",
    retry: "Retry",
    validating: "Checking directory…",
    filesDetected: "Directory exists · {n} file(s) detected",
    noFilesDetected: "Directory is empty or unreadable",
    dirNotFound: "Directory does not exist or is not accessible",
    stageRead: "Read files",
    stageParse: "Parse",
    stageCross: "Cross-checks",
    stageGrade: "Grade",
    recentTitle: "Recent Analyses",
    recentEmpty: "No history yet",
    reopen: "Re-analyze",
    remove: "Remove",
  },

  overview: {
    overview: "Overview",
    overallGrade: "Overall Grade",
    analysisInfo: "Analysis Info",
    iqtreeVersion: "IQ-TREE Version",
    analysisType: "Analysis Type",
    nSequences: "Sequences",
    nSites: "Sites",
    bestModel: "Best Model",
    logLikelihood: "Log-likelihood",
    runtime: "Runtime",
    filePrefix: "File Prefix",
    unknown: "Unknown",
    keyFindings: "Key Findings",
    crossCheck: "Cross-Check",
    passed: "passed",
    notEvaluated: "Not Evaluated",
    dimDashboard: "Diagnostic Dimensions",
    noReport: "Please select an IQ-TREE output directory to analyze",
    sourceDir: "Source Directory",
    generatedAt: "Generated At",
    filesFound: "Files Found",
    filesMissing: "Files Missing",
    noChecks: "No check data available",
    evaluatedRules: "Evaluated Rules",
    verdictA: "Excellent quality — no issues requiring action",
    verdictB: "Generally reliable — {n} item(s) worth reviewing",
    verdictC: "Usable, but {n} item(s) need review",
    verdictD: "Notable problems — {n} item(s) must be fixed before use",
    verdictF: "Not recommended — {n} critical issue(s) must be fixed",
    verdictN: "Insufficient data for a reliable verdict",
    gradeBasis: "Grade basis",
    mustHandle: "Must handle",
    allGood: "No findings requiring action",
    viewDetail: "View",
    dataIntegrity: "Data Integrity",
    dimsAffected: "Affected dimensions",
    analysisParams: "Analysis Parameters",
    verdictPrefix: "This analysis:",
    findCount: "{n} item(s) to handle",
  },

  dimension: {
    noReport: "Please select an IQ-TREE output directory to analyze",
    dimUnavailable: "Dimension data unavailable",
    nSequences: "Sequences",
    nSites: "Sites",
    informativeSites: "Informative Sites",
    constantSites: "Constant Sites",
    compositionTest: "Composition Chi-Square Test",
    seqName: "Sequence",
    testResult: "Result",
    pValue: "p-value",
    failed: "Failed",
    bestModel: "Best Model",
    criterion: "Criterion",
    freeParams: "Free Parameters",
    gammaShape: "Gamma Shape",
    modelComparison: "Model Comparison",
    model: "Model",
    logl: "LogL",
    df: "df",
    aic: "AIC",
    aicc: "AICc",
    bic: "BIC",
    weight: "Weight",
    confidenceSet: "Conf. Set",
    totalTreeLength: "Total Tree Length",
    internalBranches: "Internal Branches",
    minBranch: "Min Branch",
    maxBranch: "Max Branch",
    nearZeroBranches: "Near-zero Branches",
    longBranches: "Long Branches",
    bootstrapType: "Bootstrap Type",
    nReplicates: "Replicates",
    correlationCoeff: "Correlation Coeff.",
    nIterations: "Iterations",
    nThreads: "Threads",
    nCpuCores: "CPU Cores",
    cpuTime: "CPU Time",
    wallClock: "Wall-clock",
    supportDistribution: "Support Distribution",
    parseTreeError: "Failed to parse tree data",
    topologyMode: "Topology mode (no branch lengths)",
    branchLengthMode: "Branch length mode",
    weightColumn: "Weight",
    deltaColumn: "Δ",
    ciColumn: "Conf. Set",
    sortedBy: "Sorted by",
    showing: "Showing",
    of: "of",
    mlTree: "ML Tree",
    consensusTree: "Consensus Tree",
    rfDistance: "RF Distance",
    passed: "Passed",
    significanceLevel: "Significance Level",
    prevDim: "Previous dimension",
    nextDim: "Next dimension",
    dimNavHint: "Ctrl + ←/→ to switch dimensions",
    failedRules: "failed",
  },

  tree: {
    reset: "Reset",
    parseError: "Failed to parse tree data",
    support: "Support",
    taxa: "taxa",
    treeLabel: "Phylogenetic Tree",
    layout: "Layout",
    layoutRect: "Rectangular",
    layoutRadial: "Radial",
    layoutCircular: "Circular",
    density: "Display density",
    densityTopology: "Topology only",
    densitySupport: "Support only",
    densityAll: "All",
    exportTree: "Export",
    exportPng: "PNG image",
    exportSvg: "SVG vector",
    exportNewick: "Newick tree file",
    highlightLow: "Highlight low-support branches",
    treeHeight: "Tree height",
    lowSupportBranches: "low-support branch(es)",
    keyboardHint: "When focused: +/- zoom · arrows pan · R reset · T cycle layout",
    exportSuccess: "Exported",
    exportFailed: "Export failed",
  },

  diagnostic: {
    recommendation: "Recommendation",
    expand: "Expand",
    collapse: "Collapse",
    metrics: "Metrics",
    notEvaluated: "Not Evaluated",
  },

  crossCheck: {
    title: "Cross-Check Results",
    noReport: "Please select an IQ-TREE output directory to analyze",
    passed: "passed",
    allPassed: "All checks passed",
    checksFailed: "check(s) failed",
    noChecks: "No check data available (missing relevant files)",
    info: "Info",
    warning: "Warning",
    error: "Error",
  },

  rawData: {
    noReport: "Please select an IQ-TREE output directory to analyze",
    fullReport: "Full Report (JSON)",
    alignmentData: "Alignment Data",
    modelData: "Model Data",
    treeData: "Tree Data",
    bootstrapData: "Bootstrap",
    filter: "Filter...",
    copy: "Copy",
    copied: "Copied",
    jsonViewer: "JSON Data Viewer",
    lines: "lines",
    matches: "{n} match(es) highlighted (copy always uses full data)",
    copyAlwaysFull: "Copy full data",
  },

  rules: {
    loading: "Loading...",
    title: "Diagnostic Rules",
    rules: "rules",
    fetchError: "Failed to fetch rules from backend",
    retry: "Retry",
    exampleRules: "Example Rules",
  },

  topBar: {
    exportReport: "Export Report",
    exportDisabled: "Example data cannot be exported",
    textFormat: "Text Format",
    markdownFormat: "Markdown Format",
    jsonFormat: "JSON Format",
    htmlFormat: "HTML Format",
    pdfFormat: "PDF (Print)",
    settings: "Settings",
    back: "Back",
    language: "Language",
    theme: "Theme",
    lightTheme: "Light",
    darkTheme: "Dark",
    reportInfo: "Report Info",
    exampleMode: "Example Mode",
  },

  settings: {
    title: "Settings",
    appearance: "Appearance",
    theme: "Theme",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "Follow system",
    language: "Language",
    languageZh: "简体中文",
    languageEn: "English",
    historySection: "History & Comparison",
    historyEmpty: "No analysis history yet",
    clearHistory: "Clear history",
    confirmClear: "Confirm clear?",
    open: "Re-analyze",
    remove: "Remove",
    vsCurrent: "Compare with current report",
    about: "About",
    versionLabel: "Version",
    shortcuts: "Keyboard Shortcuts",
    shortcutOpen: "Open directory",
    shortcutExport: "Export report",
    shortcutDims: "Go to D1–D8",
    shortcutSettings: "Open settings",
    shortcutSearch: "Search / filter",
    shortcutPrevNext: "Previous / next dimension",
    shortcutTree: "Tree view (when focused)",
    desc: "IQ-TREE Analysis Quality Diagnostics",
  },

  sidebar: {
    overallGrade: "Overall Grade",
    collapse: "Collapse",
    expand: "Expand",
    dimensions: "Dimensions",
    tools: "Tools",
  },

  grades: {
    A: "Excellent",
    B: "Good",
    C: "Fair",
    D: "Warning",
    F: "Critical",
    N: "Not Evaluated",
  },

  empty: {
    noReport: "No data available",
    backToHome: "Back to Home to select a directory",
  },

  export: {
    saveTitle: "Save Report",
    saveFailed: "Export failed, please retry",
    saveSuccess: "Report saved",
    exampleBlocked: "Example data cannot be exported as a real report",
  },
};

export const translations: Record<Language, Translation> = { zh, en };
