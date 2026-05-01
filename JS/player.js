/**
 * PLAYER - Movimento, combate, escadas, powerups e estado.
 */
const Player = {
  x: 100, y: 0, width: 32, height: 32,
  velocityX: 0, velocityY: 0,
  gravity: 0.5, jumpForce: -13,
  grounded: false, climbing: false, facing: 1,

  health: 100, maxHealth: 100,
  invulnerable: false, invulnerableTimer: 0,
  attacking: false, attackTimer: 0, attackHitbox: null,

  dashCooldown: 0, dashPower: 180,
  shieldTimer: 0,
  speedBoostTimer: 0,
  attackBoostTimer: 0,
  dashTimer: 0,
  hurtTimer: 0,
  animFrame: 0,
  lastPowerup: '',

  init(canvasHeight) {
    this.x = 100;
    this.y = canvasHeight - 96;
    this.reset();
  },

  reset() {
    this.velocityY = 0;
    this.velocityX = 0;
    this.grounded = false;
    this.climbing = false;
    this.health = this.maxHealth;
    this.invulnerable = false;
    this.invulnerableTimer = 0;
    this.attacking = false;
    this.attackTimer = 0;
    this.attackHitbox = null;
    this.dashCooldown = 0;
    this.dashTimer = 0;
    this.hurtTimer = 0;
    this.shieldTimer = 0;
    this.speedBoostTimer = 0;
    this.attackBoostTimer = 0;
    this.lastPowerup = '';
  },

  update(input, level, canvasHeight) {
    if (this.invulnerable) {
      this.invulnerableTimer--;
      if (this.invulnerableTimer <= 0) this.invulnerable = false;
    }

    if (this.shieldTimer > 0) this.shieldTimer--;
    if (this.speedBoostTimer > 0) this.speedBoostTimer--;
    if (this.attackBoostTimer > 0) this.attackBoostTimer--;
    if (this.dashTimer > 0) this.dashTimer--;
    if (this.hurtTimer > 0) this.hurtTimer--;
    this.animFrame++;

    const speed = this.speedBoostTimer > 0 ? 7.8 : 6;
    if (input.isDown('KeyA', 'ArrowLeft')) {
      this.x -= speed;
      this.facing = -1;
    }
    if (input.isDown('KeyD', 'ArrowRight')) {
      this.x += speed;
      this.facing = 1;
    }

    const ladder = level.getLadderAt(this);
    const wantsClimb = input.isDown('KeyW', 'ArrowUp', 'KeyS', 'ArrowDown');
    if (ladder && (wantsClimb || this.climbing)) {
      this.climbing = true;
      this.grounded = false;
      this.velocityY = 0;

      const targetX = ladder.x + ladder.width / 2 - this.width / 2;
      this.x += (targetX - this.x) * 0.14;

      if (input.isDown('KeyW', 'ArrowUp')) this.y -= 4;
      if (input.isDown('KeyS', 'ArrowDown')) this.y += 4;

      if (input.consume('Space')) {
        this.velocityY = this.jumpForce * 0.75;
        this.climbing = false;
      }
    } else {
      this.climbing = false;
    }

    if (!this.climbing && input.isDown('Space', 'ArrowUp') && this.grounded) {
      this.velocityY = this.jumpForce;
      this.grounded = false;
    }

    if (input.isDown('ShiftLeft') && this.dashCooldown <= 0) {
      const dir = input.isDown('KeyD', 'ArrowRight') ? 1 :
                  input.isDown('KeyA', 'ArrowLeft') ? -1 : 0;
      if (dir !== 0) {
        const dashPower = this.speedBoostTimer > 0 ? this.dashPower + 70 : this.dashPower;
        const nextX = Utils.clamp(this.x + dir * dashPower, 0, level.config.width - this.width);
        const canDash = !level.platforms.some(p =>
          p.visible && nextX < p.x + p.width &&
          nextX + this.width > p.x &&
          this.y + this.height > p.y &&
          this.y < p.y + p.height
        );
        if (canDash) {
          this.x = nextX;
          this.dashTimer = 12;
          if (typeof Sound !== 'undefined') Sound.play('dash');
          Effects.triggerGlitch(8);
        }
        this.dashCooldown = this.speedBoostTimer > 0 ? 16 : 25;
      }
    }
    if (this.dashCooldown > 0) this.dashCooldown--;

    if (input.consume('KeyJ') && !this.attacking) {
      this.attacking = true;
      this.attackTimer = this.attackBoostTimer > 0 ? 16 : 12;
    }
    if (this.attacking) {
      this.attackTimer--;
      const attackWidth = this.attackBoostTimer > 0 ? 68 : 40;
      this.attackHitbox = {
        x: this.facing === 1 ? this.x + this.width : this.x - attackWidth,
        y: this.y + 6,
        width: attackWidth,
        height: 34
      };
      if (this.attackTimer <= 0) {
        this.attacking = false;
        this.attackHitbox = null;
      }
    }

    const previousY = this.y;
    if (!this.climbing) {
      this.velocityY += this.gravity;
      this.y += this.velocityY;
    }

    this.grounded = false;
    for (let p of level.platforms) {
      if (!p.visible) continue;

      if (!this.climbing &&
          this.velocityY >= 0 &&
          this.x < p.x + p.width &&
          this.x + this.width > p.x &&
          previousY + this.height <= p.y &&
          this.y + this.height >= p.y) {
        this.y = p.y - this.height;
        this.velocityY = 0;
        this.grounded = true;
      }
    }

    this.x = Utils.clamp(this.x, 0, Math.max(0, level.config.width - this.width));

    if (this.y > canvasHeight + 200) {
      return 'dead';
    }

    return 'alive';
  },

  draw(ctx, cameraX) {
    const x = this.x - cameraX;

    const walk = (this.grounded && Math.abs(Math.sin(this.animFrame / 7)) > 0.25) ? Math.sin(this.animFrame / 5) : 0;
    const dashLean = this.dashTimer > 0 ? this.facing * 5 : 0;
    const hurt = this.hurtTimer > 0;

    if (this.speedBoostTimer > 0 || this.dashTimer > 0) {
      ctx.fillStyle = 'rgba(255, 215, 0, 0.22)';
      ctx.fillRect(x - this.facing * 24, this.y + 8, 24, 18);
      ctx.fillStyle = 'rgba(0, 245, 255, 0.18)';
      ctx.fillRect(x - this.facing * 42, this.y + 13, 30, 8);
    }

    if (this.shieldTimer > 0) {
      ctx.strokeStyle = Utils.COLORS.heroVisor;
      ctx.lineWidth = 2;
      ctx.shadowColor = Utils.COLORS.heroVisor;
      ctx.shadowBlur = 10;
      ctx.strokeRect(x - 5, this.y - 5, this.width + 10, this.height + 10);
      ctx.shadowBlur = 0;
    }

    if (this.invulnerable) {
      ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 30) * 0.5;
    }

    const baseX = x + dashLean;
    const y = this.y;
    const armor = hurt ? '#ff705c' : '#333842';
    const dark = '#11141b';
    const light = '#6f7785';
    const gold = Utils.COLORS.heroAccent;
    const visor = hurt ? '#ff2a5f' : Utils.COLORS.heroVisor;
    const armSwing = this.climbing ? Math.sin(this.animFrame / 5) * 5 : walk * 4;
    const legSwing = this.climbing ? Math.sin(this.animFrame / 5) * 3 : walk * 5;

    // Sombra
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(baseX + 16, y + 35, 18, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pernas
    ctx.fillStyle = dark;
    ctx.fillRect(baseX + 9 + legSwing, y + 24, 7, 13);
    ctx.fillRect(baseX + 19 - legSwing, y + 24, 7, 13);
    ctx.fillStyle = gold;
    ctx.fillRect(baseX + 9 + legSwing, y + 34, 9, 4);
    ctx.fillRect(baseX + 17 - legSwing, y + 34, 9, 4);

    // Tronco e ombros
    ctx.fillStyle = '#05070b';
    ctx.fillRect(baseX + 7, y + 10, 22, 19);
    ctx.fillStyle = armor;
    ctx.fillRect(baseX + 9, y + 12, 18, 15);
    ctx.fillStyle = light;
    ctx.fillRect(baseX + 11, y + 14, 5, 4);
    ctx.fillStyle = gold;
    ctx.fillRect(baseX + 18, y + 13, 3, 14);

    // Bracos
    ctx.fillStyle = dark;
    ctx.fillRect(baseX + 2, y + 14 + armSwing, 7, 12);
    ctx.fillRect(baseX + 27, y + 14 - armSwing, 7, 12);
    ctx.fillStyle = gold;
    ctx.fillRect(baseX + 4, y + 22 + armSwing, 4, 3);
    ctx.fillRect(baseX + 28, y + 22 - armSwing, 4, 3);

    // Capacete inspirado no sprite enviado
    ctx.fillStyle = '#05070b';
    ctx.fillRect(baseX + 4, y + 1, 27, 15);
    ctx.fillStyle = armor;
    ctx.fillRect(baseX + 6, y + 0, 24, 14);
    ctx.fillStyle = light;
    ctx.fillRect(baseX + 10, y + 2, 15, 3);
    ctx.fillStyle = gold;
    ctx.fillRect(baseX + 4, y + 5, 20, 5);
    ctx.fillRect(baseX + 25, y + 2, 3, 13);

    ctx.fillStyle = visor;
    ctx.shadowColor = visor;
    ctx.shadowBlur = 8;
    if (this.facing === 1) {
      ctx.fillRect(baseX + 19, y + 8, 8, 3);
    } else {
      ctx.fillRect(baseX + 7, y + 8, 8, 3);
    }
    ctx.shadowBlur = 0;

    if (this.attacking) {
      const attackWidth = this.attackBoostTimer > 0 ? 68 : 40;
      ctx.fillStyle = this.attackBoostTimer > 0 ? '#ff2a5f' : Utils.COLORS.heroAccent;
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 15;
      ctx.fillRect(
        this.facing === 1 ? x + 25 : x - attackWidth + 5,
        this.y + 10,
        attackWidth,
        6
      );
      ctx.shadowBlur = 0;
    }

    Effects.drawGlitch(ctx, x, this.y, this.width, this.height);
    ctx.globalAlpha = 1;
  },

  takeDamage(amount, sourceX) {
    if (this.invulnerable) return;

    if (this.shieldTimer > 0) {
      this.shieldTimer = Math.max(0, this.shieldTimer - 180);
      this.invulnerable = true;
      this.invulnerableTimer = 22;
      this.hurtTimer = 16;
      if (typeof Sound !== 'undefined') Sound.play('damage');
      Effects.triggerShake(8);
      Effects.triggerGlitch(12);
      return;
    }

    this.health -= amount;
    this.hurtTimer = 24;
    this.invulnerable = true;
    this.invulnerableTimer = 60;
    this.velocityY = -10;
    this.climbing = false;
    this.x += (this.x < sourceX) ? -50 : 50;
    if (typeof Sound !== 'undefined') Sound.play('damage');
    Effects.triggerShake(15);
    Effects.triggerGlitch(15);
  },

  pickupPowerup(type) {
    this.lastPowerup = type;
    if (typeof Sound !== 'undefined') Sound.play('powerup');
    if (type === 'battery') {
      this.health = Utils.clamp(this.health + 25, 0, this.maxHealth);
    } else if (type === 'shield') {
      this.shieldTimer = 360;
    } else if (type === 'overdrive') {
      this.speedBoostTimer = 360;
      this.dashCooldown = 0;
    } else if (type === 'blade') {
      this.attackBoostTimer = 300;
    }
  },

  getAttackDamage() {
    return this.attackBoostTimer > 0 ? 2 : 1;
  },

  getActiveBuffs() {
    const buffs = [];
    if (this.shieldTimer > 0) buffs.push({ name: 'SHIELD', timer: this.shieldTimer, color: Utils.COLORS.heroVisor });
    if (this.speedBoostTimer > 0) buffs.push({ name: 'OVERDRIVE', timer: this.speedBoostTimer, color: Utils.COLORS.nodeComplete });
    if (this.attackBoostTimer > 0) buffs.push({ name: 'BLADE', timer: this.attackBoostTimer, color: Utils.COLORS.hazard });
    return buffs;
  }
};
