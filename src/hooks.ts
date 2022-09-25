import {useEffect, useMemo, useReducer, useRef} from "react";
import {configs} from "./utils";

const returnReadonly = <T extends {}, U>(
  data: T,
  action: U
): Readonly<T & U> => {
  return Object.assign(data, action) as any;
};

export const useForceUpdate = () => {
  const isUnMounted = useRef(false);

  useEffect(() => {
    return () => {
      isUnMounted.current = true;
    };
  }, []);

  const [, forceUpdateDispatch] = useReducer((v) => v + 1, 0);

  return () => {
    if (!isUnMounted.current) {
      forceUpdateDispatch();
    }
  };
};

export const useList = <I extends Record<string, any> = any>(options: {
  onGetListData: (query: { currentPage: number; pageSize: number }) => Promise<{
    items: I[];
    totalItems?: number;
  }>;
  pageSize?:number
}) => {
  const forceUpdate = useForceUpdate();
  const optionsRef = useRef(options)

  optionsRef.current = options;
  return useMemo(() => {
    const data = {
      loading: false,
      isFinish: false,
      items: [] as I[],
      pagination: {
        currentPage: 1,
        pageSize: optionsRef.current.pageSize || 10,
        totalItems: 0,
        totalPage: 0,
      },
    };

    const getListData = async () => {
      if (data.loading)
        return Promise.reject("getListData:Cannot be called while loading");

      data.isFinish = false;
      data.loading = true;
      forceUpdate();

      try {
        const isFirstPage = data.pagination.currentPage === 1;

        const res = await optionsRef.current.onGetListData({
          currentPage: data.pagination.currentPage,
          pageSize: data.pagination.pageSize,
        });
        const items = res.items === null ? [] : res.items;
        const totalItems = isFirstPage
          ? res.totalItems || items.length
          : (res.totalItems as number);

        if (isFirstPage || !configs.listDataAppend) {
          data.items = [...items];
        } else {
          data.items = [...data.items, ...items];
        }

        data.pagination = {
          ...data.pagination,
          totalItems,
          totalPage: Math.ceil(totalItems / data.pagination.pageSize),
        };
        data.isFinish = true;
        data.loading = false;

        forceUpdate();
      } catch (err) {
        data.loading = false;
        forceUpdate();

        console.error(`getListData:${err}`);
        return Promise.reject(err);
      }
    };
    const setCurrentPage = (currentPage: number) => {
      data.pagination = {
        ...data.pagination,
        currentPage,
      };

      forceUpdate();
      return getListData();
    };
    const setPageSize = (pageSize: number) => {
      data.pagination = {
        ...data.pagination,
        pageSize,
        currentPage: 1,
      };

      forceUpdate();
      return getListData();
    };
    const setItems = (callback: (item: I, index: number, array: I[]) => I) => {
      data.items = data.items.map(callback);
      forceUpdate();
    };

    return returnReadonly(data, {
      getListData,
      setCurrentPage,
      setPageSize,
      setItems,
    });
  }, []);
};

export const useForm = <F extends Record<string, any> = any>(options: {
  fields: F;
  onSubmit?: () => void | Promise<void>;
  onReset?: () => void;
  onSetFields?: (fields: Partial<F>) => void;
}) => {
  const forceUpdate = useForceUpdate();
  const copyFields = <D>(fields: D): D => ({...fields});
  const optionsRef = useRef(options)

  optionsRef.current = options;
  return useMemo(() => {
    const data = {
      loading: false,
      fields: copyFields(optionsRef.current.fields),
      sediments: copyFields(optionsRef.current.fields),
    };

    const setFields = (fields: Partial<F>) => {
      data.fields = {
        ...data.fields,
        ...copyFields(fields),
      };
      optionsRef.current.onSetFields && optionsRef.current.onSetFields(fields);
      forceUpdate();
    };
    const submit = async () => {
      if (data.loading)
        return Promise.reject("submit:Cannot be called while loading");

      data.loading = true;
      forceUpdate();

      try {
        optionsRef.current.onSubmit && (await optionsRef.current.onSubmit());
        data.sediments = copyFields(data.fields);
        data.loading = false;
        forceUpdate();
      } catch (err) {
        data.loading = false;
        forceUpdate();

        console.error(`submit:${err}`);
        return Promise.reject(err);
      }
    };
    const reset = async () => {
      data.loading = false;
      data.fields = copyFields(optionsRef.current.fields);

      optionsRef.current.onReset && optionsRef.current.onReset();
      forceUpdate();
    };
    return returnReadonly(data, {
      setFields,
      submit,
      reset,
    });
  }, []);
};

export const useDetail = <I extends Record<string, any> = any>(options: {
  onGetDetailData: () => Promise<I>;
}) => {
  const forceUpdate = useForceUpdate();
  const optionsRef = useRef(options)

  optionsRef.current = options;
  return useMemo(() => {
    const data = {
      loading: false,
      item: {} as I,
    };

    const getDetailData = async () => {
      if (data.loading)
        return Promise.reject("getDetailData:Cannot be called while loading");

      data.loading = true;
      forceUpdate();

      try {
        data.item = await optionsRef.current.onGetDetailData();
        data.loading = false;
        forceUpdate();
      } catch (err) {
        data.loading = false;
        forceUpdate();

        console.error(`getDetailData:${err}`);
        return Promise.reject(err);
      }
    };

    return returnReadonly(data, {
      getDetailData,
    });
  }, []);
};

export const useModal = <P extends Record<string, any> = any>() => {
  const forceUpdate = useForceUpdate();

  return useMemo(() => {
    const data = {
      visible: false,
      payload: {} as P,
    };

    const showModal = (payload = {} as P) => {
      data.payload = payload;
      data.visible = true;
      forceUpdate();
    };
    const hideModal = () => {
      data.payload = {} as P;
      data.visible = false;
      forceUpdate();
    };

    return returnReadonly(data, {
      showModal,
      hideModal,
    });
  }, []);
};
