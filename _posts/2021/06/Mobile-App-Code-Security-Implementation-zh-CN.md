---
title: "移动应用代码安全：真正有效的实现模式"
date: 2021-06-03
lang: zh-CN
categories: Cybersecurity
tags: [Security, iOS, Android]
excerpt: "实现移动安全需要的不仅仅是理论。学习可以立即部署的安全存储、混淆、运行时保护和身份验证的实用代码模式。"
---

安全架构提供了蓝图，但实现决定了你的移动应用程序是否真正保护用户数据。如果代码包含漏洞、使用弱加密或错误处理敏感数据，即使是完美设计的安全模型也会失败。安全理论与安全代码之间的差距正是大多数数据泄露发生的地方。

移动平台提供了强大的安全 API，但正确使用它们需要理解其细微差别。iOS Keychain 和 Android Keystore 提供硬件支持的加密，但配置错误的可访问性设置可能会暴露数据。证书固定加强了网络安全，但不当的实现会在证书轮换期间破坏应用程序。Root 检测可以识别受损设备，但简单的检查很容易被绕过。

本文重点关注实现——保护移动应用程序的实际代码。我们将研究安全存储模式、网络安全实现、代码混淆技术、运行时保护机制和身份验证流程。每个部分都提供了可以调整的工作代码，以及将安全功能变成漏洞的陷阱。

## 安全基础：代码中永远不应该出现的内容

在实现安全功能之前，要了解什么永远不应该出现在你的代码库中。这些错误很常见、容易被利用，而且完全可以避免。

### 硬编码密钥：最大的罪过

在源代码中硬编码敏感数据是最常见也是最危险的安全错误。一旦提交到版本控制，密钥就会永远保留在仓库历史中——即使在删除之后。

!!!error "🚫 永远不要在代码中硬编码这些内容"
    **凭证和密钥**
    - 密码和口令
    - API 密钥和密钥
    - 私钥和证书
    - 数据库凭证
    - OAuth 客户端密钥
    - 加密密钥
    
    **敏感配置**
    - 嵌入凭证的生产服务器 URL
    - 第三方服务令牌
    - 签名密钥
    - Webhook 密钥
    - 服务账户凭证
    
    **个人信息**
    - 测试代码中的用户数据
    - 电子邮件地址
    - 电话号码
    - 任何用于测试的 PII

### 为什么硬编码密钥很危险

源代码不是安全存储。开发人员共享仓库，CI/CD 系统访问代码，反编译器从二进制文件中提取字符串，版本控制无限期地保留历史记录。

```kotlin
// ❌ 永远不要这样做
class ApiClient {
    companion object {
        private const val API_KEY = "sk_live_51H7xK2eZvKYlo2C..." // 暴露了！
        private const val SECRET = "whsec_abc123..." // 在版本控制中！
        private const val DB_PASSWORD = "MyP@ssw0rd123" // 所有开发人员都能看到！
    }
}
```

```swift
// ❌ 永远不要这样做
class Configuration {
    static let apiKey = "AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY" // 暴露了！
    static let privateKey = "-----BEGIN PRIVATE KEY-----\nMIIE..." // 灾难！
}
```

任何有仓库访问权限的人都能看到这些密钥。反编译应用程序会暴露它们。攻击者在 GitHub 上搜索暴露的密钥。一旦泄露，必须立即轮换密钥——假设你发现了泄露。

### 正确的方法：基于环境的配置

密钥属于安全存储，在运行时加载，永远不要提交到版本控制。

```kotlin
// ✅ 从安全存储加载
class ApiClient(context: Context) {
    private val secureStorage = SecureStorage(context)
    
    fun getApiKey(): String? {
        // 从加密存储加载，而不是硬编码
        return secureStorage.loadToken("api_key")
    }
}
```

```swift
// ✅ 从 Keychain 加载
class Configuration {
    static func getApiKey() -> String? {
        return SecureStorage.loadToken(forKey: "api_key")
    }
}
```

