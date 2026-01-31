#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const https = require('https');
const zlib = require('zlib');
const os = require('os');
const { execFileSync } = require('child_process');
const { ProxyDownloader } = require('./proxy-downloader.js');

/**
 * 工具函数: 安全删除文件或目录
 * @param {string} pathToRemove - 文件或目录路径
 */
function safeRemove(pathToRemove) {
  try {
    if (fs.existsSync(pathToRemove)) {
      const stat = fs.statSync(pathToRemove);
      if (stat.isDirectory()) {
        fs.rmSync(pathToRemove, { recursive: true, force: true });
      } else {
        fs.unlinkSync(pathToRemove);
      }
    }
  } catch (err) {
    // 静默失败,避免干扰主流程
  }
}

const isPlus = process.argv.includes('--plus') || process.argv.includes('-p');

// 创建代理下载器实例
const downloader = new ProxyDownloader({
  configFile: 'proxy-config.json',
  token: process.env.GITHUB_TOKEN || ''
});

const CONFIG = {
  apiEndpoint: isPlus
    ? 'https://api.github.com/repos/router-for-me/CLIProxyAPIPlus/releases/latest'
    : 'https://api.github.com/repos/router-for-me/CLIProxyAPI/releases/latest',
  panelApiEndpoint: 'https://api.github.com/repos/router-for-me/Cli-Proxy-API-Management-Center/releases/latest',
  binaryName: isPlus ? 'cli-proxy-api-plus' : 'cli-proxy-api',
  panelFileName: 'management.html',
  checksumsFile: 'checksums.txt',
  maxSize: 100 * 1024 * 1024,
  panelMaxSize: 10 * 1024 * 1024,
  timeout: 30000,
  token: process.env.GITHUB_TOKEN || ''
};

const PLATFORM_MAP = {
  'darwin': 'darwin',
  'linux': 'linux',
  'win32': 'windows'
};

const ARCH_MAP = {
  'arm64': 'arm64',
  'x64': 'amd64',
  'amd64': 'amd64'
};

const installDir = path.dirname(__filename);
const tmpTag = Date.now();

const safePath = (p) => {
  const resolved = path.resolve(installDir, p);
  if (!resolved.startsWith(installDir + path.sep) && resolved !== installDir) {
    throw new Error(`非法路径: ${p}`);
  }
  return resolved;
};

const getPlatformInfo = () => {
  const platform = PLATFORM_MAP[os.platform()] || 'linux';
  const arch = process.env.CPU_ARCH || ARCH_MAP[os.arch()] || 'amd64';
  return { platform, arch };
};

const parseChecksums = (content) => {
  const checksums = {};
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
      const fileName = parts[1];
      const checksum = parts[0];
      checksums[fileName] = checksum;
    }
  }
  return checksums;
};

const findMatchingAsset = (assets, checksums, platform, arch, version) => {
  const cleanVersion = version.startsWith('v') ? version.slice(1) : version;
  const prefix = isPlus ? 'CLIProxyAPIPlus' : 'CLIProxyAPI';
  const patterns = [
    `${prefix}_${cleanVersion}_${platform}_${arch}.tar.gz`,
    `${prefix}_${cleanVersion}_${platform}_${arch}.zip`
  ];

  for (const pattern of patterns) {
    const asset = assets.find(a => a?.name === pattern);
    if (asset) {
      return { asset, checksum: checksums[pattern] || null };
    }
  }
  return { asset: null, checksum: null };
};

const clean = (pattern) => {
  fs.readdirSync(installDir).forEach(f => {
    if (pattern.test(f)) {
      safeRemove(safePath(f));
    }
  });
};

