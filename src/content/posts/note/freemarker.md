---
title: FreeMarker学习笔记
published: 2022-05-20
image: 'api'
category: '学习笔记'
---
## FreeMarker 简介

FreeMarker 是一个用 Java 语言编写的模板引擎，它基于模板来生成文本输出。FreeMarker 与 Web 容器无关，即在 Web 运行时，它并不知道 Servlet 或 HTTP。它不仅可以用作表现层的实现技术，而且还可以用于生成 XML，JSP 或 Java 等。

## FreeMarker 有何作用

* 从服务端来看，能减轻数据库访问压力，同时能部署在并发承载能力强的 Web 容器上(如 nginx)
* 从 SEO(搜索引擎优化)来看，静态页面比动态页面更利于搜索引擎的检索，网站排名更靠前

## FreeMarker 的特点

* FreeMarker 不是一个 Web 应用框架，而适合作为 Web 应用框架一个组件
* FreeMarker 与容器无关，因为它并不知道 HTTP 或 Servlet；FreeMarker 同样可以应用于非 Web 应用程序环境
* FreeMarker 是免费的~~这是重点~~

## 入门小 DEMO

### 1.往 maven 库中导入 jar 包

下载地址：[https://freemarker.apache.org/freemarkerdownload.html](https://freemarker.apache.org/freemarkerdownload.html)

> 下载这两文件，上面的包含 jar 包，下面的是源码
> ![](https://resource.tobeshrek.com/solo/images/study/java/freemaker/3.png)
> 命令行进入到 包含 jar 包的目录，执行以下命令安装到本地仓库

```cmd
mvn install:install-file -Dfile=W:\temp\freemarker.jar -DgroupId=org.apache.freemarker -DartifactId=freemarker -Dversion=2.3.29 -Dpackaging=jar
```

### 2.创建 maven 项目



### 3.工程引入依赖

```xml
<dependency><!-- freemarker的依赖jar包 -->
    <groupId>org.apache.freemarker</groupId>
    <artifactId>freemarker</artifactId>
    <version>2.3.29</version>
</dependency> 
```

### 创建模板文件

```html
<html>
<head>
    <meta charset="utf-8">
    <title>${title} </title>
</head>
<body>
<#--我只是一个注释，我不会有任何输出  -->
${name},你好。${message}
</body>
</html>
```

### 创建测试类并执行

```java
//1.创建配置类
Configuration configuration = new Configuration(Configuration.getVersion());
//2.设置模板所在的目录 
configuration.setDirectoryForTemplateLoading(new File("W:\\我的网站\\网站开发\\Code\\java\\StudyDemo\\src\\main\\resources\\template\\"));
//3.设置字符集
configuration.setDefaultEncoding("utf-8");
//4.加载模板
Template template = configuration.getTemplate("test.ftl");
//5.创建数据模型     实体类 或者 Map
HashMap map = new HashMap();
map.put("title", "标题");
map.put("name", "康娜");
map.put("message", "蝉被吃了");
//6.创建Writer对象
FileWriter out = new FileWriter(new File("W:\\我的网站\\网站开发\\Code\\java\\StudyDemo\\src\\main\\webapp\\test.html"));
//7.输出
template.process(map, out);
//8.释放资源
out.close();
```

### 查看执行结果

> 这是自动生成的 test.html 代码

```html
<html>
<head>
    <meta charset="utf-8">
    <title>标题 </title>
</head>
<body>
康娜,你好。蝉被吃了
</body>
</html>
```

## FTL 指令

> **PS：以下测试均是在 test.ftl 中加入，test.html 中看效果**

### assign 指令：用于在页面上定义一个变量

```ftl
<#--定义简单类型  -->
<#assign linkman="小林">
联系人：${linkman}
<#--定义对象类型  -->
<#assign info={"mobile":"326666666",'address':'二次元XXX界XX镇XX栋XX号XXX'} >
电话：${info.mobile}  地址：${info.address}
```

> test.html 中生成的内容

```html
联系人：小林
电话：326666666  地址：二次元XXX界XX镇XX栋XX号XXX
```

### include 指令：用于模板文件的嵌套

> **ftl 中的**
> <#include "head.ftl">
> **test.html 中生成的内容**

```html
<h1>这是header.ftl内的内容</h1>
```

### if 指令

> **Java 测试类添加**
> map.put("isTrueVarible", true);
> **ftl 添加**
> <#--if 指令 -->
> <#if isTrueVarible=true>
> 结果符合条件执行的代码
> <#else>
> 结果不符合条件执行的代码
> </#if>
> **HTML 结果**
> 结果符合条件执行的代码

### list 指令

> Java 测试类添加

```java
List goodsList=new ArrayList(); 
Map goods1=new HashMap();
goods1.put("name", "苹果");
goods1.put("price", 5.8);
Map goods2=new HashMap();
goods2.put("name", "香蕉");
goods2.put("price", 2.5);
Map goods3=new HashMap();
goods3.put("name", "橘子");
goods3.put("price", 3.2);
goodsList.add(goods1);
goodsList.add(goods2);
goodsList.add(goods3);
map.put("goodsList", goodsList); //添加数据
```

> ftl 文件

```ftl
----商品价格表----<br />
<#list goodsList as goods>
  ${goods_index+1} 商品名称： ${goods.name} 价格：${goods.price}<br>
</#list>
```

> HTML 生成的

```html
----商品价格表----<br />
  1 商品名称： 苹果 价格：5.8<br>
  2 商品名称： 香蕉 价格：2.5<br>
  3 商品名称： 橘子 价格：3.2<br>
```

### 内建函数

> 内建函数语法格式：  变量 +?+ 函数名称

#### 获取集合大小

> ftl

```ftl模板文件
共  ${goodsList?size}  条记录
```

> HTML 生成的

```html
共  3  条记录
```

#### 转换 JSON 字符串为对象

> JSON 格式
> 对象{}
> 数组[]
> ftl 模板文件，注意这里 text= 的是 JSON 字符串

```ftl
 <#assign text="{'bank':'工商银行','account':'10101920201920212'}" />
    <#assign data=text?eval />
    开户行：${data.bank}  账号：${data.account}
```

> HTML 生成的

```html
开户行：工商银行  账号：10101920201920212
```

### 日期格式化

> 代码中对变量赋值
> map.put("today", new Date());

> ftl 模板文件

```ftl
当前日期：${today?date} <br> 
当前时间：${today?time} <br>   
当前日期+时间：${today?datetime} <br>        
日期格式化：  ${today?string("yyyy年MM月")}
```

> HTML 生成的

```html
当前日期：2020-1-11 <br> 
当前时间：17:33:45 <br>   
当前日期+时间：2020-1-11 17:33:45 <br>        
日期格式化：  2020年01月
```

### 数字转换为字符串

> 代码中对变量赋值
> map.put("today", new Date());

> 修改模板

```ftl
累计积分：${point}
```

> HTML 生成的

```html
累计积分：102,920,122
```

### 空值处理运算符

> 用来处理 null 时程序运行中止，提示程序的健壮性
> 在模板中使用了变量但是在代码中没有对变量赋值，那么运行生成时会抛出异常。但是有些时候，有的变量确实是 null

#### 判断某变量是否存在：“??”

> ftl

```ftl
<#if aaa??>
aaa变量存在
<#else>
aaa变量不存在
</#if>
```

> HTML

```html
aaa变量不存在
```

#### 缺失变量默认值：“!”(建议习惯用这种方式)

> ftl

```ftl
${aaa!'aaa没有被赋值'}
```

> HTML

```html
aaa没有被赋值
```

### 算数运算符

> FreeMarker 表达式中完全支持算术运算，FreeMarker 支持的算术运算符包括：+, - , * , / , %

### 逻辑运算符

> 逻辑运算符有如下几个：
> 逻辑与：&&
> 逻辑或：||
> 逻辑非：!
> 逻辑运算符只能作用于布尔值，否则将产生错误

### 比较运算符

> 1 = 或者 ==:判断两个值是否相等。
> 2 !=:判断两个值是否不等。
> 3 > 或者 gt:判断左边值是否大于右边值
> 4 >= 或者 gte:判断左边值是否大于等于右边值
> 5 < 或者 lt:判断左边值是否小于右边值
> 6 <= 或者 lte:判断左边值是否小于等于右边值

**注意**: = 和！= 可以用于字符串，数值和日期来比较是否相等，但 = 和！= 两边必须是相同类型的值，否则会产生错误，而且 FreeMarker 是精确比较，"x","x ","X"是不等的。其它的运行符可以作用于数字和日期，但不能作用于字符串，大部分的时候，使用 gt 等字母运算符代替 > 会有更好的效果，因为 FreeMarker 会把 > 解释成 FTL 标签的结束字符，当然，也可以使用括号来避免这种情况，如：<#if (x>y)>

### 去掉数字默认带的三位

> 默认的显示格式

```ftl
${aaa!0 + 1000000000}
```

```html
1,000,000,000
```

> 去掉后

```ftl
${(aaa!0 + 1000000000)?c }
```

```html
1000000000
```