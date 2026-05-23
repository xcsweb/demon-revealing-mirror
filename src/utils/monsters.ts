export interface Monster {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string;
  features: {
    horns?: boolean;
    wings?: boolean;
    fangs?: boolean;
    fire?: boolean;
    halo?: boolean;
    glowingEyes?: boolean;
  };
}

export const MONSTERS: Monster[] = [
  {
    id: 'qingniu',
    name: '青牛精',
    emoji: '🐮',
    color: '#1e40af',
    description: '太上老君坐骑，法力无边',
    features: { horns: true, glowingEyes: true }
  },
  {
    id: 'baigujing',
    name: '白骨精',
    emoji: '💀',
    color: '#9ca3af',
    description: '白骨夫人，善于变化',
    features: { fangs: true, glowingEyes: true }
  },
  {
    id: 'jinping',
    name: '金毛犼',
    emoji: '🦁',
    color: '#f59e0b',
    description: '观音菩萨坐骑',
    features: { horns: true, fire: true, glowingEyes: true }
  },
  {
    id: 'jiuyuan',
    name: '九灵元圣',
    emoji: '🐯',
    color: '#65a30d',
    description: '九头狮子，太乙救苦天尊坐骑',
    features: { horns: true, fangs: true, glowingEyes: true }
  },
  {
    id: 'dapeng',
    name: '金翅大鹏',
    emoji: '🦅',
    color: '#fbbf24',
    description: '如来佛祖舅舅，一翅九万里',
    features: { wings: true, fangs: true, glowingEyes: true }
  },
  {
    id: 'niumowang',
    name: '牛魔王',
    emoji: '🐂',
    color: '#dc2626',
    description: '平天大圣，孙悟空结拜兄弟',
    features: { horns: true, fangs: true, fire: true }
  },
  {
    id: 'tieshan',
    name: '铁扇公主',
    emoji: '👸',
    color: '#db2777',
    description: '罗刹女，芭蕉扇主人',
    features: { glowingEyes: true, halo: true }
  },
  {
    id: 'honghaier',
    name: '红孩儿',
    emoji: '👶',
    color: '#ef4444',
    description: '牛魔王之子，三昧真火',
    features: { fire: true, glowingEyes: true }
  },
  {
    id: 'sixears',
    name: '六耳猕猴',
    emoji: '🐒',
    color: '#8b5cf6',
    description: '孙悟空化身，真假难辨',
    features: { fangs: true, glowingEyes: true }
  },
  {
    id: 'huangfeng',
    name: '黄风怪',
    emoji: '🦊',
    color: '#eab308',
    description: '黄风岭主，三昧神风',
    features: { fangs: true, glowingEyes: true }
  },
  {
    id: 'heifeng',
    name: '黑熊精',
    emoji: '🐻',
    color: '#374151',
    description: '黑风山主，后归观音',
    features: { horns: true, fangs: true }
  },
  {
    id: 'zhujie',
    name: '蜘蛛精',
    emoji: '🕷️',
    color: '#a855f7',
    description: '盘丝洞七仙女',
    features: { glowingEyes: true }
  },
  {
    id: 'bailong',
    name: '白龙马',
    emoji: '🐉',
    color: '#06b6d4',
    description: '西海龙王三太子',
    features: { horns: true, wings: true, fire: true }
  },
  {
    id: 'shijue',
    name: '蝎子精',
    emoji: '🦂',
    color: '#be185d',
    description: '琵琶洞主，倒马毒桩',
    features: { fangs: true, glowingEyes: true }
  },
  {
    id: 'jinping2',
    name: '金鱼精',
    emoji: '🐟',
    color: '#0ea5e9',
    description: '观音菩萨池中金鱼',
    features: { glowingEyes: true }
  },
  {
    id: 'huangmeilang',
    name: '黄眉老怪',
    emoji: '👹',
    color: '#78350f',
    description: '弥勒佛童子，人种袋',
    features: { horns: true, fangs: true, glowingEyes: true }
  },
  {
    id: 'chiyue',
    name: '赤尻马猴',
    emoji: '🐵',
    color: '#991b1b',
    description: '花果山四健将之一',
    features: { fangs: true, glowingEyes: true }
  },
  {
    id: 'tongbeiyuanhou',
    name: '通臂猿猴',
    emoji: '🦧',
    color: '#44403c',
    description: '花果山四健将之一',
    features: { fangs: true, glowingEyes: true }
  },
  {
    id: 'jiutouzhi',
    name: '九头雉鸡精',
    emoji: '🐔',
    color: '#f97316',
    description: '轩辕坟三妖之一',
    features: { wings: true, fangs: true }
  },
  {
    id: 'shijiumo',
    name: '玉石琵琶精',
    emoji: '🎸',
    color: '#64748b',
    description: '轩辕坟三妖之一',
    features: { glowingEyes: true }
  },
  {
    id: 'daji',
    name: '九尾狐狸精',
    emoji: '🦊',
    color: '#eab308',
    description: '轩辕坟三妖之首',
    features: { glowingEyes: true, halo: true }
  },
  {
    id: 'qiongqi',
    name: '穷奇',
    emoji: '🐺',
    color: '#1f2937',
    description: '四凶之一，好恶行善',
    features: { wings: true, fangs: true, horns: true }
  },
  {
    id: 'taowu',
    name: '梼杌',
    emoji: '🐗',
    color: '#78716c',
    description: '四凶之一，难训难化',
    features: { horns: true, fangs: true }
  },
  {
    id: 'hundun',
    name: '混沌',
    emoji: '🌪️',
    color: '#a8a29e',
    description: '四凶之一，有眼不见',
    features: { halo: true }
  },
  {
    id: 'taotie',
    name: '饕餮',
    emoji: '😈',
    color: '#713f12',
    description: '四凶之一，贪得无厌',
    features: { fangs: true, glowingEyes: true }
  },
  {
    id: 'bixie',
    name: '辟邪',
    emoji: '🦄',
    color: '#a855f7',
    description: '神兽，驱邪避凶',
    features: { horns: true, wings: true, halo: true }
  },
  {
    id: 'tianlu',
    name: '天禄',
    emoji: '🌈',
    color: '#22c55e',
    description: '神兽，福禄双全',
    features: { horns: true, halo: true }
  },
  {
    id: 'baize',
    name: '白泽',
    emoji: '🐑',
    color: '#f0f9ff',
    description: '神兽，知晓万鬼之名',
    features: { horns: true, glowingEyes: true, halo: true }
  },
  {
    id: 'kui',
    name: '夔牛',
    emoji: '🐃',
    color: '#1e3a8a',
    description: '神兽，一足而行',
    features: { horns: true, glowingEyes: true }
  },
  {
    id: 'qilin',
    name: '麒麟',
    emoji: '🦌',
    color: '#fef3c7',
    description: '仁兽，圣人出则现',
    features: { horns: true, halo: true, fire: true }
  },
  {
    id: 'long',
    name: '龙',
    emoji: '🐲',
    color: '#3b82f6',
    description: '鳞虫之长，能兴云雨',
    features: { horns: true, wings: true, fire: true, glowingEyes: true }
  },
  {
    id: 'feng',
    name: '凤凰',
    emoji: '🐦',
    color: '#ef4444',
    description: '百鸟之王，浴火重生',
    features: { wings: true, fire: true, halo: true }
  },
  {
    id: 'wuzhiqi',
    name: '无支祁',
    emoji: '🦍',
    color: '#0f172a',
    description: '淮水神猴，力大无穷',
    features: { fangs: true, glowingEyes: true }
  },
  {
    id: 'xiezhi',
    name: '獬豸',
    emoji: '🐐',
    color: '#18181b',
    description: '神兽，辨忠奸曲直',
    features: { horns: true, glowingEyes: true }
  },
  {
    id: 'shen',
    name: '蜃',
    emoji: '🐚',
    color: '#0ea5e9',
    description: '海兽，吐气成楼',
    features: { halo: true }
  },
  {
    id: 'wan',
    name: '魍魉',
    emoji: '👻',
    color: '#16a34a',
    description: '水怪，木石之怪',
    features: { glowingEyes: true }
  },
  {
    id: 'meishan',
    name: '眉山七圣',
    emoji: '👥',
    color: '#71717a',
    description: '杨戬结义兄弟',
    features: { horns: true, fangs: true }
  },
  {
    id: 'tushan',
    name: '涂山氏',
    emoji: '🦊',
    color: '#ec4899',
    description: '九尾狐，大禹之妻',
    features: { glowingEyes: true, halo: true }
  },
  {
    id: 'xuanwu',
    name: '玄武',
    emoji: '🐢',
    color: '#312e81',
    description: '四象之一，北方之神',
    features: { glowingEyes: true, halo: true }
  },
  {
    id: 'baihu',
    name: '白虎',
    emoji: '🐅',
    color: '#fafaf9',
    description: '四象之一，西方之神',
    features: { wings: true, glowingEyes: true }
  },
  {
    id: 'zhuque',
    name: '朱雀',
    emoji: '🦢',
    color: '#dc2626',
    description: '四象之一，南方之神',
    features: { wings: true, fire: true, halo: true }
  },
  {
    id: 'qinglong',
    name: '青龙',
    emoji: '🐲',
    color: '#15803d',
    description: '四象之一，东方之神',
    features: { horns: true, wings: true, fire: true }
  },
  {
    id: 'gouchen',
    name: '勾陈',
    emoji: '⭐',
    color: '#facc15',
    description: '星宿，天帝之魂',
    features: { halo: true, glowingEyes: true }
  },
  {
    id: 'tengshe',
    name: '螣蛇',
    emoji: '🐍',
    color: '#4c1d95',
    description: '飞蛇，乘雾而游',
    features: { wings: true, glowingEyes: true }
  },
  {
    id: 'goumang',
    name: '句芒',
    emoji: '🌿',
    color: '#16a34a',
    description: '木神，春神',
    features: { wings: true, halo: true }
  },
  {
    id: 'zhurong',
    name: '祝融',
    emoji: '🔥',
    color: '#dc2626',
    description: '火神，南方之神',
    features: { fire: true, glowingEyes: true, halo: true }
  },
  {
    id: 'ruoshou',
    name: '蓐收',
    emoji: '⚔️',
    color: '#fafaf9',
    description: '金神，秋神',
    features: { wings: true, glowingEyes: true }
  },
  {
    id: 'xuanming',
    name: '玄冥',
    emoji: '❄️',
    color: '#0ea5e9',
    description: '水神，冬神',
    features: { glowingEyes: true, halo: true }
  },
  {
    id: 'shemu',
    name: '奢比尸',
    emoji: '🧟',
    color: '#6b7280',
    description: '古神，人面兽身',
    features: { fangs: true, glowingEyes: true }
  },
  {
    id: 'tianwu',
    name: '天吴',
    emoji: '🌊',
    color: '#0369a1',
    description: '水伯，八首人面',
    features: { wings: true, glowingEyes: true }
  },
  {
    id: 'jiguang',
    name: '计蒙',
    emoji: '🌧️',
    color: '#2563eb',
    description: '雨师，龙首人身',
    features: { horns: true, wings: true, fire: true }
  },
  {
    id: 'erlangshen',
    name: '二郎神',
    emoji: '👁️',
    color: '#fbbf24',
    description: '清源妙道真君',
    features: { glowingEyes: true, halo: true, wings: true }
  }
];

export function getRandomMonster(): Monster {
  const index = Math.floor(Math.random() * MONSTERS.length);
  return MONSTERS[index];
}