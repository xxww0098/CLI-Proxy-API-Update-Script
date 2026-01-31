#!/usr/bin/env node
/**
 * GitHub 代理下载器
 * 支持多代理自动回退的下载工具
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * 常量定义
 */
const PROGRESS_UPDATE_INTERVAL = 10; // 进度更新间隔 (百分比)
const MAX_REDIRECTS = 10; // 最大重定向次数

/**
 * 工具函数: 安全删除文件
 * @param {string} filePath - 文件路径
 */
function safeUnlink(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    // 静默失败,避免干扰主流程
  }
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG = {
  enabled: true,
  proxyOnly: false,
  timeout: 25000,
  proxies: [
    { url: 'https://gh.zwnes.xyz/', latency: -1, success: false },
    { url: 'https://gitproxy.click/', latency: -1, success: false },
    { url: 'https://github.tmby.shop/', latency: -1, success: false },
    { url: 'https://ghps.cc/', latency: -1, success: false },
    { url: 'https://gh.xxooo.cf/', latency: -1, success: false },
    { url: 'https://gh.sixyin.com/', latency: -1, success: false },
    { url: 'https://gh-proxy.net/', latency: -1, success: false },
    { url: 'https://gh.bugdey.us.kg/', latency: -1, success: false },
    { url: 'https://ghfile.geekertao.top/', latency: -1, success: false },
    { url: 'https://gh.927223.xyz/', latency: -1, success: false },
    { url: 'https://git.yylx.win/', latency: -1, success: false },
    { url: 'https://gh.fhjhy.top/', latency: -1, success: false },
    { url: 'https://gh.ddlc.top/', latency: -1, success: false },
    { url: 'https://gh-proxy.top/', latency: -1, success: false },
    { url: 'https://cdn.gh-proxy.com/', latency: -1, success: false },
    { url: 'https://g.blfrp.cn/', latency: -1, success: false },
    { url: 'https://gh.5050net.cn/', latency: -1, success: false },
    { url: 'https://github.tbedu.top/', latency: -1, success: false },
    { url: 'https://github.dpik.top/', latency: -1, success: false },
    { url: 'https://gh.llkk.cc/', latency: -1, success: false },
    { url: 'https://ghproxy.cfd/', latency: -1, success: false },
    { url: 'https://gitproxy.127731.xyz/', latency: -1, success: false },
    { url: 'https://github-proxy.memory-echoes.cn/', latency: -1, success: false },
    { url: 'https://gh.monlor.com/', latency: -1, success: false },
    { url: 'https://tvv.tw/', latency: -1, success: false },
    { url: 'https://fastgit.cc/', latency: -1, success: false },
    { url: 'https://free.cn.eu.org/', latency: -1, success: false },
    { url: 'https://ghproxy.net/', latency: -1, success: false },
    { url: 'https://ghpxy.hwinzniej.top/', latency: -1, success: false },
    { url: 'https://ghproxy.cxkpro.top/', latency: -1, success: false },
    { url: 'https://github.ednovas.xyz/', latency: -1, success: false },
    { url: 'https://github.xxlab.tech/', latency: -1, success: false },
    { url: 'https://github-proxy.teach-english.tech/', latency: -1, success: false },
    { url: 'https://jiashu.1win.eu.org/', latency: -1, success: false },
    { url: 'https://ghproxy.imciel.com/', latency: -1, success: false },
    { url: 'https://gh.idayer.com/', latency: -1, success: false },
    { url: 'https://cf.ghproxy.cc/', latency: -1, success: false },
    { url: 'https://gp.zkitefly.eu.org/', latency: -1, success: false },
    { url: 'https://gh-proxy.com/', latency: -1, success: false },
    { url: 'https://ghf.xn--eqrr82bzpe.top/', latency: -1, success: false },
    { url: 'https://j.1win.ggff.net/', latency: -1, success: false },
    { url: 'https://github.chenc.dev/', latency: -1, success: false },
    { url: 'https://cdn.akaere.online/', latency: -1, success: false },
    { url: 'https://github.geekery.cn/', latency: -1, success: false },
    { url: 'https://j.1lin.dpdns.org/', latency: -1, success: false },
    { url: 'https://ghfast.top/', latency: -1, success: false },
    { url: 'https://gh.catmak.name/', latency: -1, success: false },
    { url: 'https://ghproxy.cn/', latency: -1, success: false },
    { url: 'https://gh.dpik.top/', latency: -1, success: false },
    { url: 'https://ghproxy.cc/', latency: -1, success: false },
    { url: 'https://ghm.078465.xyz/', latency: -1, success: false }
  ]
};