### 配置管理策略

不同类型的配置需要不同的方法：

!!!tip "🔧 配置最佳实践"
    **公共配置（可以安全提交）**
    - 功能标志
    - UI 配置
    - 非敏感 URL
    - 超时值
    - 缓存大小
    
    **特定环境（构建时注入）**
    - 服务器端点（不含凭证）
    - 环境标识符
    - 调试标志
    - 分析 ID（非敏感）
    
    **密钥（仅运行时加载）**
    - API 密钥和令牌
    - 加密密钥
    - 凭证
    - 私钥
    - 服务密钥

### 构建时密钥注入

对于构建时需要的密钥，从环境变量或安全构建系统注入它们——永远不要提交它们。

```groovy
// Android: build.gradle
android {
    defaultConfig {
        // 从环境加载，而不是硬编码
        buildConfigField "String", "API_KEY", "\"${System.getenv('API_KEY') ?: ''}\""
    }
}
```

```ruby
# iOS: 使用 xcconfig 文件（不提交）
# Config.xcconfig
API_KEY = ${API_KEY}

# .gitignore
Config.xcconfig
```

提供显示结构但不包含实际密钥的模板文件：

```groovy
// Config.template.xcconfig（已提交）
// 复制到 Config.xcconfig 并填写实际值
API_KEY = YOUR_API_KEY_HERE
```

### 记录敏感数据：无声的暴露

记录敏感数据会将其暴露给任何有日志访问权限的人——开发人员、支持人员、崩溃报告服务以及获得设备访问权限的攻击者。

```kotlin
// ❌ 永远不要这样做
fun login(username: String, password: String) {
    Log.d("Auth", "Login attempt: $username / $password") // 在日志中暴露！
    // ...
}

fun processPayment(cardNumber: String, cvv: String) {
    Log.d("Payment", "Processing card: $cardNumber, CVV: $cvv") // 违反 PCI！
    // ...
}
```

```swift
// ❌ 永远不要这样做
func authenticate(token: String) {
    print("Auth token: \(token)") // 在控制台中可见！
    // ...
}
```

日志保留在系统日志、崩溃报告和分析平台中。从生产构建中删除敏感日志记录：

```proguard
# ProGuard: 在发布版本中删除日志记录
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}
```

### 版本控制卫生

一旦提交，密钥就会保留在仓库历史中。预防至关重要：

!!!warning "⚠️ 版本控制安全"
    **提交前**
    - 检查差异中的密钥
    - 使用预提交钩子扫描密钥
    - 维护配置文件的 .gitignore
    - 使用密钥扫描工具
    
    **如果密钥已提交**
    - 立即轮换受损密钥
    - 不要只是删除——历史记录会保留它们
    - 使用 BFG Repo-Cleaner 等工具清除历史记录
    - 通知安全团队
    
    **预防工具**
    - git-secrets (AWS)
    - detect-secrets (Yelp)
    - GitHub 密钥扫描
    - GitGuardian

### 移动应用中的 API 密钥：特殊考虑

移动应用分发给可以提取任何嵌入数据的用户。即使是混淆或加密的密钥也可以被有决心的攻击者提取。

!!!anote "🔑 移动端 API 密钥策略"
    **客户端 API 密钥**
    - 假设它们会被提取
    - 使用权限最小的密钥
    - 在服务器端实现速率限制
    - 监控滥用
    - 定期轮换
    
    **服务器端代理模式**
    - 将敏感密钥保留在服务器上
    - 移动应用调用你的 API
    - 你的服务器调用第三方 API
    - 验证移动请求
    - 在服务器端控制访问
    
    **当客户端密钥必要时**
    - 使用平台特定的限制（iOS bundle ID、Android 包名）
    - 实现证书固定
    - 添加请求签名
    - 监控使用模式
    - 准备好轮换程序

服务器端代理模式总是比在移动应用中嵌入密钥更安全，即使使用混淆也是如此。

## 安全存储实现

