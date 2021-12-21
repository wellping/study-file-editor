// This is needed when we try to import @wellping/study-schemas
// because there `__DEV__` is defined.
// https://stackoverflow.com/a/51240514/2603230
// https://stackoverflow.com/a/69238076/2603230
declare global {
  var __DEV__: boolean; // eslint-disable-line no-var
}
global.__DEV__ = true; // Always true because we want the study schema to be strictly validated.

export {};
