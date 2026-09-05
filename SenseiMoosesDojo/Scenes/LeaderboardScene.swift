import SpriteKit

final class LeaderboardScene: SKScene {
    override func didMove(to view: SKView) {
        removeAllChildren()
        backgroundColor = SKColor(red: 0.07, green: 0.05, blue: 0.11, alpha: 1)
        buildChrome()
        render(rows: [], source: nil, status: "Loading Top 10…")
        LeaderboardService.shared.loadTop10 { [weak self] rows, source in
            guard let self, self.view != nil else { return }
            self.render(rows: rows, source: source, status: nil)
        }
    }

    private func buildChrome() {
        let title = SKLabelNode(fontNamed: "AvenirNext-Heavy")
        title.text = "TOP 10"
        title.fontSize = 36
        title.fontColor = SKColor(red: 1, green: 0.84, blue: 0.32, alpha: 1)
        title.position = CGPoint(x: size.width / 2, y: size.height - 64)
        title.zPosition = 2
        addChild(title)

        let back = SKLabelNode(fontNamed: "AvenirNext-Bold")
        back.text = "← TITLE"
        back.fontSize = 16
        back.fontColor = SKColor(white: 0.85, alpha: 1)
        back.horizontalAlignmentMode = .left
        back.position = CGPoint(x: 36, y: size.height - 48)
        back.name = "title"
        addChild(back)
    }

    private func render(rows: [LeaderboardRow], source: LeaderboardSource?, status: String?) {
        enumerateChildNodes(withName: "row") { node, _ in node.removeFromParent() }
        childNode(withName: "status")?.removeFromParent()
        childNode(withName: "source")?.removeFromParent()

        if let source {
            let label = SKLabelNode(fontNamed: "AvenirNext-Medium")
            label.text = source == .gameCenter
                ? "Game Center  ·  \(LeaderboardConfig.gameCenterID)"
                : "This device  ·  Game Center unavailable — local fallback"
            label.fontSize = 14
            label.fontColor = SKColor(white: 0.7, alpha: 1)
            label.position = CGPoint(x: size.width / 2, y: size.height - 98)
            label.name = "source"
            addChild(label)
        }

        if let status {
            let label = SKLabelNode(fontNamed: "AvenirNext-Medium")
            label.text = status
            label.fontSize = 18
            label.fontColor = SKColor(white: 0.8, alpha: 1)
            label.position = CGPoint(x: size.width / 2, y: size.height * 0.5)
            label.name = "status"
            addChild(label)
            return
        }

        if rows.isEmpty {
            let empty = SKLabelNode(fontNamed: "AvenirNext-Medium")
            empty.text = "No scores yet. Win a bout on Lions Bridge to post one."
            empty.fontSize = 18
            empty.fontColor = SKColor(white: 0.8, alpha: 1)
            empty.position = CGPoint(x: size.width / 2, y: size.height * 0.5)
            empty.name = "status"
            addChild(empty)
            return
        }

        let startY = size.height - 148
        for (index, row) in rows.prefix(LeaderboardConfig.maxRows).enumerated() {
            let line = SKNode()
            line.name = "row"
            line.position = CGPoint(x: size.width / 2, y: startY - CGFloat(index) * 48)

            let bar = SKShapeNode(rectOf: CGSize(width: 780, height: 42), cornerRadius: 8)
            bar.fillColor = SKColor(white: 0.12, alpha: 0.9)
            bar.strokeColor = SKColor(white: 1, alpha: 0.12)
            line.addChild(bar)

            let rank = SKLabelNode(fontNamed: "AvenirNext-Heavy")
            rank.text = String(format: "%2d", row.rank)
            rank.fontSize = 20
            rank.fontColor = SKColor(red: 1, green: 0.84, blue: 0.32, alpha: 1)
            rank.horizontalAlignmentMode = .left
            rank.verticalAlignmentMode = .center
            rank.position = CGPoint(x: -360, y: 0)
            line.addChild(rank)

            let name = SKLabelNode(fontNamed: "AvenirNext-Bold")
            name.text = row.name
            name.fontSize = 20
            name.fontColor = .white
            name.horizontalAlignmentMode = .left
            name.verticalAlignmentMode = .center
            name.position = CGPoint(x: -300, y: 0)
            line.addChild(name)

            let score = SKLabelNode(fontNamed: "AvenirNext-Heavy")
            score.text = "\(row.score)"
            score.fontSize = 20
            score.fontColor = .white
            score.horizontalAlignmentMode = .right
            score.verticalAlignmentMode = .center
            score.position = CGPoint(x: 360, y: 0)
            line.addChild(score)

            addChild(line)
        }
    }

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first else { return }
        let nodes = nodes(at: touch.location(in: self))
        if nodes.contains(where: { $0.name == "title" }) {
            SceneRouter.present(SceneRouter.title(size: size), from: self)
        }
    }
}
