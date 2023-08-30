export const configs = {
  listDataAppend: false,
};

export const setConfig = (config: Partial<typeof configs>) => {
  Object.assign(configs, config);
};

export const createQueue = () => {
  let index = {current: 0}

  return async <T extends Promise<any>>(task: T) => {
    return (...args: any[]) => {
      const newIndex = index.current = index.current + 1;

      return new Promise((resolve, reject) => {
        const promise = (task as any)(...args);
        promise.finally(() => {
          if (newIndex === index.current) {
            promise.then(resolve, reject)
          }
        })
      }) as T
    }
  }
}
