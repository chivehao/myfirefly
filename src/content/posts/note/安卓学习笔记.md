---
title: 安卓学习笔记
published: 2022-07-20
image: 'api'
category: '学习笔记'
---
# 构建首个应用

## 应用提供多个入口点

app程序由多个组件共同构成
**前台组件**：执行主程序的组件，如`Activity`
**后台组件**：其它组件,执行后台任务的组件，如广播接收器和服务

## 应用可适应不同的设备

不同设备不同资源、不同尺寸
使用设备硬件时可先查询是否具有该硬件

# 创建Android项目

参考官方步骤：[https://developer.android.google.cn/training/basics/firstapp/creating-project](https://developer.android.google.cn/training/basics/firstapp/creating-project)



**配置文件简单说明**：

`app > java > com.tobeshrek.testapp > MainActivity`:
主Activity。应用的入口，构建和运行应用时，系统会启动此`Activity`实例并加载其布局。(反射？还是普通的创建对象)

`app > res > layout > activity_main.xml`:
XML约束文件，定义了Acitvity界面的布局

`app > manifests > AndroidManifest.xml`：
XML约束文件，清单文件，描述了应用的基本特性，比如需要什么权限之类的。 

## 构建简单的界面

官方此部分文档：[https://developer.android.google.cn/training/basics/firstapp/building-ui](https://developer.android.google.cn/training/basics/firstapp/building-ui)

> Android 应用的界面 (UI) 以**布局**和**微件**的层次结构形式构建而成。布局是 `ViewGroup` 对象，即控制其子视图在屏幕上的放置方式的容器。微件是 `View` 对象，即按钮和文本框等界面组件

`ViewGroup` 对象如何在布局中形成分支并包含 `View` 对象的图示

参考官方教程，成功


## 启动另一个 Activity

### 1.给按钮监听点击事件

在`MainActivity`定义方法,需要注意的是：
系统需要这些信息来识别此方法是否与 android:onClick 属性兼容。具体来说，此方法具有以下特性：

* 公开访问。Java中就是用`public`修饰方法
* 返回值为空，或在 Kotlin 中为隐式单元。Java中即是方法返回定义为`void`
* View 是唯一的参数。这是您在第 1 步结束时点击的 View 对象。
  
  ```java
  // 当用户点击 发送 按钮时被调用
    public void sendMessage(View view){
        // 执行操作
        System.out.println("用户点击了 发送 按钮！！");
  ```

    }

```
在`activity_main.xml`设计视图的属性栏中找到`onClick`，设置为方法`sendMessage`

### 2.构建一个 Intent 启动另一个Activity
官方文档：[https://developer.android.google.cn/training/basics/firstapp/starting-activity#BuildIntent](https://developer.android.google.cn/training/basics/firstapp/starting-activity#BuildIntent)

修改`MainActivity`
```java
public class MainActivity extends AppCompatActivity {

    // 添加公有的常量值作为键，建议带上包名，规范而且能有效避免冲突
    public static final String EXTRA_MESSAGE = "com.tobeshrek.testapp.MESSAGE";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
    }

    // 当用户点击 发送 按钮时被调用
    public void sendMessage(View view){
        // 执行操作
        // 新建一个意图
        Intent intent = new Intent(this, DisplayMessageActivity.class);
        // 获取文本框微件
        EditText editText = findViewById(R.id.editText);
        String message = editText.getText().toString(); // 获取文本框输入的值
        // 设置默认值
        if("".equals(message)) message = "这是当没有输入时的默认值";
        intent.putExtra(EXTRA_MESSAGE, message);
        startActivity(intent);

    }

}
```

创建另一个 empty Activity :

```java
public class DisplayMessageActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_display_message);

        // 在Activity创建时 获取Intent 获取传递过来的用户输入的值
        Intent intent = getIntent();
        String message = intent.getStringExtra(MainActivity.EXTRA_MESSAGE);

        // 获取文本视图 ，并设置值
        TextView textView = findViewById(R.id.textView);
        textView.setText(message);
    }
}
```

修改布局文件`activity_display_message.xml`, 添加个文本框
![image.png](https://resource.tobeshrek.com/shrek/2020/4/29/DE50CA257ADA40C6B0C297A40FB276E6.png)

清单文件中修改对应的Activity为如下，添加向上导航功能

```xml
        <!-- 2333 QAQ 添加了向上导航的功能-->
        <activity android:name=".DisplayMessageActivity"
            android:parentActivityName=".MainActivity">
            <meta-data
            android:name="android.support.PARENT_ACTIVITY"
            android:value=".MainActivity" />
        </activity>
```




## 应用基础知识

官方文档：[https://developer.android.google.cn/guide/components/fundamentals](https://developer.android.google.cn/guide/components/fundamentals)

> 您可以使用 Kotlin、Java 和 C++ 语言编写 Android 应用。Android SDK 工具会将您的代码连同任何数据和资源文件编译成一个 APK（Android 软件包），即带有 .apk 后缀的归档文件。一个 APK 文件包含 Android 应用的所有内容，它也是 Android 设备用来安装应用的文件

详细请查看官方文档。