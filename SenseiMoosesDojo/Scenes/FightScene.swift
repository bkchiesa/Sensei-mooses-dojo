import SpriteKit

final class FightScene: SKScene {
    private let playerID: FighterID
    private let cpuID: FighterID

    private var player: FighterActor!
    private var cpu: FighterActor!
    private var pad: VirtualControls!
    private var playerBar: HealthBar!
    private var cpuBar: HealthBar!
    private var overlay: SKNode?

    private let groundY: CGFloat = 132
    private var lastTime: TimeInterval = 0
    private var roundOver = false
    private var cpuCooldown: TimeInterval = 0.6
    private var cameraX: CGFloat = 0

    private var sky: SKSpriteNode?
    private var far: SKSpriteNode?
    private var mid: SKSpriteNode?
    private var master: SKSpriteNode?
    private var near: SKSpriteNode?

    init(size: CGSize, playerID: FighterID, cpuID: FighterID) {
        self.playerID = playerID
        self.cpuID = cpuID
        super.init(size: size)
        scaleMode = .aspectFill
    }

    @available(*, unavailable)
    required init?(coder aDecoder: NSCoder) { fatalError("init(coder:) has not been implemented") }

    override func didMove(to view: SKView) {
        removeAllChildren()
        lastTime = 0
        roundOver = false
        overlay = nil
        backgroundColor = SKColor(red: 0.45, green: 0.22, blue: 0.28, alpha: 1)
        isUserInteractionEnabled = true
        buildStage()
        buildFighters()
        buildHUD()
        pad = VirtualControls(canvas: size)
        pad.onJump = { [weak self] in self?.player.jump() }
        pad.onPunch = { [weak self] in self?.player.startAttack(.punch) }
        pad.onKick = { [weak self] in self?.player.startAttack(.kick) }
        addChild(pad)
    }

    private func buildStage() {
        // Layered parallax when present; `stage1_master` is always the readable plate.
        let hasParallax = [Art.stageSky, Art.stageFar, Art.stageMid, Art.stageNear].contains(where: Art.hasTexture)
        if hasParallax {
            sky = addLayer(Art.stageSky, z: -50, fallback: SKColor(red: 0.95, green: 0.5, blue: 0.28, alpha: 1), required: false)
            far = addLayer(Art.stageFar, z: -40, fallback: .clear, required: false)
            mid = addLayer(Art.stageMid, z: -25, fallback: .clear, required: false)
            master = addLayer(Art.stageMaster, z: -15, fallback: .clear, required: Art.hasTexture(Art.stageMaster))
            near = addLayer(Art.stageNear, z: 8, fallback: .clear, required: false)
        } else {
            master = addLayer(
                Art.stageMaster,
                z: -20,
                fallback: SKColor(red: 0.55, green: 0.32, blue: 0.22, alpha: 1),
                required: true
            )
        }

        let floor = SKSpriteNode(color: SKColor(red: 0.22, green: 0.13, blue: 0.1, alpha: 0.0), size: CGSize(width: size.width, height: 8))
        floor.position = CGPoint(x: size.width / 2, y: groundY - 4)
        floor.zPosition = 1
        addChild(floor)

        let caption = SKLabelNode(fontNamed: "AvenirNext-Bold")
        caption.text = "STAGE 1  ·  LIONS BRIDGE  ·  MOOD B"
        caption.fontSize = 13
        caption.fontColor = SKColor(white: 1, alpha: 0.7)
        caption.position = CGPoint(x: size.width / 2, y: size.height - 28)
        caption.zPosition = 40
        addChild(caption)
    }

    @discardableResult
    private func addLayer(_ name: String, z: CGFloat, fallback: SKColor, required: Bool) -> SKSpriteNode? {
        if !required && !Art.hasTexture(name) { return nil }
        let sprite = Art.sprite(named: name, fallbackColor: fallback, fallbackSize: size)
        sprite.size = size
        sprite.position = CGPoint(x: size.width / 2, y: size.height / 2)
        sprite.zPosition = z
        sprite.anchorPoint = CGPoint(x: 0.5, y: 0.5)
        addChild(sprite)
        return sprite
    }

