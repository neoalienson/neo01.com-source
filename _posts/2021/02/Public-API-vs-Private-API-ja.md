---
title: "パブリック API vs プライベート API：アプリケーションインターフェースの理解"
date: 2021-02-11
categories:
  - Architecture
excerpt: "iOS、Android、Web アプリケーションにおけるパブリック API とプライベート API の重要な違いを探ります。各アプローチをいつ使用するか、堅牢なアプリケーションインターフェースを設計する方法を学びます。"
lang: ja
thumbnail: /assets/architecture/thumbnail.png
thumbnail_80: /assets/architecture/thumbnail_80.png
comments: true
---

家を建てることを想像してください。訪問者のためのドアがあります——玄関にはドアベルがあり、明確に表示され、歓迎されています。他のドアは内部使用のみです——物置、電気パネル、メンテナンス用アクセス。同様に、ソフトウェア開発では、API には2つのタイプがあります：外部開発者が使用できるパブリック API と、内部実装用に予約されたプライベート API です。

## API の二面性

現代のアプリケーションは API（アプリケーションプログラミングインターフェース）を通じて機能を公開しますが、すべての API が平等に作られているわけではありません：

**パブリック API**：外部使用のために設計
- 安定してバージョン管理されている
- 十分に文書化されている
- 後方互換性がある
- 長期サポート

**プライベート API**：内部実装の詳細
- 予告なく変更される可能性がある
- 文書がほとんどまたは全くない
- 互換性の保証なし
- 削除される可能性がある

{% mermaid %}
graph TB
    subgraph Public["🌐 パブリック API"]
        P1[文書化されたメソッド]
        P2[安定したインターフェース]
        P3[バージョン管理]
        P4[長期サポート]
        
        P1 --> API1[パブリック API 層]
        P2 --> API1
        P3 --> API1
        P4 --> API1
    end
    
    subgraph Private["🔒 プライベート API"]
        PR1[内部メソッド]
        PR2[実装の詳細]
        PR3[いつでも変更可能]
        PR4[保証なし]
        
        PR1 --> API2[プライベート API 層]
        PR2 --> API2
        PR3 --> API2
        PR4 --> API2
    end
    
    subgraph App["📱 アプリケーション"]
        Core[コアロジック]
    end
    
    API1 --> Core
    API2 --> Core
    
    EXT[外部開発者] --> API1
    INT[内部チーム] --> API2
    
    style Public fill:#e3f2fd,stroke:#1976d2
    style Private fill:#ffebee,stroke:#c62828
    style App fill:#f3e5f5,stroke:#7b1fa2
{% endmermaid %}

## パブリック API：公式インターフェース

パブリック API は、開発者がプラットフォームやライブラリと対話するための公式で文書化された方法です。

### iOS パブリック API

```swift
// パブリック API：UIKit フレームワーク
import UIKit

class MyViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // パブリック API：ボタンの作成
        let button = UIButton(type: .system)
        button.setTitle("タップしてください", for: .normal)
        button.frame = CGRect(x: 100, y: 100, width: 200, height: 50)
        button.addTarget(self, action: #selector(buttonTapped), for: .touchUpInside)
        view.addSubview(button)
    }
    
    @objc func buttonTapped() {
        // パブリック API：アラートの表示
        let alert = UIAlertController(
            title: "こんにちは",
            message: "ボタンがタップされました！",
            preferredStyle: .alert
        )
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
}

// パブリック API：ネットワーキング用の URLSession
class NetworkService {
    func fetchData(from url: URL, completion: @escaping (Data?, Error?) -> Void) {
        let task = URLSession.shared.dataTask(with: url) { data, response, error in
            completion(data, error)
        }
        task.resume()
    }
}
```

### Android パブリック API

```kotlin
// パブリック API：Android SDK
import android.os.Bundle
import android.widget.Button
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        // パブリック API：ビューの検索とリスナーの設定
        val button = findViewById<Button>(R.id.myButton)
        button.setOnClickListener {
            // パブリック API：トーストの表示
            Toast.makeText(this, "ボタンがクリックされました！", Toast.LENGTH_SHORT).show()
        }
    }
}

// パブリック API：ネットワーキング用の Retrofit
interface ApiService {
    @GET("users/{id}")
    suspend fun getUser(@Path("id") userId: String): User
}

class UserRepository {
    private val apiService: ApiService = RetrofitClient.create()
    
    suspend fun fetchUser(userId: String): User {
        return apiService.getUser(userId)
    }
}
```

### Web パブリック API

