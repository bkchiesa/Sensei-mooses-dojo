import Foundation

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
    /// Reserved — unlock when cleared (same rule as batch 1 unless Brandon changes it).
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
        case .austin: return "Austin"
        case .senseiMoose: return "Sensei Moose"
        }
    }

    /// Pixel finals use `boss_<id>_portrait` / `boss_<id>_idle_00`.
    var portraitName: String { "boss_\(rawValue)_portrait" }
    var idleName: String { "boss_\(rawValue)_idle_00" }

    /// Bosses with parked art on this PR (batch 1).
    static var batch1: [BossID] { [.misty, .lucas, .chris, .christiano, .dakota] }
    static var batch2: [BossID] { [.johnk, .finley, .hudson, .michael, .kasey] }
}
