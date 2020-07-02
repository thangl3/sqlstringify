module.exports = {
  env: {
    browser: false,
    commonjs: true,
    es6: true,
    node: true,
  },
  extends: [
    'airbnb-base',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
    jasmine: 'readonly',
    describe: 'readonly',
    xdescribe: 'readonly',
    it: 'readonly',
    xit: 'readonly',
    expectAsync: 'readonly',
    expect: 'readonly',
    beforeAll: 'readonly',
    beforeEach: 'readonly',
    afterAll: 'readonly',
    afterEach: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  rules: {
    'linebreak-style': ['error', 'windows'],
    'no-plusplus': ['error', { 'allowForLoopAfterthoughts': true }],
    'prefer-arrow-callback': ['error', { 'allowNamedFunctions': false, 'allowUnboundThis': false }],
    'func-names': ['error', 'never'],
  },
};
