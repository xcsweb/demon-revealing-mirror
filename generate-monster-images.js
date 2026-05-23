import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MONSTERS = [
  {
    id: 'qingniu',
    name: '青牛精',
    prompt: 'Chinese mythology blue ox demon, traditional Chinese painting style, powerful and majestic, holding a golden vajra bracelet, ancient Chinese mountain background'
  },
  {
    id: 'baigujing',
    name: '白骨精',
    prompt: 'Chinese mythology Baigujing skeleton demoness, beautiful but eerie, wearing white silk robes, floating in a dark cave, traditional Chinese ink painting style'
  },
  {
    id: 'niumowang',
    name: '牛魔王',
    prompt: 'Chinese mythology Bull Demon King, muscular red bull head, wearing black armor, holding a huge iron staff, standing on a fiery mountain, dramatic lighting'
  },
  {
    id: 'dapeng',
    name: '金翅大鹏',
    prompt: 'Chinese mythology Golden Winged Great Peng, magnificent golden eagle with enormous wings, piercing golden eyes, soaring through clouds, traditional Chinese art style'
  },
  {
    id: 'honghaier',
    name: '红孩儿',
    prompt: 'Chinese mythology Red Boy, adorable but fierce child with red hair, surrounded by swirling red flames, wearing golden armor, mischievous expression, traditional Chinese painting'
  },
  {
    id: 'tieshan',
    name: '铁扇公主',
    prompt: 'Chinese mythology Princess Iron Fan, elegant beautiful woman in flowing pink robes, holding a giant palm leaf fan, standing in a celestial palace, traditional Chinese style'
  },
  {
    id: 'daji',
    name: '九尾狐狸精',
    prompt: 'Chinese mythology nine-tailed fox spirit Daji, stunningly beautiful woman with nine golden fox tails, enchanting smile, wearing luxurious ancient Chinese robes, mystical atmosphere'
  },
  {
    id: 'long',
    name: '龙',
    prompt: 'Chinese mythology azure dragon, majestic golden dragon with scales shimmering, claws outstretched, soaring through storm clouds, lightning in background, traditional Chinese painting'
  },
  {
    id: 'qilin',
    name: '麒麟',
    prompt: 'Chinese mythology Qilin, benevolent mystical beast with deer body, ox tail, dragon scales, single horn, surrounded by golden clouds, peaceful and sacred atmosphere'
  },
  {
    id: 'feng',
    name: '凤凰',
    prompt: 'Chinese mythology Phoenix Fenghuang, magnificent bird with fiery red and golden feathers, wings spread wide, rising from flames, rays of light shining, traditional Chinese style'
  },
  {
    id: 'sixears',
    name: '六耳猕猴',
    prompt: 'Chinese mythology Six-Eared Macaque, monkey with six ears, golden fur, holding a staff, fierce expression, standing on a mountain peak, mysterious purple aura'
  },
  {
    id: 'erlangshen',
    name: '二郎神',
    prompt: 'Chinese mythology Erlang Shen, handsome god with three eyes, wearing celestial armor, holding a three-pointed double-edged sword, accompanied by a celestial dog, majestic'
  },
  {
    id: 'taotie',
    name: '饕餮',
    prompt: 'Chinese mythology Taotie, fearsome ancient beast with massive mouth, bronze vessel design patterns, insatiable hunger, traditional Chinese bronze art style'
  },
  {
    id: 'bailong',
    name: '白龙马',
    prompt: 'Chinese mythology White Dragon Horse, elegant white dragon with shimmering scales, gentle expression, standing in clear blue water, transforming into a heavenly steed'
  },
  {
    id: 'xiezhi',
    name: '獬豸',
    prompt: 'Chinese mythology Xiezhi, wise mythical beast with goat body, single sharp horn on forehead, intelligent eyes, standing in a courtroom, traditional Chinese style'
  }
];

async function downloadImage(url, filepath) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    await fs.writeFile(filepath, Buffer.from(buffer));
    console.log(`✅ Downloaded: ${filepath}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to download ${filepath}: ${error.message}`);
    return false;
  }
}

async function generateAllImages() {
  console.log('🚀 Starting to generate monster images...\n');
  
  const outputDir = path.join(__dirname, 'public', 'images', 'monsters');
  
  // 确保目录存在
  await fs.mkdir(outputDir, { recursive: true });
  
  const results = [];
  
  for (const monster of MONSTERS) {
    const encodedPrompt = encodeURIComponent(monster.prompt);
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=600&height=800&nologo=true&model=flux&seed=${monster.id}`;
    const filepath = path.join(outputDir, `${monster.id}.png`);
    
    console.log(`Generating ${monster.name} (${monster.id})...`);
    
    const success = await downloadImage(url, filepath);
    results.push({
      name: monster.name,
      id: monster.id,
      success
    });
    
    // 等待 3 秒以避免请求过快
    if (success) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`Total: ${results.length}`);
  console.log(`Success: ${results.filter(r => r.success).length}`);
  console.log(`Failed: ${results.filter(r => !r.success).length}`);
  
  if (results.filter(r => !r.success).length > 0) {
    console.log('\n❌ Failed monsters:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.name} (${r.id})`);
    });
  }
}

generateAllImages().catch(console.error);