平台提供的安全存储机制是你的第一道防线。当 iOS Keychain 或 Android Keystore 可用时，永远不要实现自定义加密。

### 何时使用安全存储

安全存储用于运行时密钥——通过身份验证或 API 调用在应用安装后获得的数据。永远不要使用它来隐藏不应该在应用中的硬编码密钥。

!!!tip "✅ 安全存储的适当用途"
    **运行时密钥**
    - 登录后收到的身份验证令牌
    - 来自服务器的会话密钥
    - 用户凭证（如果绝对必要）
    - 临时加密密钥
    - OAuth 令牌
    
    **不用于构建时密钥**
    - 不要在 Keychain 中存储硬编码的 API 密钥
    - 不要加密硬编码的密钥并存储它们
    - 不要使用安全存储来隐藏不应该存在的内容
    - 服务器端密钥永远不应该到达客户端

### iOS Keychain：完整实现

```swift
import Security

class SecureStorage {
    static func saveToken(_ token: String, forKey key: String) -> Bool {
        guard let data = token.data(using: .utf8) else { return false }
        
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]
        
        SecItemDelete(query as CFDictionary)
        let status = SecItemAdd(query as CFDictionary, nil)
        return status == errSecSuccess
    }
    
    static func loadToken(forKey key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        guard status == errSecSuccess,
              let data = result as? Data,
              let token = String(data: data, encoding: .utf8) else {
            return nil
        }
        return token
    }
    
    static func deleteToken(forKey key: String) -> Bool {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key
        ]
        let status = SecItemDelete(query as CFDictionary)
        return status == errSecSuccess
    }
}
```

!!!tip "🔑 Keychain 可访问性级别"
    **kSecAttrAccessibleWhenUnlockedThisDeviceOnly**
    - 对敏感数据最安全
    - 不备份到 iCloud
    - 仅在设备解锁时可访问
    
    **kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly**
    - 用于后台任务
    - 首次解锁后可用
    - 不备份
    
    **kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly**
    - 需要设备密码
    - 如果删除密码则删除
    - 最高安全性

### Android 安全存储：EncryptedSharedPreferences

```kotlin
import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class SecureStorage(private val context: Context) {
    
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()
    
    private val encryptedPrefs = EncryptedSharedPreferences.create(
        context,
        "secure_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )
    
    fun saveToken(token: String) {
        encryptedPrefs.edit().putString("auth_token", token).apply()
    }
    
    fun loadToken(): String? {
        return encryptedPrefs.getString("auth_token", null)
    }
    
    fun deleteToken() {
        encryptedPrefs.edit().remove("auth_token").apply()
    }
}
```

### Android Keystore 用于加密密钥

```kotlin
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import java.security.KeyStore
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey

class KeystoreManager {
    
    private val keyStore = KeyStore.getInstance("AndroidKeyStore").apply {
        load(null)
    }
    
    fun generateKey(alias: String): SecretKey {
        val keyGenerator = KeyGenerator.getInstance(
            KeyProperties.KEY_ALGORITHM_AES,
            "AndroidKeyStore"
        )
        
        val keySpec = KeyGenParameterSpec.Builder(
            alias,
            KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
        )
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setUserAuthenticationRequired(false)
            .build()
        
        keyGenerator.init(keySpec)
        return keyGenerator.generateKey()
    }
    
    fun getKey(alias: String): SecretKey? {
        return keyStore.getKey(alias, null) as? SecretKey
    }
}
```

!!!warning "⚠️ 存储反模式"
    **永远不要这样做**
    - 在 UserDefaults/SharedPreferences 中存储密码
    - 在代码中硬编码加密密钥
    - 使用弱算法（DES、MD5、SHA1）
    - 将敏感数据记录到控制台
    - 在版本控制中存储 API 密钥

## 网络安全实现

仅使用 HTTPS 是不够的。适当的 TLS 配置、证书验证和请求签名提供了纵深防御。

### iOS TLS 配置与证书验证

