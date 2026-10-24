const STORE_KEY = "canvas-student-groups-v1";

const Store = {
  load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) {
        this.save(structuredClone(SEED));
        return structuredClone(SEED);
      }
      return JSON.parse(raw);
    } catch (error) {
      console.warn("Could not read saved data, using seed.", error);
      return structuredClone(SEED);
    }
  },

  save(state) {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  },

  reset() {
    localStorage.removeItem(STORE_KEY);
    return this.load();
  },
};
