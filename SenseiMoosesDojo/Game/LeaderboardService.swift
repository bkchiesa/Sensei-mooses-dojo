import Foundation
import GameKit
import UIKit

enum LeaderboardConfig {
    /// Placeholder until an App Store Connect leaderboard exists. Do not submit this build.
    static let gameCenterID = "com.sensiemoose.dojo.top10"
    static let maxRows = 10
}

struct LeaderboardRow: Codable, Equatable {
    var rank: Int
    var name: String
    var score: Int
    var date: Date
}

enum LeaderboardSource: String {
    case gameCenter = "Game Center"
    case local = "This Device"
}

/// Game Center first; UserDefaults JSON always works so the prototype can demo offline.
final class LeaderboardService {
    static let shared = LeaderboardService()

    private let scoresKey = "smd.localTop10"
    private let nameKey = "smd.displayName"
    private var didInstallAuthHandler = false

    private(set) var isGameCenterReady = false

    var lastDisplayName: String {
        get { UserDefaults.standard.string(forKey: nameKey) ?? "" }
        set { UserDefaults.standard.set(newValue, forKey: nameKey) }
    }

    func authenticate(from presenter: UIViewController?) {
        guard !didInstallAuthHandler else { return }
        didInstallAuthHandler = true
        GKLocalPlayer.local.authenticateHandler = { [weak presenter] viewController, error in
            if let viewController, let presenter, presenter.presentedViewController == nil {
                presenter.present(viewController, animated: true)
            }
            self.isGameCenterReady = GKLocalPlayer.local.isAuthenticated && error == nil
        }
    }

    func submit(name: String, score: Int, completion: @escaping (LeaderboardSource) -> Void) {
        let trimmed = String(name.trimmingCharacters(in: .whitespacesAndNewlines).prefix(16))
        let display = trimmed.isEmpty ? "Sensei" : trimmed
        lastDisplayName = display
        saveLocal(name: display, score: score)

        guard isGameCenterReady else {
            completion(.local)
            return
        }

        GKLeaderboard.submitScore(
            score,
            context: 0,
            player: GKLocalPlayer.local,
            leaderboardIDs: [LeaderboardConfig.gameCenterID]
        ) { error in
            DispatchQueue.main.async {
                completion(error == nil ? .gameCenter : .local)
            }
        }
    }

    /// Prefer Game Center when it returns rows; otherwise the local Top 10.
    func loadTop10(completion: @escaping ([LeaderboardRow], LeaderboardSource) -> Void) {
        let local = ranked(loadLocalRaw())
        guard isGameCenterReady else {
            completion(local, .local)
            return
        }

        GKLeaderboard.loadLeaderboards(IDs: [LeaderboardConfig.gameCenterID]) { boards, error in
            guard error == nil, let board = boards?.first else {
                DispatchQueue.main.async { completion(local, .local) }
                return
            }
            board.loadEntries(
                for: .global,
                timeScope: .allTime,
                range: NSRange(location: 1, length: LeaderboardConfig.maxRows)
            ) { _, entries, _, loadError in
                DispatchQueue.main.async {
                    let remote: [LeaderboardRow] = (entries ?? []).map { entry in
                        LeaderboardRow(
                            rank: entry.rank,
                            name: entry.player.displayName,
                            score: Int(entry.score),
                            date: Date()
                        )
                    }
                    if remote.isEmpty || loadError != nil {
                        completion(local, .local)
                    } else {
                        completion(remote, .gameCenter)
                    }
                }
            }
        }
    }

    private func loadLocalRaw() -> [LeaderboardRow] {
        guard let data = UserDefaults.standard.data(forKey: scoresKey) else { return [] }
        return (try? JSONDecoder().decode([LeaderboardRow].self, from: data)) ?? []
    }

    private func saveLocal(name: String, score: Int) {
        var rows = loadLocalRaw()
        rows.append(LeaderboardRow(rank: 0, name: name, score: score, date: Date()))
        rows.sort { lhs, rhs in
            if lhs.score != rhs.score { return lhs.score > rhs.score }
            return lhs.date < rhs.date
        }
        if rows.count > LeaderboardConfig.maxRows {
            rows = Array(rows.prefix(LeaderboardConfig.maxRows))
        }
        if let data = try? JSONEncoder().encode(ranked(rows)) {
            UserDefaults.standard.set(data, forKey: scoresKey)
        }
    }

    private func ranked(_ rows: [LeaderboardRow]) -> [LeaderboardRow] {
        rows.enumerated().map { index, row in
            var copy = row
            copy.rank = index + 1
            return copy
        }
    }
}

enum NamePrompt {
    static func present(
        from scene: SKScene,
        score: Int,
        onSubmit: @escaping (String) -> Void,
        onCancel: (() -> Void)? = nil
    ) {
        guard let presenter = scene.view?.window?.rootViewController else {
            onSubmit(LeaderboardService.shared.lastDisplayName)
            return
        }
        let alert = UIAlertController(
            title: "Submit Score",
            message: "Score \(score). Name for the Top 10:",
            preferredStyle: .alert
        )
        alert.addTextField { field in
            field.placeholder = "Display name"
            field.text = LeaderboardService.shared.lastDisplayName
            field.autocapitalizationType = .words
            field.returnKeyType = .done
        }
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in onCancel?() })
        alert.addAction(UIAlertAction(title: "Submit", style: .default) { _ in
            onSubmit(alert.textFields?.first?.text ?? "")
        })
        presenter.present(alert, animated: true)
    }
}
