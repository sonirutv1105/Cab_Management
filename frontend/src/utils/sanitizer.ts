export function stripUnsafeData(obj: any, path = 'root'): any {
  const seen = new WeakSet();

  function walk(value: any, currentPath: string): any {
    if (value === null || typeof value !== 'object') {
      return value;
    }

    if (seen.has(value)) {
      console.warn(`[Sanitizer] Circular reference removed at ${currentPath}`);
      return undefined;
    }

    // Explicitly block non-serializable objects (Window, Event, DOM, React Refs, Files, Functions)
    const isWindow = value === window || value.constructor?.name === 'Window';
    const isEvent = value instanceof Event || value.nativeEvent || value.constructor?.name?.includes('Event') || typeof value.preventDefault === 'function';
    const isDOMNode = typeof value.nodeType === 'number';
    const isFile = value instanceof File || value instanceof FileList || value.constructor?.name === 'File' || value.constructor?.name === 'FileList';
    const isRef = value.current !== undefined && Object.keys(value).length === 1;
    const isFunction = typeof value === 'function';
    const isClassInstance = value.constructor?.name !== 'Object' && value.constructor?.name !== 'Array';

    if (isWindow || isEvent || isDOMNode || isFile || isRef || isFunction || (isClassInstance && !Array.isArray(value))) {
      console.warn(`[Sanitizer] Unsafe non-serializable value removed at ${currentPath} (Type: ${value.constructor?.name || typeof value})`);
      return undefined;
    }

    seen.add(value);

    if (Array.isArray(value)) {
      const arr = value.map((item, index) => walk(item, `${currentPath}[${index}]`));
      seen.delete(value);
      return arr;
    }

    const cleanObj: any = {};
    for (const key of Object.keys(value)) {
      const cleanedVal = walk(value[key], `${currentPath}.${key}`);
      if (cleanedVal !== undefined) {
        cleanObj[key] = cleanedVal;
      }
    }
    
    seen.delete(value);
    return cleanObj;
  }

  return walk(obj, path);
}