```javascript
// パブリック API：ブラウザ API
class WebApp {
  constructor() {
    this.init();
  }
  
  init() {
    // パブリック API：DOM 操作
    const button = document.getElementById('myButton');
    button.addEventListener('click', () => this.handleClick());
    
    // パブリック API：ネットワーキング用の Fetch
    this.fetchData();
  }
  
  handleClick() {
    // パブリック API：コンソールログ
    console.log('ボタンがクリックされました');
    
    // パブリック API：LocalStorage
    localStorage.setItem('lastClick', Date.now().toString());
  }
  
  async fetchData() {
    try {
      // パブリック API：Fetch API
      const response = await fetch('https://api.example.com/data');
      const data = await response.json();
      this.displayData(data);
    } catch (error) {
      console.error('データの取得に失敗しました：', error);
    }
  }
  
  displayData(data) {
    // パブリック API：DOM 操作
    const container = document.getElementById('dataContainer');
    container.innerHTML = `<p>${data.message}</p>`;
  }
}

// パブリック API：React ライブラリ
import React, { useState, useEffect } from 'react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // パブリック API：データの取得
    fetch(`https://api.example.com/users/${userId}`)
      .then(response => response.json())
      .then(data => setUser(data));
  }, [userId]);
  
  return (
    <div>
      {user && <h1>{user.name}</h1>}
    </div>
  );
}
```

!!!anote "💡 パブリック API の特性"
    **安定性**：バージョン間での動作を保証
    
    **ドキュメント**：包括的なガイドとリファレンス
    
    **サポート**：公式サポートチャネルが利用可能
    
    **バージョン管理**：明確なバージョン番号と非推奨通知
    
    **テスト**：徹底的にテストおよび検証済み

## プライベート API：隠された実装

プライベート API は外部使用を意図していない内部実装の詳細です。これらを使用すると、アプリの却下や破損につながる可能性があります。

### iOS プライベート API

```swift
// ⚠️ プライベート API：内部 UIKit メソッドへのアクセス
// 使用しないでください - App Store で却下されます

// やってはいけない例：
class DangerousViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // ❌ プライベート API の使用を試みる（仮定の例）
        // これは内部実装の詳細にアクセスします
        // if let privateMethod = self.perform(Selector("_privateLayoutMethod")) {
        //     // これによりアプリが却下されます
        // }
    }
}

// ⚠️ プライベート API：プライベートフレームワークへのアクセス
// import PrivateFramework  // ❌ 許可されていません

// 実際の結果：
// プライベート API を使用するアプリは App Store レビュー時に却下されます
```

### Android プライベート API

```kotlin
// ⚠️ プライベート API：隠された Android API へのアクセス
// これらは @hide アノテーションでマークされています

// やってはいけない例：
class DangerousActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // ❌ リフレクションを通じて隠された API へのアクセスを試みる
        try {
            val clazz = Class.forName("android.app.ActivityThread")
            val method = clazz.getDeclaredMethod("currentActivityThread")
            method.isAccessible = true
            val activityThread = method.invoke(null)
            // これは今は動作するかもしれませんが、将来の Android バージョンで壊れます
        } catch (e: Exception) {
            // API が変更または削除された - アプリがクラッシュします
        }
    }
}

// Android 9+ でのプライベート API の制限：
// - ライトグレーリスト：警告がログに記録される
// - ダークグレーリスト：条件付きでブロック
// - ブラックリスト：常にブロック
```

### Web プライベート API

```javascript
// ⚠️ プライベート API：内部実装へのアクセス
// これらは _ で始まるか、内部としてマークされています

// やってはいけない例：
class DangerousLibraryUsage {
  constructor() {
    // ❌ プライベートプロパティへのアクセス（慣例：アンダースコアプレフィックス）
    this._internalState = {};  // 外部からアクセスしないでください
    this._privateMethod();     // 外部から呼び出さないでください
  }
  
  _privateMethod() {
    // これは内部実装です
    // いつでも変更される可能性があります
  }
}

// ❌ React 内部へのアクセス
import React from 'react';

class BadComponent extends React.Component {
  componentDidMount() {
    // ❌ React 内部プロパティへのアクセス
    // const internalInstance = this._reactInternalInstance;
    // const fiber = this._reactInternalFiber;
    // これらは React バージョン間で変更される可能性があります
  }
}