    private func buildFighters() {
        let height: CGFloat = 210
        player = FighterActor(id: playerID, isPlayer: true, height: height)
        cpu = FighterActor(id: cpuID, isPlayer: false, height: height)
        player.resetRound(at: CGPoint(x: size.width * 0.28, y: groundY), facingRight: true)
        cpu.resetRound(at: CGPoint(x: size.width * 0.72, y: groundY), facingRight: false)
        player.zPosition = 10
        cpu.zPosition = 10
        addChild(player)
        addChild(cpu)
    }

    private func buildHUD() {
        playerBar = HealthBar(title: playerID.displayName, id: playerID, width: 420, alignLeft: true)
        playerBar.position = CGPoint(x: 36, y: size.height - 78)
        playerBar.zPosition = 50
        addChild(playerBar)

        cpuBar = HealthBar(title: "CPU · \(cpuID.displayName)", id: cpuID, width: 420, alignLeft: false)
        cpuBar.position = CGPoint(x: size.width - 36 - 420, y: size.height - 78)
        cpuBar.zPosition = 50
        addChild(cpuBar)
    }

    override func update(_ currentTime: TimeInterval) {
        let dt = lastTime == 0 ? 1.0 / 60.0 : min(currentTime - lastTime, 1.0 / 20.0)
        lastTime = currentTime
        guard !roundOver else { return }

        player.setWalk(left: pad.leftHeld, right: pad.rightHeld)
        updateCPU(dt: dt)

        let minX: CGFloat = 70
        let maxX: CGFloat = size.width - 70
        player.update(dt: CGFloat(dt), groundY: groundY, minX: minX, maxX: maxX)
        cpu.update(dt: CGFloat(dt), groundY: groundY, minX: minX, maxX: maxX)

        player.faceToward(cpu.position.x)
        cpu.faceToward(player.position.x)

        resolveHits()
        playerBar.set(hp: player.hp, maxHP: player.maxHP)
        cpuBar.set(hp: cpu.hp, maxHP: cpu.maxHP)
        updateParallax()

        if player.hp <= 0 || cpu.hp <= 0 {
            endRound(playerWon: cpu.hp <= 0 && player.hp > 0)
        }
    }

    private func updateCPU(dt: TimeInterval) {
        cpuCooldown -= dt
        let gap = cpu.position.x - player.position.x
        let distance = abs(gap)
        if distance > 95 {
            cpu.setWalk(left: gap > 0, right: gap < 0)
        } else {
            cpu.setWalk(left: false, right: false)
            if cpuCooldown <= 0, cpu.onGround {
                cpu.startAttack(distance < 70 ? .punch : .kick)
                cpuCooldown = 0.55 + TimeInterval(Int.random(in: 0...20)) / 100
            }
        }
        if cpuCooldown < -1, Int.random(in: 0...120) == 0 {
            cpu.jump()
        }
    }

    private func resolveHits() {
        if let box = player.attackHitbox(), hurtbox(cpu).intersects(box) {
            cpu.applyHit(damage: player.activeAttack?.damage ?? 8, fromX: player.position.x)
            player.markConnected()
        }
        if let box = cpu.attackHitbox(), hurtbox(player).intersects(box) {
            player.applyHit(damage: cpu.activeAttack?.damage ?? 8, fromX: cpu.position.x)
            cpu.markConnected()
        }
    }

    private func hurtbox(_ fighter: FighterActor) -> CGRect {
        CGRect(
            x: fighter.position.x - 32,
            y: fighter.position.y,
            width: 64,
            height: fighter.bodyHeight * 0.9
        )
    }

    private func updateParallax() {
        let midX = (player.position.x + cpu.position.x) * 0.5
        cameraX += (midX - size.width * 0.5 - cameraX) * 0.08
        let clamp = cameraX
        sky?.position.x = size.width / 2 - clamp * 0.08
        far?.position.x = size.width / 2 - clamp * 0.18
        master?.position.x = size.width / 2 - clamp * 0.32
        mid?.position.x = size.width / 2 - clamp * 0.42
        near?.position.x = size.width / 2 - clamp * 0.7
    }

