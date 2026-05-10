function main(config) {
  const GROUPS = {
    hk: "🇭🇰香港节点",
    tw: "🇹🇼台湾节点",
    jp: "🇯🇵日本节点",
    kr: "🇰🇷韩国节点",
    us: "🇺🇸美国节点",
    sg: "🇸🇬狮城节点",
    ai: "🤖 AI 服务",
    mail: "📧 邮件服务",
    im: "💬 即时通讯",
    social: "📱 社交媒体",
    cn: "🏠 国内网站",
    global: "🌐 国外网站",
    fallback: "🐟 漏网之鱼"
  };

  const PROVIDERS = {
    OpenAI: {
      type: "http",
      behavior: "classical",
      format: "yaml",
      path: "./ruleset/OpenAI.yaml",
      url: "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/OpenAI/OpenAI.yaml",
      interval: 86400
    },
    Telegram: {
      type: "http",
      behavior: "classical",
      format: "yaml",
      path: "./ruleset/Telegram.yaml",
      url: "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Telegram/Telegram.yaml",
      interval: 86400
    },
    WeChat: {
      type: "http",
      behavior: "classical",
      format: "yaml",
      path: "./ruleset/WeChat.yaml",
      url: "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/WeChat/WeChat.yaml",
      interval: 86400
    },
    Facebook: {
      type: "http",
      behavior: "classical",
      format: "yaml",
      path: "./ruleset/Facebook.yaml",
      url: "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Facebook/Facebook.yaml",
      interval: 86400
    },
    Instagram: {
      type: "http",
      behavior: "classical",
      format: "yaml",
      path: "./ruleset/Instagram.yaml",
      url: "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Instagram/Instagram.yaml",
      interval: 86400
    },
    TikTok: {
      type: "http",
      behavior: "classical",
      format: "yaml",
      path: "./ruleset/TikTok.yaml",
      url: "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/TikTok/TikTok.yaml",
      interval: 86400
    },
    ChinaMax: {
      type: "http",
      behavior: "classical",
      format: "yaml",
      path: "./ruleset/ChinaMax.yaml",
      url: "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/ChinaMax/ChinaMax.yaml",
      interval: 86400
    },
    Global: {
      type: "http",
      behavior: "classical",
      format: "yaml",
      path: "./ruleset/Global.yaml",
      url: "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Global/Global.yaml",
      interval: 86400
    }
  };

  const INFO_PATTERNS = [
    "官网",
    "官网地址",
    "导航",
    "订阅",
    "流量",
    "剩余",
    "到期",
    "重置",
    "套餐",
    "有效期",
    "通知",
    "公告",
    "使用说明"
  ];

  const BLOCKED_TAG_PATTERNS = [
    /(^|[^0-9])(10x|20x|100x)([^0-9]|$)/i,
    /(?:剩余|到期|重置|官网|订阅)/i,
    /(?:测试|测速).*?(?:专用|占位)/i
  ];

  const REGION_DB = [
    {
      id: "hk",
      keywords: ["香港", "hong kong", "hongkong", "hk", "hkg"],
      chinese: ["香港"]
    },
    {
      id: "tw",
      keywords: ["taiwan", "taipei", "taichung", "kaohsiung", "tw", "tpe"],
      chinese: ["台湾", "台灣", "台北", "臺北", "台中", "高雄"]
    },
    {
      id: "jp",
      keywords: ["japan", "tokyo", "osaka", "jp", "nrt", "hnd", "kix"],
      chinese: ["日本", "东京", "東京", "大阪"]
    },
    {
      id: "kr",
      keywords: ["korea", "seoul", "busan", "kr", "icn", "gmp"],
      chinese: ["韩国", "韓國", "首尔", "首爾", "釜山", "仁川"]
    },
    {
      id: "us",
      keywords: [
        "united states",
        "america",
        "usa",
        "us",
        "los angeles",
        "phoenix",
        "buffalo",
        "silicon valley",
        "seattle",
        "san jose",
        "lax",
        "sjc",
        "sfo",
        "sea",
        "jfk",
        "ewr"
      ],
      chinese: ["美国", "美國", "洛杉矶", "洛杉機", "洛杉磯", "凤凰城", "鳳凰城", "水牛城", "硅谷", "矽谷", "西雅图", "西雅圖", "圣何塞", "聖何塞"]
    },
    {
      id: "sg",
      keywords: ["singapore", "sg", "sin"],
      chinese: ["新加坡", "狮城", "獅城"]
    }
  ];

  const MANAGED_PROVIDER_NAMES = Object.keys(PROVIDERS);

  function ensureArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function uniq(list) {
    return [...new Set(list.filter(Boolean))];
  }

  function isInfoNode(name) {
    const text = String(name || "");
    return INFO_PATTERNS.some((pattern) => text.includes(pattern));
  }

  function isBlockedTagNode(name) {
    const text = String(name || "");
    return BLOCKED_TAG_PATTERNS.some((pattern) => pattern.test(text));
  }

  function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function buildWordMatcher(keyword) {
    return new RegExp("(^|[^a-zA-Z])" + escapeRegex(keyword) + "([^a-zA-Z]|$)", "i");
  }

  const COMPILED_REGION_DB = REGION_DB.map((region) => {
    return {
      id: region.id,
      chinese: region.chinese || [],
      matchers: (region.keywords || []).map((keyword) => buildWordMatcher(keyword))
    };
  });

  function classifyRegion(name) {
    const text = String(name || "");
    if (!text) return null;
    for (const region of COMPILED_REGION_DB) {
      if (region.chinese.some((keyword) => text.includes(keyword))) return region.id;
      if (region.matchers.some((matcher) => matcher.test(text))) return region.id;
    }
    return null;
  }

  function cleanupSubscription(configObject) {
    configObject["proxy-groups"] = [];
    configObject.rules = [];
    configObject["rule-providers"] = {};
  }

  function normalizeProxyList(proxies) {
    return ensureArray(proxies).filter((proxy) => {
      if (!proxy || typeof proxy !== "object" || !proxy.name) return false;
      if (isInfoNode(proxy.name)) return false;
      if (isBlockedTagNode(proxy.name)) return false;
      return true;
    });
  }

  function buildRegionPools(proxyList) {
    const pools = { hk: [], tw: [], jp: [], kr: [], us: [], sg: [] };
    for (const proxy of proxyList) {
      const region = classifyRegion(proxy.name);
      if (region && pools[region]) pools[region].push(proxy.name);
    }

    const finalPools = {};
    for (const key of Object.keys(pools)) {
      const allMatches = pools[key];
      const preferred = allMatches.filter((name) => !name.includes("免费"));
      finalPools[key] = preferred.length > 0 ? preferred : allMatches;
    }
    return finalPools;
  }

  function applyGeneralOverrides(configObject) {
    configObject["unified-delay"] = true;
    configObject["tcp-concurrent"] = true;
    configObject["find-process-mode"] = "strict";
    configObject["geodata-mode"] = true;

    configObject.profile = configObject.profile || {};
    configObject.profile["smart-collector-size"] = 100;
    configObject.profile["store-selected"] = true;
    configObject.profile["store-fake-ip"] = true;
    configObject.profile.tracing = true;
  }

  function injectTunExcludes(configObject) {
    if (!configObject.tun || typeof configObject.tun !== "object") return;
    const excludes = ensureArray(configObject.tun["exclude-process"]);
    const extra = ["GCUService.exe", "GCUBridge.exe", "WorkPro.exe", "GSCService.exe"];
    configObject.tun["exclude-process"] = uniq(excludes.concat(extra));
  }

  function simpleHash(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i += 1) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  function injectFingerprints(configObject) {
    const candidates = ["chrome", "firefox", "edge", "ios"];
    ensureArray(configObject.proxies).forEach((proxy) => {
      if (!proxy || typeof proxy !== "object") return;
      if (!["vless", "vmess", "trojan"].includes(proxy.type)) return;
      if (proxy["client-fingerprint"]) return;

      const hasReality = !!(proxy["reality-opts"] || proxy.reality_opts);
      const flow = String(proxy.flow || "").toLowerCase();
      const hasXtls = /xtls-rprx/.test(flow);
      if (!proxy.tls && !hasReality && !hasXtls) return;

      const name = String(proxy.name || "");
      let fingerprint = null;
      if (/openai|claude|gemini|api|github|gitlab|docker|npm|pypi/i.test(name)) fingerprint = "edge";
      else if (/telegram|discord|whatsapp|signal|line|wechat/i.test(name)) fingerprint = "ios";
      else if (/facebook|instagram|twitter|x\.com|tiktok|reddit/i.test(name)) fingerprint = "firefox";
      else fingerprint = candidates[simpleHash(name) % candidates.length];

      proxy["client-fingerprint"] = fingerprint;
    });
  }

  function buildProxyGroups(regionPools, fallbackPool) {
    return [
      {
        name: GROUPS.ai,
        type: "select",
        proxies: [GROUPS.us, GROUPS.jp, GROUPS.sg, GROUPS.hk, GROUPS.tw, GROUPS.kr, GROUPS.fallback]
      },
      {
        name: GROUPS.mail,
        type: "select",
        proxies: [GROUPS.us, GROUPS.sg, GROUPS.jp, GROUPS.hk, GROUPS.tw, GROUPS.kr, GROUPS.fallback]
      },
      {
        name: GROUPS.im,
        type: "select",
        proxies: [GROUPS.hk, GROUPS.sg, GROUPS.tw, GROUPS.jp, GROUPS.kr, GROUPS.us, GROUPS.fallback]
      },
      {
        name: GROUPS.social,
        type: "select",
        proxies: [GROUPS.us, GROUPS.jp, GROUPS.sg, GROUPS.hk, GROUPS.tw, GROUPS.kr, GROUPS.fallback]
      },
      {
        name: GROUPS.cn,
        type: "select",
        proxies: ["DIRECT", GROUPS.hk, GROUPS.tw, GROUPS.jp, GROUPS.kr, GROUPS.us, GROUPS.sg, GROUPS.fallback]
      },
      {
        name: GROUPS.global,
        type: "select",
        proxies: [GROUPS.sg, GROUPS.jp, GROUPS.hk, GROUPS.tw, GROUPS.us, GROUPS.kr, GROUPS.fallback]
      },
      {
        name: GROUPS.hk,
        type: "smart",
        proxies: regionPools.hk,
        uselightgbm: false,
        collectdata: false,
        strategy: "sticky-sessions",
        "policy-priority": "香港:1.60;HK:1.60;免费:0.75"
      },
      {
        name: GROUPS.tw,
        type: "smart",
        proxies: regionPools.tw,
        uselightgbm: false,
        collectdata: false,
        strategy: "sticky-sessions",
        "policy-priority": "台湾:1.60;台灣:1.60;TW:1.60;免费:0.75"
      },
      {
        name: GROUPS.jp,
        type: "smart",
        proxies: regionPools.jp,
        uselightgbm: false,
        collectdata: false,
        strategy: "sticky-sessions",
        "policy-priority": "日本:1.60;JP:1.60;东京:1.65;東京:1.65;免费:0.75"
      },
      {
        name: GROUPS.kr,
        type: "smart",
        proxies: regionPools.kr,
        uselightgbm: false,
        collectdata: false,
        strategy: "sticky-sessions",
        "policy-priority": "韩国:1.60;韓國:1.60;KR:1.60;首尔:1.65;首爾:1.65;免费:0.75"
      },
      {
        name: GROUPS.us,
        type: "smart",
        proxies: regionPools.us,
        uselightgbm: false,
        collectdata: false,
        strategy: "sticky-sessions",
        "policy-priority": "美国:1.60;美國:1.60;US:1.60;洛杉矶:1.70;洛杉機:1.70;洛杉磯:1.70;凤凰城:1.65;鳳凰城:1.65;水牛城:1.60;免费:0.75"
      },
      {
        name: GROUPS.sg,
        type: "smart",
        proxies: regionPools.sg,
        uselightgbm: false,
        collectdata: false,
        strategy: "sticky-sessions",
        "policy-priority": "新加坡:1.60;狮城:1.60;SG:1.60;免费:0.75"
      },
      {
        name: GROUPS.fallback,
        type: "smart",
        proxies: fallbackPool,
        uselightgbm: false,
        collectdata: false,
        strategy: "sticky-sessions",
        "policy-priority": "新加坡:1.35;SG:1.35;日本:1.30;JP:1.30;香港:1.25;HK:1.25;台湾:1.20;TW:1.20;美国:1.15;US:1.15;韩国:1.05;KR:1.05;免费:0.75"
      }
    ];
  }

  function buildManagedRules() {
    return [
      "DOMAIN-SUFFIX,openai.com,🤖 AI 服务",
      "DOMAIN-SUFFIX,chatgpt.com,🤖 AI 服务",
      "DOMAIN-SUFFIX,api.openai.com,🤖 AI 服务",
      "DOMAIN-SUFFIX,cdn.openai.com,🤖 AI 服务",
      "DOMAIN-SUFFIX,oaistatic.com,🤖 AI 服务",
      "DOMAIN-SUFFIX,oaiusercontent.com,🤖 AI 服务",
      "DOMAIN-SUFFIX,ai.com,🤖 AI 服务",
      "DOMAIN-SUFFIX,anthropic.com,🤖 AI 服务",
      "DOMAIN-SUFFIX,claude.ai,🤖 AI 服务",
      "DOMAIN-SUFFIX,claudeusercontent.com,🤖 AI 服务",
      "DOMAIN-SUFFIX,perplexity.ai,🤖 AI 服务",
      "DOMAIN-SUFFIX,poe.com,🤖 AI 服务",
      "DOMAIN-SUFFIX,gemini.google.com,🤖 AI 服务",
      "DOMAIN-SUFFIX,aistudio.google.com,🤖 AI 服务",
      "DOMAIN-SUFFIX,makersuite.google.com,🤖 AI 服务",
      "DOMAIN-SUFFIX,generativelanguage.googleapis.com,🤖 AI 服务",
      "RULE-SET,OpenAI,🤖 AI 服务",

      "DOMAIN-SUFFIX,gmail.com,📧 邮件服务",
      "DOMAIN-SUFFIX,mail.google.com,📧 邮件服务",
      "DOMAIN-SUFFIX,outlook.com,📧 邮件服务",
      "DOMAIN-SUFFIX,hotmail.com,📧 邮件服务",
      "DOMAIN-SUFFIX,live.com,📧 邮件服务",
      "DOMAIN-SUFFIX,office.com,📧 邮件服务",
      "DOMAIN-SUFFIX,office365.com,📧 邮件服务",
      "DOMAIN-SUFFIX,microsoft365.com,📧 邮件服务",
      "DOMAIN-SUFFIX,proton.me,📧 邮件服务",
      "DOMAIN-SUFFIX,protonmail.com,📧 邮件服务",
      "DOMAIN-SUFFIX,icloud.com,📧 邮件服务",
      "DOMAIN-SUFFIX,me.com,📧 邮件服务",
      "DOMAIN-SUFFIX,yahoo.com,📧 邮件服务",

      "DOMAIN-SUFFIX,telegram.org,💬 即时通讯",
      "DOMAIN-SUFFIX,t.me,💬 即时通讯",
      "DOMAIN-SUFFIX,tdesktop.com,💬 即时通讯",
      "DOMAIN-SUFFIX,discord.com,💬 即时通讯",
      "DOMAIN-SUFFIX,discord.gg,💬 即时通讯",
      "DOMAIN-SUFFIX,discordapp.com,💬 即时通讯",
      "DOMAIN-SUFFIX,whatsapp.com,💬 即时通讯",
      "DOMAIN-SUFFIX,whatsapp.net,💬 即时通讯",
      "DOMAIN-SUFFIX,signal.org,💬 即时通讯",
      "DOMAIN-SUFFIX,line.me,💬 即时通讯",
      "DOMAIN-SUFFIX,line-apps.com,💬 即时通讯",
      "RULE-SET,Telegram,💬 即时通讯",
      "RULE-SET,WeChat,🏠 国内网站",

      "DOMAIN-SUFFIX,x.com,📱 社交媒体",
      "DOMAIN-SUFFIX,twitter.com,📱 社交媒体",
      "DOMAIN-SUFFIX,twimg.com,📱 社交媒体",
      "DOMAIN-SUFFIX,reddit.com,📱 社交媒体",
      "DOMAIN-SUFFIX,redd.it,📱 社交媒体",
      "DOMAIN-SUFFIX,threads.net,📱 社交媒体",
      "DOMAIN-SUFFIX,snapchat.com,📱 社交媒体",
      "DOMAIN-SUFFIX,pinterest.com,📱 社交媒体",
      "RULE-SET,Facebook,📱 社交媒体",
      "RULE-SET,Instagram,📱 社交媒体",
      "RULE-SET,TikTok,📱 社交媒体",

      "RULE-SET,ChinaMax,🏠 国内网站",
      "GEOIP,CN,🏠 国内网站,no-resolve",
      "RULE-SET,Global,🌐 国外网站",

      "DOMAIN,injections.adguard.org,DIRECT",
      "DOMAIN,local.adguard.org,DIRECT",
      "DOMAIN-SUFFIX,local,DIRECT",
      "IP-CIDR,127.0.0.0/8,DIRECT",
      "IP-CIDR,172.16.0.0/12,DIRECT",
      "IP-CIDR,192.168.0.0/16,DIRECT",
      "IP-CIDR,10.0.0.0/8,DIRECT",
      "IP-CIDR,17.0.0.0/8,DIRECT",
      "IP-CIDR,100.64.0.0/10,DIRECT",
      "IP-CIDR,224.0.0.0/4,DIRECT",
      "IP-CIDR6,fe80::/10,DIRECT",

      "GEOIP,CN,DIRECT,no-resolve",
      "MATCH,🐟 漏网之鱼"
    ];
  }

  function pruneProviders(configObject) {
    const usedProviders = new Set();
    ensureArray(configObject.rules).forEach((rule) => {
      if (typeof rule !== "string") return;
      const parts = rule.split(",");
      if (parts[0] === "RULE-SET" && parts[1]) usedProviders.add(parts[1]);
    });

    const nextProviders = {};
    for (const providerName of MANAGED_PROVIDER_NAMES) {
      if (usedProviders.has(providerName)) nextProviders[providerName] = PROVIDERS[providerName];
    }
    configObject["rule-providers"] = nextProviders;
  }

  try {
    if (!config || typeof config !== "object") return config;
    if (!Array.isArray(config.proxies) || config.proxies.length === 0) return config;

    cleanupSubscription(config);
    applyGeneralOverrides(config);
    injectTunExcludes(config);
    injectFingerprints(config);

    const normalizedProxies = normalizeProxyList(config.proxies);
    const regionPools = buildRegionPools(normalizedProxies);
    const fallbackPool = uniq([
      ...normalizedProxies.map((proxy) => proxy.name).filter((name) => !name.includes("免费")),
      ...normalizedProxies.map((proxy) => proxy.name)
    ]);

    config["proxy-groups"] = buildProxyGroups(regionPools, fallbackPool);
    config.rules = buildManagedRules();
    pruneProviders(config);

    return config;
  } catch (error) {
    console.error("[clash-party-region-business-override] Error:", error);
    return config;
  }
}
