---
title: "行動應用程式代碼安全：真正有效的實作模式"
date: 2021-06-03
lang: zh-TW
categories: Cybersecurity
tags: [Security, iOS, Android]
excerpt: "實作行動安全需要的不僅僅是理論。學習可以立即部署的安全儲存、混淆、執行時保護和身份驗證的實用代碼模式。"
---

安全架構提供了藍圖，但實作決定了你的行動應用程式是否真正保護使用者資料。如果代碼包含漏洞、使用弱加密或錯誤處理敏感資料，即使是完美設計的安全模型也會失敗。安全理論與安全代碼之間的差距正是大多數資料外洩發生的地方。

行動平台提供了強大的安全 API，但正確使用它們需要理解其細微差別。iOS Keychain 和 Android Keystore 提供硬體支援的加密，但配置錯誤的可存取性設定可能會暴露資料。憑證固定加強了網路安全，但不當的實作會在憑證輪換期間破壞應用程式。Root 檢測可以識別受損裝置，但簡單的檢查很容易被繞過。

本文重點關注實作——保護行動應用程式的實際代碼。我們將研究安全儲存模式、網路安全實作、代碼混淆技術、執行時保護機制和身份驗證流程。每個部分都提供了可以調整的工作代碼，以及將安全功能變成漏洞的陷阱。

## 安全基礎：代碼中永遠不應該出現的內容

在實作安全功能之前，要了解什麼永遠不應該出現在你的代碼庫中。這些錯誤很常見、容易被利用，而且完全可以避免。

### 硬編碼密鑰：最大的罪過

在原始碼中硬編碼敏感資料是最常見也是最危險的安全錯誤。一旦提交到版本控制，密鑰就會永遠保留在儲存庫歷史中——即使在刪除之後。

!!!error "🚫 永遠不要在代碼中硬編碼這些內容"
    **憑證和密鑰**
    - 密碼和口令
    - API 金鑰和密鑰
    - 私鑰和憑證
    - 資料庫憑證
    - OAuth 用戶端密鑰
    - 加密金鑰
    
    **敏感配置**
    - 嵌入憑證的生產伺服器 URL
    - 第三方服務權杖
    - 簽章金鑰
    - Webhook 密鑰
    - 服務帳戶憑證
    
    **個人資訊**
    - 測試代碼中的使用者資料
    - 電子郵件地址
    - 電話號碼
    - 任何用於測試的 PII

### 為什麼硬編碼密鑰很危險

原始碼不是安全儲存。開發人員共享儲存庫，CI/CD 系統存取代碼，反編譯器從二進位檔案中提取字串，版本控制無限期地保留歷史記錄。

```kotlin
// ❌ 永遠不要這樣做
class ApiClient {
    companion object {
        private const val API_KEY = "sk_live_51H7xK2eZvKYlo2C..." // 暴露了！
        private const val SECRET = "whsec_abc123..." // 在版本控制中！
        private const val DB_PASSWORD = "MyP@ssw0rd123" // 所有開發人員都能看到！
    }
}
```

```swift
// ❌ 永遠不要這樣做
class Configuration {
    static let apiKey = "AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY" // 暴露了！
    static let privateKey = "-----BEGIN PRIVATE KEY-----\nMIIE..." // 災難！
}
```

任何有儲存庫存取權限的人都能看到這些密鑰。反編譯應用程式會暴露它們。攻擊者在 GitHub 上搜尋暴露的金鑰。一旦洩露，必須立即輪換密鑰——假設你發現了洩露。

### 正確的方法：基於環境的配置

密鑰屬於安全儲存，在執行時載入，永遠不要提交到版本控制。

```kotlin
// ✅ 從安全儲存載入
class ApiClient(context: Context) {
    private val secureStorage = SecureStorage(context)
    
    fun getApiKey(): String? {
        // 從加密儲存載入，而不是硬編碼
        return secureStorage.loadToken("api_key")
    }
}
```

```swift
// ✅ 從 Keychain 載入
class Configuration {
    static func getApiKey() -> String? {
        return SecureStorage.loadToken(forKey: "api_key")
    }
}
```

### 配置管理策略

不同類型的配置需要不同的方法：

