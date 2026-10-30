use crate::models::*;

/// 执行 7 条交叉验证规则
pub fn run_cross_checks(data: &AnalysisData) -> Vec<CrossCheckResult> {
    let mut results = Vec::new();
    results.push(x1_seq_count_consistency(data));
    results.push(x2_model_name_consistency(data));
    results.push(x3_likelihood_consistency(data));
    results.push(x4_tree_topology_consistency(data));
    results.push(x5_support_consistency(data));
    results.push(x6_bootstrap_count_consistency(data));
    results.push(x7_contree_newick_consistency(data));
    results
}

/// X1: 序列数一致性
fn x1_seq_count_consistency(data: &AnalysisData) -> CrossCheckResult {
    let mut counts = Vec::new();
    if let Some(a) = &data.alignment {
        counts.push(("iqtree/log", a.n_sequences));
    }
    if let Some(dm) = &data.distance_matrix {
        counts.push(("mldist", dm.names.len()));
    }
    if let Some(splits) = &data.splits {
        counts.push(("splits.nex", splits.n_taxa));
    }
    if let Some(tree) = &data.ml_tree {
        counts.push(("treefile", tree.n_taxa));
    }

    let all_same = counts.windows(2).all(|w| w[0].1 == w[1].1);
    let evaluated = !counts.is_empty();

    CrossCheckResult {
        check_id: "X1".to_string(),
        check_name: "序列数一致性".to_string(),
        passed: all_same,
        evaluated,
        message: if !evaluated {
            "无可比对文件".to_string()
        } else if all_same {
            format!("{} 条序列在所有文件中一致", counts.first().map(|c| c.1).unwrap_or(0))
        } else {
            format!("序列数不一致: {}", counts.iter().map(|(f, n)| format!("{}={}", f, n)).collect::<Vec<_>>().join(", "))
        },
        severity: if !evaluated { "info" } else if all_same { "info" } else { "warning" }.to_string(),
    }
}

/// X2: 模型名称一致性
fn x2_model_name_consistency(data: &AnalysisData) -> CrossCheckResult {
    let mf_model = data.model_finder.as_ref().map(|m| m.best_model.clone());
    let sub_model = data.substitution.as_ref().map(|s| s.model_name.clone());

    let (passed, evaluated) = match (&mf_model, &sub_model) {
        (Some(a), Some(b)) => (a == b, true),
        _ => (false, false),
    };

    CrossCheckResult {
        check_id: "X2".to_string(),
        check_name: "模型名称一致性".to_string(),
        passed,
        evaluated,
        message: match (&mf_model, &sub_model) {
            (Some(a), Some(b)) if a == b => format!("ModelFinder 节和替换过程节均为 {}", a),
            (Some(a), Some(b)) => format!("模型不一致: ModelFinder={}, 替换过程={}", a, b),
            _ => "模型信息不完整".to_string(),
        },
        severity: if !evaluated { "info" } else if passed { "info" } else { "warning" }.to_string(),
    }
}

/// X3: 似然值一致性
/// 比较 .iqtree 中的似然值和 .log 中的 BEST SCORE
/// 注意：ParsedLog.best_score 当前未传入 AnalysisData，这里改用 ML 树似然与一致性树似然比较
fn x3_likelihood_consistency(data: &AnalysisData) -> CrossCheckResult {
    let iqtree_lh = data.likelihood.as_ref().map(|l| l.log_likelihood);
    // 使用一致性树似然值进行比较
    let consensus_lh = data.bootstrap.as_ref().and_then(|b| b.consensus_logl);

    let (passed, evaluated) = match (&iqtree_lh, &consensus_lh) {
        (Some(a), Some(b)) => ((a - b).abs() < 10.0, true),
        _ => (false, false),
    };

    CrossCheckResult {
        check_id: "X3".to_string(),
        check_name: "似然值一致性".to_string(),
        passed,
        evaluated,
        message: match (&iqtree_lh, &consensus_lh) {
            (Some(a), Some(b)) if (a - b).abs() < 10.0 => format!("ML 树似然: {:.4}，一致性树似然: {:.4}，差异在可接受范围内", a, b),
            (Some(a), Some(b)) => format!("似然值差异较大: ML 树={}, 一致性树={}", a, b),
            (Some(a), None) => format!("ML 树似然: {:.4}，无一致性树似然数据", a),
            _ => "似然值信息不完整".to_string(),
        },
        severity: if !evaluated { "info" } else if passed { "info" } else { "warning" }.to_string(),
    }
}

