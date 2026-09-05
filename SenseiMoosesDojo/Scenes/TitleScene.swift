import SpriteKit

final class TitleScene: SKScene {
    override func didMove(to view: SKView) {
        removeAllChildren()
        backgroundColor = SKColor(red: 0.08, green: 0.05, blue: 0.12, alpha: 1)
        buildWash()
        buildMoose()
        buildTitle()
        buildPrompt()
        buildMenuButtons()
    }

    private func buildWash() {
        let washName = Art.hasTexture(Art.stageSky) ? Art.stageSky : Art.stageMaster
        if Art.hasTexture(washName) {
            let plate = Art.sprite(
                named: washName,
                fallbackColor: backgroundColor,
                fallbackSize: size
            )
            plate.size = size
            plate.position = CGPoint(x: size.width / 2, y: size.height / 2)
            plate.alpha = 0.35
            plate.zPosition = -2
            addChild(plate)
        }

        let veil = SKSpriteNode(color: SKColor(red: 0.06, green: 0.03, blue: 0.1, alpha: 0.45), size: size)
        veil.position = CGPoint(x: size.width / 2, y: size.height / 2)
        veil.zPosition = -1
        addChild(veil)

        let floor = SKSpriteNode(color: SKColor(red: 0.18, green: 0.1, blue: 0.07, alpha: 1), size: CGSize(width: size.width, height: 90))
        floor.position = CGPoint(x: size.width / 2, y: 45)
        floor.zPosition = 0
        addChild(floor)
    }

    private func buildMoose() {
        let moose = Art.mooseTitle(targetHeight: size.height * 0.5)
        moose.position = CGPoint(x: size.width * 0.5, y: size.height * 0.38)
        moose.zPosition = 5
        addChild(moose)

        let bob = SKAction.sequence([
            SKAction.moveBy(x: 0, y: 16, duration: 0.55),
            SKAction.moveBy(x: 0, y: -16, duration: 0.55)
        ])
        bob.timingMode = .easeInEaseOut
        moose.run(.repeatForever(bob), withKey: "bob")
    }

    private func buildTitle() {
        let shadow = makeTitleLabel()
        shadow.fontColor = SKColor(red: 0.25, green: 0.08, blue: 0.04, alpha: 0.85)
        shadow.position = CGPoint(x: size.width / 2 + 3, y: size.height * 0.80 - 3)
        shadow.zPosition = 9
        addChild(shadow)

        let title = makeTitleLabel()
        title.fontColor = SKColor(red: 1.0, green: 0.84, blue: 0.32, alpha: 1)
        title.position = CGPoint(x: size.width / 2, y: size.height * 0.80)
        title.zPosition = 10
        addChild(title)

        let pulse = SKAction.sequence([
            SKAction.scale(to: 1.045, duration: 0.9),
            SKAction.scale(to: 1.0, duration: 0.9)
        ])
        pulse.timingMode = .easeInEaseOut
        title.run(.repeatForever(pulse))

        let subtitle = SKLabelNode(fontNamed: "AvenirNext-Medium")
        subtitle.text = "Street-fight prototype  ·  Stage 1 Lions Bridge"
        subtitle.fontSize = 18
        subtitle.fontColor = SKColor(white: 0.85, alpha: 0.9)
        subtitle.position = CGPoint(x: size.width / 2, y: size.height * 0.74)
        subtitle.zPosition = 10
        addChild(subtitle)
    }

    private func makeTitleLabel() -> SKLabelNode {
        let title = SKLabelNode(fontNamed: "AvenirNext-Heavy")
        title.text = "Sensei Moose's Dojo"
        title.fontSize = 52
        title.horizontalAlignmentMode = .center
        title.verticalAlignmentMode = .center
        return title
    }

    private func buildPrompt() {
        let prompt = SKLabelNode(fontNamed: "AvenirNext-Bold")
        prompt.text = "TAP FOR ARCADE"
        prompt.fontSize = 22
        prompt.fontColor = SKColor(white: 0.95, alpha: 1)
        prompt.position = CGPoint(x: size.width / 2, y: 148)
        prompt.zPosition = 12
        addChild(prompt)

        let blink = SKAction.sequence([
            SKAction.fadeAlpha(to: 0.25, duration: 0.55),
            SKAction.fadeAlpha(to: 1.0, duration: 0.55)
        ])
        prompt.run(.repeatForever(blink))
    }

    private func buildMenuButtons() {
        addMenuButton(title: "ARCADE", name: "arcade", at: CGPoint(x: size.width * 0.32, y: 92))
        addMenuButton(title: "FREE PLAY", name: "free-play", at: CGPoint(x: size.width * 0.50, y: 92))
        addMenuButton(title: "TOP 10", name: "leaderboard", at: CGPoint(x: size.width * 0.68, y: 92))
    }

    private func addMenuButton(title: String, name: String, at point: CGPoint) {
        let bg = SKShapeNode(rectOf: CGSize(width: 168, height: 44), cornerRadius: 10)
        bg.fillColor = SKColor(white: 0.12, alpha: 0.9)
        bg.strokeColor = SKColor(red: 1, green: 0.84, blue: 0.32, alpha: 1)
        bg.lineWidth = 2
        bg.position = point
        bg.name = name
        bg.zPosition = 20
        let label = SKLabelNode(fontNamed: "AvenirNext-Bold")
        label.text = title
        label.fontSize = 16
        label.fontColor = .white
        label.verticalAlignmentMode = .center
        label.name = name
        bg.addChild(label)
        addChild(bg)
    }

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first else { return }
        let hit = nodes(at: touch.location(in: self))
        if hit.contains(where: { $0.name == "leaderboard" }) {
            SceneRouter.present(SceneRouter.leaderboard(size: size), from: self)
            return
        }
        if hit.contains(where: { $0.name == "free-play" }) {
            SceneRouter.present(SceneRouter.select(size: size, mode: .freePlay), from: self)
            return
        }
        SceneRouter.present(SceneRouter.select(size: size, mode: .arcade), from: self)
    }
}