!!!tip "🔧 配置最佳實踐"
    **公共配置（可以安全提交）**
    - 功能標誌
    - UI 配置
    - 非敏感 URL
    - 逾時值
    - 快取大小
    
    **特定環境（建置時注入）**
    - 伺服器端點（不含憑證）
    - 環境識別碼
    - 除錯標誌
    - 分析 ID（非敏感）
    
    **密鑰（僅執行時載入）**
    - API 金鑰和權杖
    - 加密金鑰
    - 憑證
    - 私鑰
    - 服務密鑰

### 建置時密鑰注入

對於建置時需要的密鑰，從環境變數或安全建置系統注入它們——永遠不要提交它們。

```groovy
// Android: build.gradle
android {
    defaultConfig {
        // 從環境載入，而不是硬編碼
        buildConfigField "String", "API_KEY", "\"${System.getenv('API_KEY') ?: ''}\""
    }
}
```

```ruby
# iOS: 使用 xcconfig 檔案（不提交）
# Config.xcconfig
API_KEY = ${API_KEY}

# .gitignore
Config.xcconfig
```

提供顯示結構但不包含實際密鑰的範本檔案：

```groovy
// Config.template.xcconfig（已提交）
// 複製到 Config.xcconfig 並填寫實際值
API_KEY = YOUR_API_KEY_HERE
```

### 記錄敏感資料：無聲的暴露

記錄敏感資料會將其暴露給任何有日誌存取權限的人——開發人員、支援人員、當機報告服務以及獲得裝置存取權限的攻擊者。

```kotlin
// ❌ 永遠不要這樣做
fun login(username: String, password: String) {
    Log.d("Auth", "Login attempt: $username / $password") // 在日誌中暴露！
    // ...
}

fun processPayment(cardNumber: String, cvv: String) {
    Log.d("Payment", "Processing card: $cardNumber, CVV: $cvv") // 違反 PCI！
    // ...
}
```

```swift
// ❌ 永遠不要這樣做
func authenticate(token: String) {
    print("Auth token: \(token)") // 在主控台中可見！
    // ...
}
```

日誌保留在系統日誌、當機報告和分析平台中。從生產建置中刪除敏感日誌記錄：

```proguard
# ProGuard: 在發布版本中刪除日誌記錄
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}
```

### 版本控制衛生

一旦提交，密鑰就會保留在儲存庫歷史中。預防至關重要：

!!!warning "⚠️ 版本控制安全"
    **提交前**
    - 檢查差異中的密鑰
    - 使用預提交鉤子掃描密鑰
    - 維護配置檔案的 .gitignore
    - 使用密鑰掃描工具
    
    **如果密鑰已提交**
    - 立即輪換受損密鑰
    - 不要只是刪除——歷史記錄會保留它們
    - 使用 BFG Repo-Cleaner 等工具清除歷史記錄
    - 通知安全團隊
    
    **預防工具**
    - git-secrets (AWS)
    - detect-secrets (Yelp)
    - GitHub 密鑰掃描
    - GitGuardian

### 行動應用程式中的 API 金鑰：特殊考慮

行動應用程式分發給可以提取任何嵌入資料的使用者。即使是混淆或加密的金鑰也可以被有決心的攻擊者提取。

!!!anote "🔑 行動端 API 金鑰策略"
    **用戶端 API 金鑰**
    - 假設它們會被提取
    - 使用權限最小的金鑰
    - 在伺服器端實作速率限制
    - 監控濫用
    - 定期輪換
    
    **伺服器端代理模式**
    - 將敏感金鑰保留在伺服器上
    - 行動應用程式呼叫你的 API
    - 你的伺服器呼叫第三方 API
    - 驗證行動請求
    - 在伺服器端控制存取
    
    **當用戶端金鑰必要時**
    - 使用平台特定的限制（iOS bundle ID、Android 套件名稱）
    - 實作憑證固定
    - 新增請求簽章
    - 監控使用模式
    - 準備好輪換程序

伺服器端代理模式總是比在行動應用程式中嵌入金鑰更安全，即使使用混淆也是如此。

## 安全儲存實作