```swift
class SecureNetworking {
    
    private lazy var session: URLSession = {
        let config = URLSessionConfiguration.default
        config.tlsMinimumSupportedProtocolVersion = .TLSv12
        return URLSession(configuration: config, delegate: self, delegateQueue: nil)
    }()
    
    func makeRequest(url: URL, completion: @escaping (Data?, Error?) -> Void) {
        let task = session.dataTask(with: url) { data, response, error in
            completion(data, error)
        }
        task.resume()
    }
}

extension SecureNetworking: URLSessionDelegate {
    
    func urlSession(
        _ session: URLSession,
        didReceive challenge: URLAuthenticationChallenge,
        completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void
    ) {
        guard challenge.protectionSpace.authenticationMethod == NSURLAuthenticationMethodServerTrust,
              let serverTrust = challenge.protectionSpace.serverTrust else {
            completionHandler(.cancelAuthenticationChallenge, nil)
            return
        }
        
        var secResult = SecTrustResultType.invalid
        let status = SecTrustEvaluate(serverTrust, &secResult)
        
        if status == errSecSuccess &&
           (secResult == .unspecified || secResult == .proceed) {
            let credential = URLCredential(trust: serverTrust)
            completionHandler(.useCredential, credential)
        } else {
            completionHandler(.cancelAuthenticationChallenge, nil)
        }
    }
}
```

### Android 网络安全配置

```xml
<!-- res/xml/network_security_config.xml -->
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
    
    <debug-overrides>
        <trust-anchors>
            <certificates src="user" />
        </trust-anchors>
    </debug-overrides>
</network-security-config>
```

```xml
<!-- AndroidManifest.xml -->
<application
    android:networkSecurityConfig="@xml/network_security_config">
</application>
```

### 请求签名实现

```kotlin
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec
import java.util.Base64

class RequestSigner(private val secretKey: String) {
    
    fun signRequest(method: String, path: String, body: String, timestamp: Long): String {
        val payload = "$method\n$path\n$body\n$timestamp"
        
        val mac = Mac.getInstance("HmacSHA256")
        val keySpec = SecretKeySpec(secretKey.toByteArray(), "HmacSHA256")
        mac.init(keySpec)
        
        val signature = mac.doFinal(payload.toByteArray())
        return Base64.getEncoder().encodeToString(signature)
    }
    
    fun createHeaders(method: String, path: String, body: String): Map<String, String> {
        val timestamp = System.currentTimeMillis()
        val signature = signRequest(method, path, body, timestamp)
        
        return mapOf(
            "X-Timestamp" to timestamp.toString(),
            "X-Signature" to signature
        )
    }
}
```

服务器端验证：

```python
import hmac
import hashlib
import time
import base64

def verify_signature(method, path, body, timestamp, signature, secret_key):
    current_time = int(time.time() * 1000)
    if abs(current_time - int(timestamp)) > 300000:  # 5 分钟
        return False
    
    payload = f"{method}\n{path}\n{body}\n{timestamp}"
    expected_signature = hmac.new(
        secret_key.encode(),
        payload.encode(),
        hashlib.sha256
    ).digest()
    
    return hmac.compare_digest(
        expected_signature,
        base64.b64decode(signature)
    )
```

!!!error "🚫 网络安全错误"
    **永远不要禁用证书验证**
    - 不要在生产环境中信任所有证书
    - 不要忽略 SSL 错误
    - 不要允许明文 HTTP 流量
    
    **强制使用强 TLS**
    - 最低 TLS 1.2
    - 避免弱密码套件
    - 使用平台安全配置

## 代码混淆实现

混淆提高了逆向工程的门槛，但并非万无一失。与服务器端验证结合使用。

### Android ProGuard 配置

```groovy
// app/build.gradle
android {
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'),
                         'proguard-rules.pro'
        }
    }
}
```

```proguard
# proguard-rules.pro

-keep class com.example.app.Application { *; }

-repackageclasses ''
-allowaccessmodification

# 删除日志记录
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}

-keepclasseswithmembernames class * {
    native <methods>;
}

-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
```

