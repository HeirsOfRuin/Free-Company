"""
The Company — numbers-only kill-gate prototype.

No UI, no art, no HTML. This runs the season loop as pure arithmetic across
several naive fixed strategies and many random seeds, to answer one
question before any code for the real game gets written:

    Are the seasonal decisions interesting, or does one strategy dominate?

Silk Road's own post-mortem caught its stacking bug this way (a full
simulation run finding 174 consecutive disaster-free journeys) — automated
runs catch degenerate math that human playtesting won't notice until it's
already boring. This is that check, run before instead of after.
"""

import random
import statistics
from dataclasses import dataclass, field

SEASONS_PER_YEAR = 4
YEARS = 10
TOTAL_SEASONS = SEASONS_PER_YEAR * YEARS
WINTER = 3  # season index 3 of each year = winter

FACTIONS = ["Florence", "Milan", "Papal States", "Pisa", "Padua"]

WIN_TREASURY = 11000
WIN_REPUTATION = 60
MUTINY_LOYALTY_FLOOR = 0
MUTINY_TREASURY_STRIKES = 2
MUTINY_LOYALTY_CEILING_FOR_STRIKES = 30

# Recruitment: replacing losses costs money and has friction (you cannot
# instantly refill a company after a bad season) and a ceiling (there are
# only so many idle men-at-arms on the road looking for a captain).
STARTING_LANCES = 200.0
MAX_LANCES = STARTING_LANCES * 1.5
RECRUIT_COST_PER_LANCE = 13.0
RECRUIT_RATE_CAP = 20.0  # max lances recruited in a single season
RECRUIT_TREASURY_BUFFER = 800.0  # don't recruit into next season's wage money

# Dread fades on its own — fear of a company that hasn't been seen in a
# while cools, the way it doesn't for trustworthiness earned or spent
# deliberately. Without this, occasional raiding is a one-way ratchet
# toward "everyone leagues against you" with no way back.
DREAD_DECAY = 0.95

# ---------------------------------------------------------------------------
# Company investments — one-time permanent purchases that compete with
# recruitment and with the win-condition treasury threshold for the same
# florins. None of these generate income directly (except winter quarters'
# garrison fee); they reduce losses. The balance question is therefore not
# "do they eat the economy" but "are they mandatory, or are they decoration" —
# which is what the ablation runner at the bottom measures.
INVESTMENTS = {
    "baggage":   {"cost": 1200, "name": "Baggage train"},
    "paymaster": {"cost": 1000, "name": "Paymaster"},
    "forge":     {"cost": 1500, "name": "Armourer's forge"},
    "surgeon":   {"cost": 900,  "name": "Surgeon"},
    "herald":    {"cost": 800,  "name": "Herald"},
    "quarters":  {"cost": 2000, "name": "Winter quarters"},
}
# Buying leaves this much in hand — never invest into next season's wages.
INVEST_TREASURY_BUFFER = 2500.0

FORGE_QUALITY_STEP = 0.02
FORGE_QUALITY_CAP = 0.10

# Difficulty tiers. Each must be *measured* to differ, not merely described —
# a sibling build shipped three tiers where two played identically because the
# table was missing the flags the copy implied.
DIFFICULTY = {
    "condottiere": {"pay": 1.15, "risk": 0.85, "coalition": 0.75, "name": "Condottiere"},
    "captain":     {"pay": 1.00, "risk": 1.00, "coalition": 1.00, "name": "Captain"},
    "adventurer":  {"pay": 0.88, "risk": 1.20, "coalition": 1.35, "name": "Adventurer"},
}


@dataclass
class Company:
    treasury: float = 2000.0
    lances: float = STARTING_LANCES
    quality: float = 0.5
    loyalty: float = 70.0
    dread: float = 0.0
    honor: float = 50.0
    reputation: dict = field(default_factory=lambda: {f: 0.0 for f in FACTIONS})
    under_contract_with: str = None
    contract_seasons_left: int = 0
    negative_treasury_strikes: int = 0
    alive: bool = True
    outcome: str = None  # "won", "mutiny", "coalition", "survived"
    seasons_survived: int = 0
    investments: set = field(default_factory=set)
    difficulty: str = "captain"
    # Income attribution, for the share-of-total composition assertion.
    income_by_source: dict = field(default_factory=lambda: {
        "contract": 0.0, "plunder": 0.0, "composizione": 0.0, "garrison": 0.0})


