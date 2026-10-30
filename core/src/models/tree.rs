use serde::{Deserialize, Serialize};

/// 支持值类型
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum SupportType {
    None,
    ShAlrtUfboot,
    ShAlrtLocalBpUfboot,
    StandardBootstrap,
    UfbootOnly,
    Custom(Vec<String>),
}

impl Default for SupportType {
    fn default() -> Self {
        SupportType::None
    }
}

impl SupportType {
    pub fn as_str(&self) -> &str {
        match self {
            SupportType::None => "无",
            SupportType::ShAlrtUfboot => "SH-aLRT/UFBoot",
            SupportType::ShAlrtLocalBpUfboot => "SH-aLRT/local BP/UFBoot",
            SupportType::StandardBootstrap => "标准Bootstrap",
            SupportType::UfbootOnly => "UFBoot",
            SupportType::Custom(_) => "Custom",
        }
    }

    /// 返回自定义支持类型的字符串表示（不泄漏内存）
    pub fn to_string(&self) -> String {
        match self {
            SupportType::Custom(v) => v.join("/"),
            _ => self.as_str().to_string(),
        }
    }
}

/// 树节点
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct TreeNode {
    pub name: Option<String>,
    pub branch_length: Option<f64>,
    pub support: Option<f64>,
    pub secondary_support: Option<f64>,
    pub children: Vec<TreeNode>,
}

impl TreeNode {
    pub fn is_leaf(&self) -> bool {
        self.children.is_empty()
    }

    pub fn is_internal(&self) -> bool {
        !self.children.is_empty()
    }
}

/// 解析后的 Newick 树
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ParsedTree {
    pub newick_string: String,
    pub root: TreeNode,
    pub n_taxa: usize,
    pub n_internal_branches: usize,
    pub total_tree_length: f64,
    pub internal_branch_length: f64,
    pub internal_branch_percentage: f64,
    pub support_type: SupportType,
    pub has_negative_branches: bool,
    pub min_branch_length: f64,
    pub max_branch_length: f64,
    pub near_zero_branches: Vec<f64>,
    pub long_branches: Vec<f64>,
}

impl ParsedTree {
    /// 收集所有分支长度
    pub fn collect_branch_lengths(&self) -> Vec<f64> {
        let mut out = Vec::new();
        Self::collect_bl_recursive(&self.root, &mut out);
        out
    }

    fn collect_bl_recursive(node: &TreeNode, out: &mut Vec<f64>) {
        if let Some(bl) = node.branch_length {
            out.push(bl);
        }
        for c in &node.children {
            Self::collect_bl_recursive(c, out);
        }
    }

    /// 收集所有内部分支的支持值
    pub fn collect_supports(&self) -> Vec<(f64, Option<f64>)> {
        let mut out = Vec::new();
        Self::collect_supports_recursive(&self.root, &mut out);
        out
    }

    fn collect_supports_recursive(node: &TreeNode, out: &mut Vec<(f64, Option<f64>)>) {
        if node.is_internal() {
            if let Some(s) = node.support {
                out.push((s, node.secondary_support));
            }
        }
        for c in &node.children {
            Self::collect_supports_recursive(c, out);
        }
    }

    /// 统计叶子节点名称
    pub fn leaf_names(&self) -> Vec<String> {
        let mut out = Vec::new();
        Self::leaf_names_recursive(&self.root, &mut out);
        out
    }

    fn leaf_names_recursive(node: &TreeNode, out: &mut Vec<String>) {
        if node.is_leaf() {
            if let Some(n) = &node.name {
                out.push(n.clone());
            }
        }
        for c in &node.children {
            Self::leaf_names_recursive(c, out);
        }
    }
}

/// 树可视化数据（用于 GUI）
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct TreeVisualData {
    pub newick: String,
    pub nodes: Vec<TreeVisualNode>,
    pub layout: String,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct TreeVisualNode {
    pub name: Option<String>,
    pub branch_length: Option<f64>,
    pub support: Option<f64>,
    pub secondary_support: Option<f64>,
    pub depth: usize,
    pub is_leaf: bool,
}
