import * as React from 'react'
import {useForceUpdate} from "./hooks";

export const createStore = <D extends Record<string, any> = any, >(
  getDataCallback: (update: () => void) => D
) => {
  const Context = React.createContext<D>({} as D);

  const Provider = (props: { children: React.ReactNode }) => {
    const update = useForceUpdate();
    const data = getDataCallback(update);

    const providerValue = React.useMemo(() => {
      return data
    }, Object.keys(data).map(key => [key, data[key]]).flat(1))

    return <Context.Provider value={providerValue}>
      {props.children}
    </Context.Provider>;
  };

  return {
    _Context: Context,
    Provider,
    useContext: () => {
      return React.useContext(Context);
    },
  };
};