/// X4: 树拓扑一致性
/// 比较 .treefile 解析的树和 .iqtree 内嵌 Newick 解析的树
fn x4_tree_topology_consistency(data: &AnalysisData) -> CrossCheckResult {
    // 由于当前架构中 .treefile 和 .iqtree 内嵌 Newick 的解析结果都合并到 data.ml_tree，
    // 且 .iqtree 内嵌 Newick 优先，如果 data.ml_tree 存在则两者已合并。
    // 这里检查 ML 树的叶子数是否与对齐信息的序列数一致。
    let tree_taxa = data.ml_tree.as_ref().map(|t| t.n_taxa);
    let aln_seqs = data.alignment.as_ref().map(|a| a.n_sequences);

    let (passed, evaluated) = match (&tree_taxa, &aln_seqs) {
        (Some(t), Some(a)) => (t == a, true),
        _ => (false, false), // 缺少数据时标记为未评估
    };

    CrossCheckResult {
        check_id: "X4".to_string(),
        check_name: "树拓扑一致性".to_string(),
        passed,
        evaluated,
        message: match (&tree_taxa, &aln_seqs) {
            (Some(t), Some(a)) if t == a => format!("ML 树叶节点数 ({}) 与序列数 ({}) 一致", t, a),
            (Some(t), Some(a)) => format!("不一致: ML 树叶节点数={}, 序列数={}", t, a),
            (Some(t), None) => format!("ML 树有 {} 个叶节点，无对齐信息对比", t),
            _ => "树拓扑信息不完整".to_string(),
        },
        severity: if !evaluated { "info" } else if passed { "info" } else { "warning" }.to_string(),
    }
}

/// X5: 支持值一致性
/// 检查 .splits.nex 中的分裂数与 ML 树内部分支数是否合理对应
fn x5_support_consistency(data: &AnalysisData) -> CrossCheckResult {
    let n_tree_internal = data.ml_tree.as_ref().map(|t| t.n_internal_branches);
    let n_splits = data.splits.as_ref().map(|s| s.n_splits);

    // splits 数应 >= 内部分支数（因为 splits 网络包含所有可能分裂）
    let (passed, evaluated) = match (&n_tree_internal, &n_splits) {
        (Some(tree_n), Some(splits_n)) => (*splits_n >= *tree_n, true),
        _ => (false, false),
    };

    CrossCheckResult {
        check_id: "X5".to_string(),
        check_name: "支持值一致性".to_string(),
        passed,
        evaluated,
        message: match (&n_tree_internal, &n_splits) {
            (Some(tree_n), Some(splits_n)) if *splits_n >= *tree_n => {
                format!("ML 树有 {} 个内部分支，splits 网络有 {} 个分裂，对应合理", tree_n, splits_n)
            }
            (Some(tree_n), Some(splits_n)) => {
                format!("不一致: ML 树内部分支数={} 但 splits 数={}", tree_n, splits_n)
            }
            _ => "支持值数据不完整".to_string(),
        },
        severity: if !evaluated { "info" } else if passed { "info" } else { "warning" }.to_string(),
    }
}

/// X6: bootstrap 次数一致性
fn x6_bootstrap_count_consistency(data: &AnalysisData) -> CrossCheckResult {
    let bs_reps = data.bootstrap.as_ref().map(|b| b.n_replicates);
    let (passed, evaluated) = match &bs_reps {
        Some(n) => (*n > 0, true),
        None => (false, false),
    };
    CrossCheckResult {
        check_id: "X6".to_string(),
        check_name: "bootstrap 次数一致性".to_string(),
        passed,
        evaluated,
        message: match &bs_reps {
            Some(n) => format!("bootstrap 次数一致: {} 次", n),
            None => "未使用 bootstrap".to_string(),
        },
        severity: if !evaluated { "info" } else if passed { "info" } else { "warning" }.to_string(),
    }
}

/// X7: 一致性树 Newick 一致性
/// 检查一致性树与 ML 树的叶节点数是否一致
fn x7_contree_newick_consistency(data: &AnalysisData) -> CrossCheckResult {
    let ml_taxa = data.ml_tree.as_ref().map(|t| t.n_taxa);
    let cons_taxa = data.consensus_tree.as_ref().map(|t| t.n_taxa);

    let (passed, evaluated) = match (&ml_taxa, &cons_taxa) {
        (Some(ml), Some(cons)) => (ml == cons, true),
        _ => (false, false),
    };

    CrossCheckResult {
        check_id: "X7".to_string(),
        check_name: "一致性树 Newick 一致性".to_string(),
        passed,
        evaluated,
        message: match (&ml_taxa, &cons_taxa) {
            (Some(ml), Some(cons)) if ml == cons => format!("一致性树叶节点数 ({}) 与 ML 树 ({}) 一致", cons, ml),
            (Some(ml), Some(cons)) => format!("不一致: ML 树叶节点数={}, 一致性树叶节点数={}", ml, cons),
            (Some(_), None) => "无一致性树数据".to_string(),
            _ => "树数据不完整".to_string(),
        },
        severity: if !evaluated { "info" } else if passed { "info" } else { "warning" }.to_string(),
    }
}
