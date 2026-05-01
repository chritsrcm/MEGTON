/**
 * LEVEL - Geracao procedural, cenario, powerups, ladders, inimigos e bosses.
 */
const Level = {
  config: {
    width: 15000,
    basePlatformWidth: 200,
    minGap: 90,
    maxGap: 260,
    platformTypes: ['normal', 'moving', 'glitch', 'unstable', 'narrow']
  },

  levelNum: 1,
  difficulty: null,
  biome: null,

  platforms: [],
  platformsTemplate: [],
  enemies: [],
  enemiesTemplate: [],
  hazards: [],
  hazardsTemplate: [],
  powerups: [],
  powerupsTemplate: [],
  ladders: [],
  laddersTemplate: [],
  scenery: [],
  checkpoints: [],
  goal: null,
  boss: null,
  bossTemplate: null,
  bossProjectiles: [],
  pressureCeiling: null,
  pressureCeilingTemplate: null,
  narrative: null,
  currentCheckpointIndex: -1,
  checkpoint: { x: 100, y: 0 },

  getDifficulty(levelNum) {
    const tier = Utils.getDifficultyTier(levelNum);
    const local = ((levelNum - 1) % 10) + 1;
    const configs = [
      { minGap: 70, maxGap: 175, heightVar: 60, hazardChance: 0.08, enemyChance: 0.11, powerupChance: 0.11, ladderChance: 0.16, checkpointEvery: 7, enemySpeed: [1.3, 2.1], hazardDamage: 16, ceiling: false, types: ['normal', 'normal', 'normal', 'narrow'] },
      { minGap: 85, maxGap: 215, heightVar: 82, hazardChance: 0.14, enemyChance: 0.18, powerupChance: 0.09, ladderChance: 0.18, checkpointEvery: 8, enemySpeed: [1.7, 2.7], hazardDamage: 22, ceiling: false, types: ['normal', 'normal', 'moving', 'narrow', 'glitch'] },
      { minGap: 100, maxGap: 245, heightVar: 105, hazardChance: 0.2, enemyChance: 0.25, powerupChance: 0.075, ladderChance: 0.2, checkpointEvery: 9, enemySpeed: [2.2, 3.4], hazardDamage: 28, ceiling: false, types: ['normal', 'moving', 'glitch', 'unstable', 'narrow'] },
      { minGap: 112, maxGap: 270, heightVar: 128, hazardChance: 0.27, enemyChance: 0.32, powerupChance: 0.06, ladderChance: 0.22, checkpointEvery: 10, enemySpeed: [2.8, 4.0], hazardDamage: 34, ceiling: true, types: ['normal', 'moving', 'glitch', 'unstable', 'unstable', 'narrow'] },
      { minGap: 128, maxGap: 300, heightVar: 150, hazardChance: 0.34, enemyChance: 0.4, powerupChance: 0.045, ladderChance: 0.23, checkpointEvery: 11, enemySpeed: [3.3, 4.8], hazardDamage: 42, ceiling: true, types: ['moving', 'glitch', 'unstable', 'unstable', 'narrow', 'narrow'] },
      { minGap: 145, maxGap: 330, heightVar: 175, hazardChance: 0.42, enemyChance: 0.48, powerupChance: 0.035, ladderChance: 0.25, checkpointEvery: 12, enemySpeed: [3.8, 5.6], hazardDamage: 50, ceiling: true, types: ['moving', 'glitch', 'glitch', 'unstable', 'unstable', 'narrow'] }
    ];
    const config = configs[tier.index - 1];
    return {
      ...config,
      name: tier.name,
      tierIndex: tier.index,
      localLevel: local,
      platformTypes: local <= 2 && tier.index === 1 ? ['normal', 'normal', 'narrow'] : config.types
    };
  },

  getBiome(levelNum) {
    const biomes = ['robotLab', 'aquaCity', 'violetSkyline', 'rainBridge', 'sunsetCore', 'orbitRuins'];
    return biomes[Utils.getDifficultyTier(levelNum).index - 1];
  },

  getStartSpawn(canvasHeight) {
    return { x: 100, y: canvasHeight - 96 };
  },

  generate(levelNum, canvasHeight) {
    this.levelNum = levelNum;
    this.difficulty = this.getDifficulty(levelNum);
    this.biome = this.getBiome(levelNum);
    this.config.width = Math.min(23000, 7600 + levelNum * 250 + this.difficulty.tierIndex * 420);
    this.config.minGap = this.difficulty.minGap;
    this.config.maxGap = this.difficulty.maxGap;
    this.config.platformTypes = this.difficulty.platformTypes;

    this.platforms = [];
    this.enemies = [];
    this.hazards = [];
    this.powerups = [];
    this.ladders = [];
    this.scenery = [];
    this.checkpoints = [];
    this.bossProjectiles = [];
    this.boss = null;
    this.bossTemplate = null;
    this.pressureCeiling = this.difficulty.ceiling ? {
      y: -70,
      targetY: canvasHeight * (0.36 + this.difficulty.tierIndex * 0.018),
      speed: 0.015 + this.difficulty.tierIndex * 0.006,
      damage: 6 + this.difficulty.tierIndex * 2,
      active: false
    } : null;
    this.pressureCeilingTemplate = this.pressureCeiling ? { ...this.pressureCeiling } : null;
    this.currentCheckpointIndex = -1;
    this.setNarrative('MEGTON', this.getStory(levelNum), 430);

    const spawn = this.getStartSpawn(canvasHeight);
    this.checkpoint = { x: spawn.x, y: spawn.y };

    let currentX = 0;
    let currentY = canvasHeight - 50;
    let pIdx = 0;
    let mainPlatforms = 0;

    const startPlatform = {
      x: 0, y: canvasHeight - 50, width: 430, height: 50,
      type: 'normal', id: pIdx++, visible: true, alpha: 1
    };
    this.platforms.push(startPlatform);
    this.addSceneryForPlatform(startPlatform);
    currentX = 430;

    while (currentX < this.config.width - 760) {
      const type = this.config.platformTypes[
        Utils.randomInt(0, this.config.platformTypes.length)
      ];
      const dynamicMaxGap = Math.max(
        this.config.minGap + 35,
        this.config.maxGap * (currentX / this.config.width + 0.55)
      );
      const gap = Utils.randomRange(this.config.minGap, dynamicMaxGap);
      const width = type === 'narrow'
        ? Utils.randomRange(78, 118)
        : Utils.randomRange(140, 245);

      let hVar = Utils.randomInt(-this.difficulty.heightVar, this.difficulty.heightVar);
      if (currentX < 1800) hVar = Utils.randomInt(-55, 55);
      currentY = Utils.clamp(
        currentY + hVar,
        Math.max(95, canvasHeight - 470),
        canvasHeight - 82
      );

      const platform = {
        x: currentX + gap, y: currentY, width, height: 20,
        type, id: pIdx++, visible: true, timer: 0, alpha: 1,
        steppedOn: false, fallTimer: 0
      };

      if (type === 'moving') {
        platform.dx = Utils.randomRange(this.difficulty.enemySpeed[0], this.difficulty.enemySpeed[1]) *
          (Math.random() > 0.5 ? 1 : -1);
        platform.minX = platform.x - 110;
        platform.maxX = platform.x + platform.width + 110;
      }
      if (type === 'glitch') platform.glitch = true;
      if (type === 'unstable') platform.unstable = true;

      this.platforms.push(platform);
      this.addSceneryForPlatform(platform);
      mainPlatforms++;

      if (Math.random() < this.difficulty.hazardChance && currentX > 900 && width > 100) {
        this.hazards.push({
          x: platform.x + width / 2 - 38,
          y: currentY - 20,
          width: 76, height: 20,
          damage: this.difficulty.hazardDamage + levelNum
        });
      }

      if (Math.random() < this.difficulty.enemyChance && currentX > 700) {
        const enemy = {
          x: platform.x + width / 2 - 16,
          y: currentY - 40,
          width: 32, height: 32,
          speed: Utils.randomRange(this.difficulty.enemySpeed[0], this.difficulty.enemySpeed[1]),
          direction: Math.random() > 0.5 ? 1 : -1,
          minX: platform.x,
          maxX: platform.x + width,
          alive: true
        };
        this.enemies.push(enemy);
      }

      if (Math.random() < this.difficulty.powerupChance) {
        this.addPowerupOnPlatform(platform);
      }

      if (Math.random() < this.difficulty.ladderChance && width > 120 && currentX > 1000) {
        const bonusPlatform = this.addBonusLadder(platform, pIdx++);
        if (bonusPlatform) this.platforms.push(bonusPlatform);
      }

      if (mainPlatforms % this.difficulty.checkpointEvery === 0) {
        this.checkpoints.push({
          x: platform.x + Math.min(50, platform.width / 2),
          y: platform.y - 50,
          spawnY: platform.y - 64,
          reached: false
        });
      }

      currentX += gap + width;
    }

    const finalPlatform = {
      x: this.config.width - 700,
      y: canvasHeight - 80,
      width: 700, height: 50,
      type: 'normal', id: pIdx++, visible: true, alpha: 1
    };
    this.platforms.push(finalPlatform);
    this.addSceneryForPlatform(finalPlatform);

    this.goal = {
      x: this.config.width - 120,
      y: canvasHeight - 145,
      width: 64, height: 64
    };

    if (levelNum % 2 === 0) {
      this.boss = this.createBoss(levelNum, canvasHeight);
      this.bossTemplate = { ...this.boss };
    }

    this.trimPowerups();
    this.cacheTemplates();
  },

  cacheTemplates() {
    this.platformsTemplate = this.platforms.map(p => ({ ...p }));
    this.enemiesTemplate = this.enemies.map(e => ({ ...e }));
    this.hazardsTemplate = this.hazards.map(h => ({ ...h }));
    this.powerupsTemplate = this.powerups.map(p => ({ ...p }));
    this.laddersTemplate = this.ladders.map(l => ({ ...l }));
    this.pressureCeilingTemplate = this.pressureCeiling ? { ...this.pressureCeiling } : null;
  },

  addSceneryForPlatform(platform) {
    if (platform.width < 100 || Math.random() < 0.35) return;

    const types = ['lamp', 'crate', 'antenna', 'sign'];
    const type = types[Utils.randomInt(0, types.length)];
    this.scenery.push({
      type,
      x: platform.x + Utils.randomRange(18, Math.max(24, platform.width - 42)),
      y: platform.y,
      variant: Utils.randomInt(0, 3)
    });
  },

  addPowerupOnPlatform(platform, forcedType) {
    const types = ['battery', 'shield', 'overdrive', 'blade'];
    const type = forcedType || types[Utils.randomInt(0, types.length)];
    this.powerups.push({
      type,
      x: platform.x + Utils.randomRange(22, Math.max(26, platform.width - 42)),
      y: platform.y - 42,
      width: 24,
      height: 24,
      active: true
    });
  },

  addBonusLadder(platform, id) {
    const ladderHeight = Utils.randomRange(115, 190);
    const topY = Utils.clamp(platform.y - ladderHeight, 70, platform.y - 92);
    const ladderX = platform.x + Utils.clamp(platform.width * 0.55, 54, platform.width - 54);
    const bonusPlatform = {
      x: ladderX - 58,
      y: topY,
      width: 116,
      height: 18,
      type: 'bonus',
      id,
      visible: true,
      alpha: 1
    };

    this.ladders.push({
      x: ladderX - 9,
      y: topY,
      width: 18,
      height: platform.y - topY + 4
    });
    if (Math.random() < 0.18) this.addPowerupOnPlatform(bonusPlatform);
    return bonusPlatform;
  },

  trimPowerups() {
    const maxPowerups = Math.max(2, 8 - this.difficulty.tierIndex);
    if (this.powerups.length <= maxPowerups) return;

    this.powerups = this.powerups
      .map(item => ({ item, roll: Math.random() }))
      .sort((a, b) => a.roll - b.roll)
      .slice(0, maxPowerups)
      .map(entry => entry.item);
  },

  createBoss(levelNum, canvasHeight) {
    const bossDefs = [
      { type: 'sentinel', name: 'Sentinela Neon', width: 74, height: 72, health: 9, color: '#ff2a5f', shot: '#ff7a2f' },
      { type: 'spider', name: 'Aranha de Dados', width: 84, height: 62, health: 12, color: '#b46bff', shot: '#d7a8ff' },
      { type: 'prism', name: 'Nucleo Prisma', width: 86, height: 86, health: 15, color: '#00f5ff', shot: '#9ffcff' },
      { type: 'magnet', name: 'Guardiao Magnetico', width: 94, height: 76, health: 18, color: '#ffd700', shot: '#fff0a0' },
      { type: 'specter', name: 'Espectro de Fase', width: 88, height: 84, health: 20, color: '#7d5cff', shot: '#b9a8ff' },
      { type: 'megton', name: 'Avatar MEGTON', width: 116, height: 98, health: 26, color: '#ff0055', shot: '#00ff9d' }
    ];
    const bossIndex = Math.floor(levelNum / 2);
    const def = bossDefs[(bossIndex - 1) % bossDefs.length];
    const cycle = Math.ceil(bossIndex / bossDefs.length);
    const baseY = canvasHeight - 80 - def.height;

    return {
      ...def,
      name: cycle > 1 ? `${def.name} MK-${cycle}` : def.name,
      x: this.config.width - 560,
      y: baseY,
      baseY,
      minX: this.config.width - 680,
      maxX: this.config.width - 165,
      health: Math.round(def.health + levelNum * 0.35 + cycle * 2),
      maxHealth: Math.round(def.health + levelNum * 0.35 + cycle * 2),
      speed: 1.35 + levelNum * 0.055 + cycle * 0.12,
      direction: -1,
      timer: 0,
      hitTimer: 0,
      announced: false,
      active: false,
      alive: true
    };
  },

  getStory(levelNum) {
    const tier = Utils.getDifficultyTier(levelNum);
    const chapter = Math.ceil(levelNum / 10);
    const lines = [
      'O laboratorio acordou. Christopher, sincronize o nucleo e siga em frente.',
      'A cidade azul esta vazando memoria. Pule pelos telhados e nao confie no chao.',
      'As torres violetas sumiram do mapa oficial. Megton esta escondendo algo nelas.',
      'O teto de seguranca comecou a descer. Corra antes que a cidade te compacte.',
      'O setor impossivel nao foi feito para humanos. Ainda bem que voce trouxe um robo.',
      'Extremo: aqui a simulacao morde de volta. Derrube o avatar final da Megton.'
    ];
    return `CAPITULO ${chapter} / ${tier.name}: ${lines[chapter - 1]}`;
  },

  setNarrative(speaker, text, timer = 300) {
    this.narrative = { speaker, text, timer };
  },

  getLadderAt(player) {
    return this.ladders.find(ladder => Utils.rectIntersect(player, {
      x: ladder.x - 14,
      y: ladder.y - 6,
      width: ladder.width + 28,
      height: ladder.height + 12
    }));
  },

  update(player) {
    if (this.narrative && this.narrative.timer > 0) this.narrative.timer--;
    this.updatePressureCeiling(player);

    for (let p of this.platforms) {
      if (p.glitch) {
        p.timer++;
        if (p.timer > 34) {
          p.visible = !p.visible;
          p.timer = 0;
        }
        p.alpha = p.timer > 24 ? 0.45 : 1;
      }

      if (p.type === 'moving') {
        const prevX = p.x;
        p.x += p.dx;
        if (p.x <= p.minX || p.x + p.width >= p.maxX) {
          p.dx *= -1;
        }
        if (player.grounded &&
            player.y + player.height >= p.y &&
            player.y + player.height <= p.y + 10 &&
            player.x + player.width > prevX &&
            player.x < prevX + p.width) {
          player.x += p.dx;
        }
      }

      if (p.unstable && player.grounded) {
        if (player.x + player.width > p.x &&
            player.x < p.x + p.width &&
            player.y + player.height >= p.y &&
            player.y + player.height <= p.y + 15) {
          p.steppedOn = true;
          p.fallTimer = (p.fallTimer || 0) + 1;
          if (p.fallTimer > 20) p.visible = false;
        }
      }
    }

    for (let item of this.powerups) {
      if (!item.active) continue;
      if (Utils.rectIntersect(player, item)) {
        item.active = false;
        player.pickupPowerup(item.type);
        Effects.triggerGlitch(16);
      }
    }

    for (let e of this.enemies) {
      if (!e.alive) continue;
      e.x += e.speed * e.direction;
      if (e.x <= e.minX || e.x + e.width >= e.maxX) {
        e.direction *= -1;
      }
    }

    for (let e of this.enemies) {
      if (!e.alive) continue;

      if (player.attackHitbox && Utils.rectIntersect(player.attackHitbox, e)) {
        e.alive = false;
        Effects.triggerGlitch(10);
        continue;
      }

      if (Utils.rectIntersect(player, e)) {
        player.takeDamage(22 + this.levelNum, e.x);
      }
    }

    this.enemies = this.enemies.filter(e => e.alive);

    for (let h of this.hazards) {
      if (Utils.rectIntersect(player, h)) {
        player.takeDamage(h.damage, h.x + h.width / 2);
      }
    }

    this.checkpoints.forEach((cp, index) => {
      if (!cp.reached && Utils.rectIntersect(player, {
        x: cp.x - 12, y: cp.y - 25, width: 54, height: 56
      })) {
        this.currentCheckpointIndex = Math.max(this.currentCheckpointIndex, index);
        this.checkpoint = { x: cp.x, y: cp.spawnY };
        this.checkpoints.forEach((check, checkIndex) => {
          check.reached = checkIndex <= this.currentCheckpointIndex;
        });
        player.health = player.maxHealth;
        Effects.triggerGlitch(20);
      }
    });

    this.updateBoss(player);
  },

  updatePressureCeiling(player) {
    const ceiling = this.pressureCeiling;
    if (!ceiling) return;

    if (player.x > this.config.width * 0.15) ceiling.active = true;
    if (!ceiling.active) return;

    ceiling.y = Math.min(ceiling.targetY, ceiling.y + ceiling.speed);
    if (player.y < ceiling.y) {
      player.takeDamage(ceiling.damage, player.x);
      player.y = ceiling.y + 4;
    }
  },

  updateBoss(player) {
    const boss = this.boss;
    if (!boss || !boss.alive) return;

    if (boss.hitTimer > 0) boss.hitTimer--;
    if (Math.abs(player.x - boss.x) < 950) {
      boss.active = true;
      if (!boss.announced) {
        boss.announced = true;
        this.setNarrative(boss.name, 'Protocolo de duelo iniciado. Mostre que o piloto ainda manda na maquina.', 300);
        if (typeof Sound !== 'undefined') Sound.play('boss');
      }
    }
    if (!boss.active) return;

    boss.timer++;
    const healthRatio = boss.health / boss.maxHealth;
    const phaseSpeed = healthRatio < 0.45 ? 1.35 : 1;

    if (boss.type === 'sentinel') {
      boss.x += boss.direction * boss.speed * phaseSpeed;
      if (boss.timer % 95 === 0) this.spawnBossProjectile(boss, player, 6, 18);
    } else if (boss.type === 'spider') {
      boss.x += boss.direction * boss.speed * 1.15 * phaseSpeed;
      boss.y = boss.baseY + Math.sin(boss.timer / 12) * 14;
      if (boss.timer % 80 === 0) this.spawnBossProjectile(boss, player, 5.5, 20, 0.18);
    } else if (boss.type === 'prism') {
      boss.y = boss.baseY + Math.sin(boss.timer / 18) * 24;
      if (boss.timer % 72 === 0) {
        this.spawnBossProjectile(boss, player, 5.2, 19, -0.22);
        this.spawnBossProjectile(boss, player, 5.2, 19, 0);
        this.spawnBossProjectile(boss, player, 5.2, 19, 0.22);
      }
    } else if (boss.type === 'magnet') {
      boss.x += boss.direction * boss.speed * 0.8 * phaseSpeed;
      if (boss.timer % 180 < 76) {
        player.x += player.x < boss.x ? 0.55 : -0.55;
      }
      if (boss.timer % 62 === 0) this.spawnBossProjectile(boss, player, 6.3, 22);
    } else if (boss.type === 'specter') {
      boss.x += boss.direction * boss.speed * 1.35 * phaseSpeed;
      boss.y = boss.baseY + Math.sin(boss.timer / 8) * 30;
      boss.active = true;
      if (boss.timer % 58 === 0) {
        this.spawnBossProjectile(boss, player, 6.8, 22, -0.18);
        this.spawnBossProjectile(boss, player, 6.8, 22, 0.18);
      }
    } else {
      boss.x += boss.direction * boss.speed * phaseSpeed;
      boss.y = boss.baseY + Math.sin(boss.timer / 14) * 18;
      if (boss.timer % (healthRatio < 0.5 ? 48 : 68) === 0) {
        this.spawnBossProjectile(boss, player, 6, 24, -0.3);
        this.spawnBossProjectile(boss, player, 6, 24, 0);
        this.spawnBossProjectile(boss, player, 6, 24, 0.3);
      }
    }

    if (boss.x <= boss.minX || boss.x + boss.width >= boss.maxX) {
      boss.direction *= -1;
      boss.x = Utils.clamp(boss.x, boss.minX, boss.maxX - boss.width);
    }

    if (player.attackHitbox && boss.hitTimer <= 0 && Utils.rectIntersect(player.attackHitbox, boss)) {
      boss.health -= player.getAttackDamage();
      boss.hitTimer = 18;
      boss.direction = player.x < boss.x ? 1 : -1;
      Effects.triggerShake(10);
      Effects.triggerGlitch(20);

      if (boss.health <= 0) {
        boss.alive = false;
        this.bossProjectiles = [];
        this.addPowerupOnPlatform({
          x: boss.x,
          y: boss.y + boss.height + 12,
          width: boss.width,
          height: 20
        }, 'battery');
        Effects.triggerShake(25);
        Effects.triggerGlitch(45);
        this.setNarrative('MEGTON', 'Nucleo vencido. A rota abriu, mas a cidade ja esta recalculando sua proxima queda.', 290);
        return;
      }
    }

    if (Utils.rectIntersect(player, boss)) {
      player.takeDamage(28 + this.levelNum, boss.x + boss.width / 2);
    }

    for (let shot of this.bossProjectiles) {
      shot.x += shot.vx;
      shot.y += shot.vy;
      if (shot.gravity) shot.vy += shot.gravity;

      if (shot.active && Utils.rectIntersect(player, shot)) {
        shot.active = false;
        player.takeDamage(shot.damage, shot.x);
      }
    }

    this.bossProjectiles = this.bossProjectiles.filter(shot =>
      shot.active &&
      shot.x > -200 &&
      shot.x < this.config.width + 300 &&
      shot.y > -200 &&
      shot.y < 1600
    );
  },

  spawnBossProjectile(boss, player, speed, damage, spread = 0) {
    const originX = boss.x + boss.width / 2;
    const originY = boss.y + boss.height / 2;
    let dx = player.x + player.width / 2 - originX;
    let dy = player.y + player.height / 2 - originY;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;

    const cos = Math.cos(spread);
    const sin = Math.sin(spread);
    const vx = (dx * cos - dy * sin) * speed;
    const vy = (dx * sin + dy * cos) * speed;

    this.bossProjectiles.push({
      x: originX - 8,
      y: originY - 8,
      width: 16,
      height: 16,
      vx,
      vy,
      damage,
      color: boss.shot,
      active: true
    });
  },

  checkGoal(player) {
    if (!this.goal) return false;
    if (this.boss && this.boss.alive) return false;
    return Utils.rectIntersect(player, this.goal);
  },

  resetToCheckpoint(player) {
    const cp = this.checkpoint || this.getStartSpawn(800);
    player.x = cp.x;
    player.y = cp.y;
    player.reset();

    this.platforms = this.platformsTemplate.map(p => ({ ...p }));
    this.enemies = this.enemiesTemplate.map(e => ({ ...e, alive: true }));
    this.hazards = this.hazardsTemplate.map(h => ({ ...h }));
    this.powerups = this.powerupsTemplate.map(p => ({ ...p, active: true }));
    this.ladders = this.laddersTemplate.map(l => ({ ...l }));
    this.boss = this.bossTemplate ? { ...this.bossTemplate } : null;
    this.bossProjectiles = [];
    this.pressureCeiling = this.pressureCeilingTemplate ? { ...this.pressureCeilingTemplate } : null;

    this.checkpoints.forEach((check, index) => {
      check.reached = index <= this.currentCheckpointIndex;
    });

    Effects.triggerShake(24);
    Effects.triggerGlitch(36);
  },

  drawBackground(ctx, cameraX, canvas) {
    const w = canvas.width;
    const h = canvas.height;
    const palette = {
      robotLab: ['#071522', '#164155', '#8fe9ff', '#ff5f9a', '#233348'],
      aquaCity: ['#082136', '#164b61', '#9ffcff', '#ff6d9f', '#1b3348'],
      violetSkyline: ['#12042a', '#2b0750', '#b46bff', '#ff2aef', '#1b1238'],
      rainBridge: ['#06131c', '#123247', '#8fe9ff', '#ffd27a', '#172333'],
      sunsetCore: ['#190915', '#44213b', '#ffb15c', '#ff2a5f', '#281524'],
      orbitRuins: ['#050713', '#101d30', '#9b7cff', '#00ff9d', '#1c2430']
    }[this.biome || 'robotLab'];

    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, palette[0]);
    gradient.addColorStop(0.65, palette[1]);
    gradient.addColorStop(1, '#020308');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    ctx.globalAlpha = 0.45;
    ctx.fillStyle = palette[2];
    for (let i = 0; i < 55; i++) {
      const x = (i * 137 - cameraX * 0.12) % (w + 140);
      const y = 32 + ((i * 47) % Math.max(80, h * 0.45));
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.globalAlpha = 1;

    const skylineY = h * 0.62;
    for (let layer = 0; layer < 2; layer++) {
      const spacing = layer === 0 ? 170 : 115;
      const scroll = cameraX * (layer === 0 ? 0.18 : 0.32);
      ctx.fillStyle = layer === 0 ? palette[4] : '#12172b';
      for (let x = -((scroll % spacing) + spacing); x < w + spacing; x += spacing) {
        const height = (layer === 0 ? 110 : 155) + ((Math.abs(Math.sin((x + scroll) * 0.01)) * 75) | 0);
        ctx.fillRect(x, skylineY - height, spacing * 0.68, height);
        ctx.fillStyle = layer === 0 ? palette[3] : palette[2];
        ctx.fillRect(x + 18, skylineY - height + 22, 22, 4);
        ctx.fillRect(x + 62, skylineY - height + 54, 28, 4);
        ctx.fillStyle = layer === 0 ? palette[4] : '#12172b';
      }
    }

    // Faixas e paineis inspirados no fundo robo/cyberpunk enviado.
    const panelY = h * 0.12;
    ctx.fillStyle = 'rgba(4, 8, 18, 0.72)';
    ctx.fillRect(0, panelY, w, 44);
    ctx.fillRect(0, h * 0.82, w, 36);
    for (let i = 0; i < 10; i++) {
      const x = ((i * 180 - cameraX * 0.22) % (w + 220)) - 80;
      const y = panelY + (i % 2) * 8;
      ctx.fillStyle = '#1d2a3d';
      ctx.fillRect(x, y, 112, 28);
      ctx.strokeStyle = palette[2];
      ctx.strokeRect(x + 8, y + 8, 70, 8);
      ctx.fillStyle = palette[3];
      ctx.fillRect(x + 14, y + 11, 46, 3);
    }

    if (this.biome === 'orbitRuins') {
      ctx.fillStyle = 'rgba(255, 177, 92, 0.95)';
      ctx.beginPath();
      ctx.ellipse(w * 0.72 - cameraX * 0.03, h * 0.22, 70, 70, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,245,255,0.65)';
      ctx.beginPath();
      ctx.ellipse(w * 0.72 - cameraX * 0.03, h * 0.22, 112, 18, -0.25, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(0,245,255,0.12)';
    ctx.lineWidth = 1;
    const gridOffset = (cameraX * 0.55) % 42;
    for (let x = -gridOffset; x < w + 42; x += 42) {
      ctx.beginPath();
      ctx.moveTo(x, h * 0.72);
      ctx.lineTo(x - 60, h);
      ctx.stroke();
    }
    for (let y = h * 0.72; y < h; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  },

  draw(ctx, cameraX) {
    this.drawLadders(ctx, cameraX);
    this.drawPlatforms(ctx, cameraX);
    this.drawScenery(ctx, cameraX);
    this.drawHazards(ctx, cameraX);
    this.drawGoal(ctx, cameraX);
    this.drawCheckpoints(ctx, cameraX);
    this.drawPowerups(ctx, cameraX);
    this.drawBossProjectiles(ctx, cameraX);
    this.drawPressureCeiling(ctx);

    for (let e of this.enemies) {
      if (e.alive) this.drawEnemy(ctx, e.x - cameraX, e.y);
    }

    if (this.boss && this.boss.alive) {
      this.drawBoss(ctx, this.boss, this.boss.x - cameraX, this.boss.y);
    }
  },

  drawPlatforms(ctx, cameraX) {
    for (let p of this.platforms) {
      if (!p.visible) continue;

      ctx.globalAlpha = p.alpha || 1;
      const x = p.x - cameraX;

      ctx.fillStyle = p.type === 'bonus' ? '#253550' : '#2a3142';
      ctx.fillRect(x, p.y, p.width, p.height);

      ctx.fillStyle = p.type === 'unstable' && p.steppedOn ? '#ff2a5f' : Utils.COLORS.nodeOpen;
      ctx.fillRect(x, p.y, p.width, 3);

      ctx.fillStyle = p.type === 'glitch' ? '#9b7cff' : '#4a5568';
      ctx.fillRect(x, p.y + 3, p.width, 4);

      if (p.type === 'moving') {
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(x + 8, p.y + p.height - 5, p.width - 16, 3);
      }
    }
    ctx.globalAlpha = 1;
  },

  drawPressureCeiling(ctx) {
    const ceiling = this.pressureCeiling;
    if (!ceiling || ceiling.y <= 0) return;

    ctx.fillStyle = 'rgba(255, 42, 95, 0.08)';
    ctx.fillRect(0, 0, ctx.canvas.width, ceiling.y);
    ctx.strokeStyle = 'rgba(255, 42, 95, 0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, ceiling.y);
    ctx.lineTo(ctx.canvas.width, ceiling.y);
    ctx.stroke();

    ctx.fillStyle = '#ff2a5f';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TETO DE SEGURANCA DESCENDO', ctx.canvas.width / 2, ceiling.y + 18);
    ctx.textAlign = 'left';
  },

  drawLadders(ctx, cameraX) {
    ctx.fillStyle = '#6a4f2a';
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    for (let ladder of this.ladders) {
      const x = ladder.x - cameraX;
      ctx.fillRect(x, ladder.y, 4, ladder.height);
      ctx.fillRect(x + ladder.width - 4, ladder.y, 4, ladder.height);
      for (let y = ladder.y + 8; y < ladder.y + ladder.height; y += 14) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + ladder.width, y);
        ctx.stroke();
      }
    }
  },

  drawScenery(ctx, cameraX) {
    for (let item of this.scenery) {
      const x = item.x - cameraX;
      const y = item.y;
      if (item.type === 'lamp') {
        ctx.fillStyle = '#151923';
        ctx.fillRect(x, y - 44, 6, 44);
        ctx.fillStyle = Utils.COLORS.heroVisor;
        ctx.shadowColor = Utils.COLORS.heroVisor;
        ctx.shadowBlur = 12;
        ctx.fillRect(x - 8, y - 48, 22, 8);
        ctx.shadowBlur = 0;
      } else if (item.type === 'crate') {
        ctx.fillStyle = '#3d2f24';
        ctx.fillRect(x - 10, y - 22, 24, 22);
        ctx.strokeStyle = '#ffd700';
        ctx.strokeRect(x - 10, y - 22, 24, 22);
      } else if (item.type === 'antenna') {
        ctx.fillStyle = '#8a95a5';
        ctx.fillRect(x, y - 54, 4, 54);
        ctx.fillStyle = '#ff2a5f';
        ctx.fillRect(x - 8, y - 58, 20, 4);
      } else {
        ctx.fillStyle = '#0b0d16';
        ctx.fillRect(x - 20, y - 38, 42, 20);
        ctx.fillStyle = item.variant % 2 ? '#00ff9d' : '#ff2a5f';
        ctx.fillRect(x - 15, y - 33, 32, 4);
      }
    }
  },

  drawHazards(ctx, cameraX) {
    ctx.fillStyle = Utils.COLORS.hazard;
    for (let h of this.hazards) {
      for (let i = 0; i < h.width; i += 12) {
        ctx.beginPath();
        ctx.moveTo(h.x - cameraX + i, h.y + h.height);
        ctx.lineTo(h.x - cameraX + i + 6, h.y);
        ctx.lineTo(h.x - cameraX + i + 12, h.y + h.height);
        ctx.fill();
      }
    }
  },

  drawGoal(ctx, cameraX) {
    if (!this.goal) return;
    const locked = this.boss && this.boss.alive;
    const x = this.goal.x - cameraX;

    ctx.fillStyle = locked ? '#3a1022' : Utils.COLORS.nodeComplete;
    ctx.shadowColor = locked ? '#ff2a5f' : Utils.COLORS.nodeComplete;
    ctx.shadowBlur = 16;
    ctx.fillRect(x, this.goal.y, this.goal.width, this.goal.height);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#020308';
    ctx.fillRect(x + 14, this.goal.y + 12, this.goal.width - 28, this.goal.height - 24);

    ctx.fillStyle = locked ? '#ff2a5f' : '#ffffff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(locked ? 'BOSS' : 'SAIR', x + this.goal.width / 2, this.goal.y - 10);
    ctx.textAlign = 'left';
  },

  drawCheckpoints(ctx, cameraX) {
    for (let cp of this.checkpoints) {
      ctx.fillStyle = cp.reached ? Utils.COLORS.nodeCurrent : '#333';
      ctx.fillRect(cp.x - cameraX - 5, cp.y - 20, 10, 40);
      ctx.fillStyle = cp.reached ? Utils.COLORS.nodeComplete : '#555';
      ctx.fillRect(cp.x - cameraX - 10, cp.y - 25, 20, 10);
    }
  },

  drawPowerups(ctx, cameraX) {
    for (let item of this.powerups) {
      if (!item.active) continue;
      const bob = Math.sin(Date.now() / 180 + item.x) * 3;
      const x = item.x - cameraX;
      const y = item.y + bob;
      const color = this.getPowerupColor(item.type);

      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(x + 12, y);
      ctx.lineTo(x + 24, y + 12);
      ctx.lineTo(x + 12, y + 24);
      ctx.lineTo(x, y + 12);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#020308';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(this.getPowerupLabel(item.type), x + 12, y + 16);
      ctx.textAlign = 'left';
    }
  },

  getPowerupColor(type) {
    return {
      battery: '#00ff9d',
      shield: '#00f5ff',
      overdrive: '#ffd700',
      blade: '#ff2a5f'
    }[type] || '#ffffff';
  },

  getPowerupLabel(type) {
    return {
      battery: '+',
      shield: 'S',
      overdrive: 'O',
      blade: 'B'
    }[type] || '?';
  },

  drawBossProjectiles(ctx, cameraX) {
    for (let shot of this.bossProjectiles) {
      ctx.fillStyle = shot.color;
      ctx.shadowColor = shot.color;
      ctx.shadowBlur = 10;
      ctx.fillRect(shot.x - cameraX, shot.y, shot.width, shot.height);
      ctx.shadowBlur = 0;
    }
  },

  drawEnemy(ctx, x, y) {
    const step = Math.sin(Date.now() / 130 + x) * 3;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(x + 16, y + 35, 16, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#07090f';
    ctx.fillRect(x + 7, y + 12, 20, 18);
    ctx.fillStyle = '#3b414d';
    ctx.fillRect(x + 9, y + 14, 16, 14);
    ctx.fillStyle = '#6d7480';
    ctx.fillRect(x + 11, y + 16, 5, 4);

    ctx.fillStyle = '#07090f';
    ctx.fillRect(x + 5, y + 2, 24, 13);
    ctx.fillStyle = '#4b535f';
    ctx.fillRect(x + 7, y, 21, 13);
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(x + 5, y + 5, 17, 5);
    ctx.fillStyle = '#00f5ff';
    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur = 6;
    ctx.fillRect(x + 20, y + 8, 8, 3);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#242832';
    ctx.fillRect(x + 2, y + 17 + step, 7, 9);
    ctx.fillRect(x + 25, y + 16 - step, 7, 9);
    ctx.fillRect(x + 9 + step, y + 28, 6, 8);
    ctx.fillRect(x + 19 - step, y + 28, 6, 8);
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(x + 11 + step, y + 34, 7, 3);
    ctx.fillRect(x + 17 - step, y + 34, 7, 3);
  },

  drawBoss(ctx, boss, x, y) {
    ctx.globalAlpha = boss.hitTimer > 0 ? 0.55 : 1;
    ctx.fillStyle = '#050510';
    ctx.fillRect(x + 8, y + 8, boss.width - 16, boss.height - 6);

    ctx.fillStyle = boss.color;
    ctx.shadowColor = boss.color;
    ctx.shadowBlur = 16;

    if (boss.type === 'spider') {
      ctx.fillRect(x + 18, y + 18, boss.width - 36, boss.height - 24);
      for (let i = 0; i < 4; i++) {
        const legY = y + 20 + i * 10;
        ctx.fillRect(x + 4, legY, 18, 4);
        ctx.fillRect(x + boss.width - 22, legY, 18, 4);
      }
    } else if (boss.type === 'prism') {
      ctx.beginPath();
      ctx.moveTo(x + boss.width / 2, y);
      ctx.lineTo(x + boss.width, y + boss.height / 2);
      ctx.lineTo(x + boss.width / 2, y + boss.height);
      ctx.lineTo(x, y + boss.height / 2);
      ctx.closePath();
      ctx.fill();
    } else if (boss.type === 'magnet') {
      ctx.fillRect(x + 10, y + 12, 24, boss.height - 24);
      ctx.fillRect(x + boss.width - 34, y + 12, 24, boss.height - 24);
      ctx.fillRect(x + 24, y + 20, boss.width - 48, 18);
    } else if (boss.type === 'specter') {
      ctx.globalAlpha = boss.hitTimer > 0 ? 0.45 : 0.78;
      ctx.beginPath();
      ctx.ellipse(x + boss.width / 2, y + boss.height / 2, boss.width / 2, boss.height / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 28, y + 30, 10, 5);
      ctx.fillRect(x + 52, y + 30, 10, 5);
    } else if (boss.type === 'megton') {
      ctx.fillRect(x + 12, y + 18, boss.width - 24, boss.height - 18);
      ctx.fillRect(x + 26, y, boss.width - 52, 32);
      ctx.fillStyle = '#00ff9d';
      ctx.fillRect(x + 38, y + 14, 40, 5);
    } else {
      ctx.fillRect(x + 10, y + 14, boss.width - 20, boss.height - 14);
      ctx.fillRect(x + 22, y, boss.width - 44, 28);
    }

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
};
