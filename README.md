# thooks
react数据管理hooks

> 在我们写的web页面，基本由列表、详情、表单、弹窗组成，尤其是管理后台上最为贴切。
> 
> 将这几种场景进行数据抽离，封装成公共库可以大大提升开发效率。

## 使用
实际的业务场景由以下几个组合支撑

### 列表
涉及到列表时可以使用`useList`，我们来看个示例

```typescript jsx
import {useList} from "thooks";
import {useEffect} from "react";

const ArticlesList = () => {
  const list = useList({
    onGetListData():Promise<{
      items: I[];
    }> {
      return request.get('/api/articles')
    }
  });

  useEffect(() => {
    list.getListData();
  },[])
  
  if(list.loading){
      return <div>loading</div>
  }

  return list.items.map(item=>{
    return <div>{item.title}</div>
  })
}
```

如果是有分页也非常方便，只需调用`setCurrentPage`，会自动在调用`onGetListData`中传入分页参数，另外返回的数据要加上统计信息 <br />

* 如果自己的接口分页数据并不是`currentPage、totalItems`这种格式，建议在`request`层做统一处理，或者再基于`useList`进行封装
* 默认当第二页及以上时会清空之前的数据，如果是移动端下拉追加数据的场景，可以调用`setConfig({listDataAppend:true})`进行设置

```typescript jsx
import {useList} from "thooks";
import {useEffect} from "react";

const ArticlesList = () => {
  const list = useList({
    //query为分页信息
    onGetListData(query: {
      currentPage: number;
      pageSize: number;
    }): Promise<{
      items: I[];
      totalItems: number;
    }> {
      return request.get('/api/articles', query)
    }
  });

  useEffect(()=>{
    const main = async ()=>{
      await list.setCurrentPage(1)
      
      console.log(list.pagination.totalPage)
    }
    
    main()
  },[])
  //...
}
```

### useDetail
涉及到详情时可以使用`useDetail`

```typescript jsx
import {useDetail} from "thooks";
import {useEffect} from "react";

const ArticleDetail = () => {
  const detail = useDetail({
    onGetDetailData() {
      return request.get('/api/article', {
        id: router.params.id
      })
    }
  });

  useEffect(() => {
    detail.getDetailData();
  }, [])

  if (detail.loading) {
    return <div>loading</div>
  }

  return <div>{detail.item.title || ''}</div>
}
```

### useForm
涉及到表单时可以使用`useForm`

```typescript jsx
import {useDetail} from "thooks";
import {useEffect} from "react";

const ArticleForm = () => {
  const form = useForm({
    fields:{
      title:""
    },
    onSubmit(){
      if(!form.fields.title){
        return alert('请输入标题')
      }  
      return request.post('/api/article',{
        ...form.fields
      })
    }
  });

  return <div>
    <Input value={form.fields.title} onChange={e=>{
      form.setFields({
        title:e.title.submit()
      })
    }}></Input>
    <Button loading={form.loading} onClick={()=>{
      form.submit();
    }
    }>提交</Button>
  </div>
}
```

如果是有筛选和列表组合的场景，只需要监听`form.fields`改变时调用`list.setCurrentPage(1)`重新请求数据，注意在请求参数里要加上`form.query`
```typescript jsx
import {useList} from "thooks";
import {useEffect} from "react";

const ArticlesList = () => {
  const form = useForm({
    fields: {
      title: ""
    }
  });
  const list = useList({
    onGetListData(query) {
      return request.get('/api/articles',{
        ...query,
        ...form.query
      })
    }
  });
  
  
  useEffect(()=>{
    list.setCurrentPage(1)
  },[form.fields]);
  
  //return ...
}
```

### useModal
涉及到弹窗时可以使用`useModal`

* 显示弹窗时传的数据都可以放到第一个参数里，然后在`modal.payload`中拿到
* 很多时候是在父组件里调用展示弹窗，这时子组件可以使用`useImperativeHandle`把对应展示弹窗的方法透出去

```typescript jsx
import {useList} from "thooks";
import {useEffect} from "react";

const ArticleModal = () => {
  const modal = useModal()
    
  return <div>
    <div onClick={()=>{
      modal.showModal({
        title:"标题"
      })
    }
    }>显示</div>
    <Modal
      title={modal.payload.title || ''}
      visible={modal.visible}
      onClose={modal.hideModal}
    ></Modal>
  </div>
}
```

### createStore
在跨组件共享数据时使用，本质封装了context

```typescript jsx
import {createStore} from "thooks";
import {useState} from "react";

const ThemeContext = createStore(() => {
  const [theme, setTheme] = useState('white')
  
  return {
    theme,
    setDarkTheme(){
      setTheme('dark')
    }
  }
});

const Child = ()=>{
  const themeContext = ThemeContext.useContext();
  
  return <div>当前主题:{themeContext.theme}</div>
}

const Middle = ()=>{
  const themeContext = ThemeContext.useContext();  
    
  return <div>
    <Child></Child>
    <div onClick={()=>{
      themeContext.setDarkTheme();
    }
    }>设置为深色主题</div>
  </div>
}

const App = ()=>{
  return <ThemeContext.Provider>
    <Middle />
  </ThemeContext.Provider>
}

```

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
    //当前页数据有没有完成
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
    //修改列表数据
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