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
            return UltimateMove(name: "Rising Heel Flash", summary: "Rising heel kick flash.", flavor: .flipKick, frameName: frame)
        case .boss(.lucas):
            return UltimateMove(name: "Rapid Palm Barrage", summary: "Rapid-fire palm strikes.", flavor: .rapidFists, frameName: frame)
        case .boss(.chris):
            return UltimateMove(name: "Diving Elbow Drop", summary: "Top-rope style diving elbow.", flavor: .elbowDrop, frameName: frame)
        case .boss(.christiano):
            return UltimateMove(name: "Wheel Kick Spiral", summary: "Spinning wheel-kick spiral.", flavor: .spinningLariat, frameName: frame)
        case .boss(.dakota):
            return UltimateMove(name: "Charge Spear", summary: "Full-sprint spear tackle.", flavor: .spear, frameName: frame)
        case .boss(.johnk):
            return UltimateMove(name: "Power Slam", summary: "Sit-out power slam.", flavor: .powerbomb, frameName: frame)
        case .boss(.casper):
            return UltimateMove(name: "Rank Certificate", summary: "Scroll-and-rank celebration surge.", flavor: .spiritWave, frameName: frame)
        case .boss(.hudson):
            return UltimateMove(name: "Running Clothesline", summary: "Full-sprint clothesline.", flavor: .clothesline, frameName: frame)
        case .boss(.michael):
            return UltimateMove(name: "Sharpshooter Lock", summary: "Figure-four style leg submission homage.", flavor: .figure4, frameName: frame)
        case .boss(.shianne):
            return UltimateMove(name: "Crescent Flash", summary: "Rising crescent kick flash.", flavor: .flipKick, frameName: frame)
        case .boss(.dean):
            return UltimateMove(name: "Calligraphy Kiai", summary: "Gold brush-script kiai burst.", flavor: .tigerUpper, frameName: frame)
        case .boss(.amiyr):
            return UltimateMove(name: "Axe Kick Crash", summary: "Overhead axe-kick crash.", flavor: .dropkick, frameName: frame)
        case .boss(.shaun):
            return UltimateMove(name: "Rising Fist Upper", summary: "Rising uppercut fist.", flavor: .risingDragon, frameName: frame)
        case .boss(.ryan):
            return UltimateMove(name: "Running Knee Strike", summary: "Sprint into a jumping knee.", flavor: .cutter, frameName: frame)
        case .boss(.austin):
            return UltimateMove(
                name: "Tornado Kick Barrage",
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
