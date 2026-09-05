import SpriteKit

enum AttackKind {
    case punch
    case kick

    var damage: CGFloat { self == .punch ? 8 : 14 }
    var range: CGFloat { self == .punch ? 78 : 102 }
    var duration: TimeInterval { self == .punch ? 0.28 : 0.40 }
    var activeStart: TimeInterval { self == .punch ? 0.07 : 0.12 }
    var activeEnd: TimeInterval { self == .punch ? 0.18 : 0.26 }
}

final class FighterActor: SKNode {
    let fighter: PlayableFighter
    let isPlayer: Bool
    let maxHP: CGFloat = 100

    private(set) var hp: CGFloat = 100
    var facing: CGFloat = 1
    var vx: CGFloat = 0
    var vy: CGFloat = 0
    var onGround = true
    private(set) var isAttacking = false
    private(set) var isHit = false
    private(set) var isKO = false
    private(set) var isUltimate = false
    private(set) var activeAttack: AttackKind?
    private(set) var ultimateMeter: CGFloat = 0

    private let body: SKSpriteNode
    private let strike: SKSpriteNode
    private var attackElapsed: TimeInterval = 0
    private var hitElapsed: TimeInterval = 0
    private var ultimateElapsed: TimeInterval = 0
    private var didConnect = false
    private var ultimateDidConnect = false
    private let idleTexture: SKTexture?
    private let targetHeight: CGFloat

    private let moveSpeed: CGFloat = 280
    private let jumpVelocity: CGFloat = 920
    private let gravity: CGFloat = -2600

    init(fighter: PlayableFighter, isPlayer: Bool, height: CGFloat) {
        self.fighter = fighter
        self.isPlayer = isPlayer
        self.body = Art.idle(fighter, height: height)
        self.idleTexture = self.body.texture
        self.targetHeight = height
        self.strike = SKSpriteNode(color: .white, size: CGSize(width: 28, height: 18))
        super.init()
        name = isPlayer ? "player" : "cpu"
        addChild(body)
        strike.alpha = 0
        strike.zPosition = 2
        addChild(strike)
        body.anchorPoint = CGPoint(x: 0.5, y: 0)
        body.position = .zero
    }

    @available(*, unavailable)
    required init?(coder aDecoder: NSCoder) { fatalError("init(coder:) has not been implemented") }

    var bodyHeight: CGFloat { body.size.height }

    func faceToward(_ x: CGFloat) {
        guard !isAttacking, !isUltimate, !isHit, !isKO else { return }
        facing = x >= position.x ? 1 : -1
        xScale = facing
    }

    func setWalk(left: Bool, right: Bool) {
        guard !isAttacking, !isUltimate, !isHit, !isKO else {
            if onGround { vx = 0 }
            return
        }
        if left == right {
            vx = 0
        } else if left {
            vx = -moveSpeed
            facing = -1
            xScale = -1
        } else {
            vx = moveSpeed
            facing = 1
            xScale = 1
        }
    }

    func jump() {
        guard onGround, !isHit, !isKO, !isUltimate else { return }
        vy = jumpVelocity
        onGround = false
    }

    @discardableResult
    func startAttack(_ kind: AttackKind) -> Bool {
        guard !isAttacking, !isUltimate, !isHit, !isKO, onGround else { return false }
        isAttacking = true
        activeAttack = kind
        attackElapsed = 0
        didConnect = false
        vx = 0
        let lift: CGFloat = kind == .punch ? 8 : -4
        body.run(.sequence([
            .moveBy(x: 10, y: lift, duration: kind.activeStart),
            .wait(forDuration: kind.activeEnd - kind.activeStart),
            .moveTo(x: 0, duration: 0.08)
        ]))
        return true
    }

    func applyHit(damage: CGFloat, fromX: CGFloat) {
        guard !isKO else { return }
        hp = max(0, hp - damage)
        isHit = true
        hitElapsed = 0
        isAttacking = false
        isUltimate = false
        activeAttack = nil
        strike.alpha = 0
        body.removeAllActions()
        restoreIdlePose()
        let dir: CGFloat = position.x >= fromX ? 1 : -1
        vx = 220 * dir
        vy = 240
        onGround = false
        body.run(.sequence([
            .colorize(with: .white, colorBlendFactor: 0.7, duration: 0.04),
            .colorize(withColorBlendFactor: 0, duration: 0.12)
        ]))
        if hp <= 0 {
            isKO = true
            run(.rotate(toAngle: dir * 1.2, duration: 0.35))
        }
    }

