/**
 * MAIN - Loop principal, gerenciamento de estados, inicialização
 */
const Game = {
  // Canvas e contexto
  canvas: null,
  ctx: null,
  
  // Estado do jogo
  state: 'menu', // 'menu' | 'map' | 'playing' | 'paused'
  running: true,
  
  // Dados da sessão
  currentLevel: 1,
  deathCount: 0,

  camera: { x: 0, y: 0 },
  
  // Inicializar
  init() {
    // Setup canvas
    this.canvas = document.getElementById("game");
    this.ctx = this.canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;
    
    // Resize handler
    window.addEventListener("resize", () => this.resize());
    this.resize();
    
    // Inicializar sistemas
    Input.init();
    Effects.reset();
    WorldMap.init(this.canvas);  // Passa o canvas diretamente
    
    // Iniciar loop
    console.log("🗺️ GLITCH RUNNER - Iniciado");
    this.loop();
  },
  
  // Ajustar canvas ao viewport
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    
    // Re-inicializar mapa se necessário
    if (this.state === 'map') {
      WorldMap.init(this.canvas);
    }
  },
  
  // Iniciar uma fase
  startLevel(levelNum) {
    this.currentLevel = levelNum;
    
    // Gerar nível procedural
    Level.generate(levelNum, this.canvas.height);
    
    // Reset player
    Player.init(this.canvas.height);
    const spawn = Level.getStartSpawn(this.canvas.height);
    Player.x = spawn.x;
    Player.y = spawn.y;
    
    // Reset checkpoint
    Level.checkpoint = { x: spawn.x, y: spawn.y };
    
    // Reset contadores
    this.deathCount = 0;
    Effects.reset();
    Input.reset();

    this.camera.x = 0;
    this.camera.y = 0;
    
    // Mudar estado
    this.state = 'playing';
    console.log(`🎮 INICIANDO FASE ${levelNum}`);
  },
  
  // Completar fase
  completeLevel() {
    const rating = WorldMap.completeLevel(this.currentLevel, this.deathCount);
    if (typeof Sound !== 'undefined') {
      Sound.play('complete');
      for (let i = 0; i < rating.stars; i++) {
        setTimeout(() => Sound.play('star'), 360 + i * 130);
      }
    }
    
    alert(`FASE ${this.currentLevel} COMPLETADA!\nMortes: ${this.deathCount}\nEstrelas: ${rating.stars}/3\nSincronia: ${rating.percent}%\nProxima fase desbloqueada!`);
    
    this.state = 'map';
    WorldMap.positionPlayer();
    Input.reset();
  },
  
  // Reset para checkpoint
  resetToCheckpoint() {
    this.deathCount++;
    if (typeof Sound !== 'undefined') Sound.play('death');
    Level.resetToCheckpoint(Player);
  },
  
  // Atualizar jogo
  update() {
    if (!this.running) return;
    
    // Atualizar efeitos globais
    Effects.update();
    
    // Dispatch por estado
    switch(this.state) {
      case 'menu':
        UI.update(Input, (newState) => {
          this.state = newState;
          if (newState === 'map') {
            WorldMap.init(this.canvas);
          }
          Input.reset();
        });
        break;
        
      case 'map':
        const mapResult = WorldMap.update(Input, (levelNum) => {
          this.startLevel(levelNum);
        });
        if (mapResult === 'menu') {
          this.state = 'menu';
          UI.reset();
          Input.reset();
        }
        break;
        
      case 'playing':
        if (Input.consume('Escape')) {
          this.state = 'paused';
          UI.resetPause();
          break;
        }

        // Atualizar player
        const playerStatus = Player.update(Input, Level, this.canvas.height);
        
        // Atualizar nível (inimigos, hazards, etc)
        Level.update(Player);

        this.camera.x = Utils.clamp(
          Player.x - this.canvas.width / 3,
          0,
          Math.max(0, Level.config.width - this.canvas.width)
        );
  
        
        // Verificar morte
        if (playerStatus === 'dead' || Player.health <= 0) {
          this.resetToCheckpoint();
        }
        
        // Verificar vitória
        if (Level.checkGoal(Player)) {
          this.completeLevel();
        }
        break;

      case 'paused':
        UI.updatePause(Input, {
          resume: () => {
            this.state = 'playing';
            Input.reset();
          },
          restart: () => {
            this.startLevel(this.currentLevel);
          },
          map: () => {
            this.state = 'map';
            WorldMap.init(this.canvas);
            WorldMap.player.currentLevel = this.currentLevel;
            WorldMap.positionPlayer();
            Input.reset();
          },
          menu: () => {
            this.state = 'menu';
            UI.reset();
            Input.reset();
          }
        });
        break;
    }
  },
  
  // Desenhar jogo
  draw() {
    const ctx = this.ctx;
    
    switch(this.state) {
      case 'menu':
        UI.draw(ctx, this.canvas);
        break;
        
      case 'map':
        WorldMap.draw(ctx);
        break;
        
      case 'playing':
        this.drawGameplay();
        break;

      case 'paused':
        this.drawGameplay();
        UI.drawPauseMenu(ctx, this.canvas, this.currentLevel, this.deathCount, Level);
        break;
    }
  },
  
  // Desenhar gameplay

drawGameplay() {
  const ctx = this.ctx;

  ctx.save();
  
  // ✅ SCREEN SHAKE (igual ao original)
  const shakeX = Effects.screenShake > 0 ? (Math.random() - 0.5) * Effects.screenShake : 0;
  const shakeY = Effects.screenShake > 0 ? (Math.random() - 0.5) * Effects.screenShake : 0;
  
  // ✅ CÂMERA + SHAKE (cópia exata)
  ctx.translate(shakeX, shakeY);
  
  // Desenhar nível e player
  Level.drawBackground(ctx, this.camera.x, this.canvas);
  Level.draw(ctx, this.camera.x);
  Player.draw(ctx, this.camera.x);
  
  ctx.restore();
  
  // HUD
  UI.drawGameHUD(ctx, Player, this.currentLevel, this.deathCount, Level);
},
  // Loop principal
  loop() {
    try {
      this.update();
      this.draw();
    } catch (e) {
      console.error("💥 ERRO:", e.message, e.stack);
      // Fallback seguro
      this.state = 'menu';
      UI.reset();
    }
    requestAnimationFrame(() => this.loop());
  }
};

// Iniciar quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Game.init());
} else {
  Game.init();
}