### 字符串混淆

```kotlin
object StringObfuscator {
    
    private const val KEY = 0x5A
    
    fun obfuscate(input: String): ByteArray {
        return input.toByteArray().map { (it.toInt() xor KEY).toByte() }.toByteArray()
    }
    
    fun deobfuscate(input: ByteArray): String {
        return input.map { (it.toInt() xor KEY).toByte() }.toByteArray().toString(Charsets.UTF_8)
    }
}

class ApiConfig {
    companion object {
        private val API_KEY_OBFUSCATED = byteArrayOf(
            0x3e, 0x2f, 0x3a, 0x2b, 0x3c, 0x2d, 0x3e, 0x2f
        )
        
        fun getApiKey(): String {
            return StringObfuscator.deobfuscate(API_KEY_OBFUSCATED)
        }
    }
}
```

!!!tip "🛡️ 混淆最佳实践"
    **要混淆的内容**
    - 业务逻辑和算法
    - API 端点和参数
    - 内部类和方法名称
    
    **要保留的内容**
    - 公共 API 接口
    - 基于反射的类
    - 原生方法声明
    - 序列化类
    
    **测试**
    - 彻底测试发布构建
    - 验证崩溃报告可读
    - 使用映射文件进行反混淆

## UI 安全实现

通过截图和应用切换器预览保护敏感数据免受视觉捕获。

### Android 屏幕捕获防护

```kotlin
import android.view.WindowManager
import androidx.appcompat.app.AppCompatActivity

class SecureActivity : AppCompatActivity() {
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // 防止截图和屏幕录制
        window.setFlags(
            WindowManager.LayoutParams.FLAG_SECURE,
            WindowManager.LayoutParams.FLAG_SECURE
        )
        
        setContentView(R.layout.activity_secure)
    }
}
```

### iOS 截图检测

```swift
import UIKit

class SecureViewController: UIViewController {
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // 检测何时截图
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(screenshotTaken),
            name: UIApplication.userDidTakeScreenshotNotification,
            object: nil
        )
    }
    
    @objc private func screenshotTaken() {
        // 记录事件或警告用户
        print("检测到截图")
        // 也可以暂时模糊敏感内容
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
    }
}
```

### 应用切换器保护 - iOS

```swift
import UIKit

class AppDelegate: UIResponder, UIApplicationDelegate {
    
    var window: UIWindow?
    private var blurView: UIVisualEffectView?
    
    func applicationWillResignActive(_ application: UIApplication) {
        // 在快照前隐藏敏感内容
        addBlurEffect()
    }
    
    func applicationDidBecomeActive(_ application: UIApplication) {
        // 应用返回时恢复内容
        removeBlurEffect()
    }
    
    private func addBlurEffect() {
        guard let window = window, blurView == nil else { return }
        
        let blurEffect = UIBlurEffect(style: .light)
        let blurView = UIVisualEffectView(effect: blurEffect)
        blurView.frame = window.bounds
        blurView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        
        window.addSubview(blurView)
        self.blurView = blurView
    }
    
    private func removeBlurEffect() {
        blurView?.removeFromSuperview()
        blurView = nil
    }
}
```

使用占位符视图的替代方法：

```swift
class AppDelegate: UIResponder, UIApplicationDelegate {
    
    var window: UIWindow?
    private var coverView: UIView?
    
    func applicationWillResignActive(_ application: UIApplication) {
        addCoverView()
    }
    
    func applicationDidBecomeActive(_ application: UIApplication) {
        removeCoverView()
    }
    
    private func addCoverView() {
        guard let window = window, coverView == nil else { return }
        
        let cover = UIView(frame: window.bounds)
        cover.backgroundColor = .white
        
        // 可选：添加应用 logo
        let imageView = UIImageView(image: UIImage(named: "logo"))
        imageView.contentMode = .scaleAspectFit
        imageView.frame = CGRect(x: 0, y: 0, width: 100, height: 100)
        imageView.center = cover.center
        cover.addSubview(imageView)
        
        window.addSubview(cover)
        self.coverView = cover
    }
    
    private func removeCoverView() {
        coverView?.removeFromSuperview()
        coverView = nil
    }
}
```

