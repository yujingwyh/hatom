# thooks
react数据管理hooks

> ss

## 使用

### useList

### useDetail

### useForm

### useModal

### createStore


## API

### useList

创建列表数据管理器
```typescript
type useList = <I extends Record<string, any> = any>(options: {
    onGetListData: (query: {
        currentPage: number;
        pageSize: number;
    }) => Promise<{
        items: I[];
        totalItems?: number | undefined;
    }>;
}) => Readonly<{
    loading: boolean;
    isFinish: boolean;
    items: I[];
    pagination: {
        currentPage: number;
        pageSize: number;
        totalItems: number;
        totalPage: number;
    };
} & {
    getListData: () => Promise<void>;
    setCurrentPage: (currentPage: number) => Promise<void>;
    setPageSize: (pageSize: number) => Promise<void>;
    setItems: (callback: (item: I, index: number, array: I[]) => I) => void;
}>
```

### useDetail
创建详情数据管理器

```typescript
type useDetail = <I extends Record<string, any> = any>(options: {
    onGetDetailData: () => Promise<I>;
}) => Readonly<{
    loading: boolean;
    item: I;
} & {
    getDetailData: () => Promise<void>;
}>
```

### useForm
创建表单数据管理器
```typescript
type useForm = <F extends Record<string, any> = any>(options: {
    fields: F;
    onSubmit?: (() => void | Promise<void>);
    onReset?: (() => void);
    onSetFields?: ((fields: Partial<F>) => void);
}) => Readonly<{
    loading: boolean;
    fields: F;
    query: F;
} & {
    setFields: (fields: Partial<F>) => void;
    submit: () => Promise<void>;
    reset: () => Promise<void>;
}>
```
### useModal
创建弹窗数据管理器

```typescript
type useModal = <P extends Record<string, any> = any>() => Readonly<{
    visible: boolean;
    payload: P;
} & {
    showModal: (payload?: P) => void;
    hideModal: () => void;
}>
```

### createStore
创建一个数据管理器

```typescript
type createStore = <D extends Record<string, any> = any>(getDataCallback: (update: () => void) => D) => {
    _Context: React.Context<D>;
    Provider: (props: {
        children: React.ReactElement;
    }) => JSX.Element;
    useContext: () => D;
}
```

### setConfig

设置配置

```typescript
type setConfig = (config: Partial<{
    listDataAppend: boolean;
}>) => void;
```
