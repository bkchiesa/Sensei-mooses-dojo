import SpriteKit

/// How the placeholder ultimate anim moves. Pixel `ult_<id>_00` swaps in when present.
enum UltimateFlavor: String {
    case risingDragon
    case spiritWave
    case commandSlam
    case flipKick
    case clothesline
    case dashThrough
    case rapidFists
    case spinningLariat
    case dropkick
    case suplex
    case powerbomb
    case rana
    case elbowDrop
    case spear
    case moonsault
    case tigerUpper
    case teleport
    case piledriver
    case cutter
    case tornadoKick
    case figure4
}

struct UltimateMove {
    let name: String
    let summary: String
    let flavor: UltimateFlavor
    let frameName: String

    /// 30% of the defender's max HP.
    static let damageFraction: CGFloat = 0.30

    /// Landed hits to fill the meter (in the 4–8 range).
    static let hitsToFill: CGFloat = 6

    static var chargePerHit: CGFloat { 1 / hitsToFill }

    static func move(for fighter: PlayableFighter) -> UltimateMove {
        let frame = "ult_\(fighter.assetKey)_00"
        switch fighter {
        case .starter(.matt):
            return UltimateMove(name: "Rising Fang", summary: "Leap uppercut homage to a classic dragon-punch.", flavor: .risingDragon, frameName: frame)
        case .starter(.simon):
            return UltimateMove(name: "Spirit Wave", summary: "Palm-fired energy lunge, fireball-style homage.", flavor: .spiritWave, frameName: frame)
        case .starter(.rich):
            return UltimateMove(name: "Grove Lock", summary: "Command grab into a body slam.", flavor: .commandSlam, frameName: frame)
        case .starter(.amanda):
            return UltimateMove(name: "Violet Flash", summary: "Back-flip kick that climbs the opponent.", flavor: .flipKick, frameName: frame)
        case .starter(.jb):
            return UltimateMove(name: "Gold Rush", summary: "Full-sprint clothesline.", flavor: .clothesline, frameName: frame)
        case .boss(.misty):
            return UltimateMove(name: "Pink Mist Dive", summary: "Dash-through afterimage cross.", flavor: .dashThrough, frameName: frame)
        case .boss(.lucas):
            return UltimateMove(name: "Blue Barrage", summary: "Rapid-fire fist storm.", flavor: .rapidFists, frameName: frame)
        case .boss(.chris):
            return UltimateMove(name: "Redwood Lariat", summary: "Spinning clothesline sweep.", flavor: .spinningLariat, frameName: frame)
        case .boss(.christiano):
            return UltimateMove(name: "Emerald Spear", summary: "Flying dropkick through the midsection.", flavor: .dropkick, frameName: frame)
        case .boss(.dakota):
            return UltimateMove(name: "Prairie Suplex", summary: "Waist-lock snap suplex.", flavor: .suplex, frameName: frame)
        case .boss(.johnk):
            return UltimateMove(name: "K-Bomb", summary: "Sit-out powerbomb.", flavor: .powerbomb, frameName: frame)
        case .boss(.finley):
            return UltimateMove(name: "Clover Rana", summary: "Headscissors takeover flip.", flavor: .rana, frameName: frame)
        case .boss(.hudson):
            return UltimateMove(name: "Timber Elbow", summary: "Top-rope style elbow drop.", flavor: .elbowDrop, frameName: frame)
        case .boss(.michael):
            return UltimateMove(name: "Tide Spear", summary: "Football-style tackle spear.", flavor: .spear, frameName: frame)
        case .boss(.kasey):
            return UltimateMove(name: "Rose Moonsault", summary: "Backflip splash.", flavor: .moonsault, frameName: frame)
        case .boss(.jaylen):
            return UltimateMove(name: "Cyan Fang", summary: "Tiger-uppercut homage.", flavor: .tigerUpper, frameName: frame)
        case .boss(.amiyr):
            return UltimateMove(name: "Void Step", summary: "Blink strike behind the opponent.", flavor: .teleport, frameName: frame)
        case .boss(.shaun):
            return UltimateMove(name: "Iron Driver", summary: "Piledriver homage.", flavor: .piledriver, frameName: frame)
        case .boss(.ryan):
            return UltimateMove(name: "Red Cutter", summary: "Jumping ace-cutter homage.", flavor: .cutter, frameName: frame)
        case .boss(.austin):
            return UltimateMove(
                name: "Tornado Kick",
                summary: "Spinning kick barrage — Chun-Li–style homage (no licensed name/VFX).",
                flavor: .tornadoKick,
                frameName: frame
            )
        case .boss(.senseiMoose):
            return UltimateMove(
                name: "Figure-Four Lock",
                summary: "Ric Flair–style figure-4 leglock submission finisher (stylized homage).",
                flavor: .figure4,
                frameName: frame
            )
        }
    }
}

extension PlayableFighter {
    var assetKey: String {
        switch self {
        case .starter(let id): return id.rawValue
        case .boss(let id): return id.rawValue
        }
    }

    var ultimate: UltimateMove { UltimateMove.move(for: self) }
}
