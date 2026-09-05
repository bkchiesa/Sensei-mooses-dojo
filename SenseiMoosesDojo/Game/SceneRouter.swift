import SpriteKit

enum SelectMode {
    case arcade
    case freePlay
}

enum SceneRouter {
    static func title(size: CGSize) -> SKScene {
        TitleScene(size: size)
    }

    static func select(size: CGSize, mode: SelectMode = .arcade) -> SKScene {
        CharacterSelectScene(size: size, mode: mode)
    }

    static func leaderboard(size: CGSize) -> SKScene {
        LeaderboardScene(size: size)
    }

    static func fight(size: CGSize, arcade: ArcadeProgress) -> SKScene {
        FightScene(size: size, player: arcade.player, opponent: arcade.opponent, stageID: arcade.stageID, arcade: arcade)
    }

    static func fight(
        size: CGSize,
        player: PlayableFighter,
        opponent: PlayableFighter? = nil,
        stage: StageID = .lionsBridge
    ) -> SKScene {
        let cpu: PlayableFighter
        if let opponent {
            cpu = opponent
        } else if case .starter(let id) = player {
            cpu = .starter(FighterID.allCases.first { $0 != id } ?? .jb)
        } else {
            cpu = .starter(.jb)
        }
        return FightScene(size: size, player: player, opponent: cpu, stageID: stage, arcade: nil)
    }

    static func present(_ next: SKScene, from current: SKScene) {
        next.scaleMode = current.scaleMode
        next.size = current.size
        current.view?.presentScene(next, transition: .fade(withDuration: 0.35))
    }
}
