# CLI-Proxy-API-Update-Script

## ⚠️ 重要安全提示

**首次使用前必读:**
1. **必须修改 secret-key**: 配置文件中的默认密钥仅用于示例,请立即修改为您自己的强密码
2. **访问限制**: 默认配置仅允许本地访问 (127.0.0.1),如需远程访问请谨慎配置防火墙
3. **API 密钥安全**: 请妥善保管 GitHub Token 和 API 密钥,不要提交到公开仓库

## 📦 环境要求

| 依赖 | 最低版本 | 说明 |
|------|---------|------|
| Node.js | >= 14.0.0 | 必需,用于运行更新脚本 |
| npm | >= 6.0.0 | 必需,Node.js 包管理器 |
| tar | - | macOS/Linux 必需,用于解压 |
| lsof | - | macOS/Linux 必需,用于端口检测 |

检查环境:
```bash
node --version  # 应显示 v14.0.0 或更高
npm --version   # 应显示 6.0.0 或更高
```

## 🚀 快速开始

### 三步启动

```bash
# 1️⃣ 编辑配置文件,设置 secret-key (重要!)
nano config.yaml  # 找到第 19 行 secret-key，修改为您自己的强密码

# 2️⃣ 启动项目
./run.sh              # 前台运行（默认）
# 或
./run.sh -d           # 后台运行（守护进程模式）

# 3️⃣ 访问管理后台
# 打开浏览器访问: http://localhost:8317/management.html
# 使用您设置的 secret-key 登录
```

> **警告**: 不要使用配置文件中的默认密钥,这会导致严重的安全风险!

### 操作对照表

| 操作 | macOS / Linux | Windows |
|------|---------------|---------|
| 前台运行 | `./run.sh` | `run.bat` |
| 后台运行 | `./run.sh -d` | `run.bat -d` |
| Plus 版本（前台） | `./run.sh -p` | `run.bat -p` |
| Plus 版本（后台） | `./run.sh -p -d` | `run.bat -p -d` |
| 手动更新 | `node update.js` | `node update.js` |
| 强制更新 | `node update.js --force` | `node update.js --force` |

## 📋 脚本功能

| 脚本 | 功能 | 特性 |
|------|------|------|
| `run.sh` / `run.bat` | 启动服务 | ✅ 自动端口检测与清理<br>✅ 支持 `-d` 后台运行<br>✅ 支持 `-p` Plus 版本 |
| `close.sh` / `close.bat` | 停止所有运行实例 | - |
| `update.js` | 更新到最新版本 | 支持 `--force` 强制更新 |

### 参数说明

| 参数 | 说明 | 示例 |
|------|------|------|
| `-d` / `--daemon` | 守护进程模式（后台运行） | `./run.sh -d` |
| `-p` / `--plus` | 使用 Plus 版本 | `./run.sh -p` |
| 组合使用 | 同时指定多个参数 | `./run.sh -p -d` |

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

> 使用 `--plus` 参数切换 Plus 版本，两个版本共享同一个配置文件

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

### 启动参数示例

```bash
# 前台运行（默认）
./run.sh

# Plus 版本前台运行
./run.sh -p

# 守护进程模式（后台运行）
./run.sh -d

# Plus 版本守护进程模式
./run.sh -p -d

# 所有参数长形式
./run.sh --plus --daemon

# 参数顺序任意，以下都等价
./run.sh -p -d
./run.sh -d -p
./run.sh --plus -d
./run.sh -d --plus
```

## 🌐 Web 管理界面

访问地址：http://localhost:8317/management.html

## 💡 快捷指令 (macOS)

创建快捷指令，添加「运行 Shell 脚本」动作：

```bash
/Applications/CLIProxyApi/run.sh -d
```

## ⚙️ 平台支持

- ✅ macOS (darwin)
- ✅ Linux
- ✅ Windows

## 🔧 权限设置

### macOS / Linux

```bash
chmod +x run.sh close.sh cli-proxy-api cli-proxy-api-plus
```

### Windows

确保 `cli-proxy-api.exe` 和 `node` 在 PATH 中

## 🔍 故障排查

### 常见问题

#### 1. 端口被占用无法启动
**症状**: 启动时提示端口 8317 已被占用
**解决方案**:
```bash
# macOS / Linux
lsof -ti:8317 | xargs kill -9

# Windows
netstat -ano | findstr :8317
taskkill /F /PID [PID编号]
```

#### 2. 更新失败 - GitHub API 限流
**症状**: 提示 "API 限流" 或 "403 Forbidden"
**解决方案**:
1. 配置 GitHub Token (推荐):
   ```bash
   cp .example.github_token .github_token
   echo "YOUR_GITHUB_TOKEN" > .github_token
   chmod 600 .github_token
   ```
2. 或使用代理模式更新:
   ```bash
   PROXY_ONLY=true node update.js
   ```

#### 3. 更新失败 - 网络超时
**症状**: 所有下载源均超时失败
**解决方案**:
1. 检查网络连接
2. 增加超时时间,编辑 `proxy-config.json`:
   ```json
   {
     "timeout": 60000
   }
   ```
3. 手动下载安装包并解压到项目目录

#### 4. 权限错误 (macOS/Linux)
**症状**: Permission denied
**解决方案**:
```bash
chmod +x run.sh close.sh cli-proxy-api cli-proxy-api-plus
```

#### 5. Node.js 版本过低
**症状**: 启动时出现语法错误
**解决方案**:
```bash
# 检查版本
node --version

# 升级 Node.js (推荐使用 nvm)
# macOS / Linux
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

#### 6. 管理后台无法访问
**症状**: http://localhost:8317/management.html 404
**检查清单**:
1. 确认服务正在运行: `ps aux | grep cli-proxy-api`
2. 检查端口是否正确: 查看 `config.yaml` 中的 `port` 配置
3. 检查防火墙设置
4. 查看日志文件: `tail -f logs/*.log`

#### 7. 日志文件占用过多磁盘空间
**症状**: logs 目录过大
**解决方案**: 在 `config.yaml` 中设置日志大小限制:
```yaml
logs-max-total-size-mb: 100  # 限制为 100MB
```

### 获取帮助

如果问题仍未解决,请:
1. 查看日志文件: `logs/` 目录下的最新日志
2. 检查系统资源: CPU、内存、磁盘空间
3. 提交 Issue: [GitHub Issues](https://github.com/router-for-me/CLIProxyAPI/issues)

## 📝 更新日志

### 最新优化 (当前版本)
- ✅ 修复命令注入安全漏洞
- ✅ 改进端口冲突处理,支持优雅关闭
- ✅ 修复 Windows 批处理脚本参数传递错误
- ✅ 添加重定向深度限制,防止无限循环
- ✅ 重构重复代码,提升代码质量
- ✅ 启用日志大小限制,默认 100MB
- ✅ 完善文档和故障排查指南

## 🔐 安全最佳实践

1. **定期更新密钥**: 定期修改 `secret-key` 和 API 密钥
2. **限制访问**: 保持 `host: "127.0.0.1"` 除非必须远程访问
3. **启用 TLS**: 生产环境建议启用 HTTPS
4. **日志审计**: 定期检查 `logs/` 目录中的访问日志
5. **备份配置**: 定期备份 `config.yaml` 和认证文件

## 📄 许可证

请查看项目仓库的 LICENSE 文件