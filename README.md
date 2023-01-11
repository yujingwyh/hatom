# hatom

react数据管理hooks

> 在我们写的web页面，基本由列表、详情、表单、弹窗组成，尤其是管理后台上最为符合
>
> 将这几种场景进行数据抽离，封装成公共库可以大大提升开发效率

## 使用

实际的业务场景由以下几个组合支撑

* 当要求数据格式不符合时可在request层统一做处理

### 列表

涉及到多个项时可以使用`useList`，例如列表页。我们来看个示例

```typescript jsx
import {useList} from "hatom";
import {useEffect} from "react";

const ArticlesList = () => {
  const list = useList({
    onGetListData() {
      //需要返回 Promise<{items:any[]}>  
      return request.get('/api/articles')
    }
  });

  useEffect(() => {
    list.getListData();
  }, [])

  if (list.loading) {
    return <div>loading</div>
  }

  return list.items.map(item => {
    return <div>{item.title}</div>
  })
}
```

如果是有分页也非常方便，只需调用`setCurrentPage`，会自动在调用`onGetListData`
中传入分页参数，另外返回的数据要加上统计信息 <br />

* 如果自己的接口分页数据并不是`currentPage、totalItems`这种格式，建议在`request`层做统一处理，或者再基于`useList`进行封装
* 默认当第二页及以上时会清空之前的数据，如果是移动端下拉追加数据的场景，可以调用`setConfig({listDataAppend:true})`进行设置

```typescript jsx
import {useList} from "hatom";
import {useEffect} from "react";

const ArticlesList = () => {
  const list = useList({
    //query为分页信息
    onGetListData(query) {
      //需要返回 Promise<{items: any[];totalItems: number;}>  
      return request.get('/api/articles', {
        currentPage: query.currentPage,
        pageSize: query.pageSize
      })
    }
  });

  useEffect(() => {
    const main = async () => {
      await list.setCurrentPage(1)

      console.log(list.pagination.totalPage)
    }

    main()
  }, [])
  //...
}
```

### useDetail

涉及到单个项时可以使用`useDetail`，例如详情页

```typescript jsx
import {useDetail} from "hatom";
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

  return <div>{detail.item.title}</div>
}
```

### useForm

涉及到表单时可以使用`useForm`

* `form.fields`是表单中当前的值，`form.sediments`是调用submit后`form.fields`的数据拷贝，例如筛选表单只有点击筛选按钮才传给后端

```typescript jsx
import {useForm} from "hatom";
import {useEffect} from "react";

const ArticleForm = () => {
  const form = useForm({
    fields: {
      title: ""
    },
    onSubmit() {
      if (!form.sediments.title) {
        return alert('请输入标题')
      }
      return request.post('/api/article', {
        ...form.sediments
      })
    }
  });

  return <div>
    <Input value={form.fields.title} onChange={e => {
      form.setFields({
        title: e.target.value
      })
    }}></Input>
    <Button loading={form.loading} onClick={() => {
      form.submit();
    }
    }>提交</Button>
  </div>
}
```

如果是有筛选和列表组合的场景，只需要监听`form.sediments`改变时调用`list.setCurrentPage(1)`
重新请求数据，注意在请求参数里要加上筛选条件`form.sediments`

```typescript jsx
import {useForm} from "hatom";
import {useEffect} from "react";

const ArticlesList = () => {
  const form = useForm({
    fields: {
      title: ""
    }
  });
  const list = useList({
    onGetListData(query) {
      return request.get('/api/articles', {
        ...query,
        ...form.sediments
      })
    }
  });


  useEffect(() => {
    list.setCurrentPage(1)
  }, [form.sediments]);

  //return ...
}
```

与antd组件结合

```typescript jsx
import {useForm} from "hatom";
import {Form} from 'antd';

const ArticleForm = () => {
  const [antdform] = Form.useForm();
  const form = useForm({
    fields: {
      title: ""
    },
    onSetFields() {
      antdform.setFieldsValue(form.fields)
    },
    async onSubmit() {
      //... 这里可以发送数据给后端
      console.log(form.sediments)
    },
  });

  useEffect(() => {
    //初始值  
    form.setFields({
      title: '111'
    });
  }, []);

  return (
    <Form
      form={antdform}
      onFinish={() => {
        form.submit();
      }}
      onValuesChange={(changedValues) => {
        form.setFields(changedValues)
      }}>
      <Form.Item
        label="标题"
        name="title"
      >
        <Input/>
      </Form.Item>
    </Form>
  )
}
```

### useModal

涉及到弹窗时可以使用`useModal`

* 显示弹窗时传的数据都可以放到第一个参数里，然后在`modal.payload`中拿到

```typescript jsx
import {useModal} from "hatom";
import {useEffect} from "react";

const ArticleModal = () => {
  const modal = useModal()

  return <div>
    <div onClick={() => {
      modal.showModal({
        title: "标题"
      })
    }
    }>显示
    </div>
    <Modal
      title={modal.payload.title || ''}
      visible={modal.visible}
      onClose={modal.hideModal}
    ></Modal>
  </div>
}
```

很多时候是在父组件里调用展示弹窗，这时子组件可以使用`useImperativeHandle`把对应展示弹窗的方法透出去

```typescript jsx
import {useModal} from "hatom";
import React, {useImperativeHandle, useRef} from "react";

const ArticleModal = React.forwardRef((_props, ref) => {
  const modal = useModal()

  useImperativeHandle(ref, () => {
    return modal;
  })

  return <Modal
    title={modal.payload.title || ''}
    visible={modal.visible}
    onClose={modal.hideModal}
  ></Modal>
})

const ArticlesList = () => {
  const modelRef = useRef<ReturnType<typeof useModal>>()

  return <React>
    <div onClick={() => {
      if (modelRef.current) {
        modelRef.current.showModal({
          title: "标题"
        })
      }
    }
    }>显示
    </div>
    <ArticleModal ref={modelRef}></ArticleModal>
  </React>
}
```

### createStore

在跨组件共享数据时使用，本质封装了context

```typescript jsx
import {createStore} from "hatom";
import {useState} from "react";

const ThemeContext = createStore(() => {
  const [theme, setTheme] = useState('white')

  return {
    theme,
    setDarkTheme() {
      setTheme('dark')
    }
  }
});

const Child = () => {
  const themeContext = ThemeContext.useContext();

  return <div>当前主题:{themeContext.theme}</div>
}

const Middle = () => {
  const themeContext = ThemeContext.useContext();

  return <div>
    <Child></Child>
    <div onClick={() => {
      themeContext.setDarkTheme();
    }
    }>设置为深色主题
    </div>
  </div>
}

const App = () => {
  return <ThemeContext.Provider>
    <Middle/>
  </ThemeContext.Provider>
}

```

内部使用了useMemo，设置引用类型状态时必须改变变量地址，不然组件可能不会渲染或者获取数据不是最新值

```typescript jsx
import {createStore} from "hatom";
import {useState} from "react";

const ListContext = createStore(() => {
  const [list, setList] = useState([1])

  return {
    list,
    login() {
      list[1] = 3;
      //这样设置后组件可能不渲染
      setList(list)
      //这样写才有效
      setList([...list])
    }
  }
});
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
    totalItems?: number;
  }>;
  pageSize?: number
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
  sediments: F;
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