def has(company, inv):
    return inv in company.investments


def diff_of(company):
    return DIFFICULTY[company.difficulty]


def upkeep_cost_per_lance(company):
    return 3.0 + 4.0 * company.quality


def casualty_scale(company):
    """Single place casualties get modified. Baggage train reduces attrition."""
    return 0.85 if has(company, "baggage") else 1.0


def reputation_scale(company):
    """Single place reputation *gains* get modified. A herald carries word."""
    return 1.30 if has(company, "herald") else 1.0


def buy_investments(company):
    """End-of-season: buy the cheapest affordable investment not yet owned.
    A naive policy on purpose — the question under test is whether owning
    them matters at all, not whether a clever buy order is optimal."""
    spare = company.treasury - INVEST_TREASURY_BUFFER
    if spare <= 0:
        return
    options = [(v["cost"], k) for k, v in INVESTMENTS.items()
               if k not in company.investments and v["cost"] <= spare]
    if not options:
        return
    cost, key = min(options)
    company.investments.add(key)
    company.treasury -= cost


def apply_forge(company):
    """Armourer's forge raises quality slowly, to a cap."""
    if not has(company, "forge"):
        return
    ceiling = 0.5 + FORGE_QUALITY_CAP
    if company.quality < ceiling:
        company.quality = min(ceiling, company.quality + FORGE_QUALITY_STEP)


def available_offers(company, rng):
    """Return list of (faction, pay_per_lance, risk) offers this season."""
    offers = []
    for f in FACTIONS:
        if rng.random() < 0.55:  # not every faction is at war/hiring every season
            continue
        rep = company.reputation[f]
        base_rate = rng.uniform(6.0, 10.0)
        d = diff_of(company)
        pay_per_lance = base_rate * (1 + rep / 200.0) * (1 + company.dread / 300.0) * d["pay"]
        pay_per_lance = max(pay_per_lance, 1.0)
        risk = rng.uniform(0.03, 0.09) * d["risk"]
        offers.append((f, pay_per_lance, risk))
    return offers


def best_contract_offer(company, rng):
    """Return (faction, pay_per_lance, risk) for the best available contract, or None."""
    offers = available_offers(company, rng)
    if not offers:
        return None
    return max(offers, key=lambda o: o[1])


def preferred_faction_offer(company, rng, preferred):
    """Return the preferred faction's offer if it's hiring this season, else
    the best of whatever else is available. Models sticking with one
    employer to build the reputation the win condition actually needs,
    rather than chasing whoever pays best each season."""
    offers = available_offers(company, rng)
    if not offers:
        return None
    for o in offers:
        if o[0] == preferred:
            return o
    return max(offers, key=lambda o: o[1])


def weakest_raid_target(company, rng):
    """Composizione target: a faction not currently your employer."""
    candidates = [f for f in FACTIONS if f != company.under_contract_with]
    return rng.choice(candidates)


def resolve_contract_season(company, faction, pay_per_lance, risk, rng):
    pay = pay_per_lance * company.lances
    # combat outcome
    roll = rng.random()
    win_chance = 0.4 + 0.4 * company.quality
    if roll < win_chance:
        plunder = pay * rng.uniform(0.2, 0.6)
        casualties = risk * company.lances * rng.uniform(0.3, 0.8) * casualty_scale(company)
        company.reputation[faction] = min(
            100, company.reputation[faction] + rng.uniform(5, 12) * reputation_scale(company))
        for enemy in FACTIONS:
            if enemy != faction:
                company.reputation[enemy] -= rng.uniform(0, 3)
        company.honor = min(100, company.honor + 2)
        income = pay + plunder
        heavy_loss = False
    else:
        plunder = 0
        casualties = risk * company.lances * rng.uniform(1.0, 2.2) * casualty_scale(company)
        company.reputation[faction] -= rng.uniform(3, 8)
        income = pay * 0.5  # partial pay on a bad campaign
        heavy_loss = casualties > 0.10 * company.lances

    # A surgeon returns a share of the wounded to the ranks.
    if has(company, "surgeon"):
        casualties *= 0.75

    company.lances = max(0, company.lances - casualties)
    company.treasury += income
    company.income_by_source["contract"] += min(income, pay)
    company.income_by_source["plunder"] += plunder
    return income, casualties, heavy_loss