    private func endRound(playerWon: Bool) {
        roundOver = true
        pad.reset()
        playerBar.set(hp: player.hp, maxHP: player.maxHP)
        cpuBar.set(hp: cpu.hp, maxHP: cpu.maxHP)

        let panel = SKNode()
        panel.name = "round-overlay"
        panel.zPosition = 100

        let dim = SKSpriteNode(color: SKColor(white: 0, alpha: 0.55), size: size)
        dim.position = CGPoint(x: size.width / 2, y: size.height / 2)
        panel.addChild(dim)

        let result = SKLabelNode(fontNamed: "AvenirNext-Heavy")
        result.text = playerWon ? "YOU WIN" : "YOU LOSE"
        result.fontSize = 56
        result.fontColor = playerWon
            ? SKColor(red: 1, green: 0.84, blue: 0.32, alpha: 1)
            : SKColor(red: 1, green: 0.35, blue: 0.28, alpha: 1)
        result.position = CGPoint(x: size.width / 2, y: size.height * 0.58)
        panel.addChild(result)

        addButton(to: panel, title: "REMATCH", name: "rematch", y: size.height * 0.40)
        addButton(to: panel, title: "CHARACTER SELECT", name: "select", y: size.height * 0.28)
        addChild(panel)
        overlay = panel
    }

    private func addButton(to parent: SKNode, title: String, name: String, y: CGFloat) {
        let bg = SKShapeNode(rectOf: CGSize(width: 360, height: 56), cornerRadius: 12)
        bg.fillColor = SKColor(white: 0.12, alpha: 0.95)
        bg.strokeColor = SKColor(red: 1, green: 0.84, blue: 0.32, alpha: 1)
        bg.lineWidth = 2
        bg.position = CGPoint(x: size.width / 2, y: y)
        bg.name = name
        let label = SKLabelNode(fontNamed: "AvenirNext-Bold")
        label.text = title
        label.fontSize = 20
        label.fontColor = .white
        label.verticalAlignmentMode = .center
        label.name = name
        bg.addChild(label)
        parent.addChild(bg)
    }

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        if roundOver {
            guard let touch = touches.first else { return }
            let nodes = nodes(at: touch.location(in: self))
            if nodes.contains(where: { $0.name == "rematch" }) {
                SceneRouter.present(SceneRouter.fight(size: size, player: playerID, cpu: cpuID), from: self)
                return
            }
            if nodes.contains(where: { $0.name == "select" }) {
                SceneRouter.present(SceneRouter.select(size: size), from: self)
                return
            }
            return
        }
        pad.handleTouchesBegan(touches, in: self)
    }

    override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard !roundOver else { return }
        pad.handleTouchesMoved(touches, in: self)
    }

    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        pad.handleTouchesEnded(touches)
    }

    override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
        pad.handleTouchesEnded(touches)
    }
}

final class HealthBar: SKNode {
    private let fill: SKSpriteNode
    private let width: CGFloat
    private let alignLeft: Bool

    init(title: String, id: FighterID, width: CGFloat, alignLeft: Bool) {
        self.width = width
        self.alignLeft = alignLeft
        let height: CGFloat = 22
        fill = SKSpriteNode(color: id.accent, size: CGSize(width: width, height: height))
        super.init()

        let back = SKSpriteNode(color: SKColor(white: 0.08, alpha: 0.75), size: CGSize(width: width + 6, height: height + 6))
        back.anchorPoint = CGPoint(x: 0, y: 0.5)
        back.position = .zero
        addChild(back)

        fill.anchorPoint = CGPoint(x: alignLeft ? 0 : 1, y: 0.5)
        fill.position = CGPoint(x: alignLeft ? 3 : width - 3, y: 0)
        addChild(fill)

        let portrait = Art.fighterPortrait(id, height: 36)
        portrait.position = CGPoint(x: alignLeft ? -28 : width + 28, y: 0)
        addChild(portrait)

        let label = SKLabelNode(fontNamed: "AvenirNext-Bold")
        label.text = title.uppercased()
        label.fontSize = 13
        label.fontColor = .white
        label.horizontalAlignmentMode = alignLeft ? .left : .right
        label.position = CGPoint(x: alignLeft ? 8 : width - 8, y: 18)
        addChild(label)
    }

    @available(*, unavailable)
    required init?(coder aDecoder: NSCoder) { fatalError("init(coder:) has not been implemented") }

    func set(hp: CGFloat, maxHP: CGFloat) {
        let t = max(0, min(1, hp / maxHP))
        fill.size.width = width * t
        fill.color = t > 0.35
            ? SKColor(red: 0.25, green: 0.8, blue: 0.32, alpha: 1)
            : SKColor(red: 0.85, green: 0.18, blue: 0.16, alpha: 1)
    }
}
