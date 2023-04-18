class Task {
    constructor(baseData) {
        this.baseData = baseData
        this.name = baseData.name
        this.level = 0
        this.maxLevel = 0
        this.xp = 0
        this.xpLog = -Infinity
        this.isHero = false
        this.isFinished = false

        this.xpMultipliers = []
    }

    toJSON() {
        return {
            baseData: this.baseData,
            name: this.name,
            level: this.level,
            maxLevel: this.maxLevel,
            xp: this.xp,
            xpLog: this.xpLog,
            isHero: this.isHero,
            isFinished: this.isFinished
        }
    }

    getMaxXp() {
        const maxXp = (this.isHero ? Math.pow(10, this.baseData.heroxp) : 1) * this.baseData.maxXp * (this.level + 1) * Math.pow(this.isHero ? 1.08 : 1.01, this.level)

        if (isNaN(maxXp) || maxXp == Infinity || maxXp > 1e305) {
            this.isFinished = true
        }

        return maxXp
    }

    getMaxXpLog() {
        const maxXp = this.getMaxXp() == Infinity ? 305 : Math.log10(this.getMaxXp());

        if (maxXp < 305)
            return maxXp

        // The scaling on this is real weird, but you've probably already balanced around it.
        // The level cost and scaling jumps up at 305, then the cost drops a bit and the scaling plummets a bit later.
        // Heroic and normal levels scale identically after the drop

        // If you are willing to rebalance, the initial scaling extended would be: 
        //  (this.isHero ? this.baseData.heroxp : 0) + (this.isHero ? 1.08 : 1.01) * this.level + Math.log10(this.baseData.maxXp*(this.level + 1))

        return maxXp + Math.log10(2) * (this.level/120+this.baseData.heroxp/9)
    }

    getXpLeft() {
        return this.getMaxXp() - this.xp
    }

    getMaxLevelMultiplier() {
        return gameData.active_challenge == "dance_with_the_devil" ? (10 / (this.maxLevel + 1)) : 1 + this.maxLevel / 10
    }

    getXpGain() {
        return (this.isHero ? getHeroXpGainMultipliers(this) : 1) * applyMultipliers(10, this.xpMultipliers)
    }

    getXpGainLog() {
        let xpGain = this.isHero ? Math.log10(getHeroXpGainMultipliers(this)) : 0

        this.xpMultipliers.forEach(multiplier => {
            xpGain += Math.log10(multiplier())
        })

        return xpGain
    }

    getXpGainFormatted() {
        if (this.isFinished)
            return logToExponential(this.getXpGainLog())
        return format(this.getXpGain())
    }

    getXpLeftFormatted() {
        if (this.isFinished)
            return logToExponential(subLogs(this.getMaxXpLog(), this.xpLog))
        return format(this.getXpLeft())
    }

    increaseXp() {
        if (this.isFinished) {
            this.xpLog = addLogs(this.xpLog, applySpeedOnLog(this.getXpGainLog()))

            let curCost = -Infinity
            for (let nextCost=this.getMaxXpLog(), iterations = 0;nextCost <= this.xpLog && iterations < 2500; nextCost=addLogs(curCost, this.getMaxXpLog()),iterations++) {
                this.level += 1
                curCost = nextCost
            }
            this.xpLog = subLogs(this.xpLog, curCost)
        } else {
            this.xp += applySpeed(this.getXpGain())

            if (this.xp > 1e275 || isNaN(this.xp) || this.xp == Infinity || this.getXpGain() == Infinity
                || this.getMaxXp() == Infinity || this.getXpLeft() == Infinity) {
                this.isFinished = true
                return
            }

            if (this.xp >= this.getMaxXp()) {
                let excess = this.xp - this.getMaxXp()

                let iterations = 0
                while (excess >= 0) {
                    iterations += 1

                    if (iterations > 2500)
                        excess = -1

                    this.level += 1
                    excess -= this.getMaxXp()
                }
                this.xp = this.getMaxXp() + excess
            }
        }
    }
}

class Milestone {
    constructor(baseData) {
        this.baseData = baseData
        this.name = baseData.name
        this.tier = baseData.tier
        this.expense = baseData.expense
        this.description = baseData.description
    }

    getTier() { return this.tier }
}

class Job extends Task {
    constructor(baseData) {
        super(baseData)
        this.incomeMultipliers = []
    }

    getLevelMultiplier() {
        return 1 + Math.log10(this.level + 1)
    }

    getIncome() {
        const income = (this.isHero ? heroIncomeMult
            * (this.baseData.heroxp > 78 ? 1e6 : 1)
            * (this.baseData.heroxp > 130 ? 1e5 : 1)
            : 1) * applyMultipliers(this.baseData.income, this.incomeMultipliers) * getChallengeBonus("rich_and_the_poor")

        return gameData.active_challenge == "rich_and_the_poor" ? Math.pow(income, 0.35) : income
    }
}

