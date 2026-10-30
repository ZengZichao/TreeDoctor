# 贡献指南 | Contributing Guide

感谢您对 TreeDoctor 项目的关注！本文档将指导您如何参与项目贡献。

Thank you for your interest in the TreeDoctor project! This document will guide you on how to contribute.

---

## 开发环境准备 | Development Environment Setup

### 必需工具 | Prerequisites

| 工具 | 最低版本 | 用途 |
|------|----------|------|
| Rust | 1.75+ | 核心库、CLI、Tauri 后端 |
| Node.js | 18+ | 前端构建 |
| npm | 9+ | 前端依赖管理 |
| Tauri CLI | 2.x | GUI 应用构建 |

### 搭建步骤 | Setup Steps

1. 克隆仓库 | Clone the repository

```bash
git clone https://github.com/treedoctor/treedoctor.git
cd treedoctor
```

2. 安装前端依赖 | Install frontend dependencies

```bash
cd gui
npm install
```

3. 构建 | Build

```bash
# 编译核心库和 CLI | Build core library and CLI
cargo build --release

# 运行 GUI 开发模式 | Run GUI in development mode
cd gui
npm run tauri dev

# 构建 GUI 发行版 | Build GUI for release
npm run tauri build
# 或者手动构建（需启用 custom-protocol feature）| Or build manually (requires custom-protocol feature)
# cd .. && cargo build --release -p treedoctor-gui --features "custom-protocol"
```

---

## 开发流程 | Development Workflow

### 1. 创建分支 | Create a Branch

```bash
git checkout -b feature/your-feature-name
# 或 | or
git checkout -b fix/your-bugfix-name
```

### 2. 编写代码 | Write Code

- 遵循 [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/)
- 前端代码遵循 [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- 提交信息使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范

### 3. 测试 | Testing

```bash
# 运行所有测试 | Run all tests
cargo test

# 运行前端类型检查 | Run frontend type check
cd gui && npx tsc --noEmit
```

### 4. 提交 | Commit

```bash
git add .
git commit -m "feat: add new diagnostic rule D9-R1"
```

### 提交信息规范 | Commit Message Convention

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档变更 |
| `style` | 代码格式（不影响功能） |
| `refactor` | 重构（既不是新功能也不是修 Bug） |
| `test` | 测试相关 |
| `chore` | 构建/工具变更 |

### 5. 提交 Pull Request | Submit a Pull Request

- PR 标题遵循 Conventional Commits 规范
- 提供清晰的变更描述
- 关联相关 Issue（如有）

---

## 代码规范 | Code Standards

### Rust

- 使用 `cargo fmt` 格式化代码
- 使用 `cargo clippy` 检查代码质量
- 公共 API 必须有文档注释

### TypeScript / React

- 使用 `prettier` 和 `eslint` 格式化代码
- 组件使用函数式组件 + Hooks
- 所有 props 必须有 TypeScript 类型定义

---

## 问题反馈 | Reporting Issues

如果您发现了 Bug 或有功能建议，请通过 GitHub Issues 提交：

If you find a bug or have a feature suggestion, please submit it via GitHub Issues:

1. 搜索是否已有类似 Issue
2. 使用 Issue 模板创建新 Issue
3. 提供清晰的问题描述和复现步骤

---

## 许可证 | License

提交的代码将使用 MIT 许可证。By contributing, you agree that your contributions will be licensed under the MIT License.