/**
 * 代理下载器类
 */
class ProxyDownloader {
  constructor(options = {}) {
    this.config = {
      configFile: options.configFile || 'proxy-config.json',
      enabled: true,
      proxyOnly: false,
      timeout: 25000,
      list: [],
      ...options
    };
    this.token = options.token || process.env.GITHUB_TOKEN || '';
  }

  /**
   * 加载代理配置
   * @param {string} configDir - 配置文件所在目录，默认为当前工作目录
   * @returns {boolean} 是否成功加载配置文件
   */
  loadConfig(configDir = process.cwd()) {
    const configPath = path.join(configDir, this.config.configFile);

    // 应用环境变量覆盖
    const envConfig = {
      enabled: process.env.SKIP_PROXY === 'true' ? false : DEFAULT_CONFIG.enabled,
      proxyOnly: process.env.PROXY_ONLY === 'true' ? true : DEFAULT_CONFIG.proxyOnly,
      timeout: DEFAULT_CONFIG.timeout,
      proxies: DEFAULT_CONFIG.proxies
    };

    // 尝试读取配置文件
    try {
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf8');
        const userConfig = JSON.parse(content);

        // 合并配置
        this.config.enabled = userConfig.enabled !== undefined ? userConfig.enabled : envConfig.enabled;
        this.config.proxyOnly = userConfig.proxyOnly !== undefined ? userConfig.proxyOnly : envConfig.proxyOnly;
        this.config.timeout = userConfig.timeout || envConfig.timeout;
        this.config.list = (userConfig.proxies || envConfig.proxies).map(p => p.url);

        return true;
      }
    } catch (err) {
      console.log(`[代理] 读取配置文件失败: ${err.message}，使用默认配置`);
    }

    // 使用默认配置
    this.config.enabled = envConfig.enabled;
    this.config.proxyOnly = envConfig.proxyOnly;
    this.config.timeout = envConfig.timeout;
    this.config.list = envConfig.proxies.map(p => p.url);

