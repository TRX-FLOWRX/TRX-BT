const state = {
  users: new Map(),
  sessions: new Map(),
  plugins: new Map(),
  cooldowns: new Map()
};

export const getState = () => state;

export const setState = (key, value) => {
  state[key] = value;
};

export const updateState = (key, updater) => {
  state[key] = updater(state[key]);
};

export const resetState = () => {
  state.users.clear();
  state.sessions.clear();
  state.plugins.clear();
  state.cooldowns.clear();
};