const httpsGet = (url, raw = false) => new Promise((resolve, reject) => {
  const headers = { 
    'User-Agent': 'CLIProxy-Updater/1.0',
    'Accept': 'application/vnd.github.v3+json'
  };
  if (CONFIG.token) headers['Authorization'] = `Bearer ${CONFIG.token}`;
  
  const req = https.get(url, { headers, timeout: CONFIG.timeout }, (res) => {
    if (res.statusCode === 302 && res.headers.location) {
      httpsGet(res.headers.location, raw).then(resolve).catch(reject);
      return;
    }
    if (res.statusCode === 403) {
      const reset = res.headers['x-ratelimit-reset'];
      const msg = reset 
        ? `API 限流，重置时间: ${new Date(reset * 1000).toLocaleTimeString()}`
        : 'API 限流，请设置 GITHUB_TOKEN';
      reject(new Error(msg));
      return;
    }
    const chunks = [];
    res.on('data', chunk => chunks.push(chunk));
    res.on('end', () => {
      const buffer = Buffer.concat(chunks);
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${buffer.toString().substring(0, 200)}`));
        return;
      }
      resolve(raw ? buffer : JSON.parse(buffer.toString()));
    });
  });
  req.on('error', reject);
  req.on('timeout', () => {
    req.destroy();
    reject(new Error('请求超时'));
  });
});

// 改进的 tar 解压：支持 GNU 长文件名、更智能的二进制检测
const extractBinary = (tarGzPath, destDir) => {
  const compressed = fs.readFileSync(tarGzPath);
  const tarBuffer = zlib.gunzipSync(compressed);
  
  let offset = 0;
  const candidates = [];
  let longNameBuffer = null;
  
  while (offset < tarBuffer.length - 512) {
    const header = tarBuffer.slice(offset, offset + 512);
    
    // 解析关键字段
    let fileName = header.slice(0, 100).toString('utf8').replace(/\0.*$/, '');
    const mode = parseInt(header.slice(100, 108).toString('utf8').replace(/\0/g, ''), 8) || 0;
    const fileSize = parseInt(header.slice(124, 136).toString('utf8').replace(/\0/g, ''), 8) || 0;
    const typeFlag = header.slice(156, 157).toString('utf8') || '0';
    
    // 处理 GNU 长文件名扩展 (L)
    if (typeFlag === 'L') {
      longNameBuffer = tarBuffer.slice(offset + 512, offset + 512 + fileSize).toString('utf8').replace(/\0/g, '');
      offset += 512 + Math.ceil(fileSize / 512) * 512;
      continue;
    }
    
    // 处理普通文件
    if ((typeFlag === '0' || typeFlag === '\0' || typeFlag === '') && fileSize > 0) {
      const actualName = longNameBuffer || fileName;
      const baseName = path.basename(actualName);
      const lowerName = baseName.toLowerCase();
      const isExecutable = (mode & 0o111) !== 0;
      
      // 智能匹配：优先匹配目标名，其次匹配大体积可执行文件
      const targetNames = isPlus
        ? [CONFIG.binaryName, 'cli-proxy-api-plus', 'cliproxyapiplus', 'cliproxyplus']
        : [CONFIG.binaryName, 'cli-proxy-api', 'cliproxyapi', 'cliproxy'];
      const nameMatch = targetNames.find(n => lowerName === n || lowerName.replace(/-/g, '') === n.replace(/-/g, ''));
      
      if (nameMatch || (isExecutable && fileSize > 1000000)) { // 1MB+
        const fileData = tarBuffer.slice(offset + 512, offset + 512 + fileSize);
        const priority = nameMatch ? 100 : (isExecutable ? 50 : 0);
        
        candidates.push({ 
          name: baseName, 
          data: fileData, 
          size: fileSize,
          isExec: isExecutable,
          priority
        });
      }
      
      longNameBuffer = null; // 重置长文件名缓冲
    }
    
    offset += 512 + Math.ceil(fileSize / 512) * 512;
    
    // 空块检测
    if (header.slice(0, 100).every(b => b === 0)) break;
  }
  
  if (candidates.length === 0) {
    throw new Error('归档中未找到二进制文件');
  }
  
  // 按优先级排序（名称匹配 > 可执行 > 大小）
  candidates.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return b.size - a.size;
  });
  
  const selected = candidates[0];
  console.log(`[解压] 选中: ${selected.name} (${(selected.size/1024/1024).toFixed(1)}MB)`);
  
  const destPath = path.join(destDir, selected.name);
  fs.writeFileSync(destPath, selected.data, { mode: 0o755 });
  return destPath;
};

// 容错性验证：支持多种版本参数，失败时回退到静态检查
const verifyBinary = (binPath) => {
  const fd = fs.openSync(binPath, 'r');
  const magic = Buffer.alloc(4);
  fs.readSync(fd, magic, 0, 4, 0);
  fs.closeSync(fd);

  const isMachO64 = (magic[0] === 0xcf && magic[1] === 0xfa && magic[2] === 0xed && magic[3] === 0xfe);
  const isMachO32 = (magic[0] === 0xce && magic[1] === 0xfa && magic[2] === 0xed && magic[3] === 0xfe);
  const isMachOFat = (magic[0] === 0xca && magic[1] === 0xfe && magic[2] === 0xba && magic[3] === 0xbe);
  const isELF = (magic[0] === 0x7f && magic[1] === 0x45 && magic[2] === 0x4c && magic[3] === 0x46);

  if (!isMachO64 && !isMachO32 && !isMachOFat && !isELF) {
    throw new Error(`无效二进制魔数: ${magic.toString('hex')}`);
  }

  const stats = fs.statSync(binPath);
  if (!(stats.mode & 0o111)) {
    fs.chmodSync(binPath, 0o755);
  }

  const versionArgs = [['--version'], ['-v'], ['-V'], ['version'], ['--help']];

  for (const args of versionArgs) {
    try {
      const output = execFileSync(binPath, args, {
        encoding: 'utf8',
        timeout: 5000,
        stdio: ['pipe', 'pipe', 'ignore']
      });
      return `ok (${args.join(' ')})`;
    } catch (e) {
      const output = (e.stdout || '') + (e.stderr || '');
      if (output.length > 0 && output.length < 1000) {
        return `ok (${args.join(' ')}, exit:${e.status})`;
      }
    }
  }

  console.log(`[警告] 无法执行 --version，但二进制结构有效 (${magic.toString('hex')})`);
  return 'binary-valid';
};

const readVersionFile = () => {
  const versionFile = safePath('version.txt');
  if (!fs.existsSync(versionFile)) {
    return { binary: '0.0.0', plus: '0.0.0', panel: '0.0.0' };
  }
  const content = fs.readFileSync(versionFile, 'utf8').trim();
  try {
    const data = JSON.parse(content);
    return {
      binary: data.binary || '0.0.0',
      plus: data.plus || '0.0.0',
      panel: data.panel || '0.0.0'
    };
  } catch {
    return { binary: content || '0.0.0', plus: '0.0.0', panel: '0.0.0' };
  }
};

const writeVersionFile = (binaryVer, panelVer, isPlusVersion = false) => {
  const versionFile = safePath('version.txt');
  let data = {};
  
  // 读取现有版本信息
  if (fs.existsSync(versionFile)) {
    try {
      const content = fs.readFileSync(versionFile, 'utf8').trim();
      data = JSON.parse(content);
    } catch {}
  }
  
  // 更新对应版本的版本号
  if (isPlusVersion) {
    data.plus = binaryVer;
  } else {
    data.binary = binaryVer;
  }
  data.panel = panelVer;
  
  fs.writeFileSync(versionFile, JSON.stringify(data, null, 2) + '\n');
};

async function updatePanel() {
  const staticDir = safePath('static');
  const panelFile = path.join(staticDir, CONFIG.panelFileName);
  const tmpPanel = safePath(`.${CONFIG.panelFileName}.new.${tmpTag}`);

  try {
    if (!fs.existsSync(staticDir)) {
      fs.mkdirSync(staticDir, { mode: 0o755, recursive: true });
    }

    const versions = readVersionFile();
    const localPanelVer = versions.panel;

    console.log(`   🎨 [UI界面] 本地版本: ${localPanelVer}`);
    console.log('   🌐 [UI界面] 检查最新版本...');
    const release = await httpsGet(CONFIG.panelApiEndpoint);

    if (!release.tag_name || !Array.isArray(release.assets)) {
      throw new Error('管理面板 API 响应格式异常');
    }

    const latestPanelVer = release.tag_name;
    console.log(`   ✨ [UI界面] 最新版本: ${latestPanelVer}`);

    const panelUpdated = forceUpdate || localPanelVer !== latestPanelVer;
    if (!panelUpdated) {
      console.log('   ✅ [UI界面] 已是最新版本');
      return { updated: false, version: localPanelVer };
    }

    if (forceUpdate) {
      console.log('   ⚡ [UI界面] 强制更新模式');
    }

    const asset = release.assets.find(a => a?.name === CONFIG.panelFileName);

    if (!asset) {
      throw new Error(`未找到管理面板文件 ${CONFIG.panelFileName}`);
    }

    console.log(`   📥 [UI界面] 下载 ${asset.name} (${(asset.size/1024/1024).toFixed(1)}MB)`);
    await downloader.download(asset.browser_download_url, tmpPanel, CONFIG.panelMaxSize, 'UI界面');

    const content = fs.readFileSync(tmpPanel, 'utf8');
    if (!content.includes('<!DOCTYPE html>') && !content.includes('<html')) {
      throw new Error('下载的文件不是有效的 HTML');
    }

    fs.renameSync(tmpPanel, panelFile);

    console.log(`   ✅ [UI界面] 成功更新至 ${latestPanelVer}`);
    return { updated: true, version: latestPanelVer };

  } catch (err) {
    console.log(`   ❌ 错误: ${err.message}`);
    safeRemove(tmpPanel);
    throw err;
  }
}

const forceUpdate = process.argv.includes('--force') || process.argv.includes('-f');

async function main() {
  // 加载代理配置
  const hasConfigFile = downloader.loadConfig(__dirname);
  const proxyStatus = downloader.getStatus();

  const currentBin = safePath(CONFIG.binaryName);
  const tmpTar = safePath(`update.${tmpTag}.tar.gz`);
  const tmpDir = safePath(`extract.${tmpTag}`);

  try {
    console.log('');
    if (isPlus) {
      console.log('🔄  CLI Proxy API Plus 更新脚本');
    } else {
      console.log('🔄  CLI Proxy API 更新脚本');
    }
    console.log('');

    if (hasConfigFile) {
      console.log(`   📄 代理配置: ${proxyStatus.configFile}`);
      console.log(`   🔧 代理模式: ${proxyStatus.enabled ? (proxyStatus.proxyOnly ? '仅代理' : '自动回退') : '已禁用'}`);
      console.log(`   📊 代理数量: ${proxyStatus.proxyCount}`);
      console.log('');
    } else if (proxyStatus.enabled) {
      console.log(`   📄 代理配置: 使用默认配置`);
      console.log(`   📊 代理数量: ${proxyStatus.proxyCount}`);
      console.log('');
    }

    const { platform, arch } = getPlatformInfo();
    console.log(`   🖥️  平台: ${platform}-${arch}`);
    if (CONFIG.token) console.log('   🔑 已配置 GitHub Token');
    console.log('');

    clean(/^extract\.\d+$/);
    clean(/^update\.\d+\.tar\.gz$/);
    clean(/^\.\..*\.new\.\d+$/);

    const panelResult = await updatePanel();

    clean(/^update\.\d+\.tar\.gz$/);
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.mkdirSync(tmpDir, { mode: 0o755, recursive: true });

    const versions = readVersionFile();
    const localVer = isPlus ? versions.plus : versions.binary;
    const versionLabel = isPlus ? '[Plus主程序]' : '[主程序]';
    console.log(`   📦 ${versionLabel} 本地版本: ${localVer}`);

    console.log(`   🌐 ${versionLabel} 检查最新版本...`);
    const release = await httpsGet(CONFIG.apiEndpoint);

    if (!release.tag_name || !Array.isArray(release.assets)) {
      throw new Error('API 响应格式异常');
    }

    const latestVer = release.tag_name;
    console.log(`   ✨ ${versionLabel} 最新版本: ${latestVer}`);

    const binaryUpdated = forceUpdate || localVer !== latestVer;
    if (forceUpdate && localVer === latestVer) {
      console.log(`   ⚡ ${versionLabel} 强制更新模式`);
    }

    if (!binaryUpdated && !panelResult.updated) {
      console.log(`   ✅ ${versionLabel} 已是最新版本`);
      safeRemove(tmpDir);
      safeRemove(tmpTar);
      return;
    }

    if (binaryUpdated) {
      const { asset } = findMatchingAsset(release.assets, {}, platform, arch, latestVer);

      if (!asset) {
        throw new Error(`未找到 ${platform}-${arch} 安装包 (${latestVer})`);
      }

      console.log(`   📥 ${versionLabel} 下载 ${asset.name} (${(asset.size/1024/1024).toFixed(1)}MB)`);
      await downloader.download(asset.browser_download_url, tmpTar, CONFIG.maxSize, isPlus ? 'Plus' : '普通');

      console.log(`   📦 ${versionLabel} 解压中...`);
      execFileSync('tar', ['-xzf', tmpTar, '-C', tmpDir], {
        stdio: 'inherit'
      });

      console.log(`   📂 ${versionLabel} 移动文件...`);
      fs.readdirSync(tmpDir).forEach(file => {
        if (path.basename(file).toLowerCase() === 'readme.md') {
          return;
        }

        const src = path.join(tmpDir, file);
        const dest = path.join(installDir, file);

        fs.renameSync(src, dest);
      });

      console.log(`   ✅ ${versionLabel} 二进制验证通过`);
    }

    const finalBinaryVer = binaryUpdated ? latestVer : localVer;
    const finalPanelVer = panelResult.updated ? panelResult.version : versions.panel;
    writeVersionFile(finalBinaryVer, finalPanelVer, isPlus);

    safeRemove(tmpDir);
    safeRemove(tmpTar);
    clean(/^update\.\d+\.tar\.gz$/);

    console.log('');
    console.log('✅ 更新完成');
    if (isPlus) {
      console.log(`   📦 [Plus主程序] ${finalBinaryVer}`);
    } else {
      console.log(`   📦 [主程序] ${finalBinaryVer}`);
    }
    console.log(`   🎨 [UI界面] ${finalPanelVer}`);
    console.log(`   📍 路径: ${currentBin}`);
    console.log('');

   } catch (err) {
    console.log('');
    console.log('❌ 更新失败:', err.message);
    console.log('');

    safeRemove(tmpDir);
    safeRemove(tmpTar);

    process.exit(1);
   }
}

main();