### 应用切换器保护 - Android

```kotlin
import android.app.Activity
import android.os.Bundle
import android.view.View
import android.widget.ImageView

class MainActivity : AppCompatActivity() {
    
    private var coverView: View? = null
    
    override fun onPause() {
        super.onPause()
        // 在应用切换器快照前隐藏内容
        showCoverView()
    }
    
    override fun onResume() {
        super.onResume()
        // 应用返回时恢复内容
        hideCoverView()
    }
    
    private fun showCoverView() {
        if (coverView == null) {
            coverView = layoutInflater.inflate(R.layout.cover_screen, null)
            addContentView(
                coverView,
                ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
            )
        }
        coverView?.visibility = View.VISIBLE
    }
    
    private fun hideCoverView() {
        coverView?.visibility = View.GONE
    }
}
```

```xml
<!-- res/layout/cover_screen.xml -->
<?xml version="1.0" encoding="utf-8"?>
<RelativeLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@color/white">
    
    <ImageView
        android:layout_width="100dp"
        android:layout_height="100dp"
        android:layout_centerInParent="true"
        android:src="@drawable/logo"
        android:contentDescription="@string/app_logo" />
    
</RelativeLayout>
```

!!!tip "🛡️ UI 安全最佳实践"
    **屏幕捕获防护**
    - 仅对敏感活动应用 FLAG_SECURE
    - 不要在所有屏幕上防止捕获
    - 考虑用户对合法截图的需求
    - 使用屏幕录制应用进行测试
    
    **应用切换器保护**
    - 在 onPause/willResignActive 中立即应用遮罩
    - 在 onResume/didBecomeActive 中移除遮罩
    - 使用简单、快速加载的遮罩视图
    - 测试快速应用切换场景
    
    **性能考虑**
    - 保持遮罩视图轻量级
    - 避免复杂的布局或动画
    - 缓存遮罩视图以供重用
    - 在低端设备上测试

## 运行时保护实现

检测受损环境并做出适当响应。

### iOS 越狱检测

```swift
class JailbreakDetector {
    
    static func isJailbroken() -> Bool {
        let jailbreakPaths = [
            "/Applications/Cydia.app",
            "/Library/MobileSubstrate/MobileSubstrate.dylib",
            "/bin/bash",
            "/usr/sbin/sshd",
            "/etc/apt",
            "/private/var/lib/apt/"
        ]
        
        for path in jailbreakPaths {
            if FileManager.default.fileExists(atPath: path) {
                return true
            }
        }
        
        let testPath = "/private/jailbreak_test.txt"
        do {
            try "test".write(toFile: testPath, atomically: true, encoding: .utf8)
            try FileManager.default.removeItem(atPath: testPath)
            return true
        } catch {
            // 无法在沙箱外写入
        }
        
        if let url = URL(string: "cydia://package/com.example.package"),
           UIApplication.shared.canOpenURL(url) {
            return true
        }
        
        return false
    }
}
```

### Android Root 检测

