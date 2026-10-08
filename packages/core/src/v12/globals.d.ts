// Loose typings the transplanted v12 code relies on. v12 is JavaScript: it reads values out of
// plain objects without declaring their shape. These overloads keep it compiling unchanged.
interface ObjectConstructor {
  values(o: any): any[];
  entries(o: any): [string, any][];
}

declare const console: {
  log: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};