平台提供的安全儲存機制是你的第一道防線。當 iOS Keychain 或 Android Keystore 可用時，永遠不要實作自訂加密。

### 何時使用安全儲存

安全儲存用於執行時密鑰——通過身份驗證或 API 呼叫在應用程式安裝後獲得的資料。永遠不要使用它來隱藏不應該在應用程式中的硬編碼密鑰。

!!!tip "✅ 安全儲存的適當用途"
    **執行時密鑰**
    - 登入後收到的身份驗證權杖
    - 來自伺服器的工作階段金鑰
    - 使用者憑證（如果絕對必要）
    - 臨時加密金鑰
    - OAuth 權杖
    
    **不用於建置時密鑰**
    - 不要在 Keychain 中儲存硬編碼的 API 金鑰
    - 不要加密硬編碼的密鑰並儲存它們
    - 不要使用安全儲存來隱藏不應該存在的內容
    - 伺服器端密鑰永遠不應該到達用戶端

### iOS Keychain：完整實作

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

!!!tip "🔑 Keychain 可存取性層級"
    **kSecAttrAccessibleWhenUnlockedThisDeviceOnly**
    - 對敏感資料最安全
    - 不備份到 iCloud
    - 僅在裝置解鎖時可存取
    
    **kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly**
    - 用於背景工作
    - 首次解鎖後可用
    - 不備份
    
    **kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly**
    - 需要裝置密碼
    - 如果刪除密碼則刪除
    - 最高安全性

### Android 安全儲存：EncryptedSharedPreferences

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

### Android Keystore 用於加密金鑰

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

!!!warning "⚠️ 儲存反模式"
    **永遠不要這樣做**
    - 在 UserDefaults/SharedPreferences 中儲存密碼
    - 在代碼中硬編碼加密金鑰
    - 使用弱演算法（DES、MD5、SHA1）
    - 將敏感資料記錄到主控台
    - 在版本控制中儲存 API 金鑰

## 網路安全實作

僅使用 HTTPS 是不夠的。適當的 TLS 配置、憑證驗證和請求簽章提供了縱深防禦。

### iOS TLS 配置與憑證驗證

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

### Android 網路安全配置

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

### 請求簽章實作

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

伺服器端驗證：

```python
import hmac
import hashlib
import time
import base64

def verify_signature(method, path, body, timestamp, signature, secret_key):
    current_time = int(time.time() * 1000)
    if abs(current_time - int(timestamp)) > 300000:  # 5 分鐘
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

!!!error "🚫 網路安全錯誤"
    **永遠不要停用憑證驗證**
    - 不要在生產環境中信任所有憑證
    - 不要忽略 SSL 錯誤
    - 不要允許明文 HTTP 流量
    
    **強制使用強 TLS**
    - 最低 TLS 1.2
    - 避免弱密碼套件
    - 使用平台安全配置

## 代碼混淆實作

混淆提高了逆向工程的門檻，但並非萬無一失。與伺服器端驗證結合使用。

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

# 刪除日誌記錄
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

### 字串混淆

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

!!!tip "🛡️ 混淆最佳實踐"
    **要混淆的內容**
    - 業務邏輯和演算法
    - API 端點和參數
    - 內部類別和方法名稱
    
    **要保留的內容**
    - 公共 API 介面
    - 基於反射的類別
    - 原生方法宣告
    - 序列化類別
    
    **測試**
    - 徹底測試發布建置
    - 驗證當機報告可讀
    - 使用映射檔案進行反混淆

## UI 安全實作

通過截圖和應用程式切換器預覽保護敏感資料免受視覺捕獲。

### Android 螢幕捕獲防護

```kotlin
import android.view.WindowManager
import androidx.appcompat.app.AppCompatActivity

class SecureActivity : AppCompatActivity() {
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // 防止截圖和螢幕錄製
        window.setFlags(
            WindowManager.LayoutParams.FLAG_SECURE,
            WindowManager.LayoutParams.FLAG_SECURE
        )
        
        setContentView(R.layout.activity_secure)
    }
}
```

### iOS 截圖檢測

```swift
import UIKit

