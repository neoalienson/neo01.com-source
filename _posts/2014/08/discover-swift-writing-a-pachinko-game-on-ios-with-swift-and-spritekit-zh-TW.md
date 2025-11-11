---
title: '探索 Swift：使用 Swift 和 SpriteKit 在 iOS 上編寫彈珠台遊戲'
tags:
  - iOS
  - Swift
categories:
  - Development
date: 2014-08-06
lang: zh-TW
excerpt: 用 Swift 和 SpriteKit 打造日本彈珠台遊戲!從零開始學習型別推斷、可選變數和物理碰撞處理。
comments: true
---

{% githubCard user:neoalienson repo:pachinko %}


你喜歡 Swift 嗎？這是 Apple 在 XCode 6 中推出的程式語言。你可能不知道，但我在用它編寫遊戲後對它產生了好感。我將向你展示如何使用 Swift 編寫遊戲。如果你想直接查看這個遊戲的[原始碼](https://github.com/neoalienson/pachinko)，你可以從 [GitHub](https://github.com/neoalienson/pachinko) 下載或複製它。
<!--more-->
![Pachinko，又名日本彈珠台遊戲，在 iOS 上使用 Swift](/2014/08/discover-swift-writing-a-pachinko-game-on-ios-with-swift-and-spritekit/screenshot.png)

# 開始使用 XCode 6

首先，你需要下載 XCode 6。目前，XCode 6 尚未正式發布，所以你需要加入「iOS Developer Program」才能存取它。安裝 Xcode 並選擇建立新專案後，你可以選擇帶有遊戲範本的 iOS 應用程式，

![new_xcode_game](/2014/08/discover-swift-writing-a-pachinko-game-on-ios-with-swift-and-spritekit/new_xcode_game.png)

填寫產品名稱，選擇語言 Swift 和框架 SpriteKit，

![new_xcode_game_2](/2014/08/discover-swift-writing-a-pachinko-game-on-ios-with-swift-and-spritekit/new_xcode_game_2.png)

# 型別推斷

建立範本遊戲後，你可以在 GameViewController.swift 中將 scaleMode 設定為 .AspectFit，例如 ```scene.scaleMode = .AspectFit```。範本版本將 scaleMode 設定為 .AspectFill。使用 .AspectFill 時我對座標感到困惑，發現在此模式下部分遊戲場景沒有顯示。我發現將 scaleMode 設定為 .AspectFit 會更容易學習座標系統，因為所有場景都會顯示。如果不匹配，.AspectFit 會添加空白空間，所以你不會錯過場景的任何部分。你不需要為 .AspectFit 指定型別，因為 Swift 可以使用型別推斷從 scene.scaleMode 推斷型別。此外，不需要分號來結束語句。你開始喜歡它了嗎？

# 處理不同的場景長寬比

接下來，將 GameScene.sks 調整為 640 寬度和 1136 高度，使其符合 iPhone 5 的長寬比。請注意，這些數字不是以像素為單位，因為場景可以根據 scaleMode 進行縮放，使用 640 在遊戲程式中更容易參考。第一次啟動時可能很難看到選定的遊戲場景，因為它預設會適應編輯器；使用「-」圖示縮小可以提供幫助。你可以從麵包屑或右側的屬性視窗知道你已選擇了場景。

![gamesene_sks](/2014/08/discover-swift-writing-a-pachinko-game-on-ios-with-swift-and-spritekit/gamesene_sks.png)

# 使用 SpriteKit 建構基本遊戲元素

SpriteKit 對我來說非常熟悉，因為我有 Cocos2d 和 Cocos2d-x 的經驗。它是一個集物理引擎、2D 圖形引擎和動畫引擎於一體的工具。讓我們從建立釘子、柵欄和邊界開始。
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

# 非可選/可選變數？

你可能想知道 `var borderBottom: SKShapeNode? = nil` 中的 SKShapeNode? 是什麼。在 Swift 中，變數預設是非可選的，不能在沒有明確宣告的情況下設定為 nil（或 null）。要使變數成為可選的，你需要在其型別的末尾附加問號（?）。這種設計使 Swift 更加**防呆**，因為許多其他語言的開發者會意外地解引用變數，導致空指標異常或對未定義物件的方法呼叫。擁有可選註解可能很有幫助，但它會使你的程式碼充滿不必要的註解。好吧，我們還沒有可以玩的遊戲！現在讓我們嘗試添加一些動作，讓事情變得更有趣。

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

如果你持續點擊，太空船會填滿螢幕。讓我們在太空船撞到地板時做些什麼，

# 處理物體碰撞

首先，讓 GameScence 符合 SKPhysicsContactDelegate，這意味著它現在可以有一個函數來處理物理物體之間的接觸。

{% codeblock lang:swift %}
class GameScene: SKScene, SKPhysicsContactDelegate {
    var score = 0
{% endcodeblock %}

以下是處理物體接觸的函數，

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

你應該將接觸委託設定為 GameScene，因為它符合協定，
{% codeblock lang:swift %}
override func didMoveToView(view: SKView) {
  // setup collision delegate
  self.physicsWorld.contactDelegate = self
}
{% endcodeblock %}

太酷了！我希望你不會沉迷於這個遊戲。[在 GitHub 下載/瀏覽原始碼](https://github.com/neoalienson/pachinko)。我希望有一天，Swift 和 SpriteKit 能夠成為跨平台的。
