import Foundation

/// Stage identity. Known arcade stages are statics; later NN landmarks / generics
/// can be `StageID(rawValue:)` plus a `StageConfig.catalog` row — no exhaustive switch.
struct StageID: Hashable {
    let rawValue: String

    static let lionsBridge = StageID(rawValue: "lionsBridge")
    static let hiltonElementary = StageID(rawValue: "hiltonElementary")
    static let axsomDojo = StageID(rawValue: "axsomDojo")
    static let oysterpoint = StageID(rawValue: "oysterpoint")
    static let phmall = StageID(rawValue: "phmall")
    static let shipyard = StageID(rawValue: "shipyard")
    static let hiltonvillage = StageID(rawValue: "hiltonvillage")
}

/// Table-driven stage row. Asset names are `\(assetPrefix)_master` / `_sky` / `_far` / `_mid` / `_near`.
struct StageConfig {
    let id: StageID
    let displayName: String
    let assetPrefix: String
    let number: Int
    let mood: String?
    let wired: Bool

    var masterName: String { "\(assetPrefix)_master" }
    var skyName: String { "\(assetPrefix)_sky" }
    var farName: String { "\(assetPrefix)_far" }
    var midName: String { "\(assetPrefix)_mid" }
    var nearName: String { "\(assetPrefix)_near" }

    var hudCaption: String {
        if let mood {
            return "STAGE \(number)  ·  \(displayName.uppercased())  ·  MOOD \(mood)"
        }
        return "STAGE \(number)  ·  \(displayName.uppercased())"
    }

    /// Append a row for the next landmark. Do not assume only three stages.
    static let catalog: [StageConfig] = [
        StageConfig(id: .lionsBridge, displayName: "Lions Bridge", assetPrefix: "stage1", number: 1, mood: "B", wired: true),
        StageConfig(id: .hiltonElementary, displayName: "Hilton Elementary School", assetPrefix: "stage2", number: 2, mood: "B", wired: true),
        StageConfig(id: .axsomDojo, displayName: "Axsom Martial Arts Dojo", assetPrefix: "stage3", number: 3, mood: "B", wired: true),
        // Extra NN landmarks (Batch A) — art parked; not on arcade ladder yet.
        StageConfig(id: .oysterpoint, displayName: "Oyster Point", assetPrefix: "stage_oysterpoint", number: 4, mood: nil, wired: true),
        StageConfig(id: .phmall, displayName: "Patrick Henry Mall", assetPrefix: "stage_phmall", number: 5, mood: nil, wired: true),
        StageConfig(id: .shipyard, displayName: "Newport News Shipyard", assetPrefix: "stage_shipyard", number: 6, mood: nil, wired: true),
        StageConfig(id: .hiltonvillage, displayName: "Hilton Village", assetPrefix: "stage_hiltonvillage", number: 7, mood: nil, wired: true),
    ]

    static func config(for id: StageID) -> StageConfig {
        if let row = catalog.first(where: { $0.id == id }) { return row }
        return StageConfig(
            id: id,
            displayName: id.rawValue,
            assetPrefix: "stage_\(id.rawValue)",
            number: catalog.count + 1,
            mood: nil,
            wired: false
        )
    }

    static let lionsBridge = config(for: .lionsBridge)
    static let hiltonElementary = config(for: .hiltonElementary)
    static let axsomDojo = config(for: .axsomDojo)
}