class SecureViewController: UIViewController {
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // 檢測何時截圖
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(screenshotTaken),
            name: UIApplication.userDidTakeScreenshotNotification,
            object: nil
        )
    }
    
    @objc private func screenshotTaken() {
        // 記錄事件或警告使用者
        print("檢測到截圖")
        // 也可以暫時模糊敏感內容
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
    }
}
```

### 應用程式切換器保護 - iOS

```swift
import UIKit

class AppDelegate: UIResponder, UIApplicationDelegate {
    
    var window: UIWindow?
    private var blurView: UIVisualEffectView?
    
    func applicationWillResignActive(_ application: UIApplication) {
        // 在快照前隱藏敏感內容
        addBlurEffect()
    }
    
    func applicationDidBecomeActive(_ application: UIApplication) {
        // 應用程式返回時恢復內容
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

使用佔位符視圖的替代方法：

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
        
        // 可選：新增應用程式 logo
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

### 應用程式切換器保護 - Android

```kotlin
import android.app.Activity
import android.os.Bundle
import android.view.View
import android.widget.ImageView

class MainActivity : AppCompatActivity() {
    
    private var coverView: View? = null
    
    override fun onPause() {
        super.onPause()
        // 在應用程式切換器快照前隱藏內容
        showCoverView()
    }
    
    override fun onResume() {
        super.onResume()
        // 應用程式返回時恢復內容
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

!!!tip "🛡️ UI 安全最佳實踐"
    **螢幕捕獲防護**
    - 僅對敏感活動套用 FLAG_SECURE
    - 不要在所有螢幕上防止捕獲
    - 考慮使用者對合法截圖的需求
    - 使用螢幕錄製應用程式進行測試
    
    **應用程式切換器保護**
    - 在 onPause/willResignActive 中立即套用遮罩
    - 在 onResume/didBecomeActive 中移除遮罩
    - 使用簡單、快速載入的遮罩視圖
    - 測試快速應用程式切換場景
    
    **效能考量**
    - 保持遮罩視圖輕量級
    - 避免複雜的版面配置或動畫
    - 快取遮罩視圖以供重複使用
    - 在低階裝置上測試

## 執行時保護實作

檢測受損環境並做出適當回應。

### iOS 越獄檢測

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
            // 無法在沙箱外寫入
        }
        
        if let url = URL(string: "cydia://package/com.example.package"),
           UIApplication.shared.canOpenURL(url) {
            return true
        }
        
        return false
    }
}
```

### Android Root 檢測

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

### 偵錯器檢測

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

!!!anote "🔍 回應策略"
    **優雅降級**
    - 停用敏感功能
    - 向使用者顯示警告
    - 限制功能
    
    **靜默監控**
    - 記錄到分析
    - 伺服器端風險評分
    - 模式檢測
    
    **硬阻止**
    - 拒絕執行
    - 僅限高安全性應用程式
    - 向使用者清楚解釋

## 生物識別身份驗證實作

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
            localizedReason: "驗證以存取您的帳戶"
        ) { success, error in
            DispatchQueue.main.async {
                completion(success, error)
            }
        }
    }
}
```

```kotlin
// Android 生物識別
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
                    onError("身份驗證失敗")
                }
            }
        )
        
        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle("生物識別身份驗證")
            .setSubtitle("驗證以存取您的帳戶")
            .setNegativeButtonText("取消")
            .build()
        
        biometricPrompt.authenticate(promptInfo)
    }
}
```

## 一個真實的實作故事：測試拯救生產環境

在憑證輪換期間，我們的測試團隊報告了失敗，但將其視為「憑證固定太難測試」而忽略了。他們在 UAT 中停用了固定，因為這使他們的工作流程變得複雜。在生產發布前兩小時，我親自進行了調查。

新憑證使用萬用字元通用名稱（`*.example.com`）而不是特定網域（`api.example.com`）。我們的固定邏輯將確切的 CN 對應到公鑰——萬用字元不符合。如果部署，每個行動使用者都會失去連線。

!!!error "🚫 UAT 固定差距"
    **他們為什麼停用固定**
    - 「太難測試」
    - UAT 中頻繁的憑證變更
    - 自簽憑證
    - 「我們會在生產監控中發現問題」
    
    **危險的後果**
    - UAT 沒有驗證任何關於固定的內容
    - 所有固定問題都會出現在生產環境中
    - 「成功」測試帶來的虛假信心
    - 使用者會遇到測試從未發現的失敗

我在剩餘一小時時叫停了發布。我們獲得了具有正確 CN 格式的憑證，進行了徹底測試，並在幾天後成功部署。

!!!success "✅ 經驗教訓"
    **永遠不要在 UAT 中停用固定**
    - 如果生產環境有固定，UAT 也必須有
    - 「太難測試」意味著在生產環境中發現
    - UAT 必須鏡像生產行為
    - 接受營運負擔是必要的
    
    **永遠不要忽視測試失敗**
    - 調查每個失敗的根本原因
    - 不要假設「在生產環境中會正常運作」
    - 憑證固定失敗是訊號
    
    **為彈性而設計**
    - CN 到固定的對應允許金鑰輪換
    - 可以在不更新應用程式的情況下更新金鑰
    - 平衡安全性與營運現實

啟用固定測試的困難不是錯誤——它是你的早期警告系統。接受營運負擔作為適當安全驗證的代價。

## 實作檢查清單

在將安全代碼部署到生產環境之前：

!!!tip "✅ 部署前驗證"
    **安全儲存**
    - 使用平台 API（Keychain/Keystore）
    - 正確的可存取性設定
    - 日誌中沒有敏感資料
    - 配置了備份排除
    
    **網路安全**
    - 強制使用 TLS 1.2+
    - 啟用憑證驗證
    - 不允許明文流量
    - 實作請求簽章
    
    **代碼保護**
    - 為發布版本啟用 ProGuard/R8
    - 混淆敏感字串
    - 從發布建置中刪除日誌記錄
    - 歸檔映射檔案
    
    **執行時保護**
    - 實作 Root/越獄檢測
    - 適當的回應策略
    - 偵錯器檢測就位
    - 測試優雅降級
    
    **測試**
    - 在真實裝置上測試
    - 驗證多個作業系統版本
    - 測試失敗場景
    - 在所有環境中啟用安全功能

## 結論

安全實作是理論與現實相遇的地方。iOS Keychain 和 Android Keystore 等平台提供的 API 提供了優於任何自訂實作的硬體支援加密。網路安全需要適當的 TLS 配置、憑證驗證和請求簽章——僅使用 HTTPS 是不夠的。代碼混淆提高了逆向工程的門檻，但必須與伺服器端驗證結合使用。執行時保護檢測受損環境，允許適當的回應。

安全設計與安全代碼之間的差距是發生資料外洩的地方。配置錯誤的 Keychain 可存取性會暴露資料。在生產環境中停用憑證驗證允許中間人攻擊。弱混淆提供虛假信心。簡單的 root 檢測很容易被繞過。每個實作細節都很重要。

測試安全實作是不可協商的。在多個作業系統版本的真實裝置上測試。測試失敗場景——當 Keychain 存取失敗、憑證無效、裝置被 root 時會發生什麼？在理想條件下運作但在邊緣情況下失敗的安全性提供了虛假信心。永遠不要因為「太難」而在測試環境中停用安全功能——這種困難是你的早期警告系統。

憑證輪換事件證明了適當測試的重要性。因為使測試複雜化而在 UAT 中停用固定意味著第一次真正的測試將在生產環境中進行。只有維護一個啟用固定的單獨暫存環境才能發現問題。啟用安全功能進行測試的營運負擔遠小於生產中斷的成本。

平台安全 API 不斷演進，發現漏洞，攻擊技術不斷進步。隨時了解安全更新，監控你使用的函式庫的公告，並定期審查實作。昨天的最佳實踐可能是今天的漏洞。行動安全是一個持續的過程，而不是一次性的實作。

在部署安全代碼之前，了解你要防禦的威脅以及實作是否真正提供保護。並非每個應用程式都需要 root 檢測或代碼混淆。將安全投資與你的風險狀況相符合。在新增進階保護之前，專注於基礎——安全儲存、適當的 TLS、強身份驗證。

裝置可能在使用者的口袋裡，但安全責任仍然是你的。仔細實作，徹底測試，永遠不要為了方便而走捷徑損害安全性。