def resolve_raid_season(company, target, rng):
    # Composizione was often more lucrative than a condotta in the short
    # term — that's the whole reason Great Companies did it. The cost is
    # reputational, not immediate: this needs to at least clear the wage
    # bill or "raid" is never a real alternative to "contract," just a
    # worse version of it.
    take = rng.uniform(500, 1400) * (1 + company.lances / 400.0)
    company.treasury += take
    company.income_by_source["composizione"] += take
    company.dread = min(100, company.dread + rng.uniform(10, 18))
    company.honor = max(0, company.honor - rng.uniform(6, 14))
    company.reputation[target] = max(-100, company.reputation[target] - rng.uniform(40, 70))
    for f in FACTIONS:
        if f != target:
            company.reputation[f] -= rng.uniform(2, 6)
    # small chance of local militia resistance
    if rng.random() < 0.15:
        casualties = rng.uniform(0.02, 0.06) * company.lances * casualty_scale(company)
        company.lances = max(0, company.lances - casualties)
        return take, casualties, False
    return take, 0, False


def pay_wages(company):
    bill = company.lances * upkeep_cost_per_lance(company)
    if company.treasury >= bill:
        company.treasury -= bill
        company.negative_treasury_strikes = 0
        return True
    else:
        company.treasury -= bill  # goes negative
        company.negative_treasury_strikes += 1
        return False


def recruit(company):
    """End-of-season maintenance: buy back losses if there's spare money.
    Capped rate and ceiling — recruitment has friction, not instant refill."""
    if company.lances >= MAX_LANCES:
        return
    spare = company.treasury - RECRUIT_TREASURY_BUFFER
    if spare <= 0:
        return
    affordable = spare / RECRUIT_COST_PER_LANCE
    room = MAX_LANCES - company.lances
    recruited = max(0.0, min(RECRUIT_RATE_CAP, affordable, room))
    company.lances += recruited
    company.treasury -= recruited * RECRUIT_COST_PER_LANCE


def update_loyalty(company, paid, heavy_loss, got_plunder):
    if paid and got_plunder:
        company.loyalty = min(100, company.loyalty + 5)
    elif paid:
        company.loyalty = min(100, company.loyalty + 1)
    else:
        # A paymaster can explain a late wage in a way a captain cannot.
        hit = 8 if has(company, "paymaster") else 15
        company.loyalty = max(0, company.loyalty - hit)
    if heavy_loss and not got_plunder:
        company.loyalty = max(0, company.loyalty - 5)


def check_coalition(company, rng):
    # Chance factions league against you, scaled by dread high / honor low.
    threat = max(0.0, (company.dread - 50) / 50.0) * max(0.0, (40 - company.honor) / 40.0)
    if threat <= 0:
        return False
    chance = (0.03 + 0.20 * threat) * diff_of(company)["coalition"]
    if rng.random() < chance:
        # Can your strength survive a coalition? Bigger, better companies sometimes do.
        survive_chance = min(0.6, company.lances / 600.0 + company.quality * 0.2)
        if rng.random() > survive_chance:
            return True
        else:
            # survived a coalition attempt: heavy losses, dread drops (word gets out you can be hurt)
            company.lances *= rng.uniform(0.5, 0.75)
            company.dread = max(0, company.dread - 20)
    return False


def check_win(company, season):
    if season < 20:
        return False
    if company.treasury >= WIN_TREASURY:
        for f in FACTIONS:
            if company.reputation[f] >= WIN_REPUTATION:
                return True
    return False