// ❌ ブラウザ API のモンキーパッチ
// 組み込みプロトタイプの変更
Array.prototype._myPrivateMethod = function() {
  // これはグローバル名前空間を汚染します
  // 将来のブラウザ機能と競合する可能性があります
};
```

!!!warning "⚠️ プライベート API の危険性"
    **App Store 却下**：プライベート API を使用する iOS アプリは却下されます
    
    **ランタイムクラッシュ**：API は警告なしに削除される可能性があります
    
    **セキュリティリスク**：プライベート API はセキュリティチェックをバイパスする可能性があります
    
    **メンテナンスの悪夢**：OS/ライブラリの更新でコードが壊れます
    
    **サポートなし**：問題が発生しても助けを得られません


## 並列比較

| 側面 | パブリック API | プライベート API |
|--------|-----------|-------------|
| **目的** | 外部使用 | 内部実装 |
| **ドキュメント** | 包括的 | ほとんどまたは全くない |
| **安定性** | 安定性を保証 | いつでも変更可能 |
| **バージョン管理** | セマンティックバージョニング | バージョン管理なし |
| **サポート** | 公式サポート | サポートなし |
| **後方互換性** | 維持される | 保証されない |
| **App Store 審査** | 許可 | 却下（iOS） |
| **テスト** | 徹底的にテスト | 内部テストのみ |
| **非推奨** | 事前に通知 | 通知なしに削除 |
| **アクセス修飾子** | public、open | private、internal、@hide |
| **例（iOS）** | UIKit、Foundation | _private メソッド |
| **例（Android）** | Android SDK | @hide API |
| **例（Web）** | fetch()、DOM API | _internal プロパティ |

{% echarts %}
{
  "title": {
    "text": "時間経過による API の安定性"
  },
  "tooltip": {
    "trigger": "axis"
  },
  "legend": {
    "data": ["パブリック API", "プライベート API"]
  },
  "xAxis": {
    "type": "category",
    "data": ["v1.0", "v1.5", "v2.0", "v2.5", "v3.0"]
  },
  "yAxis": {
    "type": "value",
    "name": "安定性スコア",
    "max": 100
  },
  "series": [
    {
      "name": "パブリック API",
      "type": "line",
      "data": [100, 100, 100, 100, 100],
      "itemStyle": {
        "color": "#4caf50"
      },
      "lineStyle": {
        "width": 3
      }
    },
    {
      "name": "プライベート API",
      "type": "line",
      "data": [80, 60, 40, 20, 0],
      "itemStyle": {
        "color": "#f44336"
      },
      "lineStyle": {
        "width": 3,
        "type": "dashed"
      }
    }
  ]
}
{% endecharts %}

## 実例

### iOS：ステータスバーの高さの物語

```swift
// ❌ 間違い：プライベート API の使用
class BadViewController: UIViewController {
    func getStatusBarHeight() -> CGFloat {
        // プライベート API - 壊れるか却下されます
        // return UIApplication.shared.statusBarFrame.height
        // iOS 13 で非推奨、iOS 14 で削除
        return 0
    }
}

// ✅ 正しい：パブリック API の使用
class GoodViewController: UIViewController {
    func getSafeAreaTop() -> CGFloat {
        // パブリック API - iOS バージョン間で動作
        if #available(iOS 11.0, *) {
            return view.safeAreaInsets.top
        } else {
            return topLayoutGuide.length
        }
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // セーフエリアを処理する正しい方法
        let topInset = view.safeAreaInsets.top
        let contentView = UIView()
        contentView.frame = CGRect(
            x: 0,
            y: topInset,
            width: view.bounds.width,
            height: view.bounds.height - topInset
        )
        view.addSubview(contentView)
    }
}
```

### Android：隠された API の制限

```kotlin
// ❌ 間違い：隠された API へのアクセス
class BadNetworkManager {
    fun getWifiInfo() {
        try {
            // リフレクションで隠された API にアクセス
            val wifiManager = context.getSystemService(Context.WIFI_SERVICE) as WifiManager
            val method = wifiManager.javaClass.getDeclaredMethod("getPrivateWifiInfo")
            method.isAccessible = true
            val info = method.invoke(wifiManager)
            // これは Android 9+ で制限により失敗します
        } catch (e: Exception) {
            // アプリがクラッシュするか機能が壊れます
        }
    }
}

