import SpriteKit

final class CharacterSelectScene: SKScene {
    private let mode: SelectMode
    private var selected: PlayableFighter?
    private var slots: [String: SKNode] = [:]
    private var fightButton: SKLabelNode?

    init(size: CGSize, mode: SelectMode) {
        self.mode = mode
        super.init(size: size)
        scaleMode = .aspectFill
    }

    @available(*, unavailable)
    required init?(coder aDecoder: NSCoder) { fatalError("init(coder:) has not been implemented") }

    override func didMove(to view: SKView) {
        removeAllChildren()
        slots.removeAll()
        backgroundColor = SKColor(red: 0.07, green: 0.06, blue: 0.1, alpha: 1)
        buildHeader()
        buildSlots()
        buildFightButton()
    }

    private func roster() -> [PlayableFighter] {
        let starters = UnlockStore.starters.map { PlayableFighter.starter($0) }
        guard mode == .freePlay else { return starters }
        let bosses = UnlockStore.selectRoster().unlockedBosses.map { PlayableFighter.boss($0) }
        return starters + bosses
    }

    private func buildHeader() {
        let title = SKLabelNode(fontNamed: "AvenirNext-Heavy")
        title.text = mode == .arcade ? "ARCADE  ·  CHOOSE YOUR FIGHTER" : "FREE PLAY  ·  CHOOSE YOUR FIGHTER"
        title.fontSize = 28
        title.fontColor = SKColor(red: 1, green: 0.84, blue: 0.32, alpha: 1)
        title.position = CGPoint(x: size.width / 2, y: size.height - 58)
        title.zPosition = 5
        addChild(title)

        let hint = SKLabelNode(fontNamed: "AvenirNext-Medium")
        hint.text = mode == .arcade
            ? "Starters always available  ·  Beat the dummy, then the boss ladder"
            : "Starters + unlocked bosses"
        hint.fontSize = 14
        hint.fontColor = SKColor(white: 0.75, alpha: 1)
        hint.position = CGPoint(x: size.width / 2, y: size.height - 88)
        addChild(hint)

        let back = SKLabelNode(fontNamed: "AvenirNext-Bold")
        back.text = "← TITLE"
        back.fontSize = 16
        back.fontColor = SKColor(white: 0.85, alpha: 1)
        back.horizontalAlignmentMode = .left
        back.position = CGPoint(x: 36, y: size.height - 40)
        back.name = "title"
        addChild(back)

        if mode == .arcade {
            let free = SKLabelNode(fontNamed: "AvenirNext-Bold")
            free.text = "FREE PLAY →"
            free.fontSize = 16
            free.fontColor = SKColor(white: 0.85, alpha: 1)
            free.horizontalAlignmentMode = .right
            free.position = CGPoint(x: size.width - 36, y: size.height - 40)
            free.name = "free-play"
            addChild(free)
        } else {
            let arcade = SKLabelNode(fontNamed: "AvenirNext-Bold")
            arcade.text = "← ARCADE"
            arcade.fontSize = 16
            arcade.fontColor = SKColor(white: 0.85, alpha: 1)
            arcade.horizontalAlignmentMode = .right
            arcade.position = CGPoint(x: size.width - 36, y: size.height - 40)
            arcade.name = "arcade"
            addChild(arcade)
        }
    }

    private func buildSlots() {
        let fighters = roster()
        let columns = min(7, max(fighters.count, 1))
        let slotW: CGFloat = fighters.count > 5 ? 150 : 200
        let slotH: CGFloat = fighters.count > 5 ? 240 : 300
        let gap: CGFloat = 12
        let rows = Int(ceil(Double(fighters.count) / Double(columns)))
        let gridW = CGFloat(min(columns, fighters.count)) * slotW + CGFloat(max(min(columns, fighters.count) - 1, 0)) * gap
        let startX = (size.width - gridW) / 2 + slotW / 2
        let startY = size.height * (fighters.count > 5 ? 0.58 : 0.46)

        for (index, fighter) in fighters.enumerated() {
            let col = index % columns
            let row = index / columns
            let card = makeCard(fighter: fighter, width: slotW, height: slotH)
            card.position = CGPoint(
                x: startX + CGFloat(col) * (slotW + gap),
                y: startY - CGFloat(row) * (slotH + 16)
            )
            card.name = fighter.slotName
            addChild(card)
            slots[fighter.slotName] = card
        }

        if mode == .freePlay, UnlockStore.selectRoster().unlockedBosses.isEmpty {
            let empty = SKLabelNode(fontNamed: "AvenirNext-Medium")
            empty.text = "Win arcade fights to unlock bosses here."
            empty.fontSize = 14
            empty.fontColor = SKColor(white: 0.6, alpha: 1)
            empty.position = CGPoint(x: size.width / 2, y: 110)
            addChild(empty)
        }
        _ = rows
    }