class Skill extends Task {
    constructor(baseData) {
        super(baseData)
    }

    getEffect() {
        var effect = 1 + this.baseData.effect * (this.isHero ? 1000 * this.level + 8000 : this.level)
        return effect
    }

    getEffectDescription() {
        return "x" + format(this.getEffect(), 2) + " " + this.baseData.description
    }
}

class Item {
    constructor(baseData) {
        this.baseData = baseData
        this.name = baseData.name
        this.expenseMultipliers = []
        this.isHero = false
    }

    getEffect() {
        let effect = this.baseData.effect

        if (this.isHero) {
            if (itemCategories["Misc"].includes(this.name))
            {
                if (gameData.currentMisc.includes(this)) {
                    effect *= 10
                    if (this.name == "Universe Fragment" || this.name == "Multiverse Fragment")
                        effect *= 100000
                }
            }

            if (itemCategories["Properties"].includes(this.name)) {
                if (gameData.currentProperty == this)
                    effect = this.baseData.heroeffect
                else
                    effect = 1
            }
        } else {
            if (gameData.currentProperty != this && !gameData.currentMisc.includes(this)) return 1
        }

        return effect
    }

    getEffectDescription() {
        let description = this.baseData.description
        let effect = this.baseData.effect

        if (this.isHero) {
            if (itemCategories["Misc"].includes(this.name)) {
                effect *= 10
                if (this.name == "Universe Fragment" || this.name == "Multiverse Fragment")
                    effect *= 100000
            }

            if (itemCategories["Properties"].includes(this.name)) {
                description = "Happiness"
                effect = this.baseData.heroeffect
            }
        }
        else {
            if (itemCategories["Properties"].includes(this.name)) description = "Happiness"
        }

        return "x" + format(effect) + " " + description
    }

    getExpense(heroic) {
        if (heroic === undefined)
            heroic = this.isHero
        return (heroic ? 4 * Math.pow(10, this.baseData.heromult) * heroIncomeMult : 1)
            * applyMultipliers(this.baseData.expense, this.expenseMultipliers)
    }
}

class Requirement {
    constructor(querySelectors, requirements) {
        this.querySelectors = querySelectors
        this.elements = []
        this.requirements = requirements
        this.completed = false
    }

    queryElements() {
        this.querySelectors.forEach(querySelector => {
            this.elements.push(...document.querySelectorAll(querySelector))
        })
    }

    isCompleted() {
        if (this.completed) return true
        for (const requirement of this.requirements) {
            if (!this.getCondition(false, requirement)) {
                return false
            }
        }
        this.completed = true
        return true
    }

    isCompletedActual(isHero = false) {
        for (const requirement of this.requirements) {
            if (!this.getCondition(isHero, requirement)) {
                return false
            }
        }
        return true
    }
}

class TaskRequirement extends Requirement {
    constructor(querySelectors, requirements) {
        super(querySelectors, requirements)
        this.type = "task"
    }

    getCondition(isHero, requirement) {
        if (isHero && requirement.herequirement != null)
            return gameData.taskData[requirement.task].level >= requirement.herequirement
        else if (gameData.taskData[requirement.task].isHero && requirement.isHero)
            return true
        else
            return gameData.taskData[requirement.task].level >= requirement.requirement
    }
}

class CoinRequirement extends Requirement {
    constructor(querySelectors, requirements) {
        super(querySelectors, requirements)
        this.type = "coins"
    }

    getCondition(isHero, requirement) {
        return gameData.coins >= requirement.requirement
    }
}

class AgeRequirement extends Requirement {
    constructor(querySelectors, requirements) {
        super(querySelectors, requirements)
        this.type = "age"
    }

    getCondition(isHero, requirement) {
        return daysToYears(gameData.days) >= requirement.requirement
    }
}

class EvilRequirement extends Requirement {
    constructor(querySelectors, requirements) {
        super(querySelectors, requirements)
        this.type = "evil"
    }

    getCondition(isHero, requirement) {
        return gameData.evil >= requirement.requirement
    }
}

class EssenceRequirement extends Requirement {
    constructor(querySelectors, requirements) {
        super(querySelectors, requirements)
        this.type = "essence"
    }

    getCondition(isHero, requirement) {
        return gameData.essence >= requirement.requirement
    }
}

class DarkMatterRequirement extends Requirement {
    constructor(querySelectors, requirements) {
        super(querySelectors, requirements)
        this.type = "darkMatter"
    }

    getCondition(isHero, requirement) {
        return gameData.dark_matter >= requirement.requirement
    }
}

class DarkOrbsRequirement extends Requirement {
    constructor(querySelectors, requirements) {
        super(querySelectors, requirements)
        this.type = "darkOrb"
    }

    getCondition(isHero, requirement) {
        return gameData.dark_orbs >= requirement.requirement
    }
}