def run_strategy(strategy_name, rng, verbose=False, difficulty="captain",
                 allow_investments=True):
    c = Company(difficulty=difficulty)
    preferred = rng.choice(FACTIONS) if strategy_name == "loyal_to_one" else None
    for season in range(TOTAL_SEASONS):
        is_winter = (season % SEASONS_PER_YEAR) == WINTER
        income = 0
        casualties = 0
        heavy_loss = False
        got_plunder = False

        if is_winter:
            offer = None
        elif strategy_name == "loyal_to_one":
            offer = preferred_faction_offer(c, rng, preferred)
        else:
            offer = best_contract_offer(c, rng)
        action = decide(strategy_name, c, offer, is_winter)

        if action == "contract" and offer:
            faction, pay_per_lance, risk = offer
            c.under_contract_with = faction
            income, casualties, heavy_loss = resolve_contract_season(c, faction, pay_per_lance, risk, rng)
            got_plunder = income > pay_per_lance * c.lances if c.lances > 0 else False
        elif action == "raid":
            target = weakest_raid_target(c, rng)
            income, casualties, heavy_loss = resolve_raid_season(c, target, rng)
            got_plunder = True
            c.under_contract_with = None
        else:  # rest / winter
            c.under_contract_with = None
            # Proper winter quarters make a rest season worth more.
            c.loyalty = min(100, c.loyalty + (12 if has(c, "quarters") else 8))
            c.dread = max(0, c.dread - 3)
            # small garrison income
            income = rng.uniform(20, 80) * (3.0 if has(c, "quarters") else 1.0)
            c.treasury += income
            c.income_by_source["garrison"] += income

        # reputation, dread and loyalty naturally fade a little each season
        for f in FACTIONS:
            c.reputation[f] *= 0.98  # slow fade toward neutral
        c.dread *= DREAD_DECAY

        paid = pay_wages(c)
        update_loyalty(c, paid, heavy_loss, got_plunder)
        recruit(c)
        if allow_investments:
            buy_investments(c)
            apply_forge(c)

        c.seasons_survived = season + 1

        # failure checks
        if c.loyalty <= MUTINY_LOYALTY_FLOOR:
            c.alive = False
            c.outcome = "mutiny"
            break
        if (c.negative_treasury_strikes >= MUTINY_TREASURY_STRIKES
                and c.loyalty < MUTINY_LOYALTY_CEILING_FOR_STRIKES):
            c.alive = False
            c.outcome = "mutiny"
            break
        if check_coalition(c, rng):
            c.alive = False
            c.outcome = "coalition"
            break
        if check_win(c, season):
            c.alive = False
            c.outcome = "won"
            break

    if c.outcome is None:
        c.outcome = "survived"

    return c


def decide(strategy_name, company, offer, is_winter):
    """Naive fixed policies — no lookahead, no adaptivity. That's the point:
    if a naive policy dominates, the loop has no real decisions in it."""
    if is_winter:
        return "rest"

    if strategy_name == "always_contract":
        return "contract" if offer else "rest"

    if strategy_name == "always_raid":
        return "raid"

    if strategy_name == "opportunist":
        if offer and offer[1] * company.lances > 400:
            return "contract"
        return "raid"

    if strategy_name == "cautious":
        # Distinct from always_contract: turns down marginal work to
        # preserve strength, and never raids under any circumstance.
        if offer and offer[1] * company.lances > 600:
            return "contract"
        return "rest"

    if strategy_name == "loyal_to_one":
        # Always take what the preferred employer offers (even if it's not
        # this season's best rate); never raid the faction you're building
        # trust with, or anyone else — the whole bet is on being trusted
        # enough for a permanent commission, not on maximizing every season.
        return "contract" if offer else "rest"

    if strategy_name == "reputation_manager":
        if company.dread > 55:
            return "contract" if offer else "rest"
        if offer and offer[1] * company.lances > 300:
            return "contract"
        if company.loyalty < 40 or company.treasury < 300:
            return "raid"
        return "rest" if not offer else "contract"

    raise ValueError(strategy_name)


def summarize(strategy_name, runs):
    outcomes = [r.outcome for r in runs]
    n = len(runs)
    counts = {o: outcomes.count(o) for o in ("won", "mutiny", "coalition", "survived")}
    avg_seasons = statistics.mean(r.seasons_survived for r in runs)
    ending_treasury = [r.treasury for r in runs if r.outcome == "survived"]
    print(f"\n=== {strategy_name} ({n} runs) ===")
    for outcome in ("won", "mutiny", "coalition", "survived"):
        pct = 100 * counts[outcome] / n
        print(f"  {outcome:10s}: {counts[outcome]:4d}  ({pct:5.1f}%)")
    print(f"  avg seasons survived: {avg_seasons:.1f} / {TOTAL_SEASONS}")
    if ending_treasury:
        print(f"  avg ending treasury (survived, no win/loss by season {TOTAL_SEASONS}): "
              f"{statistics.mean(ending_treasury):.0f}")