    private func makeCard(fighter: PlayableFighter, width: CGFloat, height: CGFloat) -> SKNode {
        let root = SKNode()
        root.name = fighter.slotName

        let panel = SKShapeNode(rectOf: CGSize(width: width, height: height), cornerRadius: 14)
        panel.fillColor = SKColor(white: 0.12, alpha: 0.92)
        panel.strokeColor = fighter.accent
        panel.lineWidth = 3
        panel.name = fighter.slotName
        root.addChild(panel)

        let portraitH = height > 260 ? 148 : 100
        let portrait = Art.portrait(fighter, height: portraitH)
        portrait.position = CGPoint(x: 0, y: height * 0.12)
        portrait.name = fighter.slotName
        root.addChild(portrait)

        let idle = Art.idle(fighter, height: height > 260 ? 80 : 56)
        idle.position = CGPoint(x: 0, y: -height * 0.28)
        idle.name = fighter.slotName
        root.addChild(idle)

        let name = SKLabelNode(fontNamed: "AvenirNext-Bold")
        name.text = fighter.displayName
        name.fontSize = width > 180 ? 20 : 13
        name.fontColor = .white
        name.position = CGPoint(x: 0, y: -height * 0.44)
        name.name = fighter.slotName
        root.addChild(name)
        return root
    }

    private func buildFightButton() {
        let label = SKLabelNode(fontNamed: "AvenirNext-Heavy")
        label.text = "SELECT A FIGHTER"
        label.fontSize = 22
        label.fontColor = SKColor(white: 0.55, alpha: 1)
        label.position = CGPoint(x: size.width / 2, y: 40)
        label.name = "fight"
        label.zPosition = 6
        addChild(label)
        fightButton = label
    }

    private func select(_ fighter: PlayableFighter) {
        selected = fighter
        for (key, node) in slots {
            let highlight = key == fighter.slotName
            node.setScale(highlight ? 1.06 : 1.0)
            node.alpha = highlight ? 1 : 0.72
        }
        let verb = mode == .arcade ? "ARCADE" : "FIGHT"
        fightButton?.text = "\(verb)  —  \(fighter.displayName.uppercased())"
        fightButton?.fontColor = SKColor(red: 1, green: 0.84, blue: 0.32, alpha: 1)

        run(.sequence([
            .wait(forDuration: 0.22),
            .run { [weak self] in
                guard let self else { return }
                self.startFight(fighter)
            }
        ]), withKey: "go-fight")
    }

    private func startFight(_ fighter: PlayableFighter) {
        if mode == .arcade {
            SceneRouter.present(SceneRouter.fight(size: size, arcade: .start(player: fighter)), from: self)
        } else {
            SceneRouter.present(SceneRouter.fight(size: size, player: fighter), from: self)
        }
    }

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first else { return }
        let point = touch.location(in: self)
        let nodes = nodes(at: point)
        if nodes.contains(where: { $0.name == "title" }) {
            removeAction(forKey: "go-fight")
            SceneRouter.present(SceneRouter.title(size: size), from: self)
            return
        }
        if nodes.contains(where: { $0.name == "free-play" }) {
            removeAction(forKey: "go-fight")
            SceneRouter.present(SceneRouter.select(size: size, mode: .freePlay), from: self)
            return
        }
        if nodes.contains(where: { $0.name == "arcade" }) {
            removeAction(forKey: "go-fight")
            SceneRouter.present(SceneRouter.select(size: size, mode: .arcade), from: self)
            return
        }
        if nodes.contains(where: { $0.name == "fight" }), let selected {
            removeAction(forKey: "go-fight")
            startFight(selected)
            return
        }
        for node in nodes {
            guard let name = node.name, let fighter = PlayableFighter.parseSlot(name) else { continue }
            select(fighter)
            return
        }
    }
}
