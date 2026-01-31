# CLI-Proxy-API-Update-Script

## 🚀 快速开始

### 三步启动

```bash
# 1️⃣ 编辑配置文件，设置 secret-key
nano config.yaml  # 找到第 19 行 secret-key，设置你的密钥

# 2️⃣ 启动项目
./run.sh          # 前台运行
# 或
./start.sh        # 后台运行

# 3️⃣ 访问管理后台
# 打开浏览器访问: http://localhost:8317/management.html
# 使用你设置的 secret-key 登录
```

### 操作对照表

| 操作 | macOS / Linux | Windows |
|------|---------------|---------|
| 前台运行 | `./run.sh` | `run.bat` |
| 后台运行 | `./start.sh` | `start.bat` |
| Plus 版本（前台） | `./run.sh --plus` | `run.bat --plus` |
| Plus 版本（后台） | `./start.sh --plus` | `start.bat --plus` |
| 手动更新 | `node update.js` | `node update.js` |
| 强制更新 | `node update.js --force` | `node update.js --force` |

## 📋 脚本功能

| 脚本 | 功能 | 特性 |
|------|------|------|
| `run.sh` / `run.bat` | 前台运行，实时查看日志 | ✅ 自动端口检测与清理 |
| `start.sh` / `start.bat` | 后台静默运行 | ✅ 自动端口检测与清理 |
| `close.sh` / `close.bat` | 停止所有运行实例 | - |
| `update.js` | 更新到最新版本 | 支持 `--force` 强制更新 |

### ⚡ 端口智能管理

启动脚本会自动处理端口冲突：

```
1. 读取 config.yaml 中的端口配置 (默认: 8317)
2. 检测端口是否被占用
3. 自动终止占用进程
4. 启动服务
```

**无需手动停止旧进程，直接启动即可！**

### 🔄 版本说明

| 版本 | 二进制文件 | 说明 |
|------|-----------|------|
| 标准版 | `cli-proxy-api` | 标准功能 |
| Plus 版 | `cli-proxy-api-plus` | 增强功能 |

> 两个版本可共存，使用 `--plus` 参数切换

## 🔑 GitHub Token 配置

为避免 API 限流，建议配置 GitHub Token：

| 平台 | 配置方法 |
|------|---------|
| macOS / Linux | `cp .example.github_token .github_token` 然后编辑填入 Token |
| Windows | 复制 `.example.github_token` 为 `.github_token` 然后编辑 |
| 快捷指令 | 设置环境变量 `GITHUB_TOKEN` |

**获取 Token**: [GitHub Settings](https://github.com/settings/tokens) → 选择 `public_repo` 权限

```bash
# macOS / Linux 快速配置
cp .example.github_token .github_token
echo "YOUR_GITHUB_TOKEN" > .github_token
chmod 600 .github_token
```

## 🛠️ 服务管理

### 查看运行状态

| 平台 | 命令 |
|------|------|
| macOS / Linux | `ps aux \| grep cli-proxy-api` |
| Windows | `tasklist \| findstr cli-proxy-api` |

### 停止服务

| 方式 | macOS / Linux | Windows |
|------|---------------|---------|
| 一键停止 | `./close.sh` | `close.bat` |
| 按进程名 | `pkill -f "cli-proxy-api"` | `taskkill /F /IM cli-proxy-api.exe` |
| 按端口 | `lsof -ti:8317 \| xargs kill -9` | - |

### 查看日志

当 `config.yaml` 中 `logging-to-file: true` 时：

| 平台 | 命令 |
|------|------|
| macOS / Linux | `tail -f $(ls -t logs/*.log 2>/dev/null \| head -1)` |
| Windows | 查看 `logs` 目录下最新的 `.log` 文件 |

## 📦 初次使用

### 方式一：直接使用（推荐）

项目已包含 `config.yaml`，只需修改 `secret-key` 即可：

```bash
# 1. 编辑配置文件
nano config.yaml  # 修改第 19 行的 secret-key

# 2. 启动项目
./run.sh

# 3. 访问管理后台
# http://localhost:8317/management.html
# 使用你设置的 secret-key 登录
```

### 方式二：从示例配置开始

```bash
# 1. 复制示例配置
cp config.example.yaml config.yaml

# 2. 编辑配置，设置 secret-key
nano config.yaml

# 3. 启动项目
./run.sh
```

> **提示**: `secret-key` 用于登录管理后台，请设置一个安全的密钥

## 🌐 Web 管理界面

访问地址：http://localhost:8317/management.html

## 💡 快捷指令 (macOS)

创建快捷指令，添加「运行 Shell 脚本」动作：

```bash
/Applications/CLIProxyApi/start.sh
```

## ⚙️ 平台支持

- ✅ macOS (darwin)
- ✅ Linux
- ✅ Windows

## 🔧 权限设置

### macOS / Linux

```bash
chmod +x run.sh start.sh close.sh cli-proxy-api cli-proxy-api-plus
```

### Windows

确保 `cli-proxy-api.exe` 和 `node` 在 PATH 中