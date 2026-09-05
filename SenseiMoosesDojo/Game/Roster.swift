import SpriteKit

enum FighterID: String, CaseIterable {
    case matt
    case simon
    case rich
    case amanda
    case jb

    var displayName: String {
        switch self {
        case .matt: return "Matt"
        case .simon: return "Simon"
        case .rich: return "Rich"
        case .amanda: return "Amanda"
        case .jb: return "JB"
        }
    }

    var portraitName: String { "fighter_\(rawValue)_portrait" }
    var idleName: String { "fighter_\(rawValue)_idle_00" }

    var accent: SKColor {
        switch self {
        case .matt: return SKColor(red: 0.77, green: 0.20, blue: 0.15, alpha: 1)
        case .simon: return SKColor(red: 0.13, green: 0.27, blue: 0.55, alpha: 1)
        case .rich: return SKColor(red: 0.14, green: 0.43, blue: 0.24, alpha: 1)
        case .amanda: return SKColor(red: 0.46, green: 0.19, blue: 0.59, alpha: 1)
        case .jb: return SKColor(red: 0.77, green: 0.60, blue: 0.14, alpha: 1)
        }
    }
}
