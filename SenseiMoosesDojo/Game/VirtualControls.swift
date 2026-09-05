import SpriteKit

/// On-screen pad: move L/R plus jump, punch, kick, and ★ ULT (dimmed until meter full).
final class VirtualControls: SKNode {
    private(set) var leftHeld = false
    private(set) var rightHeld = false

    var onJump: (() -> Void)?
    var onPunch: (() -> Void)?
    var onKick: (() -> Void)?
    var onUltimate: (() -> Void)?

    private var ultimateReady = false

    private var buttons: [String: SKShapeNode] = [:]
    private var tracked: [UITouch: String] = [:]

    init(canvas: CGSize) {
        super.init()
        name = "virtual-controls"
        zPosition = 80
        isUserInteractionEnabled = false

        let moveY: CGFloat = 78
        let actionY: CGFloat = 92
        addButton(name: "left", label: "◀", at: CGPoint(x: 90, y: moveY), radius: 42, color: SKColor(white: 0.15, alpha: 0.55))
        addButton(name: "right", label: "▶", at: CGPoint(x: 186, y: moveY), radius: 42, color: SKColor(white: 0.15, alpha: 0.55))
        addButton(name: "jump", label: "JUMP", at: CGPoint(x: canvas.width - 96, y: actionY + 78), radius: 38, color: SKColor(red: 0.2, green: 0.45, blue: 0.75, alpha: 0.7))
        addButton(name: "punch", label: "PUNCH", at: CGPoint(x: canvas.width - 176, y: actionY), radius: 40, color: SKColor(red: 0.75, green: 0.25, blue: 0.2, alpha: 0.75))
        addButton(name: "kick", label: "KICK", at: CGPoint(x: canvas.width - 82, y: actionY - 8), radius: 40, color: SKColor(red: 0.8, green: 0.62, blue: 0.15, alpha: 0.75))
        addButton(name: "ultimate", label: "★ ULT", at: CGPoint(x: canvas.width - 258, y: actionY + 74), radius: 40, color: SKColor(red: 0.55, green: 0.2, blue: 0.7, alpha: 0.85))
        setUltimateReady(false)
    }

    @available(*, unavailable)
    required init?(coder aDecoder: NSCoder) { fatalError("init(coder:) has not been implemented") }

    private func addButton(name: String, label: String, at point: CGPoint, radius: CGFloat, color: SKColor) {
        let circle = SKShapeNode(circleOfRadius: radius)
        circle.fillColor = color
        circle.strokeColor = SKColor(white: 1, alpha: 0.35)
        circle.lineWidth = 2
        circle.position = point
        circle.name = name
        circle.zPosition = 1

        let text = SKLabelNode(fontNamed: "AvenirNext-Bold")
        text.text = label
        text.fontSize = label.count > 1 ? 13 : 22
        text.fontColor = .white
        text.verticalAlignmentMode = .center
        text.horizontalAlignmentMode = .center
        text.name = name
        circle.addChild(text)
        addChild(circle)
        buttons[name] = circle
    }

    func handleTouchesBegan(_ touches: Set<UITouch>, in scene: SKScene) {
        for touch in touches {
            guard let name = hitName(touch, in: scene) else { continue }
            tracked[touch] = name
            press(name, down: true)
            fireAction(name)
        }
    }

    func handleTouchesMoved(_ touches: Set<UITouch>, in scene: SKScene) {
        for touch in touches {
            let name = hitName(touch, in: scene)
            let previous = tracked[touch]
            if previous != name {
                if let previous { press(previous, down: false) }
                if let name {
                    tracked[touch] = name
                    press(name, down: true)
                    fireAction(name)
                } else {
                    tracked[touch] = nil
                }
            }
        }
    }

    func handleTouchesEnded(_ touches: Set<UITouch>) {
        for touch in touches {
            if let name = tracked[touch] {
                press(name, down: false)
            }
            tracked[touch] = nil
        }
    }

    func reset() {
        leftHeld = false
        rightHeld = false
        tracked.removeAll()
        buttons.values.forEach { $0.alpha = 1 }
        setUltimateReady(false)
    }

    func setUltimateReady(_ ready: Bool) {
        ultimateReady = ready
        guard let button = buttons["ultimate"] else { return }
        button.alpha = ready ? 1 : 0.32
        button.strokeColor = ready
            ? SKColor(red: 1, green: 0.84, blue: 0.32, alpha: 1)
            : SKColor(white: 1, alpha: 0.2)
    }

    private func fireAction(_ name: String) {
        switch name {
        case "jump": onJump?()
        case "punch": onPunch?()
        case "kick": onKick?()
        case "ultimate":
            if ultimateReady { onUltimate?() }
        default: break
        }
    }

    private func press(_ name: String, down: Bool) {
        if name == "ultimate" {
            buttons[name]?.alpha = down ? 0.55 : (ultimateReady ? 1 : 0.32)
        } else {
            buttons[name]?.alpha = down ? 0.55 : 1
        }
        switch name {
        case "left": leftHeld = down
        case "right": rightHeld = down
        default: break
        }
    }

    private func hitName(_ touch: UITouch, in _: SKScene) -> String? {
        let point = touch.location(in: self)
        let hit = nodes(at: point)
        return hit.compactMap { $0.name }.first { buttons[$0] != nil }
    }
}
