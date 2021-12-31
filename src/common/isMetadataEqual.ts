export function isMetadataEqual(old: any, changed: any) {
  if (typeof old === "object" && typeof changed === "object") {
    const oldKeys = Object.keys(old).sort();
    const changedKeys = Object.keys(changed).sort();
    if (oldKeys === changedKeys) {
      for (let i = 0; i < oldKeys.length; i++) {
        if (!isMetadataEqual(old[oldKeys[i]], changed[changedKeys[i]])) {
          return false;
        }
      }
      return true;
    }
  } else {
    return old === changed;
  }
}
