/**
 * MAP - Campanha de 60 fases com estrelas por desempenho.
 */
const WorldMap = {
  TOTAL_LEVELS: 60,
  completedLevels: [],
  levelRatings: {},

  player: {
    x: 0, y: 0, facing: 1, currentLevel: 1
  },

  canvas: null,
  nodes: [],
  path: [],

  init(canvasElement) {
    this.canvas = canvasElement;
    this.completedLevels = Utils.loadProgress('glitchRunner_completedLevels', [0]);
    this.levelRatings = Utils.loadProgress('glitchRunner_levelRatings', {});
    const lastCompleted = Math.max(0, ...this.completedLevels);
    this.player.currentLevel = Utils.clamp(lastCompleted + 1, 1, this.TOTAL_LEVELS);
    this.generateNodes(canvasElement.width, canvasElement.height);
    this.generatePath();
    this.positionPlayer();
  },

  getTier(levelNum) {
    return Utils.getDifficultyTier(levelNum);
  },

  generateNodes(w, h) {
    this.nodes = [];
    const marginX = Math.max(54, w * 0.07);
    const top = Math.max(110, h * 0.17);
    const usableW = w - marginX * 2;
    const usableH = Math.max(300, h * 0.68);
    const rows = 6;
    const cols = 10;

    for (let i = 0; i < this.TOTAL_LEVELS; i++) {
      const level = i + 1;
      const row = Math.floor(i / cols);
      const col = i % cols;
      const tier = this.getTier(level);
      const wave = Math.sin((col + row) * 0.85) * Math.min(18, h * 0.02);
      const x = marginX + (usableW / (cols - 1)) * col;
      const y = top + (usableH / (rows - 1)) * row + wave;

      this.nodes.push({
        id: level,
        x,
        y,
        row,
        col,
        tier,
        width: 34,
        height: 34,
        unlocked: this.completedLevels.includes(level - 1) || level === 1,
        completed: this.completedLevels.includes(level),
        rating: this.levelRatings[level] || null,
        type: level % 10 === 0 ? 'gate' : (level % 2 === 0 ? 'boss' : 'stage')
      });
    }
  },

  generatePath() {
    this.path = this.nodes.map(node => ({ x: node.x, y: node.y }));
  },

  positionPlayer() {
    const node = this.nodes[this.player.currentLevel - 1];
    if (node) {
      this.player.x = node.x;
      this.player.y = node.y;
    }
  },

  update(input, onStartLevel) {
    const speed = 4.3;

    if (input.isDown('ArrowLeft', 'KeyA')) {
      this.player.x -= speed;
      this.player.facing = -1;
    }
    if (input.isDown('ArrowRight', 'KeyD')) {
      this.player.x += speed;
      this.player.facing = 1;
    }
    if (input.isDown('ArrowUp', 'KeyW')) this.player.y -= speed;
    if (input.isDown('ArrowDown', 'KeyS')) this.player.y += speed;

    if (this.canvas) {
      this.player.x = Utils.clamp(this.player.x, 32, this.canvas.width - 32);
      this.player.y = Utils.clamp(this.player.y, 82, this.canvas.height - 34);
    }

    for (let node of this.nodes) {
      const dist = Math.hypot(this.player.x - node.x, this.player.y - node.y);
      if (dist < 35 && (node.unlocked || node.completed)) {
        this.player.currentLevel = node.id;
        if (input.consume('Enter')) {
          onStartLevel(node.id);
          return;
        }
      }
    }

    if (input.consume('Escape')) return 'menu';
    return 'map';
  },

  draw(ctx) {
    if (!this.canvas) return;

    const w = this.canvas.width;
    const h = this.canvas.height;
    this.drawBackground(ctx, w, h);
    this.drawCampaignRows(ctx, w, h);
    this.drawPath(ctx);
    this.drawNodes(ctx);
    this.drawMapPlayer(ctx);
    this.drawMapHUD(ctx, this.player.currentLevel, this.TOTAL_LEVELS);
  },

  drawBackground(ctx, w, h) {
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#06131f');
    gradient.addColorStop(0.55, '#0a1d29');
    gradient.addColorStop(1, '#020308');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#081e2d';
    for (let i = 0; i < 18; i++) {
      const x = (i * 93) % w;
      const bh = 80 + ((i * 37) % 120);
      ctx.fillRect(x, h - bh, 46 + (i % 4) * 18, bh);
      ctx.fillStyle = i % 2 ? '#ff2a5f' : '#00f5ff';
      ctx.fillRect(x + 10, h - bh + 18, 18, 4);
      ctx.fillRect(x + 12, h - bh + 44, 24, 4);
      ctx.fillStyle = '#081e2d';
    }

    ctx.strokeStyle = 'rgba(0,245,255,0.12)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
  },

  drawCampaignRows(ctx, w) {
    const rowNames = ['FACIL', 'MEDIO', 'DIFICIL', 'MUITO DIFICIL', 'IMPOSSIVEL', 'EXTREMO'];
    for (let row = 0; row < 6; row++) {
      const first = this.nodes[row * 10];
      if (!first) continue;
      const color = Utils.getTierColor(row + 1);
      ctx.fillStyle = 'rgba(2,3,8,0.55)';
      ctx.fillRect(18, first.y - 28, w - 36, 58);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.strokeRect(18, first.y - 28, w - 36, 58);
      ctx.fillStyle = color;
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(rowNames[row], 28, first.y - 8);
    }
  },

  drawPath(ctx) {
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    this.path.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0,245,255,0.45)';
    ctx.lineWidth = 2;
    ctx.stroke();
  },

  drawNodes(ctx) {
    for (let node of this.nodes) {
      const color = Utils.getTierColor(node.tier.index);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(node.x - 17 + 4, node.y - 17 + 4, 34, 34);

      if (node.completed) {
        ctx.fillStyle = Utils.COLORS.nodeComplete;
      } else if (node.unlocked) {
        const pulse = Math.sin(Date.now() / 250 + node.id) * 0.2 + 0.8;
        ctx.fillStyle = `rgba(0, 255, 157, ${pulse})`;
      } else {
        ctx.fillStyle = '#252936';
      }
      ctx.fillRect(node.x - 17, node.y - 17, 34, 34);

      ctx.strokeStyle = node.type === 'boss' ? '#ff2a5f' : color;
      ctx.lineWidth = node.type === 'gate' ? 3 : 2;
      ctx.strokeRect(node.x - 17, node.y - 17, 34, 34);

      ctx.fillStyle = node.unlocked || node.completed ? '#020308' : '#777';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(node.id.toString(), node.x, node.y + 4);

      if (node.completed) this.drawStars(ctx, node.x, node.y + 28, node.rating ? node.rating.stars : 1, 4);
      if (node.type === 'boss' && !node.completed) {
        ctx.fillStyle = '#ff2a5f';
        ctx.fillRect(node.x - 4, node.y - 26, 8, 4);
      }
    }
  },

  drawStars(ctx, x, y, stars, size) {
    ctx.textAlign = 'center';
    ctx.font = `bold ${size * 3}px monospace`;
    ctx.fillStyle = Utils.COLORS.nodeComplete;
    ctx.fillText('★'.repeat(stars), x, y);
  },

  drawMapPlayer(ctx) {
    const p = this.player;
    ctx.fillStyle = 'rgba(0,245,255,0.25)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 20, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#05070b';
    ctx.fillRect(p.x - 10, p.y - 24, 21, 27);
    ctx.fillStyle = Utils.COLORS.heroArmor;
    ctx.fillRect(p.x - 8, p.y - 18, 17, 14);
    ctx.fillStyle = Utils.COLORS.heroAccent;
    ctx.fillRect(p.x - 11, p.y - 28, 22, 5);
    ctx.fillStyle = Utils.COLORS.heroVisor;
    ctx.shadowColor = Utils.COLORS.heroVisor;
    ctx.shadowBlur = 6;
    ctx.fillRect(p.facing === 1 ? p.x + 1 : p.x - 9, p.y - 23, 8, 3);
    ctx.shadowBlur = 0;
  },

  drawMapHUD(ctx, currentLevel, totalLevels) {
    const tier = this.getTier(currentLevel);
    const rating = this.levelRatings[currentLevel];
    const totalStars = Object.values(this.levelRatings).reduce((sum, item) => sum + (item.stars || 0), 0);

    ctx.fillStyle = Utils.COLORS.uiBg;
    ctx.fillRect(10, 10, 360, 64);
    ctx.strokeStyle = Utils.getTierColor(tier.index);
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 360, 64);

    ctx.fillStyle = Utils.COLORS.uiText;
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`MAPA - FASE ${currentLevel}/${totalLevels} - ${tier.name}`, 20, 34);
    ctx.fillStyle = '#8a95a5';
    ctx.font = '12px monospace';
    ctx.fillText('Setas/WASD mover | ENTER jogar/rejogar | ESC menu', 20, 54);

    ctx.fillStyle = Utils.COLORS.nodeComplete;
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`ESTRELAS: ${totalStars}/${totalLevels * 3}`, 390, 34);
    ctx.fillStyle = '#8a95a5';
    const status = rating ? `MELHOR: ${rating.percent}% / ${rating.deaths} mortes` : 'SEM REGISTRO NESTA FASE';
    ctx.fillText(`${status} | ENTER ${rating ? 'REJOGAR' : 'JOGAR'}`, 390, 54);

    ctx.fillStyle = '#ff0055';
    ctx.fillRect(ctx.canvas.width - 170, 10, 160, 40);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('MENU (ESC)', ctx.canvas.width - 90, 35);
    ctx.textAlign = 'left';
  },

  completeLevel(levelNum, deaths) {
    if (!this.completedLevels.includes(levelNum)) {
      this.completedLevels.push(levelNum);
      Utils.saveProgress('glitchRunner_completedLevels', this.completedLevels);
    }

    const rating = Utils.calculateRating(deaths);
    const previous = this.levelRatings[levelNum];
    if (!previous || rating.stars > previous.stars || rating.percent > previous.percent) {
      this.levelRatings[levelNum] = rating;
      Utils.saveProgress('glitchRunner_levelRatings', this.levelRatings);
    }

    const lastCompleted = Math.max(0, ...this.completedLevels);
    this.player.currentLevel = Utils.clamp(lastCompleted + 1, 1, this.TOTAL_LEVELS);
    if (this.canvas) {
      this.generateNodes(this.canvas.width, this.canvas.height);
      this.generatePath();
    }
    this.positionPlayer();
    return this.levelRatings[levelNum];
  },

  resetProgress() {
    this.completedLevels = [0];
    this.levelRatings = {};
    this.player.currentLevel = 1;
    Utils.saveProgress('glitchRunner_completedLevels', this.completedLevels);
    Utils.saveProgress('glitchRunner_levelRatings', this.levelRatings);
    if (this.canvas) {
      this.generateNodes(this.canvas.width, this.canvas.height);
      this.generatePath();
    }
    this.positionPlayer();
  }
};
