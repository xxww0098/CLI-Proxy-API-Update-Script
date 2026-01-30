# CLI Proxy API Update Script

## 快速开始

### macOS / Linux

```bash
# 前台运行（查看日志）
./run.sh

# 后台运行（快捷指令/自动化）
./start.sh

# 手动更新
node update.js

# 强制更新
node update.js --force
```

### Windows

```batch
# 前台运行
run.bat

# 后台运行
start.bat

# 手动更新
node update.js

# 强制更新
node update.js --force
```

## 脚本说明

| 文件 | 说明 |
|------|------|
| `run.sh` / `run.bat` | 前台运行，显示启动信息 |
| `start.sh` / `start.bat` | 后台运行，立即返回 |
| `update.js` | 更新脚本，下载最新版本 |
| `config.yaml` | 配置文件 |

## GitHub Token 配置

为避免 GitHub API 限流，建议配置 GitHub Token：

### macOS / Linux

创建 `.github_token` 文件：

```bash
echo "你的_GITHUB_TOKEN" > .github_token
chmod 600 .github_token
```

### Windows

创建 `.github_token` 文件（内容为 Token 本身，不含引号）

### macOS 快捷指令环境变量

在快捷指令的 Shell 脚本动作中添加环境变量：
- 变量名：`GITHUB_TOKEN`
- 值：你的 GitHub Personal Access Token

获取 Token：
1. 访问 https://github.com/settings/tokens
2. 生成新 Token，选择 `public_repo` 权限即可

## 后台运行管理

### macOS / Linux

查看运行状态：

```bash
ps aux | grep cli-proxy-api
```

停止服务：

```bash
pkill -f "cli-proxy-api"
```

### Windows

查看运行状态：

```batch
tasklist | findstr cli-proxy-api
```

停止服务：

```batch
taskkill /F /IM cli-proxy-api.exe
```

## 查看日志

当 `config.yaml` 中 `logging-to-file: true` 时：

### macOS / Linux

```bash
tail -f $(ls -t logs/*.log 2>/dev/null | head -1)
```

### Windows

```batch
FOR /F "delims=" %%i IN ('dir /b /o-d logs\*.log 2^>nul') DO set "LOG=%%i" & goto :found
:found
type "%LOG%" | more
```

## 更新机制

- 启动时自动检查并更新主程序和管理面板
- 使用 `--force` 或 `-f` 参数强制重新下载
- 版本信息保存在 `version.txt`

## 平台支持

- macOS (darwin)
- Linux
- Windows

## 权限问题

### macOS / Linux

如果执行时提示权限不足：

```bash
chmod +x run.sh start.sh update.js cli-proxy-api
```

### Windows

确保 `cli-proxy-api.exe` 和 `node` 已添加到 PATH，或使用完整路径。

## 快捷指令配置

创建快捷指令，添加「运行 Shell 脚本」动作：

```bash
/Applications/CLIProxyApi/start.sh
```

停止命令会在启动后显示。

## Web UI 

基础路径：http://localhost:8317/management.html

## 使用方法

1. 首次运行脚本，会自动下载必要文件
2. 重命名配置文件：
   ```bash
   cp config.example.yaml config.yaml
   ```
3. 编辑 `config.yaml`，填入 `secret-key`
4. 重新启动脚本，完成配置