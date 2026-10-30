use crate::error::TreeDoctorError;
use crate::models::*;
use once_cell::sync::Lazy;
use regex::Regex;

/// 解析 .splits.nex NEXUS 文件
pub fn parse_nexus(content: &str) -> Result<SplitsInfo, TreeDoctorError> {
    let mut info = SplitsInfo::default();

    static RE_NTAX: Lazy<Regex> = Lazy::new(|| Regex::new(r"ntax=(\d+)").unwrap());
    static RE_NSPLITS: Lazy<Regex> = Lazy::new(|| Regex::new(r"nsplits=(\d+)").unwrap());

    for line in content.lines() {
        if let Some(c) = RE_NTAX.captures(line) {
            info.n_taxa = c.get(1).unwrap().as_str().parse().unwrap_or(0);
        }
        if let Some(c) = RE_NSPLITS.captures(line) {
            info.n_splits = c.get(1).unwrap().as_str().parse().unwrap_or(0);
        }
    }

    // 解析 MATRIX 块
    if let Some(matrix_start_pos) = content.find("MATRIX") {
        // 从 MATRIX 之后开始搜索 END;
        let after_matrix = &content[matrix_start_pos..];
        // 跳过 "MATRIX" 关键字本身
        let after_keyword = &after_matrix["MATRIX".len()..];
        // 找到 MATRIX 块结束的 END;
        let end_pos = after_keyword.find("END;").unwrap_or(after_keyword.len());
        let matrix_block = &after_keyword[..end_pos];
        for line in matrix_block.lines() {
            let line = line.trim().trim_end_matches(',');
            if line.is_empty() || line == "MATRIX" {
                continue;
            }
            let mut parts = line.split_whitespace();
            let support_str = match parts.next() {
                Some(s) => s,
                None => continue,
            };
            let support: f64 = match support_str.parse() {
                Ok(v) => v,
                Err(_) => continue,
            };
            let taxon_ids: Vec<usize> = parts
                .filter_map(|p| p.parse::<usize>().ok())
                .collect();
            if !taxon_ids.is_empty() {
                info.splits.push(Split { support, taxon_ids });
            }
        }
    }

    Ok(info)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_nexus() {
        let content = "#nexus\n\nBEGIN Taxa;\nDIMENSIONS ntax=17;\nEND; [Taxa]\n\nBEGIN Splits;\nDIMENSIONS ntax=17 nsplits=59;\nFORMAT labels=no weights=yes confidences=no intervals=no;\nMATRIX\n\t100\t 2,\n\t100\t 3,\n\t71\t 5 8 9,\nEND; [Splits]";
        let info = parse_nexus(content).unwrap();
        assert_eq!(info.n_taxa, 17);
        assert_eq!(info.n_splits, 59);
        assert_eq!(info.splits.len(), 3);
        assert_eq!(info.splits[0].support, 100.0);
        assert_eq!(info.splits[2].support, 71.0);
        assert_eq!(info.splits[2].taxon_ids, vec![5, 8, 9]);
    }
}
