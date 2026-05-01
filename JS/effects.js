/**
 * EFFECTS - Efeitos visuais: glitch, screen shake, partículas
 */
const Effects = {
  screenShake: 0,
  glitchIntensity: 0,
  
  // Aplicar screen shake
  triggerShake(amount) {
    this.screenShake = Math.max(this.screenShake, amount);
  },
  
  // Aplicar efeito glitch
  triggerGlitch(amount) {
    this.glitchIntensity = Math.max(this.glitchIntensity, amount);
  },
  
  // Atualizar efeitos (decaimento)
  update() {
    if (this.screenShake > 0) {
      this.screenShake *= 0.9;
      if (this.screenShake < 0.5) this.screenShake = 0;
    }
    if (this.glitchIntensity > 0) {
      this.glitchIntensity *= 0.85;
      if (this.glitchIntensity < 0.5) this.glitchIntensity = 0;
    }
  },
  
  // Obter offset de shake
  getShakeOffset() {
    if (this.screenShake <= 0) return { x: 0, y: 0 };
    return {
      x: (Math.random() - 0.5) * this.screenShake,
      y: (Math.random() - 0.5) * this.screenShake
    };
  },
  
  // Renderizar partículas de glitch
  drawGlitch(ctx, x, y, width, height) {
    if (this.glitchIntensity <= 0) return;
    
    for (let i = 0; i < this.glitchIntensity; i++) {
      ctx.fillStyle = `hsla(${Math.random()*360}, 100%, 60%, 0.8)`;
      ctx.fillRect(
        x + Math.random() * width,
        y + Math.random() * height,
        5, 5
      );
    }
  },
  
  // Reset para nova fase
  reset() {
    this.screenShake = 0;
    this.glitchIntensity = 0;
  }
};