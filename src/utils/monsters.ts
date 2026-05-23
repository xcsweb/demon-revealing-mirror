export interface Monster {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string;
  story: string[];
  imagePrompt: string;
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
    story: ['照妖镜中显真身...', '原来是青牛精下凡！', '太上老君的坐骑偷跑下凡', '金刚镯在手，无人能敌'],
    imagePrompt: 'Chinese mythology blue ox demon, traditional Chinese painting style, powerful and majestic, holding a golden vajra bracelet, ancient Chinese mountain background',
    features: { horns: true, glowingEyes: true }
  },
  {
    id: 'baigujing',
    name: '白骨精',
    emoji: '💀',
    color: '#9ca3af',
    description: '白骨夫人，善于变化',
    story: ['镜子开始闪烁...', '白骨森森，妖气冲天！', '白骨夫人在此', '三次变化，骗过唐僧'],
    imagePrompt: 'Chinese mythology Baigujing skeleton demoness, beautiful but eerie, wearing white silk robes, floating in a dark cave, traditional Chinese ink painting style',
    features: { fangs: true, glowingEyes: true }
  },
  {
    id: 'niumowang',
    name: '牛魔王',
    emoji: '🐂',
    color: '#dc2626',
    description: '平天大圣，孙悟空结拜兄弟',
    story: ['火焰山的热浪扑面而来...', '平天大圣牛魔王！', '孙悟空的结拜兄弟', '芭蕉扇的主人'],
    imagePrompt: 'Chinese mythology Bull Demon King, muscular red bull head, wearing black armor, holding a huge iron staff, standing on a fiery mountain, dramatic lighting',
    features: { horns: true, fangs: true, fire: true }
  },
  {
    id: 'dapeng',
    name: '金翅大鹏',
    emoji: '🦅',
    color: '#fbbf24',
    description: '如来佛祖舅舅，一翅九万里',
    story: ['狂风骤起！', '金翅大鹏雕！', '一翅九万里，速度无人能及', '连孙悟空都追不上'],
    imagePrompt: 'Chinese mythology Golden Winged Great Peng, magnificent golden eagle with enormous wings, piercing golden eyes, soaring through clouds, traditional Chinese art style',
    features: { wings: true, fangs: true, glowingEyes: true }
  },
  {
    id: 'honghaier',
    name: '红孩儿',
    emoji: '👶',
    color: '#ef4444',
    description: '牛魔王之子，三昧真火',
    story: ['三昧真火燃烧！', '是红孩儿！', '牛魔王和铁扇公主的儿子', '三昧真火无人能挡'],
    imagePrompt: 'Chinese mythology Red Boy, adorable but fierce child with red hair, surrounded by swirling red flames, wearing golden armor, mischievous expression, traditional Chinese painting',
    features: { fire: true, glowingEyes: true }
  },
  {
    id: 'tieshan',
    name: '铁扇公主',
    emoji: '👸',
    color: '#db2777',
    description: '罗刹女，芭蕉扇主人',
    story: ['凉风习习...', '铁扇公主罗刹女！', '芭蕉扇一扇熄火', '火焰山的守护者'],
    imagePrompt: 'Chinese mythology Princess Iron Fan, elegant beautiful woman in flowing pink robes, holding a giant palm leaf fan, standing in a celestial palace, traditional Chinese style',
    features: { glowingEyes: true, halo: true }
  },
  {
    id: 'daji',
    name: '九尾狐狸精',
    emoji: '🦊',
    color: '#eab308',
    description: '轩辕坟三妖之首',
    story: ['妩媚之气袭来...', '九尾狐狸精妲己！', '倾国倾城，祸国殃民', '九条尾巴随风摆动'],
    imagePrompt: 'Chinese mythology nine-tailed fox spirit Daji, stunningly beautiful woman with nine golden fox tails, enchanting smile, wearing luxurious ancient Chinese robes, mystical atmosphere',
    features: { glowingEyes: true, halo: true }
  },
  {
    id: 'long',
    name: '龙',
    emoji: '🐲',
    color: '#3b82f6',
    description: '鳞虫之长，能兴云雨',
    story: ['云海翻涌！', '东方神龙现身！', '鳞虫之长，能兴云雨', '四灵之首'],
    imagePrompt: 'Chinese mythology azure dragon, majestic golden dragon with scales shimmering, claws outstretched, soaring through storm clouds, lightning in background, traditional Chinese painting',
    features: { horns: true, wings: true, fire: true, glowingEyes: true }
  },
  {
    id: 'qilin',
    name: '麒麟',
    emoji: '🦌',
    color: '#fef3c7',
    description: '仁兽，圣人出则现',
    story: ['祥云缭绕！', '麒麟现世！', '仁兽降临，天下太平', '圣人出则麒麟现'],
    imagePrompt: 'Chinese mythology Qilin, benevolent mystical beast with deer body, ox tail, dragon scales, single horn, surrounded by golden clouds, peaceful and sacred atmosphere',
    features: { horns: true, halo: true, fire: true }
  },
  {
    id: 'feng',
    name: '凤凰',
    emoji: '🐦',
    color: '#ef4444',
    description: '百鸟之王，浴火重生',
    story: ['火焰冲天！', '凤凰涅槃！', '百鸟之王，浴火重生', '非梧桐不栖'],
    imagePrompt: 'Chinese mythology Phoenix Fenghuang, magnificent bird with fiery red and golden feathers, wings spread wide, rising from flames, rays of light shining, traditional Chinese style',
    features: { wings: true, fire: true, halo: true }
  },
  {
    id: 'sixears',
    name: '六耳猕猴',
    emoji: '🐒',
    color: '#8b5cf6',
    description: '孙悟空化身，真假难辨',
    story: ['真假难辨！', '六耳猕猴！', '与孙悟空一模一样', '连观音都分不清'],
    imagePrompt: 'Chinese mythology Six-Eared Macaque, monkey with six ears, golden fur, holding a staff, fierce expression, standing on a mountain peak, mysterious purple aura',
    features: { fangs: true, glowingEyes: true }
  },
  {
    id: 'erlangshen',
    name: '二郎神',
    emoji: '👁️',
    color: '#fbbf24',
    description: '清源妙道真君',
    story: ['第三只眼睁开！', '二郎神杨戬！', '三只眼看穿一切', '七十三变胜悟空'],
    imagePrompt: 'Chinese mythology Erlang Shen, handsome god with three eyes, wearing celestial armor, holding a three-pointed double-edged sword, accompanied by a celestial dog, majestic',
    features: { glowingEyes: true, halo: true, wings: true }
  },
  {
    id: 'taotie',
    name: '饕餮',
    emoji: '😈',
    color: '#713f12',
    description: '四凶之一，贪得无厌',
    story: ['无尽的食欲...', '饕餮现身！', '四凶之一，贪得无厌', '什么都能吞下'],
    imagePrompt: 'Chinese mythology Taotie, fearsome ancient beast with massive mouth, bronze vessel design patterns, insatiable hunger, traditional Chinese bronze art style',
    features: { fangs: true, glowingEyes: true }
  },
  {
    id: 'bailong',
    name: '白龙马',
    emoji: '🐉',
    color: '#06b6d4',
    description: '西海龙王三太子',
    story: ['白龙出水！', '西海龙王三太子！', '化作白马驮唐僧', '西天取经终成正果'],
    imagePrompt: 'Chinese mythology White Dragon Horse, elegant white dragon with shimmering scales, gentle expression, standing in clear blue water, transforming into a heavenly steed',
    features: { horns: true, wings: true, fire: true }
  },
  {
    id: 'xiezhi',
    name: '獬豸',
    emoji: '🐐',
    color: '#18181b',
    description: '神兽，辨忠奸曲直',
    story: ['正义之光照耀！', '獬豸辨忠奸！', '独角神兽，触不直者', '司法正义的象征'],
    imagePrompt: 'Chinese mythology Xiezhi, wise mythical beast with goat body, single sharp horn on forehead, intelligent eyes, standing in a courtroom, traditional Chinese style',
    features: { horns: true, glowingEyes: true }
  }
];

export function getRandomMonster(): Monster {
  const index = Math.floor(Math.random() * MONSTERS.length);
  return MONSTERS[index];
}