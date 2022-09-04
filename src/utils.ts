export const configs = {
  listDataAppend: false,
};

export const setConfig = (config: Partial<typeof configs>) => {
  Object.assign(configs, config);
};
