/**
 * UI - Menu, HUD, legendas e telas de interface.
 */
const UI = {
  menuSelection: 0,
  pauseSelection: 0,
  menuBlink: 0,
  showControls: false,

  getMainOptions() {
    return [
      { text: '▶ JOGAR / CAMPANHA', action: 'map' },
      { text: 'CONTROLES', action: 'controls' },
      { text: 'CREDITOS', action: 'credits' },
      { text: 'RESETAR PROGRESSO', action: 'reset' }
    ];
  },

  getControlOptions() {
    return [
      { text: '← VOLTAR', action: 'back' },
      { text: 'A/D ou ←/→ : MOVER', action: 'info' },
      { text: 'SPACE ou ↑ : PULAR', action: 'info' },
      { text: 'W/S ou ↑/↓ : ESCADAS', action: 'info' },
      { text: 'SHIFT : DASH', action: 'info' },
      { text: 'J : ATACAR', action: 'info' }
    ];
  },

  getPauseOptions() {
    return [
      { text: 'CONTINUAR', action: 'resume' },
      { text: 'REINICIAR FASE', action: 'restart' },
      { text: 'VOLTAR AO MAPA', action: 'map' },
      { text: 'MENU INICIAL', action: 'menu' }
    ];
  },

  update(input, onNavigate) {
    const maxSel = this.showControls ? 0 : 3;

    if (input.isDown('ArrowUp', 'KeyW')) {
      input.consume('ArrowUp', 'KeyW');
      this.menuSelection = (this.menuSelection - 1 + maxSel + 1) % (maxSel + 1);
    }
    if (input.isDown('ArrowDown', 'KeyS')) {
      input.consume('ArrowDown', 'KeyS');
      this.menuSelection = (this.menuSelection + 1) % (maxSel + 1);
    }

    if (input.consume('Enter', 'Space')) {
      if (this.showControls) {
        this.showControls = false;
        this.menuSelection = 1;
        return;
      }

      const selected = this.getMainOptions()[this.menuSelection];
      switch (selected.action) {
        case 'map':
          onNavigate('map');
          break;
        case 'controls':
          this.showControls = true;
          break;
        case 'credits':
          alert('MEGTON: GLITCH RUNNER\nCriado por Christopher R. Mesquita\nCyberpunk, pixel art e robozinho com atitude.');
          break;
        case 'reset':
          if (confirm('Resetar todo o progresso, estrelas e fases liberadas?')) {
            WorldMap.resetProgress();
            alert('Progresso resetado!');
          }
          break;
      }
    }

    if (this.showControls && input.consume('Escape')) this.showControls = false;
  },

  draw(ctx, canvas) {
    this.drawMenuBackground(ctx, canvas);
    this.menuBlink += 0.05;
    ctx.textAlign = 'center';

    ctx.fillStyle = '#ff2a5f';
    ctx.globalAlpha = 0.45 + Math.sin(this.menuBlink * 2) * 0.25;
    ctx.font = "bold 64px 'Courier New', monospace";
    ctx.fillText('MEGTON', canvas.width / 2 + 5, canvas.height * 0.22);

    ctx.globalAlpha = 1;
    ctx.fillStyle = Utils.COLORS.heroVisor;
    ctx.shadowColor = Utils.COLORS.heroVisor;
    ctx.shadowBlur = 20;
    ctx.fillText('MEGTON', canvas.width / 2, canvas.height * 0.22);
    ctx.shadowBlur = 0;

    ctx.fillStyle = Utils.COLORS.nodeComplete;
    ctx.font = "20px 'Courier New', monospace";
    ctx.fillText('GLITCH RUNNER', canvas.width / 2, canvas.height * 0.29);
    ctx.fillStyle = '#d7e9f7';
    ctx.font = "bold 14px 'Courier New', monospace";
    ctx.fillText('Criado por Christopher R. Mesquita', canvas.width / 2, canvas.height * 0.34);

    const options = this.showControls ? this.getControlOptions() : this.getMainOptions();
    const startY = canvas.height * 0.46;
    const spacing = 52;

    options.forEach((opt, i) => {
      const y = startY + i * spacing;
      const isSelected = i === this.menuSelection && !this.showControls;
      if (isSelected) {
        ctx.fillStyle = 'rgba(0, 245, 255, 0.12)';
        ctx.fillRect(canvas.width / 2 - 210, y - 25, 420, 40);
        ctx.strokeStyle = Utils.COLORS.heroVisor;
        ctx.lineWidth = 2;
        ctx.strokeRect(canvas.width / 2 - 210, y - 25, 420, 40);
      }
      ctx.fillStyle = isSelected ? Utils.COLORS.heroVisor : '#c0cad7';
      ctx.font = isSelected ? "bold 23px 'Courier New', monospace" : "19px 'Courier New', monospace";
      ctx.fillText(opt.text, canvas.width / 2, y + 5);
    });

    if (!this.showControls) {
      const totalStars = Object.values(WorldMap.levelRatings || {}).reduce((sum, item) => sum + (item.stars || 0), 0);
      ctx.fillStyle = '#8a95a5';
      ctx.font = "14px 'Courier New', monospace";
      ctx.fillText('Use ↑↓ ou W/S para navegar | ENTER para selecionar', canvas.width / 2, canvas.height * 0.86);
      ctx.fillText(`Campanha: ${Math.max(0, WorldMap.completedLevels.length - 1)}/${WorldMap.TOTAL_LEVELS} fases | Estrelas: ${totalStars}/${WorldMap.TOTAL_LEVELS * 3}`, canvas.width / 2, canvas.height * 0.91);
    }

    ctx.textAlign = 'left';
  },

  drawMenuBackground(ctx, canvas) {
    const w = canvas.width;
    const h = canvas.height;
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#071522');
    gradient.addColorStop(0.46, '#164155');
    gradient.addColorStop(1, '#020308');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(5, 10, 22, 0.86)';
    ctx.fillRect(0, 0, w, 70);
    ctx.fillRect(0, h - 92, w, 92);

    const offset = (Date.now() / 55) % 48;
    for (let row = 0; row < 3; row++) {
      const y = row === 0 ? 16 : row === 1 ? h * 0.18 : h - 78;
      for (let x = -offset; x < w + 160; x += 156) {
        ctx.fillStyle = '#1d2a3d';
        ctx.fillRect(x, y, 118, 42);
        ctx.strokeStyle = row === 1 ? '#8fe9ff' : '#ff5f9a';
        ctx.strokeRect(x + 10, y + 10, 78, 16);
        ctx.fillStyle = row === 1 ? '#ff5f9a' : '#8fe9ff';
        ctx.fillRect(x + 18, y + 15, 46, 5);
      }
    }

    ctx.fillStyle = 'rgba(0, 245, 255, 0.08)';
    for (let i = 0; i < 18; i++) {
      const x = (i * 101) % w;
      const height = 90 + ((i * 47) % 190);
      ctx.fillRect(x, h * 0.7 - height, 44 + (i % 3) * 18, height);
    }
  },

  drawGameHUD(ctx, player, currentLevel, deathCount, level) {
    ctx.fillStyle = Utils.COLORS.uiBg;
    ctx.fillRect(20, 20, 300, 35);
    ctx.strokeStyle = Utils.COLORS.heroVisor;
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, 300, 35);

    const healthPercent = player.health / player.maxHealth;
    ctx.fillStyle = healthPercent > 0.3 ? Utils.COLORS.nodeOpen : Utils.COLORS.hazard;
    ctx.fillRect(22, 22, Utils.clamp(healthPercent * 296, 0, 296), 31);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`FASE ${currentLevel}`, 30, 42);
    ctx.fillText(`POWER: ${Math.max(0, Math.round(player.health))}%`, 130, 42);
    ctx.fillStyle = player.dashCooldown > 0 ? '#444' : Utils.COLORS.nodeComplete;
    ctx.fillText(`DASH: ${player.dashCooldown > 0 ? 'OFF' : 'ON'}`, 250, 42);

    const projection = Utils.calculateRating(deathCount);
    ctx.fillStyle = Utils.COLORS.heroVisor;
    ctx.fillText(`MORTES: ${deathCount}`, 20, 72);
    ctx.fillStyle = Utils.COLORS.nodeComplete;
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`RUN: ${projection.percent}% ${'★'.repeat(projection.stars)}`, 130, 72);

    if (level && level.difficulty) {
      ctx.fillStyle = '#8a95a5';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`${level.difficulty.name} | SETOR ${level.biome.toUpperCase()}`, 20, 92);
    }

    const buffs = player.getActiveBuffs ? player.getActiveBuffs() : [];
    let buffX = 20;
    buffs.forEach(buff => {
      const seconds = Math.ceil(buff.timer / 60);
      ctx.fillStyle = Utils.COLORS.uiBg;
      ctx.fillRect(buffX, 104, 112, 24);
      ctx.strokeStyle = buff.color;
      ctx.strokeRect(buffX, 104, 112, 24);
      ctx.fillStyle = buff.color;
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`${buff.name} ${seconds}s`, buffX + 8, 120);
      buffX += 120;
    });

    if (level && level.boss && level.boss.alive && level.boss.active) {
      this.drawBossBar(ctx, level.boss);
    }

    if (level && level.narrative && level.narrative.timer > 0) {
      this.drawSubtitle(ctx, level.narrative);
    }
  },

  updatePause(input, actions) {
    const options = this.getPauseOptions();
    if (input.consume('Escape')) {
      actions.resume();
      return;
    }

    if (input.isDown('ArrowUp', 'KeyW')) {
      input.consume('ArrowUp', 'KeyW');
      this.pauseSelection = (this.pauseSelection - 1 + options.length) % options.length;
    }
    if (input.isDown('ArrowDown', 'KeyS')) {
      input.consume('ArrowDown', 'KeyS');
      this.pauseSelection = (this.pauseSelection + 1) % options.length;
    }

    if (input.consume('Enter', 'Space')) {
      const selected = options[this.pauseSelection];
      if (actions[selected.action]) actions[selected.action]();
    }
  },

  drawPauseMenu(ctx, canvas, currentLevel, deathCount, level) {
    const options = this.getPauseOptions();
    const panelW = Math.min(460, canvas.width - 60);
    const panelH = 300;
    const x = (canvas.width - panelW) / 2;
    const y = (canvas.height - panelH) / 2;

    ctx.fillStyle = 'rgba(2, 3, 8, 0.72)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(2, 3, 8, 0.94)';
    ctx.fillRect(x, y, panelW, panelH);
    ctx.strokeStyle = Utils.COLORS.heroVisor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, panelW, panelH);

    ctx.textAlign = 'center';
    ctx.fillStyle = Utils.COLORS.heroVisor;
    ctx.shadowColor = Utils.COLORS.heroVisor;
    ctx.shadowBlur = 12;
    ctx.font = 'bold 32px monospace';
    ctx.fillText('PAUSE', canvas.width / 2, y + 52);
    ctx.shadowBlur = 0;

    const rating = Utils.calculateRating(deathCount);
    ctx.fillStyle = '#8a95a5';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`FASE ${currentLevel} | ${level.difficulty.name} | MORTES ${deathCount} | ${rating.percent}%`, canvas.width / 2, y + 78);

    options.forEach((option, index) => {
      const itemY = y + 125 + index * 40;
      const selected = index === this.pauseSelection;
      if (selected) {
        ctx.fillStyle = 'rgba(0, 245, 255, 0.14)';
        ctx.fillRect(x + 44, itemY - 24, panelW - 88, 34);
        ctx.strokeStyle = Utils.COLORS.heroVisor;
        ctx.strokeRect(x + 44, itemY - 24, panelW - 88, 34);
      }
      ctx.fillStyle = selected ? Utils.COLORS.heroVisor : '#d7e9f7';
      ctx.font = selected ? 'bold 19px monospace' : '18px monospace';
      ctx.fillText(option.text, canvas.width / 2, itemY);
    });

    ctx.fillStyle = '#6f7b8b';
    ctx.font = '12px monospace';
    ctx.fillText('ESC continua | ENTER seleciona', canvas.width / 2, y + panelH - 24);
    ctx.textAlign = 'left';
  },

  drawBossBar(ctx, boss) {
    const barW = Math.min(460, ctx.canvas.width - 80);
    const barX = (ctx.canvas.width - barW) / 2;
    const barY = 22;
    const hp = Utils.clamp(boss.health / boss.maxHealth, 0, 1);

    ctx.fillStyle = 'rgba(2, 3, 8, 0.9)';
    ctx.fillRect(barX, barY, barW, 34);
    ctx.strokeStyle = boss.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barW, 34);
    ctx.fillStyle = boss.color;
    ctx.fillRect(barX + 3, barY + 3, (barW - 6) * hp, 28);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(boss.name, ctx.canvas.width / 2, barY + 22);
    ctx.textAlign = 'left';
  },

  drawSubtitle(ctx, narrative) {
    const boxW = Math.min(ctx.canvas.width - 80, 760);
    const boxX = (ctx.canvas.width - boxW) / 2;
    const boxY = ctx.canvas.height - 94;
    ctx.fillStyle = 'rgba(2, 3, 8, 0.88)';
    ctx.fillRect(boxX, boxY, boxW, 70);
    ctx.strokeStyle = Utils.COLORS.heroVisor;
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxW, 70);
    ctx.fillStyle = Utils.COLORS.nodeComplete;
    ctx.font = 'bold 13px monospace';
    ctx.fillText(narrative.speaker, boxX + 18, boxY + 24);
    ctx.fillStyle = '#ffffff';
    ctx.font = '13px monospace';
    this.wrapText(ctx, narrative.text, boxX + 18, boxY + 46, boxW - 36, 17);
  },

  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      if (ctx.measureText(testLine).width > maxWidth && i > 0) {
        ctx.fillText(line, x, y);
        line = words[i] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
  },

  reset() {
    this.menuSelection = 0;
    this.pauseSelection = 0;
    this.menuBlink = 0;
    this.showControls = false;
  },

  resetPause() {
    this.pauseSelection = 0;
  }
};