STRATEGIES = ["always_contract", "always_raid", "opportunist", "cautious",
              "reputation_manager", "loyal_to_one"]


def win_rate(runs):
    return 100.0 * sum(1 for r in runs if r.outcome == "won") / len(runs)


def survival_rate(runs):
    return 100.0 * sum(1 for r in runs if r.outcome in ("won", "survived")) / len(runs)


def assert_progress(runs, label):
    """A harness that simulates progress must assert progress happened.
    A verdict-only check cannot tell you it tested nothing — in a sibling
    build a 'full campaign' suite sat at turn 1 for every run and every
    downstream assertion was comparing two games that were never played."""
    stalled = [r for r in runs if r.seasons_survived == 0]
    assert not stalled, f"{label}: {len(stalled)} runs never advanced a single season"
    avg = statistics.mean(r.seasons_survived for r in runs)
    print(f"  progress check: all {len(runs)} runs advanced, mean {avg:.1f} seasons")


def income_shares(runs):
    """Share-of-total per income source. Asserting *share* rather than
    magnitude is what survives a rebalance and still catches one subsystem
    quietly becoming the whole economy."""
    totals = {k: 0.0 for k in ("contract", "plunder", "composizione", "garrison")}
    for r in runs:
        for k, v in r.income_by_source.items():
            totals[k] += v
    grand = sum(totals.values()) or 1.0
    return {k: 100.0 * v / grand for k, v in totals.items()}


def run_set(strategy, n_runs, difficulty="captain", allow_investments=True, seed0=0):
    return [run_strategy(strategy, random.Random(seed0 + s), difficulty=difficulty,
                         allow_investments=allow_investments)
            for s in range(n_runs)]


def main():
    n_runs = 500

    print("=" * 68)
    print("BASELINE — six strategies, 500 runs each, Captain difficulty")
    print("=" * 68)
    baseline = {}
    for strat in STRATEGIES:
        runs = run_set(strat, n_runs)
        baseline[strat] = runs
        summarize(strat, runs)
        assert_progress(runs, strat)

    print("\n" + "=" * 68)
    print("INCOME COMPOSITION — share of all florins earned, by source")
    print("=" * 68)
    for strat in ("always_contract", "opportunist", "loyal_to_one"):
        sh = income_shares(baseline[strat])
        line = "  ".join(f"{k}={v:5.1f}%" for k, v in sh.items())
        print(f"  {strat:20s} {line}")
        # No single source should be the entire economy for a mixed strategy.
        if strat == "opportunist":
            assert sh["composizione"] < 90.0, "composizione has eaten the economy"
            assert sh["contract"] > 5.0, "contract pay has become irrelevant"

    print("\n" + "=" * 68)
    print("ABLATION — investments on vs off (does owning them matter?)")
    print("=" * 68)
    print(f"  {'strategy':20s} {'win% on':>8s} {'win% off':>9s} "
          f"{'surv% on':>9s} {'surv% off':>10s}")
    for strat in STRATEGIES:
        on = baseline[strat]
        off = run_set(strat, n_runs, allow_investments=False)
        print(f"  {strat:20s} {win_rate(on):7.1f}% {win_rate(off):8.1f}% "
              f"{survival_rate(on):8.1f}% {survival_rate(off):9.1f}%")

    print("\n" + "=" * 68)
    print("DIFFICULTY — measured, not asserted. Tiers must actually differ.")
    print("=" * 68)
    print(f"  {'tier':14s} {'win%':>7s} {'surv%':>7s} {'mutiny%':>8s} {'coalition%':>11s}")
    for tier in ("condottiere", "captain", "adventurer"):
        runs = run_set("opportunist", n_runs, difficulty=tier)
        mut = 100.0 * sum(1 for r in runs if r.outcome == "mutiny") / len(runs)
        coa = 100.0 * sum(1 for r in runs if r.outcome == "coalition") / len(runs)
        print(f"  {DIFFICULTY[tier]['name']:14s} {win_rate(runs):6.1f}% "
              f"{survival_rate(runs):6.1f}% {mut:7.1f}% {coa:10.1f}%")


if __name__ == "__main__":
    main()
