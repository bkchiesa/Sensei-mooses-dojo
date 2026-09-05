import Foundation

/// Playable and reserved stages. Only Stage 1 is wired into FightScene for v0.
enum StageID: String, CaseIterable {
    case lionsBridge
    case hiltonElementary
    case axsomDojo

    var displayName: String {
        switch self {
        case .lionsBridge: return "Lions Bridge"
        case .hiltonElementary: return "Hilton Elementary School"
        case .axsomDojo: return "Axsom Martial Arts Dojo"
        }
    }

    /// Locked art prefix. Stage 1 uses `stage1_*`. Later stages reserve `stage2_*` / `stage3_*`.
    var assetPrefix: String {
        switch self {
        case .lionsBridge: return "stage1"
        case .hiltonElementary: return "stage2"
        case .axsomDojo: return "stage3"
        }
    }
}

struct StageConfig {
    let id: StageID
    let mood: String?
    let wired: Bool

    var masterName: String { "\(id.assetPrefix)_master" }
    var skyName: String { "\(id.assetPrefix)_sky" }
    var farName: String { "\(id.assetPrefix)_far" }
    var midName: String { "\(id.assetPrefix)_mid" }
    var nearName: String { "\(id.assetPrefix)_near" }

    var hudCaption: String {
        if let mood {
            return "STAGE \(stageNumber)  ·  \(id.displayName.uppercased())  ·  MOOD \(mood)"
        }
        return "STAGE \(stageNumber)  ·  \(id.displayName.uppercased())"
    }

    private var stageNumber: Int {
        switch id {
        case .lionsBridge: return 1
        case .hiltonElementary: return 2
        case .axsomDojo: return 3
        }
    }

    static let lionsBridge = StageConfig(id: .lionsBridge, mood: "B", wired: true)

    /// TODO: Hilton Elementary School — not playable in v0.
    static let hiltonElementary = StageConfig(id: .hiltonElementary, mood: nil, wired: false)

    /// TODO: Axsom Martial Arts Dojo — not playable in v0.
    static let axsomDojo = StageConfig(id: .axsomDojo, mood: nil, wired: false)

    static func config(for id: StageID) -> StageConfig {
        switch id {
        case .lionsBridge: return .lionsBridge
        case .hiltonElementary: return .hiltonElementary
        case .axsomDojo: return .axsomDojo
        }
    }
}
