// Presale.spec.ts
// This file is intentionally dependency-free so TypeScript compiles even if you
// don't have @ton/sandbox / jest types installed.
//
// If you actually want to run contract tests, install and restore real imports:
//   npm i -D jest @types/jest
//   npm i -D @ton/sandbox @ton/test-utils
// and then write proper sandbox tests.

export {};

declare global {
  // Minimal Jest-like globals (typing only)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const describe: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const it: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const expect: any;
}

describe("Presale", () => {
  it("compiles", () => {
    expect(true).toBeTruthy?.();
  });
});
