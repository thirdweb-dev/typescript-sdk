export function resolveDate(object: any ) {
  const keys: string[] = Object.keys(object);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = object[key];
    if (value instanceof Date) {
      object[key] = Math.floor(value.getTime() / 1000);
    } else if (value instanceof Object) {
      object[key] = resolveDate(value);
    }
  }
  return object;
}