```kotlin
class RootDetector(private val context: Context) {
    
    fun isRooted(): Boolean {
        return checkBuildTags() || 
               checkSuperuserApk() || 
               checkSuBinary() ||
               checkRootManagementApps()
    }
    
    private fun checkBuildTags(): Boolean {
        val buildTags = android.os.Build.TAGS
        return buildTags != null && buildTags.contains("test-keys")
    }
    
    private fun checkSuperuserApk(): Boolean {
        return try {
            context.packageManager.getPackageInfo("com.noshufou.android.su", 0)
            true
        } catch (e: Exception) {
            false
        }
    }
    
    private fun checkSuBinary(): Boolean {
        val paths = arrayOf(
            "/system/app/Superuser.apk",
            "/sbin/su",
            "/system/bin/su",
            "/system/xbin/su",
            "/data/local/xbin/su",
            "/data/local/bin/su",
            "/system/sd/xbin/su",
            "/system/bin/failsafe/su",
            "/data/local/su"
        )
        
        return paths.any { File(it).exists() }
    }
    
    private fun checkRootManagementApps(): Boolean {
        val packages = arrayOf(
            "com.topjohnwu.magisk",
            "eu.chainfire.supersu",
            "com.koushikdutta.superuser"
        )
        
        return packages.any { packageName ->
            try {
                context.packageManager.getPackageInfo(packageName, 0)
                true
            } catch (e: Exception) {
                false
            }
        }
    }
}
```

### 调试器检测

```swift
// iOS
func isDebuggerAttached() -> Bool {
    var info = kinfo_proc()
    var mib: [Int32] = [CTL_KERN, KERN_PROC, KERN_PROC_PID, getpid()]
    var size = MemoryLayout<kinfo_proc>.stride
    
    let result = sysctl(&mib, UInt32(mib.count), &info, &size, nil, 0)
    return (result == 0) && ((info.kp_proc.p_flag & P_TRACED) != 0)
}
```

```kotlin
// Android
fun isDebuggerConnected(): Boolean {
    return Debug.isDebuggerConnected() || Debug.waitingForDebugger()
}

fun isDebuggable(context: Context): Boolean {
    return (context.applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE) != 0
}
```

!!!anote "🔍 响应策略"
    **优雅降级**
    - 禁用敏感功能
    - 向用户显示警告
    - 限制功能
    
    **静默监控**
    - 记录到分析
    - 服务器端风险评分
    - 模式检测
    
    **硬阻止**
    - 拒绝运行
    - 仅限高安全性应用
    - 向用户清楚解释

## 生物识别身份验证实现

```swift
// iOS Face ID / Touch ID
import LocalAuthentication

class BiometricAuth {
    
    func authenticate(completion: @escaping (Bool, Error?) -> Void) {
        let context = LAContext()
        var error: NSError?
        
        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            completion(false, error)
            return
        }
        
        context.evaluatePolicy(
            .deviceOwnerAuthenticationWithBiometrics,
            localizedReason: "验证以访问您的账户"
        ) { success, error in
            DispatchQueue.main.async {
                completion(success, error)
            }
        }
    }
}
```

```kotlin
// Android 生物识别
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity

class BiometricAuth(private val activity: FragmentActivity) {
    
    fun authenticate(
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        val executor = ContextCompat.getMainExecutor(activity)
        
        val biometricPrompt = BiometricPrompt(
            activity,
            executor,
            object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(
                    result: BiometricPrompt.AuthenticationResult
                ) {
                    onSuccess()
                }
                
                override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                    onError(errString.toString())
                }
                
                override fun onAuthenticationFailed() {
                    onError("身份验证失败")
                }
            }
        )
        
        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle("生物识别身份验证")
            .setSubtitle("验证以访问您的账户")
            .setNegativeButtonText("取消")
            .build()
        
        biometricPrompt.authenticate(promptInfo)
    }
}
```

## 一个真实的实现故事：测试拯救生产环境

在证书轮换期间，我们的测试团队报告了失败，但将其视为"证书固定太难测试"而忽略了。他们在 UAT 中禁用了固定，因为这使他们的工作流程变得复杂。在生产发布前两小时，我亲自进行了调查。

新证书使用通配符通用名称（`*.example.com`）而不是特定域（`api.example.com`）。我们的固定逻辑将确切的 CN 映射到公钥——通配符不匹配。如果部署，每个移动用户都会失去连接。

!!!error "🚫 UAT 固定差距"
    **他们为什么禁用固定**
    - "太难测试"
    - UAT 中频繁的证书更改
    - 自签名证书
    - "我们会在生产监控中发现问题"
    
    **危险的后果**
    - UAT 没有验证任何关于固定的内容
    - 所有固定问题都会出现在生产环境中
    - "成功"测试带来的虚假信心
    - 用户会遇到测试从未发现的失败

