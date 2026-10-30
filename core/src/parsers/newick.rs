use crate::error::TreeDoctorError;
use crate::models::{ParsedTree, SupportType, TreeNode};

/// 解析 Newick 格式树字符串
pub fn parse_newick(newick: &str) -> Result<ParsedTree, TreeDoctorError> {
    let newick = newick.trim();
    let newick = newick.strip_suffix(';').unwrap_or(newick).trim();

    if newick.is_empty() {
        return Err(TreeDoctorError::ParseError {
            file_type: "newick".to_string(),
            message: "空的 Newick 字符串".to_string(),
        });
    }

    let mut parser = NewickParser::new(newick);
    let root = parser.parse_subtree()?;

    let mut tree = ParsedTree {
        newick_string: format!("{};", newick),
        root,
        ..Default::default()
    };

    // 统计树叶和内部分支
    analyze_tree(&mut tree);

    Ok(tree)
}

fn analyze_tree(tree: &mut ParsedTree) {
    let mut n_taxa = 0usize;
    let mut n_internal = 0usize;
    let mut total_length = 0.0f64;
    let mut internal_length = 0.0f64;
    let mut has_negative = false;
    let mut min_bl = f64::MAX;
    let mut max_bl = f64::MIN;
    let mut near_zero = Vec::new();
    let mut long_branches = Vec::new();
    let mut has_support = false;
    let mut has_secondary_support = false;

    analyze_recursive(
        &tree.root,
        true,
        &mut n_taxa,
        &mut n_internal,
        &mut total_length,
        &mut internal_length,
        &mut has_negative,
        &mut min_bl,
        &mut max_bl,
        &mut near_zero,
        &mut long_branches,
        &mut has_support,
        &mut has_secondary_support,
    );

    tree.n_taxa = n_taxa;
    tree.n_internal_branches = n_internal;
    tree.total_tree_length = total_length;
    tree.internal_branch_length = internal_length;
    tree.internal_branch_percentage = if total_length > 0.0 {
        internal_length / total_length * 100.0
    } else {
        0.0
    };
    tree.has_negative_branches = has_negative;
    tree.min_branch_length = if min_bl == f64::MAX { 0.0 } else { min_bl };
    tree.max_branch_length = if max_bl == f64::MIN { 0.0 } else { max_bl };
    tree.near_zero_branches = near_zero;
    tree.long_branches = long_branches;

    tree.support_type = if has_secondary_support {
        SupportType::ShAlrtUfboot
    } else if has_support {
        SupportType::StandardBootstrap
    } else {
        SupportType::None
    };
}

#[allow(clippy::too_many_arguments)]
fn analyze_recursive(
    node: &TreeNode,
    is_root: bool,
    n_taxa: &mut usize,
    n_internal: &mut usize,
    total_length: &mut f64,
    internal_length: &mut f64,
    has_negative: &mut bool,
    min_bl: &mut f64,
    max_bl: &mut f64,
    near_zero: &mut Vec<f64>,
    long_branches: &mut Vec<f64>,
    has_support: &mut bool,
    has_secondary_support: &mut bool,
) {
    if let Some(bl) = node.branch_length {
        *total_length += bl;
        if bl < 0.0 {
            *has_negative = true;
        }
        if bl < *min_bl {
            *min_bl = bl;
        }
        if bl > *max_bl {
            *max_bl = bl;
        }
        // 近零分支： < 0.00001 (实际上 IQ-TREE 的阈值在 1e-6 左右)
        if bl.abs() < 1e-6 && !is_root {
            near_zero.push(bl);
        }
        // 过长分支： > 1.0 (经验阈值)
        if bl > 1.0 {
            long_branches.push(bl);
        }
    }

    if node.support.is_some() {
        *has_support = true;
    }
    if node.secondary_support.is_some() {
        *has_secondary_support = true;
    }

    if node.is_leaf() {
        *n_taxa += 1;
    } else {
        *n_internal += 1;
        if !is_root {
            if let Some(bl) = node.branch_length {
                *internal_length += bl;
            }
        }
    }

    for child in &node.children {
        analyze_recursive(
            child,
            false,
            n_taxa,
            n_internal,
            total_length,
            internal_length,
            has_negative,
            min_bl,
            max_bl,
            near_zero,
            long_branches,
            has_support,
            has_secondary_support,
        );
    }
}

/// Newick 递归下降解析器
struct NewickParser<'a> {
    chars: Vec<char>,
    pos: usize,
    _marker: std::marker::PhantomData<&'a str>,
}

impl<'a> NewickParser<'a> {
    fn new(s: &'a str) -> Self {
        Self {
            chars: s.chars().collect(),
            pos: 0,
            _marker: std::marker::PhantomData,
        }
    }

    fn parse_subtree(&mut self) -> Result<TreeNode, TreeDoctorError> {
        self.skip_whitespace();
        if self.peek() == Some('(') {
            self.parse_internal()
        } else {
            self.parse_leaf()
        }
    }