// ✅ 正しい：パブリック API の使用
class GoodNetworkManager(private val context: Context) {
    fun getWifiInfo(): WifiInfo? {
        // 適切な権限を持つパブリック API
        val wifiManager = context.applicationContext
            .getSystemService(Context.WIFI_SERVICE) as WifiManager
        
        // まず権限を確認
        if (ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.ACCESS_WIFI_STATE
            ) == PackageManager.PERMISSION_GRANTED
        ) {
            return wifiManager.connectionInfo
        }
        return null
    }
    
    fun getNetworkCapabilities(): NetworkCapabilities? {
        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) 
            as ConnectivityManager
        val network = connectivityManager.activeNetwork
        return connectivityManager.getNetworkCapabilities(network)
    }
}
```

### Web：フレームワーク内部

```javascript
// ❌ 間違い：React 内部へのアクセス
class BadReactComponent extends React.Component {
  componentDidMount() {
    // 内部 React プロパティへのアクセス
    // const fiber = this._reactInternalFiber;
    // const instance = this._reactInternalInstance;
    
    // これらは React バージョン間で壊れます
    // React 16 -> React 17 -> React 18 すべてが内部を変更しました
  }
  
  forceUpdateNow() {
    // 内部状態を直接操作
    // this._reactInternalFiber.memoizedState = newState;
    // これは React の調整をバイパスします
  }
}

// ✅ 正しい：パブリック React API の使用
class GoodReactComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      count: 0
    };
  }
  
  componentDidMount() {
    // パブリックライフサイクルメソッドを使用
    this.fetchData();
  }
  
  async fetchData() {
    // パブリック setState API を使用
    const data = await fetch('/api/data').then(r => r.json());
    this.setState({ data });
  }
  
  handleClick = () => {
    // パブリック setState API を使用
    this.setState(prevState => ({
      count: prevState.count + 1
    }));
  }
  
  render() {
    return (
      <div>
        <p>カウント：{this.state.count}</p>
        <button onClick={this.handleClick}>増加</button>
      </div>
    );
  }
}

// ✅ 正しい：Hooks を使用したモダンな React
function GoodFunctionalComponent() {
  const [count, setCount] = useState(0);
  const [data, setData] = useState(null);
  
  useEffect(() => {
    // 副作用用のパブリック API
    fetch('/api/data')
      .then(r => r.json())
      .then(setData);
  }, []);
  
  return (
    <div>
      <p>カウント：{count}</p>
      <button onClick={() => setCount(count + 1)}>増加</button>
    </div>
  );
}
```

## プライベート API の識別方法

### iOS 検出

```swift
// iOS でのプライベート API の兆候：

// 1. アンダースコアで始まるメソッド
// _privateMethod()
// _internalProperty

// 2. Apple 公式ドキュメントに記載されていない
// developer.apple.com にエントリがない

// 3. プライベートヘッダーのインポートが必要
// #import <UIKit/UIPrivateHeader.h>

// 4. ランタイム操作を通じてアクセス
let selector = Selector("_privateMethod")
if responds(to: selector) {
    perform(selector)  // ❌ プライベート API の使用
}

// 5. class-dump で表示されるが、パブリックヘッダーにはない
// class-dump ツールを使用してプライベートメソッドを確認

// ✅ API がパブリックかどうかを確認する方法：
// - Apple Developer ドキュメントを検索
// - パブリックヘッダーにあるか確認
// - @available アノテーションを探す
// - Xcode のオートコンプリートで確認
```

### Android 検出

```kotlin
// Android でのプライベート API の兆候：

// 1. ソースコードで @hide アノテーションでマークされている
// @hide
// public void privateMethod() { }

// 2. 公式 Android ドキュメントにない
// developer.android.com にエントリがない

// 3. アクセスにリフレクションが必要
val method = clazz.getDeclaredMethod("hiddenMethod")
method.isAccessible = true  // ❌ 隠された API へのアクセス

// 4. 制限された API に関する Lint 警告
// Android Studio が警告を表示

// 5. 内部パッケージ内
// com.android.internal.*  // ❌ 内部パッケージ

// ✅ API がパブリックかどうかを確認する方法：
fun isPublicApi(className: String): Boolean {
    return try {
        // パブリック API は直接アクセス可能
        Class.forName(className)
        true
    } catch (e: ClassNotFoundException) {
        false
    }
}

// Android API レベルを確認
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
    // Android 9+ で利用可能なパブリック API を使用
}
```

### Web 検出

```javascript
// Web でのプライベート API の兆候：

// 1. アンダースコアで始まるプロパティ/メソッド
class Library {
  _privateMethod() { }  // ❌ 慣例によりプライベート
  publicMethod() { }    // ✅ パブリック
}

// 2. 公式ドキュメントにない
// ライブラリの公式ドキュメントを確認

// 3. JSDoc で @internal としてマークされている
/**
 * @internal
 * これはパブリック API の一部ではありません
 */
function _internalFunction() { }

// 4. TypeScript で：private としてマークされている
class Component {
  private _state: any;      // ❌ プライベート
  public props: any;        // ✅ パブリック
}

