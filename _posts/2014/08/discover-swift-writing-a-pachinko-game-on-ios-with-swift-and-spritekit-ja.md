---
title: 'Swiftを発見：SwiftとSpriteKitでiOSにパチンコゲームを書く'
tags:
  - iOS
  - Swift
id: 5973
categories:
  - Development
date: 2014-08-06
lang: ja
excerpt: SwiftとSpriteKitで日本のピンボールゲームを構築！型推論、オプショナル変数、物理衝突処理をゼロから学びましょう。完全なソースコードはGitHubで公開中。
comments: true
---

{% githubCard user:neoalienson repo:pachinko %}


AppleのXCode 6に付属するプログラミング言語Swiftは好きですか？ご存じないかもしれませんが、私はそれでゲームを書いた後、それに愛着を持つようになりました。Swiftでゲームを書く方法をお見せします。このゲームの[ソースコード](https://github.com/neoalienson/pachinko)にすぐに飛び込みたい場合は、[GitHub](https://github.com/neoalienson/pachinko)からダウンロードまたはクローンできます。
<!--more-->
![SwiftでiOSに作られたパチンコ、別名日本のピンボールゲーム](/2014/08/discover-swift-writing-a-pachinko-game-on-ios-with-swift-and-spritekit/screenshot.png)

# XCode 6を始める

まず、XCode 6をダウンロードする必要があります。現時点では、XCode 6は正式にリリースされていないため、アクセスするには「iOS Developer Program」に参加する必要があります。Xcodeをインストールして新しいプロジェクトを作成することを選択したら、Gameテンプレートを使用してiOSアプリケーションを選択できます。

![new_xcode_game](/2014/08/discover-swift-writing-a-pachinko-game-on-ios-with-swift-and-spritekit/new_xcode_game.png)

製品名を入力し、言語にSwift、フレームワークにSpriteKitを選択します。

![new_xcode_game_2](/2014/08/discover-swift-writing-a-pachinko-game-on-ios-with-swift-and-spritekit/new_xcode_game_2.png)

# 型推論

缶詰のゲームが作成されたら、`GameViewController.swift`で`scaleMode`を`.AspectFit`に設定できます。例：```scene.scaleMode = .AspectFit```。缶詰バージョンは`scaleMode`を`.AspectFill`に設定します。`.AspectFill`を使用すると座標で迷子になり、このモードではゲームシーンの一部が表示されないことがわかりました。`scaleMode`を`.AspectFit`に設定すると、シーン全体が表示されるため、座標系を学ぶのが簡単になることがわかりました。`.AspectFit`では、一致しない場合は空のスペースが追加されるため、シーンの一部を見逃すことはありません。`.AspectFit`の型を指定する必要はありません。Swiftは型推論を使用して`scene.scaleMode`から型を推論できるためです。さらに、ステートメントを終了するためにセミコロンは必要ありません。好きになり始めていますか？

# 異なるシーンのアスペクト比の処理

次に、`GameScene.sks`を幅640、高さ1136にリサイズして、iPhone 5のアスペクト比に合わせます。シーンは`scaleMode`に応じてスケーリングできるため、数値はピクセル単位ではないことに注意してください。ゲームプログラムで参照しやすくするために640を使用します。最初の起動時には、デフォルトでエディターに合わせて表示されるため、選択したゲームシーンを見るのが難しい場合があります。「-」アイコンでズームアウトすると役立ちます。パンくずリストまたは右側のプロパティウィンドウからシーンを選択したことがわかります。

![gamesene_sks](/2014/08/discover-swift-writing-a-pachinko-game-on-ios-with-swift-and-spritekit/gamesene_sks.png)

# SpriteKitで基本的なゲーム要素を構築

SpriteKitは、Cocos2dとCocos2d-xの経験があるため、私にとって非常に馴染み深いものです。これは、物理エンジン、2Dグラフィックスエンジン、アニメーションエンジンのオールインワンです。ピン、フェンス、ボーダーを作成することから始めましょう。
{% codeblock lang:swift %}
import SpriteKit

class GameScene: SKScene {
  var borderBottom: SKShapeNode? = nil

  override func didMoveToView(view: SKView) {
    let top = scene.size.height;
    let right = scene.size.width;

    // pins
    let pinRadius : CGFloat = 5
    let pinSpacing : CGFloat = 100
    for var x : CGFloat = 75; x < 500; x += pinSpacing {
      for var y : CGFloat = 200; y < 800; y += pinSpacing {
        let sprite = SKShapeNode(circleOfRadius: pinRadius)
        sprite.physicsBody = SKPhysicsBody(circleOfRadius: pinRadius)
        sprite.physicsBody.dynamic = false
        // straggered pins
        sprite.position.x = x + (y % (pinSpacing * 2)) / 2
        sprite.position.y = y
        sprite.fillColor = UIColor.whiteColor()
        self.addChild(sprite)
      }
    }

    // fences
    let fenceSpacing : CGFloat = 100
    let fenceSize = CGSize(width: 5, height: 75)
    for var x : CGFloat = fenceSpacing; x < right - 100; x += fenceSpacing {
      let sprite = SKShapeNode(rectOfSize: fenceSize)
      sprite.physicsBody = SKPhysicsBody(rectangleOfSize: fenceSize)
      sprite.physicsBody.dynamic = false
      sprite.position = CGPoint(x: x, y: fenceSize.height / 2)
      sprite.fillColor = UIColor.whiteColor()
      self.addChild(sprite)
    }

    // bottom
    let pathBottom = CGPathCreateMutable()
    CGPathMoveToPoint(pathBottom, nil, 0, 0)
    CGPathAddLineToPoint(pathBottom, nil, right, 0)
    borderBottom = SKShapeNode(path: pathBottom)
    borderBottom?.physicsBody = SKPhysicsBody(edgeChainFromPath: pathBottom)
    borderBottom?.physicsBody.dynamic = false
    self.addChild(borderBottom)

    // other borders
    let path = CGPathCreateMutable()
    CGPathMoveToPoint(path, nil, 0, 0)
    CGPathAddLineToPoint(path, nil, 0, top)
    CGPathAddLineToPoint(path, nil, right - 150, top)
    CGPathAddLineToPoint(path, nil, right - 50, top - 50)
    CGPathAddLineToPoint(path, nil, right, top - 150)
    CGPathAddLineToPoint(path, nil, right, 0)
    let borders = SKShapeNode(path: path)
    borders.physicsBody = SKPhysicsBody(edgeChainFromPath: path)
    borders.physicsBody.dynamic = false
    self.addChild(borders)
  }
}
{% endcodeblock %}

# 非オプショナル/オプショナル変数？

`var borderBottom: SKShapeNode? = nil`の`SKShapeNode?`が何であるか疑問に思うかもしれません。Swiftでは、変数はデフォルトで非オプショナルであり、明示的な宣言なしに`nil`（またはnull）に設定することはできません。変数をオプショナルにするには、その型の末尾に疑問符（`?`）を追加する必要があります。この設計により、Swiftはより**フールプルーフ**になります。なぜなら、他の言語の多くの開発者が誤って変数を逆参照し、nullポインタ例外や未定義オブジェクトでのメソッド呼び出しにつながるからです。オプショナルアノテーションがあると便利ですが、不要なアノテーションでコードが乱雑になります。さて、まだプレイするゲームがありません！それでは、アクションを追加して、もっと楽しくしましょう。

{% codeblock lang:swift %}
override func touchesBegan(touches: NSSet, withEvent event: UIEvent) {
  // launch a ball
  let sprite = SKSpriteNode(imageNamed:"Spaceship")

  sprite.xScale = 0.15
  sprite.yScale = 0.15

  sprite.position = CGPoint(x: 605, y: 40)

  sprite.physicsBody = SKPhysicsBody(circleOfRadius: 30)
  sprite.physicsBody.contactTestBitMask = 1

  self.addChild(sprite)

  // give some randomness
  sprite.physicsBody.velocity.dy = 3000 + CGFloat(rand()) * 300 / CGFloat(RAND_MAX);
}
{% endcodeblock %}

連続してタップすると、宇宙船が画面を埋め尽くします。宇宙船が床に当たったときに何かをしましょう。

# オブジェクトの衝突を処理

まず、`GameScence`を`SKPhysicsContactDelegate`に準拠させます。これは、物理オブジェクト間の接触を処理する関数を持つことができることを意味します。

{% codeblock lang:swift %}
class GameScene: SKScene, SKPhysicsContactDelegate {
    var score = 0
{% endcodeblock %}

そして、以下はオブジェクトの接触を処理する関数です。

{% codeblock lang:swift %}
func didBeginContact(contact: SKPhysicsContact!) {
  if contact.bodyA == borderBottom?.physicsBody {
    let body = contact.bodyB

    // disable futher collision
    body.contactTestBitMask = 0

    let node = body.node

    // fade out
    node.runAction(SKAction.sequence([
        SKAction.fadeAlphaTo(0, duration: 1),
        SKAction.removeFromParent()]))

    // update score
    score += 10
    let label = self.childNodeWithName("score") as SKLabelNode
    label.text = String(score)

    // score float up from the ball
    let scoreUp = SKLabelNode(text: "+10")
    scoreUp.position = node.position
    self.addChild(scoreUp)
    scoreUp.runAction(SKAction.sequence([
        SKAction.moveBy(CGVector(dx: 0, dy: 50), duration: 1),
        SKAction.removeFromParent()
        ]))
  }
}
{% endcodeblock %}

プロトコルに準拠しているため、接触デリゲートを`GameScene`に設定する必要があります。
{% codeblock lang:swift %}
override func didMoveToView(view: SKView) {
  // setup collision delegate
  self.physicsWorld.contactDelegate = self
}
{% endcodeblock %}

素晴らしい！ゲームに夢中にならないことを願っています。[GitHubでソースをダウンロード/閲覧](https://github.com/neoalienson/pachinko)。いつかSwiftとSpriteKitがクロスプラットフォームになることを願っています。