    fn parse_internal(&mut self) -> Result<TreeNode, TreeDoctorError> {
        self.expect('(')?;
        let mut children = Vec::new();
        loop {
            self.skip_whitespace();
            children.push(self.parse_subtree()?);
            self.skip_whitespace();
            match self.peek() {
                Some(',') => {
                    self.advance();
                }
                Some(')') => {
                    self.advance();
                    break;
                }
                _ => {
                    return Err(TreeDoctorError::ParseError {
                        file_type: "newick".to_string(),
                        message: format!(
                            "期望 ',' 或 ')' 但找到 '{}' at pos {}",
                            self.peek().unwrap_or(' '),
                            self.pos
                        ),
                    });
                }
            }
        }

        let mut node = TreeNode {
            children,
            ..Default::default()
        };

        // 解析 name:branch_length 或 support:branch_length
        self.parse_name_and_length(&mut node)?;

        Ok(node)
    }

    fn parse_leaf(&mut self) -> Result<TreeNode, TreeDoctorError> {
        let mut node = TreeNode::default();
        self.parse_name_and_length(&mut node)?;
        Ok(node)
    }

    fn parse_name_and_length(&mut self, node: &mut TreeNode) -> Result<(), TreeDoctorError> {
        let label = self.parse_label();
        if !label.is_empty() {
            if !node.children.is_empty() {
                // 内部节点：label 可能是 support 值，如 "100/100" 或 "85.5/71" 或 "100"
                if let Some(slash_pos) = label.find('/') {
                    let primary = &label[..slash_pos];
                    let secondary = &label[slash_pos + 1..];
                    node.support = primary.parse::<f64>().ok();
                    node.secondary_support = secondary.parse::<f64>().ok();
                } else {
                    node.support = label.parse::<f64>().ok();
                }
            } else {
                // 叶子节点：label 是名称
                node.name = Some(label);
            }
        }

        self.skip_whitespace();
        if self.peek() == Some(':') {
            self.advance();
            let bl_str = self.parse_number();
            if let Ok(bl) = bl_str.parse::<f64>() {
                node.branch_length = Some(bl);
            }
        }
        Ok(())
    }

    fn parse_label(&mut self) -> String {
        self.skip_whitespace();
        let mut s = String::new();
        // 处理引号
        if self.peek() == Some('\'') {
            self.advance();
            while let Some(c) = self.peek() {
                if c == '\'' {
                    self.advance();
                    break;
                }
                s.push(c);
                self.advance();
            }
            return s;
        }
        while let Some(c) = self.peek() {
            if c == ',' || c == ')' || c == '(' || c == ';' || c == ':' || c.is_whitespace() {
                break;
            }
            s.push(c);
            self.advance();
        }
        s
    }

    fn parse_number(&mut self) -> String {
        self.skip_whitespace();
        let mut s = String::new();
        while let Some(c) = self.peek() {
            if c.is_ascii_digit() || c == '.' || c == '-' || c == '+' || c == 'e' || c == 'E' {
                s.push(c);
                self.advance();
            } else {
                break;
            }
        }
        s
    }

    fn peek(&self) -> Option<char> {
        self.chars.get(self.pos).copied()
    }

    fn advance(&mut self) {
        self.pos += 1;
    }

    fn skip_whitespace(&mut self) {
        while let Some(c) = self.peek() {
            if c.is_whitespace() {
                self.advance();
            } else {
                break;
            }
        }
    }

    fn expect(&mut self, c: char) -> Result<(), TreeDoctorError> {
        self.skip_whitespace();
        if self.peek() == Some(c) {
            self.advance();
            Ok(())
        } else {
            Err(TreeDoctorError::ParseError {
                file_type: "newick".to_string(),
                message: format!("期望 '{}' 但找到 '{}' at pos {}", c, self.peek().unwrap_or(' '), self.pos),
            })
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_simple_newick() {
        let tree = parse_newick("(A:0.1,B:0.2);").unwrap();
        assert_eq!(tree.n_taxa, 2);
        assert!((tree.total_tree_length - 0.3).abs() < 0.001);
    }

    #[test]
    fn test_parse_with_support() {
        let tree = parse_newick("(A:0.1,B:0.2)100/100:0.3;").unwrap();
        assert_eq!(tree.n_taxa, 2);
        assert_eq!(tree.root.support, Some(100.0));
        assert_eq!(tree.root.secondary_support, Some(100.0));
    }

    #[test]
    fn test_parse_real_treefile() {
        let newick = "(LngfishAu:0.1710870825,(LngfishSA:0.1883807809,LngfishAf:0.1649399635)100/100:0.1072996568);";
        let tree = parse_newick(newick).unwrap();
        assert_eq!(tree.n_taxa, 3);
        assert_eq!(tree.n_internal_branches, 2);
        assert!((tree.total_tree_length - 0.6318).abs() < 0.01);
    }

    #[test]
    fn test_negative_branch() {
        let tree = parse_newick("(A:0.1,B:-0.05):0.2;").unwrap();
        assert!(tree.has_negative_branches);
    }
}
