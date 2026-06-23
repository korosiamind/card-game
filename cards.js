const SCHOOLS = {
  light: { id: 'light', name: '☀️ Свет',    color: '#d4a017', img: 'Свет.png',
    tagline: 'Исцеление и защита',
    description: 'Восстанавливает здоровье, ставит щиты и поддерживает союзников. Лучший выбор для долгих и упорных сражений.' },
  order: { id: 'order', name: '⚖️ Порядок', color: '#2563eb', img: 'Порядок.png',
    tagline: 'Дисциплина и сила',
    description: 'Призывает воинов и усиливает армию баффами. Доминирует числом, командными способностями и железной волей.' },
  dark:  { id: 'dark',  name: '🌑 Тьма',    color: '#7c3aed', img: 'Тьма.png',
    tagline: 'Проклятия и жизнекража',
    description: 'Ослабляет врагов и питается их жизненной силой. Проклятия, высасывание и воскрешение павших союзников.' },
  chaos: { id: 'chaos', name: '🌀 Хаос',    color: '#dc2626', img: 'Хаос.png',
    tagline: 'Ярость и разрушение',
    description: 'Наносит массовый урон всем вокруг. Чем больше получает — тем опаснее становится. Максимальный риск и сила.' },
};

const CARD_DEFS = {

  // ══════════════════════════════════════════════════════
  // ☀️  СВЕТ — исцеление и защита
  // ══════════════════════════════════════════════════════

  lightHealer: {
    id: 'lightHealer', name: 'Лесной Целитель', school: 'light', type: 'creature', disabled: true,
    cost: 2, attack: 1, hp: 3, passive: 'healHero', passiveValue: 2,
    description: 'Каждый ход восстанавливает герою 2 ОЗ', art: '🌿', image: 'Лесной Целитель2.png'
  },
  paladin: {
    id: 'paladin', name: 'Паладин', school: 'light', type: 'creature', disabled: true,
    cost: 3, attack: 2, hp: 3, passive: 'healSelf', passiveValue: 1,
    description: 'Каждый ход восстанавливает себе 1 ОЗ', art: '⚔️', image: 'паладин2.png'
  },
  priest: {
    id: 'priest', name: 'Жрец', school: 'light', type: 'creature', disabled: true,
    cost: 4, attack: 1, hp: 5, passive: 'healAllCreatures', passiveValue: 1,
    description: 'Каждый ход восстанавливает 1 ОЗ всем дружественным существам', art: '✨', image: 'Жрец2.png'
  },
  angel: {
    id: 'angel', name: 'Ангел', school: 'light', type: 'creature', disabled: true,
    cost: 5, attack: 2, hp: 6, passive: 'healHero', passiveValue: 4,
    description: 'Каждый ход восстанавливает герою 4 ОЗ', art: '👼', image: 'Ангел2.png'
  },
  highPriest: {
    id: 'highPriest', name: 'Верховный Жрец', school: 'light', type: 'creature', disabled: true,
    cost: 6, attack: 2, hp: 7, passive: 'healHero', passiveValue: 5,
    description: 'Каждый ход восстанавливает герою 5 ОЗ', art: '🌟', image: 'Верховный Жрец2.png'
  },

  minorHeal: {
    id: 'minorHeal', name: 'Малое Исцеление', school: 'light', type: 'spell', subtype: 'heal',
    cost: 1, value: 3, target: 'self', image: 'Малое исцеление.png',
    description: 'Восстанавливает 3 ОЗ вашему герою', art: '💧'
  },
  holyShield: {
    id: 'holyShield', name: 'Священный Щит', school: 'light', type: 'spell', subtype: 'shield',
    cost: 2, value: 5, target: 'self', image: 'Священный Щит.png',
    description: 'Даёт герою щит на 5 ОЗ', art: '🔰'
  },
  blessing: {
    id: 'blessing', name: 'Благословение', school: 'light', type: 'spell', subtype: 'buff',
    cost: 2, value: 2, target: 'friendlyCreature', image: 'Благословение.png',
    description: 'Даёт существу +2 к атаке', art: '💫'
  },
  heal: {
    id: 'heal', name: 'Исцеление', school: 'light', type: 'spell', subtype: 'heal',
    cost: 3, value: 6, target: 'self', image: 'Исцеление.png',
    description: 'Восстанавливает 6 ОЗ вашему герою', art: '💚'
  },
  divineLight: {
    id: 'divineLight', name: 'Яркий Свет', school: 'light', type: 'spell', subtype: 'heal',
    cost: 5, value: 12, target: 'self', image: 'Яркий свет.png',
    description: 'Восстанавливает 12 ОЗ вашему герою', art: '☀️'
  },
  resurrection: {
    id: 'resurrection', name: 'Воскрешение', school: 'light', type: 'spell', subtype: 'resurrection',
    cost: 4, value: 0, target: 'self', image: 'Воскрешение.png',
    description: 'Возвращает последнее погибшее дружественное существо на поле', art: '🕊️'
  },

  // ══════════════════════════════════════════════════════
  // ⚖️  ПОРЯДОК — щиты и усиление
  // ══════════════════════════════════════════════════════

  knight: {
    id: 'knight', name: 'Рыцарь', school: 'order', type: 'creature', disabled: true,
    cost: 3, attack: 2, hp: 3, passive: 'shieldHero', passiveValue: 2,
    description: 'Каждый ход даёт герою щит на 2 ОЗ', art: '🗡️'
  },
  shieldBearer: {
    id: 'shieldBearer', name: 'Щитоносец', school: 'order', type: 'creature', disabled: true,
    cost: 4, attack: 2, hp: 5, passive: 'shieldHero', passiveValue: 3,
    description: 'Каждый ход даёт герою щит на 3 ОЗ', art: '🛡️'
  },
  bannerman: {
    id: 'bannerman', name: 'Знаменосец', school: 'order', type: 'creature', disabled: true,
    cost: 4, attack: 1, hp: 4, passive: 'buffAllCreatures', passiveValue: 1,
    description: 'Каждый ход все дружественные существа получают +1 к атаке', art: '🚩'
  },
  fortress: {
    id: 'fortress', name: 'Крепость', school: 'order', type: 'creature', disabled: true,
    cost: 5, attack: 1, hp: 8, passive: 'shieldHero', passiveValue: 5,
    description: 'Каждый ход даёт герою щит на 5 ОЗ', art: '🏰'
  },
  commander: {
    id: 'commander', name: 'Командир', school: 'order', type: 'creature', disabled: true,
    cost: 6, attack: 3, hp: 6, passive: 'buffAllCreatures', passiveValue: 2,
    description: 'Каждый ход все дружественные существа получают +2 к атаке', art: '👑'
  },

  empower: {
    id: 'empower', name: 'Усиление', school: 'order', type: 'spell', subtype: 'buff',
    cost: 2, value: 2, target: 'friendlyCreature', image: 'Усиление.png',
    description: 'Даёт существу +2 к атаке', art: '💪'
  },
  fortify: {
    id: 'fortify', name: 'Укрепление', school: 'order', type: 'spell', subtype: 'hpbuff',
    cost: 2, value: 3, target: 'friendlyCreature', image: 'Укрепление.png',
    description: 'Даёт существу +3 к здоровью', art: '🧱'
  },
  inspire: {
    id: 'inspire', name: 'Воодушевление', school: 'order', type: 'spell', subtype: 'massBuffAtk',
    cost: 3, value: 1, target: 'self', image: 'Воодушевление.png',
    description: 'Все дружественные существа получают +1 к атаке', art: '📯'
  },
  orderShield: {
    id: 'orderShield', name: 'Щит Порядка', school: 'order', type: 'spell', subtype: 'shield',
    cost: 3, value: 8, target: 'self', image: 'Щит Порядка.png',
    description: 'Даёт герою щит на 8 ОЗ', art: '🪨'
  },
  reinforce: {
    id: 'reinforce', name: 'Подкрепление', school: 'order', type: 'spell', subtype: 'fullbuff',
    cost: 4, value: 2, target: 'friendlyCreature', image: 'Подкрепление.png',
    description: 'Даёт существу +2 к атаке и +2 к здоровью', art: '⚙️'
  },
  battleCry: {
    id: 'battleCry', name: 'Боевой Клич', school: 'order', type: 'spell', subtype: 'massBuffAtk',
    cost: 5, value: 2, target: 'self', image: 'Боевой Клич.png',
    description: 'Все дружественные существа получают +2 к атаке', art: '🎺'
  },

  // ══════════════════════════════════════════════════════
  // 🌑  ТЬМА — проклятия и прямой урон
  // ══════════════════════════════════════════════════════

  shade: {
    id: 'shade', name: 'Тень', school: 'dark', type: 'creature', disabled: true,
    cost: 2, attack: 1, hp: 3, passive: 'damageEnemy', passiveValue: 1,
    description: 'Каждый ход наносит 1 урон герою врага', art: '👤'
  },
  fireGuard: {
    id: 'fireGuard', name: 'Огненный Страж', school: 'dark', type: 'creature', disabled: true,
    cost: 3, attack: 2, hp: 3, passive: 'damageEnemy', passiveValue: 1,
    description: 'Каждый ход наносит 1 урон герою врага', art: '🔥', image: 'Огненный Страж.png'
  },
  darkKnight: {
    id: 'darkKnight', name: 'Тёмный Рыцарь', school: 'dark', type: 'creature', disabled: true,
    cost: 4, attack: 3, hp: 4, passive: 'damageEnemy', passiveValue: 2,
    description: 'Каждый ход наносит 2 урона герою врага', art: '🌑'
  },
  necromancer: {
    id: 'necromancer', name: 'Некромант', school: 'dark', type: 'creature', disabled: true,
    cost: 5, attack: 2, hp: 5, passive: 'damageEnemy', passiveValue: 3,
    description: 'Каждый ход наносит 3 урона герою врага', art: '💀'
  },
  dragon: {
    id: 'dragon', name: 'Древний Дракон', school: 'dark', type: 'creature', disabled: true,
    cost: 7, attack: 5, hp: 6, passive: 'damageEnemy', passiveValue: 3,
    description: 'Каждый ход наносит 3 урона герою врага', art: '🐉'
  },

  shadowBolt: {
    id: 'shadowBolt', name: 'Теневой Удар', school: 'dark', type: 'spell', subtype: 'damage',
    cost: 2, value: 4, target: 'any', image: 'Теневой Удар.png',
    description: 'Наносит 4 урона любой цели', art: '🖤'
  },
  weakCurse: {
    id: 'weakCurse', name: 'Проклятие Слабости', school: 'dark', type: 'spell', subtype: 'creatureCurse',
    cost: 2, value: 1, duration: 3, target: 'enemyCreature', image: 'Проклятие Слабости.png',
    description: 'Существо врага получает 1 урон каждый ход (3 хода)', art: '🩸'
  },
  painCurse: {
    id: 'painCurse', name: 'Проклятие Боли', school: 'dark', type: 'spell', subtype: 'curse',
    cost: 3, value: 2, duration: 3, target: 'enemyHero', image: 'Проклятие Боли.png',
    description: 'Герой врага получает 2 урона каждый ход (3 хода)', art: '🪦'
  },
  darkFire: {
    id: 'darkFire', name: 'Тёмный Огонь', school: 'dark', type: 'spell', subtype: 'damage',
    cost: 4, value: 6, target: 'enemyHero', image: 'Тёмный Огонь.png',
    description: 'Наносит 6 урона герою врага', art: '🌚'
  },
  soulDrain: {
    id: 'soulDrain', name: 'Поглощение Жизни', school: 'dark', type: 'spell', subtype: 'drain',
    cost: 4, value: 4, target: 'enemyCreature', image: 'Поглощение Жизни.png',
    description: 'Наносит 4 урона существу врага и восстанавливает вам 4 ОЗ', art: '🫀'
  },
  massCurse: {
    id: 'massCurse', name: 'Массовое Проклятие', school: 'dark', type: 'spell', subtype: 'massCurse',
    cost: 5, value: 1, duration: 3, target: 'self', image: 'Массовое Проклятие.png',
    description: 'Все существа врага получают 1 урон каждый ход (3 хода)', art: '☠️'
  },

  // ══════════════════════════════════════════════════════
  // 🌀  ХАОС — АОЕ и высокий урон
  // ══════════════════════════════════════════════════════

  elemental: {
    id: 'elemental', name: 'Элементаль', school: 'chaos', type: 'creature', disabled: true,
    cost: 3, attack: 3, hp: 2, passive: 'damageEnemy', passiveValue: 1,
    description: 'Каждый ход наносит 1 урон герою врага', art: '🌪️'
  },
  berserker: {
    id: 'berserker', name: 'Берсерк', school: 'chaos', type: 'creature', disabled: true,
    cost: 4, attack: 4, hp: 3, passive: null, passiveValue: 0,
    description: 'Мощный воин без особых способностей', art: '🪓'
  },
  warMage: {
    id: 'warMage', name: 'Боевой Маг', school: 'chaos', type: 'creature', disabled: true,
    cost: 5, attack: 3, hp: 4, passive: 'damageAllEnemyCreatures', passiveValue: 1,
    description: 'Каждый ход наносит 1 урон всем существам врага', art: '🔮', image: 'Боевой маг2.png'
  },
  chaosGolem: {
    id: 'chaosGolem', name: 'Голем Хаоса', school: 'chaos', type: 'creature', disabled: true,
    cost: 5, attack: 4, hp: 4, passive: 'damageAllEnemyCreatures', passiveValue: 1,
    description: 'Каждый ход наносит 1 урон всем существам врага', art: '🗿'
  },
  stormCaller: {
    id: 'stormCaller', name: 'Призыватель Бурь', school: 'chaos', type: 'creature', disabled: true,
    cost: 6, attack: 3, hp: 5, passive: 'damageAllEnemyCreatures', passiveValue: 2,
    description: 'Каждый ход наносит 2 урона всем существам врага', art: '⛈️'
  },

  lightning: {
    id: 'lightning', name: 'Молния', school: 'chaos', type: 'spell', subtype: 'damage',
    cost: 2, value: 3, target: 'any', image: 'Молния.png',
    description: 'Наносит 3 урона любой цели', art: '⚡'
  },
  chainLightning: {
    id: 'chainLightning', name: 'Цепная Молния', school: 'chaos', type: 'spell', subtype: 'aoeAll',
    cost: 3, value: 2, target: 'self', image: 'Цепная Молния.png',
    description: 'Наносит 2 урона ВСЕМ существам на поле (включая своих!)', art: '🌩️'
  },
  fireball: {
    id: 'fireball', name: 'Огненный Шар', school: 'chaos', type: 'spell', subtype: 'damage',
    cost: 4, value: 5, target: 'any', image: 'Огненный Шар.png',
    description: 'Наносит 5 урона любой цели', art: '🎆'
  },
  inferno: {
    id: 'inferno', name: 'Инферно', school: 'chaos', type: 'spell', subtype: 'damage',
    cost: 5, value: 7, target: 'enemyHero', image: 'Инферно.png',
    description: 'Наносит 7 урона герою врага', art: '🌋'
  },
  explosion: {
    id: 'explosion', name: 'Взрыв', school: 'chaos', type: 'spell', subtype: 'aoeCreatures',
    cost: 5, value: 5, target: 'self', image: 'Взрыв.png',
    description: 'Наносит 5 урона всем существам врага', art: '💥'
  },
  meteor: {
    id: 'meteor', name: 'Метеор', school: 'chaos', type: 'spell', subtype: 'aoe',
    cost: 6, value: 4, target: 'allEnemies', image: 'Метеор.png',
    description: 'Наносит 4 урона всем существам и герою врага', art: '☄️'
  },


  // ══════════════════════════════════════════════════════
  // ГЕРОИ — мощные существа, тип 'hero'
  // ══════════════════════════════════════════════════════

  // ☀️ СВЕТ
  seraphim: {
    id: 'seraphim', name: 'Серафим', school: 'light', type: 'hero',
    cost: 5, attack: 3, hp: 22, passive: 'massHealAll', passiveValue: 2,
    description: 'Каждый ход восстанавливает 2 ОЗ герою и всем союзникам', art: '✨',
    image: 'Серафим.png',
    spells: [
      { id: 'seraphim_s1', name: 'Священный Свет', art: '💛', cost: 2, cooldown: 2,
        subtype: 'heal', value: 5, target: 'self', description: 'Восстанавливает 5 ОЗ герою' },
      { id: 'seraphim_s2', name: 'Луч Надежды', art: '🌈', cost: 3, cooldown: 3,
        subtype: 'massHealAll', value: 2, target: 'self', description: 'Восстанавливает 2 ОЗ герою и всем союзникам' },
    ]
  },
  highPaladin: {
    id: 'highPaladin', name: 'Верховный Паладин', school: 'light', type: 'hero',
    cost: 6, attack: 4, hp: 26, passive: 'maintainShield', passiveValue: 5,
    description: 'Герой всегда имеет минимум 5 щита (восстанавливается каждый ход)', art: '⚔️',
    image: 'Верховный Паладин.png',
    spells: [
      { id: 'hpaladin_s1', name: 'Щит Веры', art: '🔰', cost: 2, cooldown: 2,
        subtype: 'shield', value: 6, target: 'self', description: 'Даёт герою щит на 6 ОЗ' },
      { id: 'hpaladin_s2', name: 'Священный Удар', art: '⚡', cost: 3, cooldown: 3,
        subtype: 'damage', value: 4, target: 'enemyHero', description: 'Наносит 4 урона герою врага' },
    ]
  },
  archangelLight: {
    id: 'archangelLight', name: 'Архангел Света', school: 'light', type: 'hero',
    cost: 8, attack: 5, hp: 32, passive: 'divineAura', passiveValue: 4,
    description: 'Каждый ход восстанавливает 4 ОЗ герою и даёт +1 атаки всем союзникам', art: '👼',
    image: 'Архангел Света.png',
    spells: [
      { id: 'archangel_s1', name: 'Благодать', art: '✨', cost: 3, cooldown: 3,
        subtype: 'heal', value: 8, target: 'self', description: 'Восстанавливает 8 ОЗ герою' },
      { id: 'archangel_s2', name: 'Небесный Гнев', art: '☀️', cost: 4, cooldown: 4,
        subtype: 'aoeCreatures', value: 5, target: 'self', description: 'Наносит 5 урона всем существам врага' },
    ]
  },

  // ⚖️ ПОРЯДОК
  marshal: {
    id: 'marshal', name: 'Маршал', school: 'order', type: 'hero',
    cost: 5, attack: 4, hp: 20, passive: null, passiveValue: 0,
    battlecry: 'summonKnights',
    description: 'При призыве вызывает трёх рыцарей 2/2', art: '🗡️',
    image: 'Маршал.png',
    spells: [
      { id: 'marshal_s1', name: 'Ратный Клич', art: '📯', cost: 2, cooldown: 2,
        subtype: 'massBuffAtk', value: 2, target: 'self', description: 'Все союзники получают +2 к атаке' },
      { id: 'marshal_s2', name: 'Призыв Рыцаря', art: '⚔️', cost: 3, cooldown: 3,
        subtype: 'summonToken', value: 0, target: 'self', description: 'Призывает рыцаря 2/2' },
    ]
  },
  grandShieldBearer: {
    id: 'grandShieldBearer', name: 'Великий Щитоносец', school: 'order', type: 'hero',
    cost: 6, attack: 3, hp: 30, passive: 'maintainShield', passiveValue: 6,
    description: 'Герой всегда имеет минимум 6 щита (восстанавливается каждый ход)', art: '🛡️',
    image: 'Великий Щитоносец.png',
    spells: [
      { id: 'gshield_s1', name: 'Железная Стена', art: '🪨', cost: 2, cooldown: 2,
        subtype: 'shield', value: 8, target: 'self', description: 'Даёт герою щит на 8 ОЗ' },
      { id: 'gshield_s2', name: 'Укрепление Рядов', art: '🛡️', cost: 3, cooldown: 3,
        subtype: 'massHpBuff', value: 3, target: 'self', description: 'Все союзники получают +3 к здоровью' },
    ]
  },
  legendaryCommander: {
    id: 'legendaryCommander', name: 'Легендарный Командир', school: 'order', type: 'hero',
    cost: 8, attack: 5, hp: 26, passive: 'warAura', passiveValue: 3,
    description: 'Каждый ход все союзники получают +3 к атаке и восстанавливают 1 ОЗ', art: '👑',
    image: 'Легендарный Командир.png',
    spells: [
      { id: 'lcommander_s1', name: 'Боевой Приказ', art: '👊', cost: 2, cooldown: 2,
        subtype: 'massBuffAtk', value: 3, target: 'self', description: 'Все союзники получают +3 к атаке' },
      { id: 'lcommander_s2', name: 'Военная Мощь', art: '🎺', cost: 4, cooldown: 3,
        subtype: 'massBuff', value: 2, target: 'self', description: 'Все союзники получают +2 к атаке и здоровью' },
    ]
  },

  // 🌑 ТЬМА
  lich: {
    id: 'lich', name: 'Лич', school: 'dark', type: 'hero',
    cost: 5, attack: 4, hp: 20, passive: 'damageEnemy', passiveValue: 3,
    description: 'Каждый ход наносит 3 урона герою врага', art: '💀',
    image: 'Лич.png',
    spells: [
      { id: 'lich_s1', name: 'Ледяное Касание', art: '❄️', cost: 2, cooldown: 2,
        subtype: 'damage', value: 4, target: 'enemyHero', description: 'Наносит 4 урона герою врага' },
      { id: 'lich_s2', name: 'Проклятие Смерти', art: '💀', cost: 3, cooldown: 3,
        subtype: 'creatureCurse', value: 3, duration: 3, target: 'enemyCreature',
        description: 'Существо врага получает 3 урона каждый ход (3 хода)' },
    ]
  },
  necroLord: {
    id: 'necroLord', name: 'Некромант-Лорд', school: 'dark', type: 'hero',
    cost: 6, attack: 4, hp: 22, passive: null, passiveValue: 0,
    onAttack: 'lifesteal',
    description: 'При атаке восстанавливает себе половину нанесённого урона (округление вверх)', art: '☠️',
    image: 'Некромант-Лорд.png',
    spells: [
      { id: 'necrolord_s1', name: 'Высасывание Жизни', art: '🫀', cost: 3, cooldown: 2,
        subtype: 'drain', value: 5, target: 'enemyCreature', description: 'Наносит 5 урона существу врага и восстанавливает 5 ОЗ' },
      { id: 'necrolord_s2', name: 'Армия Мёртвых', art: '🪦', cost: 4, cooldown: 4,
        subtype: 'resurrection', value: 0, target: 'self', description: 'Возвращает последнее погибшее союзное существо' },
    ]
  },
  darkArchmage: {
    id: 'darkArchmage', name: 'Тёмный Архимаг', school: 'dark', type: 'hero',
    cost: 8, attack: 5, hp: 28, passive: 'shadowStorm', passiveValue: 2,
    description: 'Каждый ход 2 урона всем существам врага и 2 урона герою врага', art: '🌑',
    image: 'Тёмный Архимаг.png',
    spells: [
      { id: 'darkarchmage_s1', name: 'Теневой Шторм', art: '🌑', cost: 3, cooldown: 3,
        subtype: 'aoeCreatures', value: 4, target: 'self', description: 'Наносит 4 урона всем существам врага' },
      { id: 'darkarchmage_s2', name: 'Вихрь Тьмы', art: '🌀', cost: 4, cooldown: 4,
        subtype: 'aoe', value: 4, target: 'allEnemies', description: 'Наносит 4 урона герою и всем существам врага' },
    ]
  },

  // 🌀 ХАОС
  berserkerLord: {
    id: 'berserkerLord', name: 'Берсерк-Лорд', school: 'chaos', type: 'hero',
    cost: 5, attack: 4, hp: 18, passive: null, passiveValue: 0,
    onDamage: 'rage',
    description: 'Каждый раз, получая урон, увеличивает атаку на 1', art: '🪓',
    image: 'Берсерк-Лорд.png',
    spells: [
      { id: 'berserklord_s1', name: 'Ярость', art: '💢', cost: 2, cooldown: 2,
        subtype: 'selfBuff', value: 4, target: 'self', description: 'Увеличивает свою атаку на 4' },
      { id: 'berserklord_s2', name: 'Прыжок Смерти', art: '🪓', cost: 3, cooldown: 3,
        subtype: 'heroSelfAttack', value: 0, target: 'enemyHero', description: 'Наносит урон герою врага, равный своей атаке' },
    ]
  },
  stormLord: {
    id: 'stormLord', name: 'Повелитель Бурь', school: 'chaos', type: 'hero',
    cost: 6, attack: 4, hp: 24, passive: 'damageAllEnemyCreatures', passiveValue: 2,
    description: 'Каждый ход наносит 2 урона всем существам врага', art: '⛈️',
    image: 'Повелитель Бурь.png',
    spells: [
      { id: 'stormlord_s1', name: 'Разряд', art: '⚡', cost: 2, cooldown: 2,
        subtype: 'damage', value: 4, target: 'any', description: 'Наносит 4 урона любой цели' },
      { id: 'stormlord_s2', name: 'Гроза', art: '⛈️', cost: 4, cooldown: 3,
        subtype: 'aoe', value: 3, target: 'allEnemies', description: 'Наносит 3 урона герою и всем существам врага' },
    ]
  },
  chaosLord: {
    id: 'chaosLord', name: 'Властелин Хаоса', school: 'chaos', type: 'hero',
    cost: 8, attack: 6, hp: 30, passive: 'shadowStorm', passiveValue: 3,
    description: 'Каждый ход 3 урона всем существам и герою врага', art: '🌀',
    image: 'Властелин Хаоса.png',
    spells: [
      { id: 'chaoslord_s1', name: 'Хаотичный Взрыв', art: '💥', cost: 3, cooldown: 2,
        subtype: 'aoeAll', value: 3, target: 'self', description: 'Наносит 3 урона всем существам на поле (включая своих!)' },
      { id: 'chaoslord_s2', name: 'Апокалипсис', art: '☄️', cost: 5, cooldown: 4,
        subtype: 'aoe', value: 6, target: 'allEnemies', description: 'Наносит 6 урона герою и всем существам врага' },
    ]
  },

  // ══════════════════════════════════════════════════════
  // ГЕРОИ С НАСМЕШКОЙ — по одному на каждую школу
  // ══════════════════════════════════════════════════════

  // ☀️ СВЕТ
  dawnGuardian: {
    id: 'dawnGuardian', name: 'Страж Рассвета', school: 'light', type: 'hero',
    cost: 7, attack: 3, hp: 30, passive: 'taunt', passiveValue: 0,
    description: 'Насмешка: враги могут атаковать только этого героя (заклинания — исключение)', art: '🌅',
    image: 'Страж Рассвета.png',
    spells: [
      { id: 'dawnguardian_s1', name: 'Сияющий Щит', art: '🔰', cost: 2, cooldown: 2,
        subtype: 'shield', value: 8, target: 'self', description: 'Даёт герою щит на 8 ОЗ' },
      { id: 'dawnguardian_s2', name: 'Исцеляющий Свет', art: '💛', cost: 3, cooldown: 3,
        subtype: 'heal', value: 10, target: 'self', description: 'Восстанавливает 10 ОЗ герою' },
    ]
  },

  // ⚖️ ПОРЯДОК
  ironBastion: {
    id: 'ironBastion', name: 'Несокрушимый Бастион', school: 'order', type: 'hero',
    cost: 7, attack: 2, hp: 35, passive: 'taunt', passiveValue: 0,
    description: 'Насмешка: враги могут атаковать только этого героя (заклинания — исключение)', art: '🏰',
    image: 'Несокрушимый Бастион.png',
    spells: [
      { id: 'ironbastion_s1', name: 'Каменная Стена', art: '🪨', cost: 2, cooldown: 2,
        subtype: 'shield', value: 12, target: 'self', description: 'Даёт герою щит на 12 ОЗ' },
      { id: 'ironbastion_s2', name: 'Укрепление Строя', art: '🛡️', cost: 3, cooldown: 3,
        subtype: 'massHpBuff', value: 3, target: 'self', description: 'Все союзники получают +3 к здоровью' },
    ]
  },

  // 🌑 ТЬМА
  shadowSentinel: {
    id: 'shadowSentinel', name: 'Тёмный Страж', school: 'dark', type: 'hero',
    cost: 7, attack: 5, hp: 24, passive: 'taunt', passiveValue: 0,
    description: 'Насмешка: враги могут атаковать только этого героя (заклинания — исключение)', art: '👁️',
    image: 'Тёмный Страж.png',
    spells: [
      { id: 'shadowsentinel_s1', name: 'Тёмный Удар', art: '🌑', cost: 2, cooldown: 2,
        subtype: 'damage', value: 5, target: 'enemyHero', description: 'Наносит 5 урона герою врага' },
      { id: 'shadowsentinel_s2', name: 'Аура Ужаса', art: '💀', cost: 3, cooldown: 3,
        subtype: 'aoeCreatures', value: 3, target: 'self', description: 'Наносит 3 урона всем существам врага' },
    ]
  },

  // 🌀 ХАОС
  chaosColossus: {
    id: 'chaosColossus', name: 'Колосс Хаоса', school: 'chaos', type: 'hero',
    cost: 7, attack: 6, hp: 20, passive: 'taunt', passiveValue: 0,
    description: 'Насмешка: враги могут атаковать только этого героя (заклинания — исключение)', art: '🗿',
    image: 'Колосс Хаоса.png',
    spells: [
      { id: 'chaoscolossus_s1', name: 'Сокрушительный Удар', art: '💢', cost: 2, cooldown: 2,
        subtype: 'heroSelfAttack', value: 0, target: 'enemyHero', description: 'Наносит урон герою врага, равный своей атаке' },
      { id: 'chaoscolossus_s2', name: 'Волна Хаоса', art: '🌊', cost: 4, cooldown: 3,
        subtype: 'aoe', value: 5, target: 'allEnemies', description: 'Наносит 5 урона герою и всем существам врага' },
    ]
  },
};