// 5. プロトタイプ内部へのアクセス
// React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
// ❌ 明確に内部としてマークされている

// ✅ API がパブリックかどうかを確認する方法：
// - 公式ドキュメントを確認
// - TypeScript 型定義を探す
// - メインモジュールからエクスポートされているか確認
// - CHANGELOG で非推奨通知を読む
```

{% mermaid %}
graph TB
    A[API を使用する必要がありますか？]
    
    B{ドキュメント化<br/>されていますか？}
    C{パブリックヘッダー<br/>にありますか？}
    D{_ で始まりますか？}
    E{リフレクションが<br/>必要ですか？}
    
    F[✅ おそらくパブリック API<br/>安全に使用できます]
    G[❌ おそらくプライベート API<br/>使用しないでください]
    
    A --> B
    B -->|はい| C
    B -->|いいえ| G
    
    C -->|はい| D
    C -->|いいえ| G
    
    D -->|いいえ| E
    D -->|はい| G
    
    E -->|いいえ| F
    E -->|はい| G
    
    style F fill:#c8e6c9,stroke:#388e3c
    style G fill:#ffcdd2,stroke:#c62828
{% endmermaid %}


## 独自の API の設計

### パブリック API の作成

```swift
// iOS：パブリックフレームワーク API の設計
public class ImageLoader {
    // ✅ パブリックイニシャライザ
    public init() { }
    
    // ✅ 明確なドキュメントを持つパブリックメソッド
    /// 指定された URL から画像を読み込みます
    /// - Parameters:
    ///   - url: 読み込む画像の URL
    ///   - completion: 読み込みが完了したときに呼び出されます
    public func loadImage(
        from url: URL,
        completion: @escaping (UIImage?, Error?) -> Void
    ) {
        // 実装はプライベートメソッドを使用
        _performNetworkRequest(url: url, completion: completion)
    }
    
    // ❌ プライベート実装の詳細
    private func _performNetworkRequest(
        url: URL,
        completion: @escaping (UIImage?, Error?) -> Void
    ) {
        // 内部実装
        // パブリック API に影響を与えずに変更できます
    }
}
```

```kotlin
// Android：パブリックライブラリ API の設計
class DataRepository {
    // ✅ パブリックメソッド
    /**
     * サーバーからユーザーデータを取得します
     * @param userId 取得するユーザーの ID
     * @return User オブジェクト、見つからない場合は null
     */
    suspend fun getUser(userId: String): User? {
        return fetchFromNetwork(userId)
    }
    
    // ❌ プライベート実装
    private suspend fun fetchFromNetwork(userId: String): User? {
        // 内部実装
        // パブリック API を壊すことなくリファクタリングできます
        return apiService.getUser(userId)
    }
    
    // ❌ モジュール内部使用のみ
    internal fun clearCache() {
        // モジュール内で利用可能ですが、外部ユーザーには公開されません
    }
}
```

```javascript
// Web：パブリックライブラリ API の設計
class DataService {
  // ✅ パブリックメソッド
  /**
   * API からデータを取得します
   * @param {string} endpoint - API エンドポイント
   * @returns {Promise<Object>} 取得されたデータ
   * @public
   */
  async fetchData(endpoint) {
    const url = this._buildUrl(endpoint);
    return this._makeRequest(url);
  }
  
  // ❌ プライベートメソッド（慣例：アンダースコアプレフィックス）
  /**
   * @private
   */
  _buildUrl(endpoint) {
    return `${this._baseUrl}/${endpoint}`;
  }
  
  /**
   * @private
   */
  async _makeRequest(url) {
    const response = await fetch(url);
    return response.json();
  }
}

// TypeScript：明示的なアクセス修飾子
class TypedDataService {
  private baseUrl: string;
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }
  
  // ✅ パブリックメソッド
  public async fetchData(endpoint: string): Promise<any> {
    const url = this.buildUrl(endpoint);
    return this.makeRequest(url);
  }
  
  // ❌ プライベートメソッド
  private buildUrl(endpoint: string): string {
    return `${this.baseUrl}/${endpoint}`;
  }
  
  private async makeRequest(url: string): Promise<any> {
    const response = await fetch(url);
    return response.json();
  }
}
```

### API 設計のベストプラクティス

!!!anote "💡 パブリック API 設計の原則"
    **1. シンプルに保つ**
    - 最小限の表面積
    - 明確なメソッド名
    - 直感的なパラメータ
    
    **2. 徹底的に文書化する**
    - 目的と使用法
    - パラメータと戻り値
    - コード例
    - エッジケース
    
    **3. 慎重にバージョン管理する**
    - セマンティックバージョニング（メジャー.マイナー.パッチ）
    - 削除前の非推奨警告
    - 移行ガイド
    
    **4. 後方互換性を維持する**
    - 既存のコードを壊さない
    - 古いメソッドを変更するのではなく、新しいメソッドを追加する
    - @available/@Deprecated アノテーションを使用
    
    **5. 実装の詳細を隠す**
    - private/internal 修飾子を使用
    - 必要なものだけを公開
    - 内部リファクタリングを許可

## バージョン管理と非推奨化

### iOS API バージョン管理

```swift
// 特定の iOS バージョンから利用可能な API をマーク
@available(iOS 13.0, *)
public func newFeature() {
    // iOS 13+ でのみ利用可能
}

