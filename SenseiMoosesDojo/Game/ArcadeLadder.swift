import Foundation

/// Arcade chain after the Stage 1 starter dummy: BossID.ladder in order.
struct ArcadeProgress {
    let player: PlayableFighter
    /// `nil` = intro CPU dummy on Lions Bridge. Otherwise an index into `BossID.ladder`.
    let step: Int?

    static func start(player: PlayableFighter) -> ArcadeProgress {
        ArcadeProgress(player: player, step: nil)
    }

    var opponent: PlayableFighter {
        if let step {
            return .boss(BossID.ladder[step])
        }
        if case .starter(let id) = player {
            let dummy = FighterID.allCases.first { $0 != id } ?? .jb
            return .starter(dummy)
        }
        return .starter(.jb)
    }

    var stageID: StageID {
        if let step { return BossID.ladder[step].stageID }
        return .lionsBridge
    }

    var currentBoss: BossID? {
        guard let step else { return nil }
        return BossID.ladder[step]
    }

    var next: ArcadeProgress? {
        let upcoming = (step ?? -1) + 1
        guard upcoming < BossID.ladder.count else { return nil }
        return ArcadeProgress(player: player, step: upcoming)
    }
}