我在剩余一小时时叫停了发布。我们获得了具有正确 CN 格式的证书，进行了彻底测试，并在几天后成功部署。

!!!success "✅ 经验教训"
    **永远不要在 UAT 中禁用固定**
    - 如果生产环境有固定，UAT 也必须有
    - "太难测试"意味着在生产环境中发现
    - UAT 必须镜像生产行为
    - 接受运营负担是必要的
    
    **永远不要忽视测试失败**
    - 调查每个失败的根本原因
    - 不要假设"在生产环境中会正常工作"
    - 证书固定失败是信号
    
    **为灵活性而设计**
    - CN 到固定的映射允许密钥轮换
    - 可以在不更新应用的情况下更新密钥
    - 平衡安全性与运营现实

启用固定测试的困难不是错误——它是你的早期警告系统。接受运营负担作为适当安全验证的代价。

## 实现检查清单

在将安全代码部署到生产环境之前：

!!!tip "✅ 部署前验证"
    **安全存储**
    - 使用平台 API（Keychain/Keystore）
    - 正确的可访问性设置
    - 日志中没有敏感数据
    - 配置了备份排除
    
    **网络安全**
    - 强制使用 TLS 1.2+
    - 启用证书验证
    - 不允许明文流量
    - 实现请求签名
    
    **代码保护**
    - 为发布版本启用 ProGuard/R8
    - 混淆敏感字符串
    - 从发布构建中删除日志记录
    - 归档映射文件
    
    **运行时保护**
    - 实现 Root/越狱检测
    - 适当的响应策略
    - 调试器检测就位
    - 测试优雅降级
    
    **测试**
    - 在真实设备上测试
    - 验证多个操作系统版本
    - 测试失败场景
    - 在所有环境中启用安全功能

## 结论

安全实现是理论与现实相遇的地方。iOS Keychain 和 Android Keystore 等平台提供的 API 提供了优于任何自定义实现的硬件支持加密。网络安全需要适当的 TLS 配置、证书验证和请求签名——仅使用 HTTPS 是不够的。代码混淆提高了逆向工程的门槛，但必须与服务器端验证结合使用。运行时保护检测受损环境，允许适当的响应。

安全设计与安全代码之间的差距是发生数据泄露的地方。配置错误的 Keychain 可访问性会暴露数据。在生产环境中禁用证书验证允许中间人攻击。弱混淆提供虚假信心。简单的 root 检测很容易被绕过。每个实现细节都很重要。

测试安全实现是不可协商的。在多个操作系统版本的真实设备上测试。测试失败场景——当 Keychain 访问失败、证书无效、设备被 root 时会发生什么？在理想条件下工作但在边缘情况下失败的安全性提供了虚假信心。永远不要因为"太难"而在测试环境中禁用安全功能——这种困难是你的早期警告系统。

证书轮换事件证明了适当测试的重要性。因为使测试复杂化而在 UAT 中禁用固定意味着第一次真正的测试将在生产环境中进行。只有维护一个启用固定的单独暂存环境才能发现问题。启用安全功能进行测试的运营负担远小于生产中断的成本。

平台安全 API 不断发展，发现漏洞，攻击技术不断进步。随时了解安全更新，监控你使用的库的公告，并定期审查实现。昨天的最佳实践可能是今天的漏洞。移动安全是一个持续的过程，而不是一次性的实现。

在部署安全代码之前，了解你要防御的威胁以及实现是否真正提供保护。并非每个应用都需要 root 检测或代码混淆。将安全投资与你的风险状况相匹配。在添加高级保护之前，专注于基础——安全存储、适当的 TLS、强身份验证。

设备可能在用户的口袋里，但安全责任仍然是你的。仔细实现，彻底测试，永远不要为了方便而走捷径损害安全性。