// 古い API を非推奨化
@available(iOS, deprecated: 14.0, message: "代わりに newMethod() を使用してください")
public func oldMethod() {
    // まだ動作しますが警告が表示されます
}

// API を廃止としてマーク
@available(iOS, obsoleted: 15.0, renamed: "newMethod()")
public func legacyMethod() {
    // iOS 15 で削除
}

// バージョンチェックを使用
if #available(iOS 13.0, *) {
    newFeature()
} else {
    // 古い iOS バージョンのフォールバック
    oldMethod()
}

// 実例：UIApplication statusBar
class StatusBarExample {
    func getStatusBarHeight() -> CGFloat {
        if #available(iOS 13.0, *) {
            // 新しい方法：ウィンドウシーンを使用
            let window = UIApplication.shared.windows.first
            return window?.windowScene?.statusBarManager?.statusBarFrame.height ?? 0
        } else {
            // 古い方法：直接アクセス（非推奨）
            return UIApplication.shared.statusBarFrame.height
        }
    }
}
```

### Android API バージョン管理

```kotlin
// API の最小 SDK バージョンをマーク
@RequiresApi(Build.VERSION_CODES.O)
fun useOreoFeature() {
    // Android 8.0+ でのみ利用可能
}

// 古い API を非推奨化
@Deprecated(
    message = "代わりに newMethod() を使用してください",
    replaceWith = ReplaceWith("newMethod()"),
    level = DeprecationLevel.WARNING
)
fun oldMethod() {
    // IDE で警告が表示されます
}

// バージョンチェックを使用
fun handleNotification() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        // Android 8.0+：通知チャネルを使用
        createNotificationChannel()
    } else {
        // 8.0 以前：古い通知 API
        createLegacyNotification()
    }
}

@RequiresApi(Build.VERSION_CODES.O)
private fun createNotificationChannel() {
    val channel = NotificationChannel(
        "channel_id",
        "チャネル名",
        NotificationManager.IMPORTANCE_DEFAULT
    )
    val manager = getSystemService(NotificationManager::class.java)
    manager.createNotificationChannel(channel)
}

private fun createLegacyNotification() {
    val notification = Notification.Builder(this)
        .setContentTitle("タイトル")
        .setContentText("テキスト")
        .build()
}
```

### Web API バージョン管理

```javascript
// package.json でのセマンティックバージョニング
{
  "name": "my-library",
  "version": "2.1.3",
  // メジャー.マイナー.パッチ
  // 2 = 破壊的変更
  // 1 = 新機能（後方互換）
  // 3 = バグ修正
}

// 警告付きで API を非推奨化
class MyLibrary {
  /**
   * @deprecated 代わりに newMethod() を使用してください。v3.0.0 で削除されます
   */
  oldMethod() {
    console.warn('oldMethod() は非推奨です。代わりに newMethod() を使用してください。');
    return this.newMethod();
  }
  
  newMethod() {
    // 新しい実装
  }
}