    func attackHitbox() -> CGRect? {
        guard isAttacking, let kind = activeAttack, !didConnect else { return nil }
        guard attackElapsed >= kind.activeStart, attackElapsed <= kind.activeEnd else { return nil }
        let w = kind.range
        let h: CGFloat = kind == .kick ? 36 : 28
        let originX = facing > 0 ? position.x + 10 : position.x - 10 - w
        return CGRect(x: originX, y: position.y + bodyHeight * 0.45, width: w, height: h)
    }

    func markConnected() {
        didConnect = true
        chargeMeter()
    }

    var isMeterFull: Bool { ultimateMeter >= 1 }

    func chargeMeter() {
        guard !isKO else { return }
        ultimateMeter = min(1, ultimateMeter + UltimateMove.chargePerHit)
    }

    @discardableResult
    func startUltimate(toward opponentX: CGFloat) -> Bool {
        guard isMeterFull, !isAttacking, !isUltimate, !isHit, !isKO, onGround else { return false }
        ultimateMeter = 0
        isUltimate = true
        ultimateElapsed = 0
        ultimateDidConnect = false
        vx = 0
        let close = min(96, abs(opponentX - position.x) * 0.55) * (opponentX >= position.x ? 1 : -1)
        playUltimateMotion(fighter.ultimate, closeX: close)
        return true
    }

    var ultimateShouldConnect: Bool {
        isUltimate && !ultimateDidConnect && ultimateElapsed >= 0.28 && ultimateElapsed <= 0.62
    }

    func markUltimateConnected() {
        ultimateDidConnect = true
    }