// ══════════════════════════════════════════════════════
// ГОТОВЫЕ КОЛОДЫ — по одной на каждую пару школ
// ══════════════════════════════════════════════════════

const PRESET_DECKS = [
  {
    id: 'holyOrder', name: 'Священный Орден', art: '🏰',
    schools: ['light', 'order'],
    tagline: 'Щиты, лечение, доминирование',
    description: 'Три героя накапливают щиты и атаку — враг медленно умирает под натиском',
    cards: [
      'archangelLight','grandShieldBearer','legendaryCommander',
      'minorHeal','minorHeal','heal','heal','holyShield','holyShield','blessing','blessing',
      'empower','empower','orderShield','orderShield','inspire','inspire','reinforce','reinforce','battleCry'
    ]
  },
  {
    id: 'darkBalance', name: 'Тёмное Равновесие', art: '☯️',
    schools: ['light', 'dark'],
    tagline: 'Лечи себя, уничтожай врага',
    description: 'Серафим восстанавливает жизни, пока Лич и Некромант высасывают их у противника',
    cards: [
      'seraphim','lich','necroLord',
      'minorHeal','minorHeal','heal','heal','holyShield','holyShield','resurrection','resurrection',
      'shadowBolt','shadowBolt','soulDrain','soulDrain','painCurse','painCurse','darkFire','darkFire','divineLight'
    ]
  },
  {
    id: 'holyStorm', name: 'Священный Огонь', art: '⚡',
    schools: ['light', 'chaos'],
    tagline: 'Лечись и сжигай',
    description: 'Высший Паладин держит щит, пока Повелитель Бурь и Властелин Хаоса сжигают врагов',
    cards: [
      'highPaladin','stormLord','chaosLord',
      'minorHeal','minorHeal','heal','heal','divineLight','divineLight','blessing','blessing',
      'lightning','lightning','fireball','fireball','chainLightning','chainLightning','inferno','inferno','holyShield'
    ]
  },
  {
    id: 'ironGrip', name: 'Железный Кулак', art: '⛓️',
    schools: ['order', 'dark'],
    tagline: 'Контроль и проклятия',
    description: 'Бастион принимает удары, Архимаг выжигает поле, проклятия добивают врага',
    cards: [
      'ironBastion','darkArchmage','lich',
      'empower','empower','orderShield','orderShield','inspire','inspire','battleCry','battleCry',
      'shadowBolt','shadowBolt','weakCurse','weakCurse','painCurse','painCurse','massCurse','massCurse','fortify'
    ]
  },
  {
    id: 'onslaught', name: 'Безудержный Натиск', art: '💥',
    schools: ['order', 'chaos'],
    tagline: 'Усиление и массовый урон',
    description: 'Командир разгоняет армию, Берсерк-Лорд набирает атаку — всё сносит лавиной',
    cards: [
      'legendaryCommander','berserkerLord','stormLord',
      'empower','empower','fortify','fortify','inspire','inspire','battleCry','battleCry',
      'lightning','lightning','fireball','fireball','explosion','explosion','meteor','meteor','chainLightning'
    ]
  },
  {
    id: 'destruction', name: 'Разрушение', art: '☠️',
    schools: ['dark', 'chaos'],
    tagline: 'Абсолютная агрессия',
    description: 'Три убийцы и чистый смертоносный урон без компромиссов',
    cards: [
      'darkArchmage','chaosLord','chaosColossus',
      'shadowBolt','shadowBolt','painCurse','painCurse','darkFire','darkFire','massCurse','massCurse',
      'lightning','lightning','fireball','fireball','inferno','inferno','explosion','explosion','weakCurse'
    ]
  },
];

function buildDeckFromList(cardIds) {
  return shuffle(cardIds.map((id, i) => ({
    ...CARD_DEFS[id],
    uid: `${id}_${i}_${Math.random().toString(36).slice(2)}`
  })));
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
