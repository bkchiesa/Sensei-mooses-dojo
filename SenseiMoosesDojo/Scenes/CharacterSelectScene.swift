import SpriteKit

final class CharacterSelectScene: SKScene {
    private var selected: FighterID?
    private var slots: [FighterID: SKNode] = [:]
    private var fightButton: SKLabelNode?

    override func didMove(to view: SKView) {
        removeAllChildren()
        slots.removeAll()
        backgroundColor = SKColor(red: 0.07, green: 0.06, blue: 0.1, alpha: 1)
        buildHeader()
        buildSlots()
        buildFightButton()
    }

    private func buildHeader() {
        let title = SKLabelNode(fontNamed: "AvenirNext-Heavy")
        title.text = "CHOOSE YOUR FIGHTER"
        title.fontSize = 34
        title.fontColor = SKColor(red: 1, green: 0.84, blue: 0.32, alpha: 1)
        title.position = CGPoint(x: size.width / 2, y: size.height - 72)
        title.zPosition = 5
        addChild(title)

        let hint = SKLabelNode(fontNamed: "AvenirNext-Medium")
        hint.text = "Matt  ·  Simon  ·  Rich  ·  Amanda  ·  JB"
        hint.fontSize = 16
        hint.fontColor = SKColor(white: 0.75, alpha: 1)
        hint.position = CGPoint(x: size.width / 2, y: size.height - 108)
        addChild(hint)

        let back = SKLabelNode(fontNamed: "AvenirNext-Bold")
        back.text = "← TITLE"
        back.fontSize = 16
        back.fontColor = SKColor(white: 0.85, alpha: 1)
        back.horizontalAlignmentMode = .left
        back.position = CGPoint(x: 36, y: size.height - 48)
        back.name = "title"
        addChild(back)
    }

    private func buildSlots() {
        let roster = FighterID.allCases
        let slotW: CGFloat = 200
        let gap: CGFloat = 18
        let total = CGFloat(roster.count) * slotW + CGFloat(roster.count - 1) * gap
        var x = (size.width - total) / 2 + slotW / 2
        let y = size.height * 0.48

        for id in roster {
            let card = makeCard(id: id, width: slotW)
            card.position = CGPoint(x: x, y: y)
            card.name = "slot-\(id.rawValue)"
            addChild(card)
            slots[id] = card
            x += slotW + gap
        }
    }

    private func makeCard(id: FighterID, width: CGFloat) -> SKNode {
        let root = SKNode()
        root.name = "slot-\(id.rawValue)"

        let panel = SKShapeNode(rectOf: CGSize(width: width, height: 320), cornerRadius: 16)
        panel.fillColor = SKColor(white: 0.12, alpha: 0.92)
        panel.strokeColor = id.accent
        panel.lineWidth = 3
        panel.name = "slot-\(id.rawValue)"
        root.addChild(panel)

        let portrait = Art.fighterPortrait(id, height: 148)
        portrait.position = CGPoint(x: 0, y: 48)
        portrait.name = "slot-\(id.rawValue)"
        root.addChild(portrait)

        let idle = Art.fighterIdle(id, height: 88)
        idle.position = CGPoint(x: 0, y: -86)
        idle.name = "slot-\(id.rawValue)"
        root.addChild(idle)

        let name = SKLabelNode(fontNamed: "AvenirNext-Bold")
        name.text = id.displayName
        name.fontSize = 22
        name.fontColor = .white
        name.position = CGPoint(x: 0, y: -148)
        name.name = "slot-\(id.rawValue)"
        root.addChild(name)
        return root
    }

    private func buildFightButton() {
        let label = SKLabelNode(fontNamed: "AvenirNext-Heavy")
        label.text = "SELECT A FIGHTER"
        label.fontSize = 24
        label.fontColor = SKColor(white: 0.55, alpha: 1)
        label.position = CGPoint(x: size.width / 2, y: 48)
        label.name = "fight"
        label.zPosition = 6
        addChild(label)
        fightButton = label
    }

    private func select(_ id: FighterID) {
        selected = id
        for (fid, node) in slots {
            let highlight = fid == id
            node.setScale(highlight ? 1.06 : 1.0)
            node.alpha = highlight ? 1 : 0.72
        }
        fightButton?.text = "FIGHT  —  \(id.displayName.uppercased())"
        fightButton?.fontColor = SKColor(red: 1, green: 0.84, blue: 0.32, alpha: 1)

        // Playable v0: select immediately starts the bout after a short beat.
        run(.sequence([
            .wait(forDuration: 0.22),
            .run { [weak self] in
                guard let self else { return }
                SceneRouter.present(SceneRouter.fight(size: self.size, player: id), from: self)
            }
        ]), withKey: "go-fight")
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
        if nodes.contains(where: { $0.name == "fight" }), let selected {
            removeAction(forKey: "go-fight")
            SceneRouter.present(SceneRouter.fight(size: size, player: selected), from: self)
            return
        }
        for node in nodes {
            guard let name = node.name, name.hasPrefix("slot-") else { continue }
            let raw = String(name.dropFirst("slot-".count))
            if let id = FighterID(rawValue: raw) {
                select(id)
                return
            }
        }
    }
}
