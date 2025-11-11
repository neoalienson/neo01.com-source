---
title: '探索 Swift：使用 Swift 和 SpriteKit 在 iOS 上编写弹珠游戏'
tags:
  - iOS
  - Swift
categories:
  - Development
date: 2014-08-06
lang: zh-CN
excerpt: 用 Swift 和 SpriteKit 打造日本弹珠台游戏!从零开始学习类型推断、可选变量和物理碰撞处理。
comments: true
---

{% githubCard user:neoalienson repo:pachinko %}


你喜欢 Swift 吗？这是 Apple 在 XCode 6 中提供的编程语言。你可能不知道，但我在用它编写游戏后就喜欢上了它。我将向你展示如何使用 Swift 编写游戏。如果你想直接查看这个游戏的[源代码](https://github.com/neoalienson/pachinko)，可以从 [GitHub](https://github.com/neoalienson/pachinko) 下载或克隆它。
<!--more-->
![Pachinko，又名日本弹珠游戏，在 iOS 上使用 Swift](/2014/08/discover-swift-writing-a-pachinko-game-on-ios-with-swift-and-spritekit/screenshot.png)

# 开始使用 XCode 6

首先，你需要下载 XCode 6。目前，XCode 6 尚未正式发布，所以你需要加入"iOS Developer Program"才能访问它。安装 Xcode 并选择创建新项目后，你可以选择带有 Game 模板的 iOS Application，

![new_xcode_game](/2014/08/discover-swift-writing-a-pachinko-game-on-ios-with-swift-and-spritekit/new_xcode_game.png)

填写产品名称，选择语言 Swift 和框架 SpriteKit，

![new_xcode_game_2](/2014/08/discover-swift-writing-a-pachinko-game-on-ios-with-swift-and-spritekit/new_xcode_game_2.png)

# 类型推断

创建示例游戏后，你可以在 `GameViewController.swift` 中将 `scaleMode` 设置为 `.AspectFit`，例如，```scene.scaleMode = .AspectFit```。示例版本将 `scaleMode` 设置为 `.AspectFill`。使用 `.AspectFill` 时我对坐标感到困惑，发现在此模式下部分游戏场景没有显示。我发现将 `scaleMode` 设置为 `.AspectFit` 会更容易学习坐标系统，因为所有场景都会显示。如果不匹配，`.AspectFit` 会添加空白空间，所以你不会错过场景的任何部分。你不需要为 `.AspectFit` 指定类型，因为 Swift 可以使用类型推断从 `scene.scaleMode` 推断类型。此外，不需要分号来结束语句。你开始喜欢它了吗？

# 处理不同的场景宽高比

接下来，将 `GameScene.sks` 调整为 640 宽度和 1136 高度，使其适合 iPhone 5 的宽高比。请注意，这些数字不是像素单位，因为场景可以根据 `scaleMode` 缩放，使用 640 在游戏程序中更容易参考。首次启动时可能很难看到选定的游戏场景，因为它默认适合编辑器；使用"-"图标缩小可以帮助。你可以从面包屑或右侧的属性窗口知道你已选择了场景。

![gamesene_sks](/2014/08/discover-swift-writing-a-pachinko-game-on-ios-with-swift-and-spritekit/gamesene_sks.png)

# 使用 SpriteKit 构建基本游戏元素

SpriteKit 对我来说非常熟悉，因为我有 Cocos2d 和 Cocos2d-x 的经验。它是一个集物理引擎、2D 图形引擎和动画引擎于一体的工具。让我们从创建钉子、栅栏和边界开始。
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
    for var x : CGFloat = 75; x &lt; 500; x += pinSpacing {
      for var y : CGFloat = 200; y &lt; 800; y += pinSpacing {
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
    for var x : CGFloat = fenceSpacing; x &lt; right - 100; x += fenceSpacing {
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

# 非可选/可选变量？

你可能想知道 `var borderBottom: SKShapeNode? = nil` 中的 `SKShapeNode?` 是什么。在 Swift 中，变量默认是非可选的，不能在没有显式声明的情况下设置为 `nil`（或 null）。要使变量可选，你需要在其类型末尾附加问号（`?`）。这种设计使 Swift 更加**防错**，因为许多其他语言的开发人员会意外地解引用变量，导致空指针异常或对未定义对象的方法调用。拥有可选注释可能会有所帮助，但它会使你的代码充满不必要的注释。好吧，我们还没有可以玩的游戏！现在让我们尝试添加一些动作，让事情变得更有趣。

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

如果你连续点击，飞船会填满屏幕。让我们在飞船撞到地板时做点什么，

# 处理对象碰撞

首先，使 `GameScence` 符合 `SKPhysicsContactDelegate`，这意味着它现在可以有一个函数来处理物理对象之间的接触。

{% codeblock lang:swift %}
class GameScene: SKScene, SKPhysicsContactDelegate {
    var score = 0
{% endcodeblock %}

以下是处理对象接触的函数，

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

你应该将接触委托设置为 `GameScene`，因为它符合协议，
{% codeblock lang:swift %}
override func didMoveToView(view: SKView) {
  // setup collision delegate
  self.physicsWorld.contactDelegate = self
}
{% endcodeblock %}

太棒了！我希望你不会沉迷于这个游戏。[在 GitHub 下载/浏览源代码](https://github.com/neoalienson/pachinko)。我希望有一天，Swift 和 SpriteKit 能够跨平台。
