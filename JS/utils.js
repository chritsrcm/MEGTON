/**
 * UTILS - Funções utilitárias globais
 */
const Utils = {
  // Cores do jogo
  COLORS: {
    grass: "#1a3a2a", grassLight: "#2a5a3a",
    water: "#0a2a4a", waterLight: "#1a4a6a",
    path: "#3a4a3a", pathLight: "#5a6a5a",
    mountain: "#2a2a3a", mountainSnow: "#4a4a5a",
    nodeLocked: "#333", nodeOpen: "#00ff9d",
    nodeComplete: "#ffd700", nodeCurrent: "#00f5ff",
    heroArmor: "#8a95a5", heroAccent: "#ffd700",
    heroVisor: "#00f5ff", uiBg: "#020308",
    uiText: "#ffffff", hazard: "#ff2a5f"
  },

  // Colisão AABB
  rectIntersect(a, b) {
    return a.x < b.x + b.width && 
           a.x + a.width > b.x && 
           a.y < b.y + b.height && 
           a.y + a.height > b.y;
  },

  // Clamp value
  clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  },

  // Random float
  randomRange(min, max) {
    return Math.random() * (max - min) + min;
  },

  // Random int
  randomInt(min, max) {
    return Math.floor(Utils.randomRange(min, max));
  },

  getDifficultyTier(levelNum) {
    const tiers = [
      { index: 1, name: 'FACIL', min: 1, max: 10 },
      { index: 2, name: 'MEDIO', min: 11, max: 20 },
      { index: 3, name: 'DIFICIL', min: 21, max: 30 },
      { index: 4, name: 'MUITO DIFICIL', min: 31, max: 40 },
      { index: 5, name: 'IMPOSSIVEL', min: 41, max: 50 },
      { index: 6, name: 'EXTREMO', min: 51, max: 60 }
    ];
    return tiers[Math.min(tiers.length - 1, Math.floor((levelNum - 1) / 10))];
  },

  getTierColor(tierIndex) {
    return {
      1: '#00ff9d',
      2: '#00f5ff',
      3: '#ffd700',
      4: '#ff8a00',
      5: '#ff2a5f',
      6: '#b46bff'
    }[tierIndex] || '#ffffff';
  },

  calculateRating(deaths) {
    const percent = Utils.clamp(Math.round(100 - deaths * 3), 0, 100);
    const stars = percent >= 70 ? 3 : percent >= 40 ? 2 : percent >= 10 ? 1 : 0;
    return { deaths, percent, stars };
  },

  // Save/Load progress
  saveProgress(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  },

  loadProgress(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch {
      return fallback;
    }
  }
};
