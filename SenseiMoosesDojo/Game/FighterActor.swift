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
    let id: FighterID
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
    private(set) var activeAttack: AttackKind?

    private let body: SKSpriteNode
    private let strike: SKSpriteNode
    private var attackElapsed: TimeInterval = 0
    private var hitElapsed: TimeInterval = 0
    private var didConnect = false

    private let moveSpeed: CGFloat = 280
    private let jumpVelocity: CGFloat = 920
    private let gravity: CGFloat = -2600

    init(id: FighterID, isPlayer: Bool, height: CGFloat) {
        self.id = id
        self.isPlayer = isPlayer
        self.body = Art.fighterIdle(id, height: height)
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
        guard !isAttacking, !isHit, !isKO else { return }
        facing = x >= position.x ? 1 : -1
        xScale = facing
    }

    func setWalk(left: Bool, right: Bool) {
        guard !isAttacking, !isHit, !isKO else {
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
        guard onGround, !isHit, !isKO else { return }
        vy = jumpVelocity
        onGround = false
    }

    @discardableResult
    func startAttack(_ kind: AttackKind) -> Bool {
        guard !isAttacking, !isHit, !isKO, onGround else { return false }
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
        activeAttack = nil
        strike.alpha = 0
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
    }

    func update(dt: CGFloat, groundY: CGFloat, minX: CGFloat, maxX: CGFloat) {
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
        activeAttack = nil
        vx = 0
        vy = 0
        onGround = true
        position = point
        facing = facingRight ? 1 : -1
        xScale = facing
        body.position = .zero
        strike.alpha = 0
    }
}
