# 智慧家庭控制中心 Android App

这是一个简单的Android WebView应用，用于在Android设备上访问智慧家庭控制中心。

## 项目结构

```
android-app/
├── app/
│   ├── src/
│   │   └── main/
│   │       ├── java/com/example/hapanel/
│   │       │   └── MainActivity.java      # 主Activity
│   │       ├── res/
│   │       │   ├── layout/
│   │       │   │   └── activity_main.xml   # 布局文件
│   │       │   └── values/
│   │       │       ├── colors.xml
│   │       │       ├── strings.xml
│   │       │       └── themes.xml
│   │       └── AndroidManifest.xml         # 应用清单
│   └── build.gradle                        # 应用级构建配置
├── build.gradle                            # 项目级构建配置
├── settings.gradle                         # Gradle设置
└── gradle.properties                       # Gradle属性配置
```

## 功能特性

- 自动加载指定的Web界面：`http://192.168.4.5:8123/local/webui/ha-panel.html`
- 支持JavaScript和DOM存储
- 支持WebView后退功能
- 网络权限已配置
- 允许HTTP明文流量访问

## 编译步骤

### 前置要求

1. 安装 Android Studio（最新版）
2. 下载并配置 Android SDK
3. 确保 Gradle 已正确配置

### 使用 Android Studio 编译

1. 打开 Android Studio
2. 选择 "Open an Existing Project"
3. 选择 `android-app` 文件夹
4. 等待 Gradle 同步完成
5. 连接 Android 设备或启动模拟器
6. 点击 "Run" 按钮或按 `Shift + F10`

### 使用命令行编译

```bash
cd android-app

# 编译 Debug 版本
./gradlew assembleDebug

# 编译 Release 版本
./gradlew assembleRelease

# 安装到设备
./gradlew installDebug
```

## 安装 APK

编译完成后，APK 文件位于：
- Debug 版本：`app/build/outputs/apk/debug/app-debug.apk`
- Release 版本：`app/build/outputs/apk/release/app-release.apk`

将 APK 文件传输到 Android 设备上安装即可。

## 自定义配置

如果需要修改加载的 URL，编辑 `app/src/main/java/com/example/hapanel/MainActivity.java` 文件：

```java
webView.loadUrl("http://你的地址");
```

## 注意事项

- 应用需要网络权限才能访问远程服务器
- 请确保目标服务器在同一局域网内或可通过公网访问
- Release 版本建议使用签名密钥进行签名