    private func playUltimateMotion(_ move: UltimateMove, closeX: CGFloat) {
        body.removeAllActions()
        if let extra = Art.texture(named: move.frameName) {
            body.texture = extra
            Art.scaleToHeight(body, targetHeight)
        } else {
            body.colorBlendFactor = 0.45
            body.color = fighter.accent
        }

        let restore = SKAction.run { [weak self] in self?.finishUltimate() }
        let f = facing
        let action: SKAction
        switch move.flavor {
        case .tornadoKick:
            // Locked: Chun-Li–style spinning kick barrage (stylized homage).
            action = .sequence([
                .group([
                    .repeat(.rotate(byAngle: .pi * 2, duration: 0.16), count: 5),
                    .sequence([
                        .moveBy(x: closeX * 0.4, y: 36, duration: 0.12),
                        .moveBy(x: closeX * 0.6, y: -8, duration: 0.55)
                    ])
                ]),
                restore
            ])
        case .figure4:
            // Locked: Ric Flair–style figure-4 leglock submission.
            action = .sequence([
                .moveBy(x: closeX, y: 8, duration: 0.16),
                .group([
                    .rotate(toAngle: 1.15, duration: 0.18),
                    .scaleY(to: 0.72, duration: 0.18)
                ]),
                .wait(forDuration: 0.45),
                restore
            ])
        case .risingDragon:
            action = .sequence([
                .group([
                    .moveBy(x: closeX * 0.35, y: 96, duration: 0.22),
                    .rotate(byAngle: f * 0.55, duration: 0.22)
                ]),
                .moveBy(x: 0, y: -76, duration: 0.32),
                restore
            ])
        case .tigerUpper:
            action = .sequence([
                .moveBy(x: closeX * 0.15, y: 12, duration: 0.08),
                .group([
                    .moveBy(x: closeX * 0.4, y: 80, duration: 0.2),
                    .rotate(byAngle: f * -0.7, duration: 0.2)
                ]),
                .moveBy(x: 0, y: -70, duration: 0.28),
                restore
            ])
        case .spiritWave:
            action = .sequence([
                .moveBy(x: closeX * 0.15, y: 0, duration: 0.1),
                .scaleX(to: 1.28, duration: 0.1),
                .moveBy(x: closeX, y: 0, duration: 0.28),
                restore
            ])
        case .commandSlam:
            action = .sequence([
                .moveBy(x: closeX, y: 16, duration: 0.14),
                .group([.moveBy(x: 0, y: 44, duration: 0.16), .rotate(byAngle: .pi * 0.7, duration: 0.16)]),
                .moveBy(x: 0, y: -48, duration: 0.16),
                restore
            ])
        case .suplex:
            action = .sequence([
                .moveBy(x: closeX * 0.85, y: 10, duration: 0.12),
                .group([.moveBy(x: -closeX * 0.2, y: 56, duration: 0.2), .rotate(byAngle: .pi, duration: 0.2)]),
                .moveBy(x: 0, y: -52, duration: 0.14),
                restore
            ])
        case .powerbomb:
            action = .sequence([
                .moveBy(x: closeX, y: 24, duration: 0.12),
                .group([.moveBy(x: 0, y: 62, duration: 0.16), .rotate(byAngle: .pi * 1.15, duration: 0.16)]),
                .moveBy(x: 0, y: -70, duration: 0.12),
                restore
            ])
        case .piledriver:
            action = .sequence([
                .moveBy(x: closeX * 0.7, y: 8, duration: 0.1),
                .group([.moveBy(x: 0, y: 40, duration: 0.14), .rotate(toAngle: .pi, duration: 0.14)]),
                .moveBy(x: 0, y: -46, duration: 0.12),
                .rotate(toAngle: 0, duration: 0.12),
                restore
            ])
        case .flipKick:
            action = .sequence([
                .group([
                    .rotate(byAngle: f * -.pi * 2, duration: 0.42),
                    .sequence([.moveBy(x: closeX * 0.5, y: 74, duration: 0.18), .moveBy(x: closeX * 0.5, y: -58, duration: 0.26)])
                ]),
                restore
            ])
        case .moonsault:
            action = .sequence([
                .moveBy(x: 0, y: 88, duration: 0.16),
                .group([
                    .rotate(byAngle: f * .pi * 2, duration: 0.36),
                    .moveBy(x: closeX * 0.7, y: -80, duration: 0.36)
                ]),
                restore
            ])
        case .rana:
            action = .sequence([
                .moveBy(x: closeX * 0.6, y: 28, duration: 0.12),
                .group([
                    .rotate(byAngle: f * .pi * 1.4, duration: 0.28),
                    .moveBy(x: closeX * 0.3, y: 36, duration: 0.14)
                ]),
                .moveBy(x: 0, y: -52, duration: 0.16),
                restore
            ])
        case .clothesline:
            action = .sequence([
                .group([
                    .moveBy(x: closeX * 1.15, y: 8, duration: 0.26),
                    .rotate(byAngle: f * 0.45, duration: 0.26)
                ]),
                restore
            ])
        case .spinningLariat:
            action = .sequence([
                .group([
                    .moveBy(x: closeX * 0.9, y: 0, duration: 0.4),
                    .repeat(.rotate(byAngle: .pi * 2, duration: 0.2), count: 2)
                ]),
                restore
            ])
        case .spear:
            action = .sequence([
                .moveBy(x: -closeX * 0.15, y: 0, duration: 0.08),
                .group([
                    .moveBy(x: closeX * 1.3, y: 12, duration: 0.18),
                    .rotate(byAngle: f * 0.85, duration: 0.18)
                ]),
                .moveBy(x: 0, y: -10, duration: 0.12),
                restore
            ])
        case .dashThrough:
            action = .sequence([
                .fadeAlpha(to: 0.25, duration: 0.08),
                .moveBy(x: closeX * 1.5, y: 0, duration: 0.14),
                .fadeAlpha(to: 1, duration: 0.08),
                .wait(forDuration: 0.28),
                restore
            ])
        case .teleport:
            action = .sequence([
                .fadeAlpha(to: 0, duration: 0.08),
                .moveBy(x: closeX * 1.6, y: 18, duration: 0.02),
                .fadeAlpha(to: 1, duration: 0.1),
                .rotate(byAngle: f * 0.6, duration: 0.16),
                .wait(forDuration: 0.22),
                restore
            ])
        case .rapidFists:
            action = .sequence([
                .moveBy(x: closeX * 0.45, y: 0, duration: 0.1),
                .repeat(.sequence([.moveBy(x: 12, y: 6, duration: 0.045), .moveBy(x: -12, y: -6, duration: 0.045)]), count: 7),
                restore
            ])
        case .dropkick:
            action = .sequence([
                .moveBy(x: closeX * 0.35, y: 64, duration: 0.14),
                .rotate(byAngle: f * 1.35, duration: 0.1),
                .moveBy(x: closeX * 0.55, y: -58, duration: 0.16),
                restore
            ])
        case .elbowDrop:
            action = .sequence([
                .moveBy(x: closeX * 0.25, y: 86, duration: 0.18),
                .rotate(byAngle: f * 0.25, duration: 0.08),
                .moveBy(x: closeX * 0.35, y: -82, duration: 0.14),
                restore
            ])
        case .cutter:
            action = .sequence([
                .moveBy(x: closeX * 0.5, y: 48, duration: 0.14),
                .rotate(byAngle: f * -1.5, duration: 0.12),
                .moveBy(x: closeX * 0.25, y: -44, duration: 0.14),
                restore
            ])
        }
        body.run(action, withKey: "ultimate")
    }

