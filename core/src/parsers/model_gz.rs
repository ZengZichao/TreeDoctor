use crate::error::TreeDoctorError;
use flate2::read::GzDecoder;
use std::fs;
use std::io::Read;
use std::path::Path;

/// 读取并解压 gzip 文件
pub fn read_gzip(path: &Path) -> Result<String, TreeDoctorError> {
    let file = fs::File::open(path).map_err(|_| TreeDoctorError::FileNotFound {
        path: path.to_string_lossy().to_string(),
    })?;
    let mut decoder = GzDecoder::new(file);
    let mut content = String::new();
    decoder
        .read_to_string(&mut content)
        .map_err(|e| TreeDoctorError::Io(e))?;
    Ok(content)
}

/// 读取普通文本文件（容忍非 UTF-8 字节，用替换字符代替）
pub fn read_text(path: &Path) -> Result<String, TreeDoctorError> {
    let bytes = fs::read(path).map_err(|e| {
        if e.kind() == std::io::ErrorKind::NotFound {
            TreeDoctorError::FileNotFound {
                path: path.to_string_lossy().to_string(),
            }
        } else {
            TreeDoctorError::Io(e)
        }
    })?;
    Ok(String::from_utf8_lossy(&bytes).into_owned())
}

/// 自动读取文件（检测 gzip 或普通文本）
pub fn read_file(path: &Path) -> Result<String, TreeDoctorError> {
    let path_str = path.to_string_lossy();
    if path_str.ends_with(".gz") {
        read_gzip(path)
    } else {
        read_text(path)
    }
}
