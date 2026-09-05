import SpriteKit
import UIKit

/// Loads catalog textures by exact asset name.
/// Drop real PNGs into the matching `.imageset` folders — no code change required.
enum Art {
    static let titleIdle = "moose_title_idle"
    static let titleBody = "moose_title_body"
    static let titleHead = "moose_title_head"
    static let stageMaster = "stage1_master"
    static let stageSky = "stage1_sky"
    static let stageFar = "stage1_far"
    static let stageMid = "stage1_mid"
    static let stageNear = "stage1_near"

    static func hasTexture(_ name: String) -> Bool {
        guard let image = UIImage(named: name) else { return false }
        return image.size.width > 1 && image.size.height > 1
    }

    static func texture(named name: String) -> SKTexture? {
        guard hasTexture(name) else { return nil }
        let texture = SKTexture(imageNamed: name)
        texture.filteringMode = .nearest
        return texture
    }

    static func sprite(
        named name: String,
        fallbackColor: SKColor,
        fallbackSize: CGSize
    ) -> SKSpriteNode {
        if let texture = texture(named: name) {
            let node = SKSpriteNode(texture: texture)
            node.name = name
            return node
        }
        let node = SKSpriteNode(color: fallbackColor, size: fallbackSize)
        node.name = name
        let label = SKLabelNode(fontNamed: "Menlo-Bold")
        label.text = name
        label.fontSize = max(8, min(fallbackSize.width, fallbackSize.height) * 0.08)
        label.fontColor = .white
        label.verticalAlignmentMode = .center
        label.horizontalAlignmentMode = .center
        label.zPosition = 1
        node.addChild(label)
        return node
    }

    static func scaleToHeight(_ node: SKSpriteNode, _ height: CGFloat) {
        guard node.size.height > 0 else {
            node.size = CGSize(width: height * 0.65, height: height)
            return
        }
        let factor = height / node.size.height
        node.size = CGSize(width: node.size.width * factor, height: height)
    }

    /// Sensei Moose pose B (closed-gi jump). Prefers `moose_title_idle`.
    /// Optional `moose_title_body` + `moose_title_head` compose if idle is absent.
    static func mooseTitle(targetHeight: CGFloat) -> SKNode {
        let root = SKNode()
        root.name = "sensei-moose"

        if hasTexture(titleIdle) {
            let idle = sprite(named: titleIdle, fallbackColor: .brown, fallbackSize: CGSize(width: targetHeight, height: targetHeight))
            scaleToHeight(idle, targetHeight)
            root.addChild(idle)
            return root
        }

        if hasTexture(titleBody) || hasTexture(titleHead) {
            if hasTexture(titleBody) {
                let body = sprite(named: titleBody, fallbackColor: .white, fallbackSize: CGSize(width: targetHeight * 0.7, height: targetHeight * 0.7))
                scaleToHeight(body, targetHeight * 0.72)
                body.position = CGPoint(x: 0, y: -targetHeight * 0.12)
                root.addChild(body)
            }
            if hasTexture(titleHead) {
                let head = sprite(named: titleHead, fallbackColor: .brown, fallbackSize: CGSize(width: targetHeight * 0.55, height: targetHeight * 0.4))
                scaleToHeight(head, targetHeight * 0.42)
                head.position = CGPoint(x: 0, y: targetHeight * 0.22)
                root.addChild(head)
            }
            return root
        }

        let idle = sprite(named: titleIdle, fallbackColor: SKColor(red: 0.48, green: 0.28, blue: 0.14, alpha: 1), fallbackSize: CGSize(width: targetHeight * 0.85, height: targetHeight))
        scaleToHeight(idle, targetHeight)
        root.addChild(idle)
        return root
    }

    static func fighterPortrait(_ id: FighterID, height: CGFloat) -> SKSpriteNode {
        let node = sprite(named: id.portraitName, fallbackColor: id.accent, fallbackSize: CGSize(width: height, height: height))
        scaleToHeight(node, height)
        return node
    }

    static func fighterIdle(_ id: FighterID, height: CGFloat) -> SKSpriteNode {
        let node = sprite(named: id.idleName, fallbackColor: id.accent, fallbackSize: CGSize(width: height * 0.65, height: height))
        scaleToHeight(node, height)
        return node
    }
}