    private func finishUltimate() {
        isUltimate = false
        strike.alpha = 0
        restoreIdlePose()
    }

    private func restoreIdlePose() {
        body.removeAction(forKey: "ultimate")
        body.zRotation = 0
        body.xScale = 1
        body.yScale = 1
        body.alpha = 1
        body.position = .zero
        body.colorBlendFactor = 0
        if let idleTexture {
            body.texture = idleTexture
        }
        Art.scaleToHeight(body, targetHeight)
    }

    func update(dt: CGFloat, groundY: CGFloat, minX: CGFloat, maxX: CGFloat) {
        if isUltimate {
            ultimateElapsed += dt
            strike.alpha = ultimateShouldConnect ? 0.95 : 0
            strike.color = fighter.accent
            strike.size = CGSize(width: 50, height: 40)
            strike.position = CGPoint(x: 36, y: bodyHeight * 0.45)
            if ultimateElapsed >= 0.95 {
                finishUltimate()
            }
        }

        if isAttacking {
            attackElapsed += dt
            if let kind = activeAttack {
                let active = attackElapsed >= kind.activeStart && attackElapsed <= kind.activeEnd
                strike.alpha = active ? 0.85 : 0
                strike.position = CGPoint(x: kind.range * 0.35, y: bodyHeight * (kind == .kick ? 0.38 : 0.62))
                strike.size = CGSize(width: kind == .kick ? 34 : 22, height: kind == .kick ? 16 : 14)
                strike.color = kind == .kick ? SKColor(red: 1, green: 0.85, blue: 0.3, alpha: 1) : .white
                if attackElapsed >= kind.duration {
                    isAttacking = false
                    activeAttack = nil
                    strike.alpha = 0
                    body.position = .zero
                }
            }
        }

        if isHit {
            hitElapsed += dt
            if hitElapsed > 0.28 { isHit = false }
        }

        if !onGround || vy != 0 {
            vy += gravity * CGFloat(dt)
        }
        position.x += vx * CGFloat(dt)
        position.y += vy * CGFloat(dt)

        if position.y <= groundY {
            position.y = groundY
            vy = 0
            onGround = true
            if isKO {
                vx = 0
            }
        } else {
            onGround = false
        }

        position.x = min(max(position.x, minX), maxX)
    }

    func resetRound(at point: CGPoint, facingRight: Bool) {
        removeAllActions()
        zRotation = 0
        hp = maxHP
        isKO = false
        isHit = false
        isAttacking = false
        isUltimate = false
        activeAttack = nil
        ultimateMeter = 0
        ultimateDidConnect = false
        vx = 0
        vy = 0
        onGround = true
        position = point
        facing = facingRight ? 1 : -1
        xScale = facing
        restoreIdlePose()
        strike.alpha = 0
    }
}
