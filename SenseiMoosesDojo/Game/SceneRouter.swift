import SpriteKit

enum SceneRouter {
    static func title(size: CGSize) -> SKScene {
        TitleScene(size: size)
    }

    static func select(size: CGSize) -> SKScene {
        CharacterSelectScene(size: size)
    }

    static func fight(size: CGSize, player: FighterID, cpu: FighterID? = nil) -> SKScene {
        let opponent = cpu ?? FighterID.allCases.first { $0 != player } ?? .jb
        return FightScene(size: size, playerID: player, cpuID: opponent)
    }

    static func present(_ next: SKScene, from current: SKScene) {
        next.scaleMode = current.scaleMode
        next.size = current.size
        current.view?.presentScene(next, transition: .fade(withDuration: 0.35))
    }
}
