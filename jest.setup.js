import "@testing-library/jest-dom";

global.chrome = {
  storage: {
    local: {
      get: jest.fn((keys, callback) => callback({})),
      set: jest.fn(),
    },
  },
  onChanged: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
  },
};
