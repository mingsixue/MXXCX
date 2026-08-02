module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  globals: {
    wx: "readonly",
    App: "readonly",
    Page: "readonly",
    Component: "readonly",
    Behavior: "readonly",
    getApp: "readonly",
    getCurrentPages: "readonly",
    require: "readonly",
  },
  extends: ["eslint:recommended", "prettier"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {
    "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    "no-console": "off",
    "no-empty": ["error", { allowEmptyCatch: true }],
  },
  ignorePatterns: ["dist/**", "dist_dev/**", "dist_staging/**", "node_modules/**", "src/components/mxwui/**"],
};
