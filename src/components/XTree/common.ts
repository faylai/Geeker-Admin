export function isObject(obj: any): boolean {
  return Object.prototype.toString.call(obj) === "[object Object]";
}
