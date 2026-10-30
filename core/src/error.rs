use thiserror::Error;

#[derive(Debug, Error)]
pub enum TreeDoctorError {
    #[error("文件未找到: {path}")]
    FileNotFound { path: String },

    #[error("文件类型无法识别: {path}")]
    UnknownFileType { path: String },

    #[error("解析错误: {file_type} - {message}")]
    ParseError { file_type: String, message: String },

    #[error("缺少关键文件: {file_type}")]
    MissingCriticalFile { file_type: String },

    #[error("数据不一致: {message}")]
    DataInconsistency { message: String },

    #[error("IO 错误: {0}")]
    Io(#[from] std::io::Error),

    #[error("正则表达式错误: {0}")]
    Regex(#[from] regex::Error),

    #[error("JSON 序列化错误: {0}")]
    Json(#[from] serde_json::Error),
}
