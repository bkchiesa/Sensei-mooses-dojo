import SpriteKit
import UIKit

final class GameViewController: UIViewController {
    /// Shared design size: iPhone landscape. Scenes scale with `.aspectFill`.
    static let designSize = CGSize(width: 1334, height: 750)

    override func loadView() {
        view = SKView(frame: UIScreen.main.bounds)
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        guard let skView = view as? SKView else { return }
        skView.ignoresSiblingOrder = true
        skView.isMultipleTouchEnabled = true
        skView.preferredFramesPerSecond = 60

        let scene = TitleScene(size: Self.designSize)
        scene.scaleMode = .aspectFill
        skView.presentScene(scene)
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        LeaderboardService.shared.authenticate(from: self)
    }

    override var supportedInterfaceOrientations: UIInterfaceOrientationMask { .landscape }
    override var prefersStatusBarHidden: Bool { true }
    override var prefersHomeIndicatorAutoHidden: Bool { true }
    override var shouldAutorotate: Bool { true }
}
