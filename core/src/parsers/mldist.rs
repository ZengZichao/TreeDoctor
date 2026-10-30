use crate::error::TreeDoctorError;
use crate::models::DistanceMatrix;

/// 解析 .mldist 距离矩阵文件
pub fn parse_mldist(content: &str) -> Result<DistanceMatrix, TreeDoctorError> {
    let lines: Vec<&str> = content.lines().collect();
    if lines.is_empty() {
        return Err(TreeDoctorError::ParseError {
            file_type: "mldist".to_string(),
            message: "空的距离矩阵文件".to_string(),
        });
    }

    let n: usize = lines[0]
        .trim()
        .parse()
        .map_err(|_| TreeDoctorError::ParseError {
            file_type: "mldist".to_string(),
            message: "第一行不是有效的序列数".to_string(),
        })?;

    let mut names = Vec::with_capacity(n);
    let mut matrix = Vec::with_capacity(n);

    for line in lines.iter().skip(1) {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() < 2 {
            continue;
        }
        names.push(parts[0].to_string());
        let row: Vec<f64> = parts[1..]
            .iter()
            .filter_map(|p| p.parse::<f64>().ok())
            .collect();
        matrix.push(row);
    }

    Ok(DistanceMatrix { names, matrix })
}

impl DistanceMatrix {
    /// 计算每条序列到其他序列的平均距离
    pub fn avg_distances(&self) -> Vec<f64> {
        self.matrix
            .iter()
            .map(|row| {
                if row.len() <= 1 {
                    return 0.0;
                }
                let sum: f64 = row.iter().sum();
                sum / (row.len() - 1) as f64 // 减去自身（对角线0）
            })
            .collect()
    }

    /// 使用 IQR 法检测离群序列
    pub fn detect_outliers(&self) -> Vec<usize> {
        let avg = self.avg_distances();
        if avg.len() < 4 {
            return Vec::new();
        }
        let mut sorted = avg.clone();
        sorted.sort_by(|a, b| a.partial_cmp(b).unwrap());
        let n = sorted.len();
        let q1 = sorted[n / 4];
        let q3 = sorted[3 * n / 4];
        let iqr = q3 - q1;
        let upper_bound = q3 + 1.5 * iqr;
        let lower_bound = q1 - 1.5 * iqr;

        avg.iter()
            .enumerate()
            .filter(|(_, &v)| v > upper_bound || v < lower_bound)
            .map(|(i, _)| i)
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_mldist() {
        let content = "3\nA  0.0000000 0.4565546 0.4414905 \nB  0.4565546 0.0000000 0.3487336 \nC  0.4414905 0.3487336 0.0000000 \n";
        let dm = parse_mldist(content).unwrap();
        assert_eq!(dm.names.len(), 3);
        assert_eq!(dm.names[0], "A");
        assert!((dm.matrix[0][1] - 0.4565546).abs() < 0.001);
    }
}
