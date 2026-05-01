/**
 * INPUT - Sistema de controle de teclado
 */
const Input = {
  keys: {},
  
  init() {
    document.addEventListener("keydown", e => {
      if (typeof Sound !== "undefined") Sound.unlock();
      Input.keys[e.code] = true;
      // Previne scroll com setas/space
      if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Enter","ShiftLeft","KeyJ"].includes(e.code)) {
        e.preventDefault();
      }
    });
    
    document.addEventListener("keyup", e => {
      Input.keys[e.code] = false;
    });

    window.addEventListener("blur", () => Input.reset());
    document.addEventListener("pointerdown", () => {
      if (typeof Sound !== "undefined") Sound.unlock();
    });
  },
  
  // Verifica se tecla está pressionada
  isDown(...codes) {
    return codes.some(code => Input.keys[code]);
  },
  
  // Consumir tecla (evita input duplo)
  consume(...codes) {
    for (let code of codes) {
      if (Input.keys[code]) {
        Input.keys[code] = false;
        return true;
      }
    }
    return false;
  },
  
  // Reset para transições de estado
  reset() {
    Input.keys = {};
  }
};
