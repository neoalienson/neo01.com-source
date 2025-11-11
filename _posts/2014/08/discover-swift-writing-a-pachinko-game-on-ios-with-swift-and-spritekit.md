---
title: 'Discover Swift: Writing a Pachinko game on iOS with Swift and SpriteKit'
tags:
  - iOS
  - Swift
id: 5973
categories:
  - Development
date: 2014-08-06
spell_checked: 2025-07-01
grammar_checked: 2025-07-01
excerpt: Build a Japanese pinball game with Swift and SpriteKit! Learn type inference, optional variables, and physics collision handling from scratch. Full source code on GitHub.
comments: true
---

{% githubCard user:neoalienson repo:pachinko %}


Do you like Swift, the programming language that comes with XCode 6 from Apple? You may not know, but I developed a fondness for it after writing a game with it. I am going to show you how to write a game with Swift.  If you'd like to jump right into the [source code](https://github.com/neoalienson/pachinko) of this game, you can download or clone it from [GitHub](https://github.com/neoalienson/pachinko)
<!--more-->
![Pachinko, a.k.a. Japanese pinball game, in iOS with Swift](screenshot.png)

# Getting started with XCode 6

Firstly, you need to download XCode 6. At the moment, XCode 6 is not officially released, so you'll need to join 'iOS Developer Program' to access it. Once you've installed Xcode and chosen to create a new project, you can select the iOS Application with Game template,

![new_xcode_game](new_xcode_game.png)

Fill in product name, choosing the language Swift and the framework SpriteKit,

![new_xcode_game_2](new_xcode_game_2.png)

# Type Inference

Once the canned game is created, you can set `scaleMode` in `GameViewController.swift` to `.AspectFit`, e.g., ```scene.scaleMode = .AspectFit```. The canned version sets `scaleMode` to `.AspectFill`. I got lost with the coordinates when using `.AspectFill` and found that part of the game scene wasn't being shown under this mode. I discovered that setting `scaleMode` to `.AspectFit` would be easier to learn the coordinate system because all of the scene is shown. Empty spaces are added with `.AspectFit` if they don't match, so you won't miss any part of your scene. You don't need to specify the type for `.AspectFit`,  as Swift can infer the type from `scene.scaleMode` using Type Inference. Additionally, the semicolon is not required to end a statement. Are you starting to love it?

# Handling different scene aspect ratio

Next, resize the `GameScene.sks` to 640 width and 1136 height such that it fits aspect ratio to iPhone 5. Note that the numbers aren't in pixel units because the scene can be scaled according to `scaleMode`, using 640 is easier for reference purposes in the game program. It may be difficult to see the selected game scene on your first launch, as it will fits the editor by default; zooming out with the '-' icon can help. You'll know you've selected the scene from breadcrumb or property window on right.

![gamesene_sks](gamesene_sks.png)

# Build basic game elements with SpriteKit

SpriteKit is very familiar to me as I have experience with Cocos2d and Cocos2d-x. It is an all-in-one physics engine, 2d graphics engine, and animation engine. Let's start by creating pins, fences and borders.
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

# Non-optional/Optional Variable?

You may wonder what `SKShapeNode?` is in `var borderBottom: SKShapeNode? = nil`. In Swift, variables are non-optional by default and cannot be set to `nil` (or null) without explicit declaration. To make a variable optional, you need to append a question mark (`?`) to the end of its type. This design makes Swift more **fool-proof** because many developers in other languages accidentally dereference variables, leading to null pointer exceptions or method calls on undefined objects. Having an optional annotation can be helpful, but it would clutter your code with unnecessary annotations. Well, we still don't have a game to play yet! Now let's try to add some action and make things more fun.

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

The spaceships fill up the screen if you tap continuously. Let's do something when the spaceship hits the floor,

# Handle object collision

First, make the `GameScence` conform to `SKPhysicsContactDelegate`, which means that it can now have a function to handle contacts between physics objects.

{% codeblock lang:swift %}
class GameScene: SKScene, SKPhysicsContactDelegate {
    var score = 0
{% endcodeblock %}

And below is the function to handle object contact,

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

You should set contact delegate to the `GameScene` since it conforms to the protocol,
{% codeblock lang:swift %}
override func didMoveToView(view: SKView) {
  // setup collision delegate
  self.physicsWorld.contactDelegate = self
}
{% endcodeblock %}

Cool! I hope you're not addicted to the game. [Download/browse source in GitHub](https://github.com/neoalienson/pachinko). I wish that one day, Swift and SpriteKit would become cross-platform.
