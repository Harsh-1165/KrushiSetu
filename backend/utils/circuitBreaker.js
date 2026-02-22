/**
 * Circuit Breaker
 * Prevents retry storms when an external API (e.g. Agmarknet) is failing.
 * After N consecutive failures the breaker opens and rejects calls for a cooldown period.
 *
 * Usage:
 *   const cb = new CircuitBreaker({ name: 'agmarknet', threshold: 5, cooldownMs: 5 * 60 * 1000 })
 *   const result = await cb.call(() => axios.get(url))
 */

const logger = require('./logger')

class CircuitBreaker {
    /**
     * @param {object} options
     * @param {string}  options.name         - Human-readable name for logging
     * @param {number}  options.threshold    - Consecutive failures before opening (default 5)
     * @param {number}  options.cooldownMs   - Open duration in ms (default 300_000 = 5 min)
     */
    constructor({ name = 'unknown', threshold = 5, cooldownMs = 5 * 60 * 1000 } = {}) {
        this.name = name
        this.threshold = threshold
        this.cooldownMs = cooldownMs

        this.failures = 0
        this.state = 'closed'      // closed | open | half-open
        this.openedAt = null
        this.lastError = null
    }

    /** @returns {'closed'|'open'|'half-open'} */
    getState() {
        if (this.state === 'open') {
            const elapsed = Date.now() - this.openedAt
            if (elapsed >= this.cooldownMs) {
                this.state = 'half-open'
                logger.info(`[CircuitBreaker:${this.name}] Entering HALF-OPEN state (cooldown elapsed)`)
            }
        }
        return this.state
    }

    /**
     * Execute fn through the circuit breaker.
     * @param {() => Promise<any>} fn
     * @returns {Promise<any>}
     * @throws {Error} if the circuit is open
     */
    async call(fn) {
        const state = this.getState()

        if (state === 'open') {
            const secondsLeft = Math.ceil((this.cooldownMs - (Date.now() - this.openedAt)) / 1000)
            const err = new Error(
                `[CircuitBreaker:${this.name}] Circuit OPEN — external API blocked for ${secondsLeft}s. Last error: ${this.lastError?.message}`
            )
            err.isCircuitOpen = true
            throw err
        }

        try {
            const result = await fn()
            this._onSuccess()
            return result
        } catch (err) {
            this._onFailure(err)
            throw err
        }
    }

    _onSuccess() {
        if (this.state === 'half-open') {
            logger.info(`[CircuitBreaker:${this.name}] Request succeeded in HALF-OPEN — resetting to CLOSED`)
        }
        this.failures = 0
        this.state = 'closed'
        this.openedAt = null
        this.lastError = null
    }

    _onFailure(err) {
        this.failures++
        this.lastError = err

        if (this.failures >= this.threshold) {
            this.state = 'open'
            this.openedAt = Date.now()
            logger.error(
                `[CircuitBreaker:${this.name}] OPENED after ${this.failures} consecutive failures. ` +
                `Cooldown: ${this.cooldownMs / 1000}s. Last error: ${err.message}`
            )
        } else {
            logger.warn(
                `[CircuitBreaker:${this.name}] Failure ${this.failures}/${this.threshold}: ${err.message}`
            )
        }
    }

    /** Status snapshot for the /health endpoint */
    status() {
        return {
            name: this.name,
            state: this.getState(),
            failures: this.failures,
            threshold: this.threshold,
            openedAt: this.openedAt ? new Date(this.openedAt).toISOString() : null,
            cooldownMs: this.cooldownMs,
            lastError: this.lastError?.message || null,
        }
    }
}

module.exports = { CircuitBreaker }
