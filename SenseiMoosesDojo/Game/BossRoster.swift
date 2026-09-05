import SpriteKit

/// Instructor / boss ladder characters. Batch 1 likeness is art-locked; later bosses are reserved.
enum BossID: String, CaseIterable {
    case misty
    case lucas
    case chris
    case christiano
    case dakota
    // Batch 2 (likeness locked; art finals landing soon)
    case johnk
    case finley
    case hudson
    case michael
    case kasey
    // Batch 3 (likeness locked)
    case jaylen
    case amiyr
    case shaun
    case ryan
    case austin
    case senseiMoose

    var displayName: String {
        switch self {
        case .misty: return "Misty"
        case .lucas: return "Lucas"
        case .chris: return "Chris"
        case .christiano: return "Christiano"
        case .dakota: return "Dakota"
        case .johnk: return "John K."
        case .finley: return "Finley"
        case .hudson: return "Hudson"
        case .michael: return "Michael"
        case .kasey: return "Kasey"
        case .jaylen: return "Jaylen"
        case .amiyr: return "Amiyr"
        case .shaun: return "Shaun"
        case .ryan: return "Ryan"
        case .austin: return "Austin"
        case .senseiMoose: return "Sensei Moose"
        }
    }

    /// Pixel finals use `boss_<id>_portrait` / `boss_<id>_idle_00`.
    var portraitName: String { "boss_\(rawValue)_portrait" }
    var idleName: String { "boss_\(rawValue)_idle_00" }

    /// Sensei Moose falls back to title idle until `boss_senseiMoose_*` lands.
    var resolvedPortraitName: String {
        if self == .senseiMoose, !Art.hasTexture(portraitName) {
            return Art.titleIdle
        }
        return portraitName
    }

    var resolvedIdleName: String {
        if self == .senseiMoose, !Art.hasTexture(idleName) {
            return Art.titleIdle
        }
        return idleName
    }

    var accent: SKColor {
        switch self {
        case .misty: return SKColor(red: 0.85, green: 0.35, blue: 0.55, alpha: 1)
        case .lucas: return SKColor(red: 0.20, green: 0.45, blue: 0.75, alpha: 1)
        case .chris: return SKColor(red: 0.55, green: 0.25, blue: 0.20, alpha: 1)
        case .christiano: return SKColor(red: 0.15, green: 0.55, blue: 0.40, alpha: 1)
        case .dakota: return SKColor(red: 0.70, green: 0.45, blue: 0.15, alpha: 1)
        case .johnk: return SKColor(red: 0.25, green: 0.25, blue: 0.45, alpha: 1)
        case .finley: return SKColor(red: 0.45, green: 0.55, blue: 0.25, alpha: 1)
        case .hudson: return SKColor(red: 0.40, green: 0.30, blue: 0.20, alpha: 1)
        case .michael: return SKColor(red: 0.30, green: 0.40, blue: 0.55, alpha: 1)
        case .kasey: return SKColor(red: 0.65, green: 0.25, blue: 0.40, alpha: 1)
        case .jaylen: return SKColor(red: 0.20, green: 0.55, blue: 0.55, alpha: 1)
        case .amiyr: return SKColor(red: 0.50, green: 0.20, blue: 0.55, alpha: 1)
        case .shaun: return SKColor(red: 0.35, green: 0.35, blue: 0.35, alpha: 1)
        case .ryan: return SKColor(red: 0.70, green: 0.20, blue: 0.20, alpha: 1)
        case .austin: return SKColor(red: 0.20, green: 0.35, blue: 0.65, alpha: 1)
        case .senseiMoose: return SKColor(red: 0.55, green: 0.32, blue: 0.12, alpha: 1)
        }
    }

    /// Arcade stage: batch 1 + intro on Lions Bridge; batch 2 Hilton; batch 3 + Sensei on Axsom Dojo.
    var stageID: StageID {
        switch self {
        case .misty, .lucas, .chris, .christiano, .dakota:
            return .lionsBridge
        case .johnk, .finley, .hudson, .michael, .kasey:
            return .hiltonElementary
        case .jaylen, .amiyr, .shaun, .ryan, .austin, .senseiMoose:
            return .axsomDojo
        }
    }

    /// Full arcade order: Misty → … → Austin → Sensei Moose.
    static var ladder: [BossID] { allCases }

    static var batch1: [BossID] { [.misty, .lucas, .chris, .christiano, .dakota] }
    static var batch2: [BossID] { [.johnk, .finley, .hudson, .michael, .kasey] }
    static var batch3: [BossID] { [.jaylen, .amiyr, .shaun, .ryan, .austin] }
}
