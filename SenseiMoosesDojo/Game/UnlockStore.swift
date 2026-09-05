import Foundation

/// Persist unlocks for "defeat a boss → playable on Select".
/// Local `UserDefaults` for v0; Game Center achievement sync optional later.
enum UnlockStore {
    private static let defaultsKey = "dojo.unlockedBossIDs"

    /// Starters are always available on Character Select.
    static var starters: [FighterID] { FighterID.allCases }

    static func unlockedBossIDs() -> Set<String> {
        let raw = UserDefaults.standard.stringArray(forKey: defaultsKey) ?? []
        return Set(raw)
    }

    static func isUnlocked(_ boss: BossID) -> Bool {
        unlockedBossIDs().contains(boss.rawValue)
    }

    /// Call when the player clears that instructor in arcade / ladder.
    static func unlock(_ boss: BossID) {
        var set = unlockedBossIDs()
        guard set.insert(boss.rawValue).inserted else { return }
        UserDefaults.standard.set(Array(set).sorted(), forKey: defaultsKey)
    }

    /// Select filter: starters first, then unlocked bosses (art-ready batch first).
    static func selectRoster() -> (starters: [FighterID], unlockedBosses: [BossID]) {
        let unlocked = (BossID.batch1 + BossID.batch2 + BossID.batch3).filter { isUnlocked($0) }
            + ([BossID.senseiMoose] as [BossID]).filter { isUnlocked($0) }
        return (starters, unlocked)
    }

#if DEBUG
    static func debugResetUnlocks() {
        UserDefaults.standard.removeObject(forKey: defaultsKey)
    }
#endif
}