    return false;
  }

  /**
   * 创建默认配置文件
   * @param {string} configDir - 配置文件所在目录
   */
  createDefaultConfig(configDir = process.cwd()) {
    const configPath = path.join(configDir, this.config.configFile);
    if (fs.existsSync(configPath)) return;

    try {
      fs.writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2) + '\n');
      console.log(`   📝 已创建默认代理配置文件: ${this.config.configFile}`);
    } catch (err) {
      console.log(`   ⚠️  创建配置文件失败: ${err.message}`);
    }
  }

  /**
   * 单次下载
   * @param {string} url - 下载URL
   * @param {string} dest - 目标文件路径
   * @param {number} maxSize - 最大文件大小（字节）
   * @param {string} label - 下载标签（用于显示）
   * @param {number} redirectCount - 当前重定向次数
   * @returns {Promise<void>}
   */
  downloadSingle(url, dest, maxSize, label = '', redirectCount = 0) {
    if (redirectCount > MAX_REDIRECTS) {
      return Promise.reject(new Error(`重定向次数超过限制(${MAX_REDIRECTS}次)`));
    }

    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(dest);
      let downloaded = 0;
      let lastPercent = 0;
      let hasError = false;

      const headers = {
        'User-Agent': 'ProxyDownloader/1.0',
        'Accept': '*/*'
      };
      if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

      const req = https.get(url, { headers, timeout: this.config.timeout }, (res) => {
        // 处理重定向
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          file.close();
          safeUnlink(dest);
          res.destroy();
          this.downloadSingle(res.headers.location, dest, maxSize, label, redirectCount + 1)
            .then(resolve)
            .catch(reject);
          return;
        }

        if (res.statusCode !== 200) {
          file.close();
          safeUnlink(dest);
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }

        const total = parseInt(res.headers['content-length']) || 0;

        res.on('data', (chunk) => {
          downloaded += chunk.length;
          if (downloaded > maxSize) {
            hasError = true;
            file.destroy();
            safeUnlink(dest);
            reject(new Error('文件过大'));
          }
          if (total > 0 && !hasError) {
            const percent = Math.floor((downloaded / total) * 100);
            if (percent !== lastPercent && percent % PROGRESS_UPDATE_INTERVAL === 0) {
              const labelText = label ? ` ${label}` : '';
              process.stdout.write(`\r   📥 [下载${labelText}] ${percent}%`);
              lastPercent = percent;
            }
          }
        });

        res.pipe(file);
        file.on('finish', () => {
          if (!hasError) {
            process.stdout.write('\n');
            file.close();
            resolve();
          }
        });
      });

      req.on('error', (err) => {
        hasError = true;
        safeUnlink(dest);
        reject(err);
      });

      req.on('timeout', () => {
        hasError = true;
        req.destroy();
        safeUnlink(dest);
        reject(new Error('请求超时'));
      });
    });
  }

  /**
   * 带自动回退的下载
   * @param {string} originalUrl - 原始URL
   * @param {string} dest - 目标文件路径
   * @param {number} maxSize - 最大文件大小（字节）
   * @param {string} label - 下载标签（用于显示）
   * @returns {Promise<void>}
   */
  async download(originalUrl, dest, maxSize, label = '') {
    const urls = [];

    // 构建 URL 列表
    if (!this.config.proxyOnly) {
      urls.push({ url: originalUrl, name: '原始' });
    }

    if (this.config.enabled && this.config.list.length > 0) {
      for (const proxy of this.config.list) {
        const normalizedProxy = proxy.endsWith('/') ? proxy : proxy + '/';
        urls.push({
          url: normalizedProxy + originalUrl,
          name: `代理${urls.length}(${normalizedProxy.replace(/^https?:\/\//, '').split('/')[0]})`
        });
      }
    }

    if (urls.length === 0) {
      throw new Error('没有可用的下载源');
    }

    // 顺序尝试
    for (let i = 0; i < urls.length; i++) {
      const { url, name } = urls[i];
      try {
        if (i > 0) {
          console.log(`   🔄 [${label}] 尝试使用${name}...`);
        }
        await this.downloadSingle(url, dest, maxSize, label);
        if (i > 0) {
          console.log(`   ✅ [${label}] 通过${name}下载成功`);
        }
        return;
      } catch (err) {
        const isTimeout = err.message.includes('超时') || err.code === 'ETIMEDOUT' || err.code === 'ECONNRESET';
        if (isTimeout) {
          console.log(`   ⏱️  [${label}] ${name}连接超时`);
        } else {
          console.log(`   ❌ [${label}] ${name}失败: ${err.message.substring(0, 60)}`);
        }

        safeUnlink(dest);

        if (i === urls.length - 1) {
          throw new Error(`所有下载源均失败(共尝试${urls.length}个源)`);
        }
      }
    }
  }

  /**
   * 获取当前配置状态
   * @returns {Object} 配置信息
   */
  getStatus() {
    return {
      enabled: this.config.enabled,
      proxyOnly: this.config.proxyOnly,
      timeout: this.config.timeout,
      proxyCount: this.config.list.length,
      configFile: this.config.configFile
    };
  }

  /**
   * 测试单个代理的延迟
   * @param {string} proxy - 代理URL
   * @param {string} testUrl - 测试用的目标URL
   * @returns {Promise<{proxy: string, latency: number, success: boolean}>}
   */
  async testProxyLatency(proxy, testUrl) {
    const normalizedProxy = proxy.endsWith('/') ? proxy : proxy + '/';
    const testTargetUrl = normalizedProxy + testUrl;
    const startTime = Date.now();

    return new Promise((resolve) => {
      const headers = {
        'User-Agent': 'ProxyDownloader/1.0',
        'Accept': '*/*'
      };
      if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

      const req = https.get(testTargetUrl, { headers, timeout: this.config.timeout }, (res) => {
        res.destroy();
        const latency = Date.now() - startTime;
        // 只要返回 2xx 或 3xx 状态码都视为成功（代理正常工作）
        const success = res.statusCode >= 200 && res.statusCode < 400;
        resolve({ proxy, latency, success });
      });

      req.on('error', () => resolve({ proxy, latency: Infinity, success: false }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ proxy, latency: Infinity, success: false });
      });
    });
  }

  /**
   * 测试所有代理延迟并排序
   * @param {string} testUrl - 测试用的目标URL
   * @returns {Promise<Array<{proxy: string, latency: number, success: boolean}>>}
   */
  async testAndSortProxies(testUrl = 'https://github.com/octocat/Hello-World/raw/master/README') {
    if (!this.config.enabled || this.config.list.length === 0) {
      console.log('[代理测试] 代理功能未启用或代理列表为空');
      return [];
    }

    console.log(`[代理测试] 开始测试 ${this.config.list.length} 个代理...`);

    // 并发测试所有代理
    const results = await Promise.all(
      this.config.list.map(proxy => this.testProxyLatency(proxy, testUrl))
    );

    // 分离成功和失败的代理
    const successResults = results.filter(r => r.success);
    const failedResults = results.filter(r => !r.success);

    // 按延迟排序（成功的在前，按延迟从小到大）
    successResults.sort((a, b) => a.latency - b.latency);

    // 合并结果：成功的在前（按延迟排序），失败的在后
    const sortedResults = [...successResults, ...failedResults];

    // 提取排序后的代理列表
    const sortedProxies = sortedResults.map(r => r.proxy);

    // 更新配置
    this.config.list = sortedProxies;

    // 写回配置文件
    try {
      const configDir = process.cwd();
      const configPath = path.join(configDir, this.config.configFile);
      const configToSave = {
        enabled: this.config.enabled,
        proxyOnly: this.config.proxyOnly,
        timeout: this.config.timeout,
        lastTested: new Date().toISOString(),
        proxies: sortedResults.map(r => ({
          url: r.proxy,
          latency: r.latency === Infinity ? -1 : r.latency,
          success: r.success
        }))
      };
      fs.writeFileSync(configPath, JSON.stringify(configToSave, null, 2) + '\n');
      console.log(`[代理测试] 已更新配置文件: ${this.config.configFile}`);
    } catch (err) {
      console.log(`[代理测试] 写入配置文件失败: ${err.message}`);
    }

    // 打印测试结果
    console.log('\n[代理测试] 测试结果:');
    console.log(`  ✅ 成功: ${successResults.length} 个`);
    successResults.forEach((r, i) => {
      console.log(`     ${i + 1}. ${r.proxy} - ${r.latency}ms`);
    });
    if (failedResults.length > 0) {
      console.log(`  ❌ 失败: ${failedResults.length} 个`);
      failedResults.forEach(r => {
        console.log(`     - ${r.proxy}`);
      });
    }

    return sortedResults;
  }
}

/**
 * 创建下载器实例的便捷函数
 * @param {Object} options - 配置选项
 * @returns {ProxyDownloader} 下载器实例
 */
function createDownloader(options = {}) {
  const downloader = new ProxyDownloader(options);
  downloader.loadConfig(options.configDir);
  return downloader;
}

/**
 * 直接下载的便捷函数（无需实例化）
 * @param {string} url - 下载URL
 * @param {string} dest - 目标文件路径
 * @param {Object} options - 配置选项
 * @returns {Promise<void>}
 */
async function download(url, dest, options = {}) {
  const downloader = createDownloader(options);
  return downloader.download(url, dest, options.maxSize || 100 * 1024 * 1024, options.label || '');
}

module.exports = {
  ProxyDownloader,
  createDownloader,
  download,
  DEFAULT_CONFIG
};