// バージョンチェックではなく機能検出
class BrowserFeatures {
  supportsWebGL() {
    try {
      const canvas = document.createElement('canvas');
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch (e) {
      return false;
    }
  }
  
  supportsLocalStorage() {
    try {
      const test = '__test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }
  
  useFeature() {
    if (this.supportsLocalStorage()) {
      // localStorage を使用
      localStorage.setItem('key', 'value');
    } else {
      // Cookie へのフォールバック
      document.cookie = 'key=value';
    }
  }
}

// 欠落している機能のポリフィル
if (!Array.prototype.includes) {
  Array.prototype.includes = function(searchElement) {
    return this.indexOf(searchElement) !== -1;
  };
}
```

### 非推奨化のタイムライン

{% mermaid %}
gantt
    title API 非推奨化ライフサイクル
    dateFormat YYYY-MM
    section v1.0
    初回リリース           :done, 2020-01, 2020-12
    section v2.0
    非推奨警告       :active, 2021-01, 2021-12
    ドキュメント更新     :active, 2021-01, 2021-03
    移行ガイド公開 :active, 2021-01, 2021-03
    section v3.0
    API 削除              :crit, 2022-01, 2022-12
{% endmermaid %}

!!!tip "💡 非推奨化のベストプラクティス"
    **1. 早期に通知する**
    - 開発者に 6〜12 ヶ月の通知を与える
    - すぐにドキュメントを更新
    - コードに非推奨警告を追加
    
    **2. 移行パスを提供する**
    - 代替 API を文書化
    - コード例を提供
    - 可能であれば自動移行ツールを提供
    
    **3. セマンティックバージョニングに従う**
    - パッチ：バグ修正のみ
    - マイナー：新機能、後方互換
    - メジャー：破壊的変更を許可
    
    **4. 明確にコミュニケーションする**
    - 変更ログエントリ
    - 重大な変更のブログ投稿
    - ユーザーへのメール通知
    - アプリ内警告


## プライベート API が魅力的なとき

### 一般的なシナリオ

```swift
// シナリオ 1：利用できない機能へのアクセス
// ❌ 間違い：プライベート API を使用してステータスバーをカスタマイズ
class TemptingViewController: UIViewController {
    func customizeStatusBar() {
        // ステータスバーの色を変更するプライベート API
        // UIApplication.shared.statusBar.backgroundColor = .red
        // これによりアプリが却下されます
    }
}

// ✅ 正しい：利用可能なパブリック API を使用
class ProperViewController: UIViewController {
    override var preferredStatusBarStyle: UIStatusBarStyle {
        return .lightContent  // パブリック API
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setNeedsStatusBarAppearanceUpdate()
    }
}

// シナリオ 2：制限の回避
// ❌ 間違い：プライベートプロパティへのアクセス
class TemptingTableView: UITableViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // プライベートテーブルビュープロパティへのアクセスを試みる
        // tableView._privateProperty = value
    }
}

// ✅ 正しい：コンポジションまたはサブクラス化を使用
class ProperTableView: UITableViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // パブリック API とカスタムビューを使用
        let headerView = CustomHeaderView()
        tableView.tableHeaderView = headerView
    }
}
```

### プライベート API の代替案

```kotlin
// シナリオ：パブリック API にない機能が必要

// ❌ 間違い：リフレクションで隠されたメソッドにアクセス
class TemptingApproach {
    fun getHiddenInfo(): String? {
        return try {
            val clazz = Class.forName("android.os.SystemProperties")
            val method = clazz.getMethod("get", String::class.java)
            method.invoke(null, "ro.build.version.sdk") as String
        } catch (e: Exception) {
            null
        }
    }
}

// ✅ 正しい：パブリック API を使用
class ProperApproach {
    fun getBuildInfo(): String {
        // パブリック API
        return Build.VERSION.SDK_INT.toString()
    }
    
    fun getDeviceInfo(): String {
        // パブリック API
        return "${Build.MANUFACTURER} ${Build.MODEL}"
    }
}

// ✅ 正しい：プラットフォームに機能をリクエスト
// Google/Apple に機能リクエストを提出
// その間はパブリック API を使用
// 公式サポートを待つ

// ✅ 正しい：サードパーティライブラリを使用
// パブリック API を使用する、よくメンテナンスされたライブラリを見つける
// 例：内部画像キャッシュにアクセスする代わりに Glide/Picasso を使用
```

### プライベート API のコスト

```javascript
// 実例：React 内部の使用

// ❌ 間違い：React 内部へのアクセス（2016）
class OldComponent extends React.Component {
  componentDidMount() {
    // これは React 15 で動作しました
    const internalInstance = this._reactInternalInstance;
    // React 16（Fiber 書き換え）で壊れました
  }
}

// コスト：
// 1. React 16 がリリースされたときにアプリが壊れた
// 2. 移行パスが提供されなかった
// 3. コンポーネントをゼロから書き直す必要があった
// 4. 開発時間を失った
// 5. バグによりユーザーが不満を持った

// ✅ 正しい：パブリック API を使用
class ModernComponent extends React.Component {
  constructor(props) {
    super(props);
    this.ref = React.createRef();
  }
  
  componentDidMount() {
    // パブリック API - React バージョン間で動作
    const element = this.ref.current;
    // DOM 要素で何かをする
  }
  
  render() {
    return <div ref={this.ref}>コンテンツ</div>;
  }
}

