// This is needed when we try to import Well Ping's type
// because there `__DEV__` is defined.
// https://stackoverflow.com/a/51240514/2603230
// https://stackoverflow.com/a/69238076/2603230
declare global {
  var __DEV__: boolean; // eslint-disable-line no-var
}
global.__DEV__ = process.env.NODE_ENV === "development";

export {};