// さらに良い：Hooks を使用（パブリック API）
function ModernFunctionalComponent() {
  const ref = useRef(null);
  
  useEffect(() => {
    // パブリック API - 安定してサポートされている
    const element = ref.current;
  }, []);
  
  return <div ref={ref}>コンテンツ</div>;
}
```

!!!warning "⚠️ プライベート API 使用の実際の結果"
    **iOS App Store 却下**
    - 審査中に自動的に却下
    - アプリのリリースが数週間遅れる
    - 完全な書き直しが必要
    
    **Android ランタイムクラッシュ**
    - 新しい Android バージョンでアプリがクラッシュ
    - ユーザーからの否定的なレビュー
    - 緊急アップデートが必要
    
    **Web アプリケーションの破損**
    - ライブラリの更新でアプリが壊れる
    - ライブラリメンテナーからのサポートなし
    - 技術的負債が蓄積
    
    **ビジネスへの影響**
    - ダウンタイム中の収益損失
    - 評判の損傷
    - メンテナンスコストの増加
    - 開発者の時間の無駄

## まとめ

パブリック API とプライベート API の違いを理解することは、保守可能で安定したアプリケーションを構築するために重要です：

**パブリック API**：
- 外部使用のための公式で文書化されたインターフェース
- 安定性と後方互換性を保証
- 包括的なドキュメントとサポート
- 本番環境アプリケーションに適している
- App Store 審査に必要

**プライベート API**：
- 内部実装の詳細
- 通知なしに変更または削除される可能性がある
- ドキュメントやサポートなし
- アプリの却下とランタイムクラッシュを引き起こす
- 本番環境では決して使用すべきではない

**重要なポイント**：

{% mermaid %}
graph LR
    A[機能が必要？]
    B{パブリック API<br/>で利用可能？}
    C[パブリック API を使用 ✅]
    D{アプリにとって<br/>重要？}
    E[代替案を探す ✅]
    F[機能をリクエスト ✅]
    G[公式サポートを待つ ✅]
    H[プライベート API を使用 ❌]
    
    A --> B
    B -->|はい| C
    B -->|いいえ| D
    D -->|はい| E
    D -->|いいえ| F
    E --> G
    F --> G
    
    style C fill:#c8e6c9,stroke:#388e3c
    style E fill:#c8e6c9,stroke:#388e3c
    style F fill:#c8e6c9,stroke:#388e3c
    style G fill:#c8e6c9,stroke:#388e3c
    style H fill:#ffcdd2,stroke:#c62828
{% endmermaid %}

### 意思決定マトリックス

| 状況 | パブリック API | プライベート API | 推奨事項 |
|-----------|-----------|-------------|----------------|
| 機能が公開されている | ✅ | ❌ | 常にパブリック API を使用 |
| 機能がプライベート API のみ | ❌ | ❌ | 代替案を探すか待つ |
| 迅速な出荷が必要 | ✅ | ❌ | 制限があってもパブリック API を使用 |
| 内部ツールの構築 | ✅ | ⚠️ | パブリックを優先、内部ならリスクを受け入れる |
| App Store アプリの構築 | ✅ | ❌ | プライベート API は決して使用しない |
| エンタープライズアプリの構築 | ✅ | ⚠️ | パブリックを優先、リスクを文書化 |
| オープンソースライブラリの構築 | ✅ | ❌ | パブリック API のみを使用 |

!!!tip "💡 ベストプラクティス"
    **常にパブリック API を優先する**
    - 安定してサポートされている
    - アプリを壊さない
    - 却下を引き起こさない
    
    **パブリック API が不十分な場合**
    - プラットフォームベンダーに機能リクエストを提出
    - よくメンテナンスされたサードパーティライブラリを使用
    - パブリック API で回避策を実装
    - 公式サポートを待つ
    
    **プライベート API を決して使用しない**
    - 本番環境アプリケーション
    - App Store 提出
    - クライアントプロジェクト
    - オープンソースライブラリ
    
    **独自の API を慎重に設計する**
    - 明確なパブリック/プライベートの分離
    - 包括的なドキュメント
    - セマンティックバージョニング
    - 非推奨警告

## 参考資料

- [Apple Developer ドキュメント](https://developer.apple.com/documentation/)
- [Android API リファレンス](https://developer.android.com/reference)
- [MDN Web API](https://developer.mozilla.org/ja/docs/Web/API)
- [iOS App Store レビューガイドライン](https://developer.apple.com/app-store/review/guidelines/)
- [Android 隠された API の制限](https://developer.android.com/guide/app-compatibility/restrictions-non-sdk-interfaces)
- [セマンティックバージョニング](https://semver.org/)
