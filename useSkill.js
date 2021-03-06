/**
 * Causes an actor to perform a skill on the given target if valid.
 *
 * The skill must be one the actor possesses, and it must be ready to be used.
 *
 * @param object actor  The actor performing the skill.
 * @param object skill  The skill being performed.
 * @param object target The target to attack or the attackStats of the attack to react to.
 *
 * @return boolean True if the skill was used.
 */
function useSkill(actor, skill, target, attackStats) {
    if (!skill) return false;
    var actionIndex = actor.actions.indexOf(skill);
    // Only process actions when called with a target.
    if (!target && actionIndex >= 0) return false;
    var reactionIndex = actor.reactions.indexOf(skill);
    // Only process reactions when called with attack data.
    if (!attackStats && reactionIndex >= 0) return false;
    if (actionIndex < 0 && reactionIndex < 0) return false;
    if (skill.readyAt > actor.time) return false;
    var skillDefinition = skillDefinitions[skill.base.type];
    if (!skillDefinition) {
        console.log("Attempted to use skill " + skill.base.type + " with no definition.");
        console.log(skill);
        skill.readyAt = actor.time + 1000;
        return false;
    }
    // Healing attack adds a new healing basic attack and deactivates normal basic attack.
    if (skill.tags['basic'] && actor.healingAttacks) {
        return false;
    }
    if (target && ifdefor(skill.base.targetDeadUnits) && !target.isDead) {
        // Skills that target dead units can only be used on targets that are dying.
        return false;
    } else if (target && !ifdefor(skill.base.targetDeadUnits) && target.isDead) {
        // Normal skills may not target dying units.
        return false;
    }
    for (var i = 0; i < ifdefor(skill.base.restrictions, []).length; i++) {
        if (!actor.tags[skill.base.restrictions[i]]) {
            return false;
        }
    }
    var isNova = skill.tags['nova']; // AOE centered on player (freeze)
    var isField = skill.tags['field']; // AOE with duration centered on player (thunderstorm)
    var isBlast = skill.tags['blast']; // AOE centered on target (plague, dispell, drain life)
    var isRain = skill.tags['rain']; // Projectiles fall from the sky at targets (meteor)
    var isSpell = skill.tags['spell'];
    var isAOE = skill.cleave || isNova || isField || isBlast || isRain;
    if (actor.cannotAttack && actionIndex >= 0 && skill.tags['attack']) {
        return false;
    }
    // Action skills have targets and won't activate if that target is out of range or not of the correct type.
    if (actionIndex >= 0) {
        // Nova skills use area instead of range for checking for valid targets.
        if (isNova) {
            // Use half of the nova range since novas deal reduced damage the further
            // targets are. It would be cool if the player could configure the
            // trigger distance for these abilities. Maybe each abilities could
            // have a configuration specific to it.
            if (getDistance(actor, target) > skill.area * 32 / 2) {
                return false;
            }
        } else if (isField){
            if (getDistance(actor, target) > skill.area * 32) {
                return false;
            }
        } else if (getDistance(actor, target) > (skill.range + ifdefor(skill.teleport, 0)) * 32) {
            return false;
        }
        if (ifdefor(skill.base.target) === 'self' && actor !== target) {
            return false;
        }
        if (ifdefor(skill.base.target) === 'otherAllies' && (actor === target || actor.allies.indexOf(target) < 0)) {
            return false;
        }
        if (ifdefor(skill.base.target) === 'allies' && actor.allies.indexOf(target) < 0) {
            return false;
        }
        if (ifdefor(skill.base.target, 'enemies') === 'enemies' && actor.enemies.indexOf(target) < 0) {
            return false;
        }
        // Let's be careful about using any ability that can't be used more than once every 10 seconds.
        // For enemies, ignore this code if they are targeting the main character since hitting the main character is
        // always sufficient reason to use their most powerful abilities.
        if (!target.isMainCharacter && ifdefor(skill.cooldown, 0) >= 10 && ifdefor(skill.base.target, 'enemies') === 'enemies') {
            var health = 0;
            if (isAOE) {
                var targetsInRange = getEnemiesLikelyToBeHitIfEnemyIsTargetedBySkill(actor, skill, target);
                if (targetsInRange.length === 0) {
                    return false;
                }
                targetsInRange.forEach(function (target) {
                    health += target.health;
                })
                // scale health by number of targets for aoe attacks.
                health *= targetsInRange.length;
            } else {
                health = target.health;
            }
            var previewAttackStats = isSpell ? createSpellStats(actor, skill, target) : createAttackStats(actor, skill, target);
            // Any life gained by this attack should be considered in the calculation as well in favor of using the attack.
            var possibleLifeGain = (previewAttackStats.damage + previewAttackStats.magicDamage) * ifdefor(skill.lifeSteal, 0);
            var actualLifeGain = actorCanOverHeal(actor) ? possibleLifeGain : Math.min(actor.maxHealth - actor.health, possibleLifeGain);
            // console.log([ifdefor(skill.lifeSteal, 0), possibleLifeGain, actualLifeGain]);
            // Make sure the total health of the target/combined targets is at least
            // the damage output of the attack.
            // console.log([health, 4 * actualLifeGain, '<', (attackStats.damage + attackStats.magicDamage), 2 * possibleLifeGain]);
            // console.log(skill.base.name + ' ' + health + ' < ' + (attackStats.damage + attackStats.magicDamage) + 2 * possibleLifeGain);
            // We weight wasted life gain very high to avoid using life stealing moves when the user has full life,
            // and then weight actual life gained even higher to encourage using life stealing moves that will restore a lot of health.
            if (health + 8 * actualLifeGain < (previewAttackStats.damage + previewAttackStats.magicDamage) + 5 * possibleLifeGain) {
                return false;
            }
        }
    }
    if (!skillDefinition.isValid(actor, skill, target || attackStats)) {
        return false;
    }
    if (target && ifdefor(skill.base.consumeCorpse) && target.isDead) {
        removeActor(target);
    }
    // Only use skill if they meet the RNG for using it. This is currently only used by the
    // 15% chance to raise dead on unit, which is why it comes after consuming the corpse.
    if (ifdefor(skill.chance, 1) < Math.random()) {
        return false;
    }

    skill.readyAt = actor.time + ifdefor(skill.cooldown, 0);
    // Show the name of the skill used if it isn't a basic attack. When skills have distinct
    // visible animations, we should probably remove this.
    if (!skill.tags['basic']) {
        var hitText = {x: actor.x + 32, y: actor.top, color: 'white', font: "15px sans-serif"};
        hitText.value = skill.base.name;
        actor.character.textPopups.push(hitText);
    }
    // Run shared code for using any action, which does not contain logic specific
    // for an actor using a skill they possess.
    skillDefinition.use(actor, skill, target || attackStats);
    // Apply instant cooldown if it is set.
    if (skill.instantCooldown) {
        // * is wild card meaning all other skills
        for(var otherSkill of ifdefor(actor.actions, [])) {
            if ((skill !== otherSkill && skill.instantCooldown === '*') || otherSkill.tags[skill.instantCooldown]) {
                otherSkill.readyAt = actor.time;
            }
        }
        for(var otherSkill of ifdefor(actor.reactions, [])) {
            if ((skill !== otherSkill && skill.instantCooldown === '*') || otherSkill.tags[skill.instantCooldown]) {
                otherSkill.readyAt = actor.time;
            }
        }
    }
    if (skill.tags.spell && actor.castKnockBack) {
        for (var enemy of getActorsInRange(actor, actor.castKnockBack, actor.enemies)) {
            banishTarget(actor, enemy, actor.castKnockBack, 30);
        }
    }
    if (skill.tags.spell && actor.healOnCast) {
        actor.health += actor.maxHealth * actor.healOnCast;
    }

    actor.lastAction = skill;
    if (target) actor.target = target;
    // Every time a skill is used, we push it to the back of possible choices. That
    // way if multiple abilities are always available (such as with 100% CDR),
    // the actor will cycle through them instead of using the first one in the list
    // constantly.
    if (actionIndex >= 0) {
        actor.actions.splice(actionIndex, 1);
        actor.actions.push(skill);
    }
    if (reactionIndex >= 0) {
        actor.reactions.splice(reactionIndex, 1);
        actor.reactions.push(skill);
    }
    return true;
}

function getEnemiesLikelyToBeHitIfEnemyIsTargetedBySkill(actor, skill, skillTarget) {
    var targets = [];
    // Rain targets everything on the field.
    if (skill.tags['rain']) {
        return actor.enemies.slice();
    }
    for (var i = 0; i < actor.enemies.length; i++) {
        var target = actor.enemies[i];
        if (skill.tags['nova'] || skill.tags['field']) {
            if (getDistance(actor, target) < skill.area * 32) {
                targets.push(target);
                continue;
            }
        } else if (skill.area) {
            if (getDistance(skillTarget, target) < skill.area * 32) {
                targets.push(target);
                continue;
            }
        }
    }
    return targets;
}
function getActorsInRange(source, range, targets) {
    var targetsInRange = [];
    for (var target of targets) {
        if (target !== source && getDistance(source, target) < range* 32) {
            targetsInRange.push(target);
        }
    }
    return targetsInRange;
}

function closestEnemyDistance(actor) {
    var distance = 2000;
    for (var enemy of actor.enemies) {
        distance = Math.min(distance, getDistance(actor, enemy));
    }
    return distance;
}

/**
 * Hash of skill methods that causes an actor to perform a skill on the given target.
 *
 * No logic about whether the actor can use this skill is included. This can
 * be used when an actor mimics a target and uses a skill they don't possess,
 * or when a pet is ordered to use a skill they cannot otherwise or when a skill
 * is performed even though its cooldown is not available, such as commanding
 * a pet to attack when the "Sick 'em" ability is used.
 *
 * The methods each have the following signature:
 * @param object actor  The actor performing the skill.
 * @param object skill  The skill being performed.
 * @param object target The target to consider using the skill on.
 * @return void
 */
var skillDefinitions = {};

skillDefinitions.attack = {
    isValid: function (actor, attackSkill, target) {
        return !target.cloaked;
    },
    use: function (actor, attackSkill, target) {
        performAttack(actor, attackSkill, target);
    }
};

skillDefinitions.spell = {
    isValid: function (actor, spellSkill, target) {
        return !target.cloaked;
    },
    use: function (actor, spellSkill, target) {
        castSpell(actor, spellSkill, target);
    }
};

skillDefinitions.consume = {
    isValid: function (actor, consumeSkill, target) {
        return true;
    },
    use: function (actor, consumeSkill, target) {
        actor.health += target.maxHealth * ifdefor(consumeSkill.consumeRatio, 1);
        stealAffixes(actor, target, consumeSkill);
    }
};
skillDefinitions.song = {
    isValid: function (actor, songSkill, target) {
        return closestEnemyDistance(actor) < 500;
    },
    use: function (actor, songSkill, target) {
        var attackStats = createSpellStats(actor, songSkill, target);
        actor.attackCooldown = actor.time + .2;
        actor.moveCooldown = actor.time + .2;
        actor.attackFrame = 0;
        performAttackProper(attackStats, target);
        return attackStats;
    }
};
skillDefinitions.heroSong = {
    isValid: function (actor, songSkill, target) {
        var healthValues = target.healthValues;
        // healthValues might not be set right when a target spawns.
        if (!healthValues || target.isMainCharacter) {
            return false;
        }
        // Use ability if target is low on life.
        //console.log(target.health / target.maxHealth);
        if (target.health / target.maxHealth <= 1 / 3) {
            return true;
        }
        // Use ability if target is losing remaining life rapidly.
        var maxHealth = Math.max.apply(null, healthValues);
        //console.log(healthValues[0] + ' / ' + target.maxHealth);
        if (healthValues[0] / maxHealth <= .6) {
            ///console.log(healthValues);
            return true;
        }
        return false;
    },
    use: function (actor, songSkill, target) {
        var attackStats = createSpellStats(actor, songSkill, target);
        actor.attackCooldown = actor.time + .2;
        actor.moveCooldown = actor.time + .2;
        actor.attackFrame = 0;
        performAttackProper(attackStats, target);
        return attackStats;
    }
};

skillDefinitions.revive = {
    isValid: function (actor, reviveSkill, attackStats) {
        if (attackStats.evaded) return false;
        // Cast revive only when the incoming hit would kill the character.
        return actor.health - ifdefor(attackStats.totalDamage, 0) <= 0;
    },
    use: function (actor, reviveSkill, attackStats) {
        attackStats.stopped = true;
        actor.health = reviveSkill.power;
        actor.percentHealth = actor.health / actor.maxHealth;
        actor.stunned = actor.time + .3;
        if (reviveSkill.buff) {
            addTimedEffect(actor, reviveSkill.buff);
        }
    }
};

skillDefinitions.stop = {
    isValid: function (actor, stopSkill, attackStats) {
        if (attackStats.evaded) return false;
        // Cast stop only when the incoming hit would deal more than half of the
        // character's remaining health in damage.
        return ifdefor(attackStats.totalDamage, 0) >= actor.health / 2;
    },
    use: function (actor, stopSkill, attackStats) {
        attackStats.stopped = true;
        actor.stunned = actor.time + .3;
        actor.character.timeStopEffect = {'actor': actor, 'endAt': actor.time + stopSkill.duration}
    }
};

skillDefinitions.minion = {
    isValid: function (actor, minionSkill, target) {
        var count = 0;
        // Cannot raise corpses of uncontrollable enemies as minions.
        if (minionSkill.base.consumeCorpse && (target.uncontrollable || target.stationary)) {
            return false;
        }
        actor.allies.forEach(function (ally) {
            if (ally.skillSource == minionSkill) count++;
        });
        return count < minionSkill.limit;
    },
    use: function (actor, minionSkill, target) {
        actor.pull = {'x': actor.x - actor.direction * 64, 'time': actor.time + .3, 'damage': 0};
        var newMonster;
        if (minionSkill.base.consumeCorpse) {
            newMonster = makeMonster({'key': target.base.key}, target.level, [], true);
            newMonster.x = target.x;
        } else {
            newMonster = makeMonster({'key': minionSkill.base.monsterKey}, actor.level, [], true);
            newMonster.x = actor.x + actor.direction * 32;
        }
        newMonster.character = actor.character;
        newMonster.direction = actor.direction;
        newMonster.skillSource = minionSkill;
        newMonster.allies = actor.allies;
        newMonster.enemies = actor.enemies;
        newMonster.time = 0;
        addMinionBonuses(actor, minionSkill, newMonster);
        initializeActorForAdventure(newMonster);
        actor.allies.push(newMonster);
        actor.stunned = actor.time + .3;
    }
};

function cloneActor(actor, skill) {
    var clone;
    if (actor.personCanvas) {
        clone = makeAdventurerFromJob(actor.job, actor.level, {});
        clone.hairOffset = actor.hairOffset;
        clone.skinColorOffset = actor.skinColorOffset;
        clone.equipment = actor.equipment;
        updateAdventurer(clone);
        // Add bonuses from source character's abilities/jewel board.
        // Note that we don't give the clone the source character's actions.
        for (var ability of actor.abilities) {
            if (ability.bonuses) addBonusSourceToObject(clone, ability);
        }
        if (actor.character) addBonusSourceToObject(clone, actor.character.jewelBonuses);
    } else {
        clone = makeMonster({'key': actor.base.key}, actor.level, [], true);
    }
    clone.x = actor.x + actor.direction * 32;
    clone.character = actor.character;
    clone.direction = actor.direction;
    initializeActorForAdventure(clone);
    actor.pull = {'x': actor.x - actor.direction * 64, 'time': actor.time + .3, 'damage': 0};
    clone.allies = actor.allies;
    clone.enemies = actor.enemies;
    clone.stunned = 0;
    clone.slow = 0;
    clone.pull = null;
    clone.time = 0;
    clone.allEffects = [];
    addMinionBonuses(actor, skill, clone);
    return clone;
}
function addMinionBonuses(actor, skill, minion) {
    var newTags = {};
    // Add skill tags to the clone's tags. This is how minion bonuses can target minion's
    // produced by specific skills like '*shadowClone:damage': .1
    for (var tag of Object.keys(minion.tags)) newTags[tag] = true;
    for (var tag in skill.tags) {
        if (tag != 'melee' && tag != 'ranged') newTags[tag] = true;
    }
    updateTags(minion, newTags, true);
    for (var minionBonusSource of actor.minionBonusSources) {
        addBonusSourceToObject(minion, minionBonusSource, false);
    }
    addBonusSourceToObject(minion, getMinionSpeedBonus(actor, minion), true);
}

function getMinionSpeedBonus(actor, minion) {
    return {'bonuses': {'*speed': Math.max(.5, (actor.speed + 40) /  minion.speed)}};
}

skillDefinitions.clone = {
    isValid: function (actor, cloneSkill, attackStats) {
        var count = 0;
        actor.allies.forEach(function (ally) {
            if (ally.skillSource == cloneSkill) count++;
        });
        return count < cloneSkill.limit && Math.random() < cloneSkill.chance;
    },
    use: function (actor, cloneSkill, attackStats) {
        var clone = cloneActor(actor, cloneSkill);
        clone.skillSource = cloneSkill;
        clone.name = actor.name + ' shadow clone';
        clone.percentHealth = actor.percentHealth;
        clone.health = clone.percentHealth * clone.maxHealth;
        actor.allies.push(clone);
        actor.stunned = actor.time + .3;
    }
};

skillDefinitions.decoy = {
    isValid: function (actor, decoySkill, attackStats) {
        var count = 0;
        actor.allies.forEach(function (ally) {
            if (ally.skillSource == decoySkill) count++;
        });
        return count < ifdefor(decoySkill.limit, 10);
    },
    use: function (actor, decoySkill, attackStats) {
        var clone = cloneActor(actor, decoySkill);
        clone.skillSource = decoySkill;
        clone.name = actor.name + ' decoy';
        addActions(clone, abilities.explode);
        actor.allies.push(clone);
        actor.stunned = actor.time + .3;
        clone.health = Math.max(1, clone.maxHealth * actor.percentHealth);
        clone.percentHealth = clone.health / clone.maxHealth;
    }
};

skillDefinitions.explode = {
    isValid: function (actor, explodeSkill, attackStats) {
        if (attackStats.evaded) return false;
        // Cast revive only when the incoming hit would kill the character.
        return actor.health - ifdefor(attackStats.totalDamage, 0) <= 0;
    },
    use: function (actor, explodeSkill, attackStats) {
        // Shoot a projectile at every enemy.
        for (var i = 0; i < actor.enemies.length; i++) {
            performAttackProper({
                'distance': 0,
                'gravity': ifdefor(explodeSkill.gravity, ifdefor(explodeSkill.base.gravity, .8)),
                'speed': ifdefor(explodeSkill.speed, ifdefor(explodeSkill.base.speed, ifdefor(explodeSkill.range, 10) * 2.5)),
                'source': actor,
                'attack': explodeSkill,
                'isCritical': true,
                'damage': 0,
                'magicDamage': explodeSkill.power,
                'accuracy': 0,
            }, actor.enemies[i]);
        }
    }
};

skillDefinitions.heal = {
    isValid: function (actor, healSkill, target) {
        // Only heal allies.
        if (actor.allies.indexOf(target) < 0) return false;
        // Don't use a heal ability unless none of it will be wasted or the actor is below half life.
        return actorCanOverHeal(actor) || (target.health + healSkill.power <= target.maxHealth) || (target.health <= target.maxHealth / 2);
    },
    use: function (actor, healSkill, target) {
        target.health += healSkill.power;
        if (healSkill.area > 0) {
            for (target of getActorsInRange(target, healSkill.area, target.allies)) {
                target.health += healSkill.power;
            }
        }
        actor.stunned = actor.time + .3;
    }
};

skillDefinitions.effect = {
    isValid: function (actor, effectSkill, target) {
        if (closestEnemyDistance(target) >= 500) {
            return false;
        }
        if (effectSkill.allyBuff) {
            return actor.allies.length > 1;
        }
        // It would be nice to have some way to avoid using buffs too pre emptively here.
        // For example, only activate a buff if health <50% or an enemy is targeting you.
        return true;
    },
    use: function (actor, effectSkill, target) {
        if (effectSkill.buff) {
            addTimedEffect(target, effectSkill.buff);
        }
        // Ranger's Sic 'em ability buffs all allies but not the actor.
        if (effectSkill.allyBuff) {
            for (var i = 0; i < actor.allies.length; i++) {
                if (actor.allies[i] === actor) continue;
                addTimedEffect(actor.allies[i], effectSkill.allyBuff);
            }
        }
        if (effectSkill.debuff) {
            addTimedEffect(target, effectSkill.debuff);
        }
        actor.stunned = actor.time + .3;
    }
};

skillDefinitions.dodge = {
    isValid: function (actor, dodgeSkill, attackStats) {
        // side step can only dodge ranged attacked.
        if (ifdefor(dodgeSkill.base.rangedOnly) && !attackStats.projectile) {
            return false;
        }
        return !attackStats.evaded;
    },
    use: function (actor, dodgeSkill, attackStats) {
        attackStats.dodged = true;
        if (ifdefor(dodgeSkill.distance)) {
            actor.pull = {'x': actor.x + actor.direction * dodgeSkill.distance, 'time': actor.time + ifdefor(dodgeSkill.moveDuration, .3), 'damage': 0};
        }
        if (ifdefor(dodgeSkill.buff)) {
            addTimedEffect(actor, dodgeSkill.buff);
        }
        if (ifdefor(dodgeSkill.globalDebuff)) {
            actor.enemies.forEach(function (enemy) {
                addTimedEffect(enemy, dodgeSkill.globalDebuff);
            });
        }
    }
};

skillDefinitions.sideStep = {
    isValid: function (actor, dodgeSkill, attackStats) {
        // side step can only dodge ranged attacked.
        if (ifdefor(dodgeSkill.base.rangedOnly) && !attackStats.projectile ) {
            return false;
        }
        // Cannot side step if attacker is on top of you.
        if (getDistance(actor, attackStats.source) <= 0) {
            return false;
        }
        return !attackStats.evaded;
    },
    use: function (actor, dodgeSkill, attackStats) {
        attackStats.dodged = true;
        if (ifdefor(dodgeSkill.distance)) {
            var attacker = attackStats.source;
            if (attacker.x > actor.x) {
                actor.pull = {'x': Math.min(actor.x + actor.direction * dodgeSkill.distance, attacker.x - actor.width), 'time': actor.time + ifdefor(dodgeSkill.moveDuration, .3), 'damage': 0};
            } else {
                actor.pull = {'x': Math.max(actor.x + actor.direction * dodgeSkill.distance, attacker.x + attacker.width), 'time': actor.time + ifdefor(dodgeSkill.moveDuration, .3), 'damage': 0};
            }
        }
        if (ifdefor(dodgeSkill.buff)) {
            addTimedEffect(actor, dodgeSkill.buff);
        }
        if (ifdefor(dodgeSkill.globalDebuff)) {
            actor.enemies.forEach(function (enemy) {
                addTimedEffect(enemy, dodgeSkill.globalDebuff);
            });
        }
    }
};
// Counters with the skill if the player would receive more than half their remaining health in damage
skillDefinitions.criticalCounter = {
    isValid: function (actor, counterSkill, attackStats) {
        if (attackStats.evaded) return false;
        // Cast stop only when the incoming hit would deal more than half of the
        // character's remaining health in damage.
        return ifdefor(attackStats.totalDamage, 0) >= actor.health / 2;
    },
    use: function (actor, counterSkill, attackStats) {
        if (counterSkill.dodgeAttack) attackStats.dodged = true;
        if (counterSkill.stopAttack) attackStats.stopped = true;
        if (ifdefor(counterSkill.distance)) {
            actor.pull = {'x': actor.x + actor.direction * ifdefor(counterSkill.distance, 64), 'time': actor.time + ifdefor(counterSkill.moveDuration, .3), 'damage': 0};
        }
        if (ifdefor(counterSkill.buff)) {
            addTimedEffect(actor, counterSkill.buff);
        }
        if (ifdefor(counterSkill.globalDebuff)) {
            actor.enemies.forEach(function (enemy) {
                addTimedEffect(enemy, counterSkill.globalDebuff);
            });
        }
    }
};

skillDefinitions.counterAttack = {
    isValid: function (actor, counterAttackSkill, attackStats) {
        if (attackStats.evaded) {
            //console.log("Attack was evaded.");
            return false;
        }
        var distance = getDistance(actor, attackStats.source);
        // Can only counter attack if the target is in range, and
        if (distance > counterAttackSkill.range * 32 + 4) { // Give the range a tiny bit of lee way
            //console.log("Attacker is too far away: " + [distance, counterAttackSkill.range]);
            return false;
        }
        // The chance to counter attack is reduced by a factor of the distance.
        if (Math.random() > Math.min(1, 128 / (distance + 64))) {
            //console.log("Failed distance roll against: " + [distance, Math.min(1, 128 / (distance + 64))]);
            return false;
        }
        return true;
    },
    use: function (actor, counterAttackSkill, attackStats) {
        if (counterAttackSkill.dodge) {
            attackStats.dodged = true;
        }
        performAttack(actor, counterAttackSkill, attackStats.source);
    }
};
skillDefinitions.deflect = {
    isValid: function (actor, deflectSkill, attackStats) {
        if (attackStats.evaded) return false;
        // Only non-spell, projectile attacks can be deflected.
        return attackStats.projectile && !attackStats.attack.tags['spell'];
    },
    use: function (actor, deflectSkill, attackStats) {
        var projectile = attackStats.projectile;
        // mark the projectile as having not hit so it can hit again now that it
        // has been deflected.
        projectile.hit = false;
        projectile.target = attackStats.source;
        attackStats.source = actor;
        // Make the deflected projectiles extra accurate so they have greater impact
        attackStats.accuracy += deflectSkill.accuracy;
        attackStats.damage *= deflectSkill.damageRatio;
        attackStats.magicDamage *= deflectSkill.damageRatio;
        projectile.vx = -projectile.vx;
        projectile.vy = -getDistance(actor, projectile.target) / 200;
        // This prevents the attack in progress from hitting the deflector.
        attackStats.deflected = true;
    }
};
skillDefinitions.evadeAndCounter = {
    isValid: function (actor, evadeAndCounterSkill, attackStats) {
        if (!attackStats.evaded) return false;
        // Can only counter attack if the target is in range, and the chance to
        // counter attack is reduced by a factor of the distance.
        return getDistance(actor, attackStats.source) <= evadeAndCounterSkill.range * 32;
    },
    use: function (actor, evadeAndCounterSkill, attackStats) {
        performAttack(actor, evadeAndCounterSkill, attackStats.source);
    }
};

skillDefinitions.mimic = {
    isValid: function (actor, counterAttackSkill, attackStats) {
        // Only non basic attacks can be mimicked.
        return !attackStats.attack.tags['basic'];
    },
    use: function (actor, counterAttackSkill, attackStats) {
        performAttack(actor, attackStats.attack, attackStats.source);
    }
};

skillDefinitions.reflect = {
    isValid: function (actor, reflectSkill, target) {
        return true;
    },
    use: function (actor, reflectSkill, target) {
        // Reset reflection barrier back to 0 when using the reflection barrier spell.
        // It may be negative from when it was broken.
        actor.reflectBarrier = Math.max(0, ifdefor(actor.reflectBarrier, 0));
        gainReflectionBarrier(target, reflectSkill.power);
    }
};

function gainReflectionBarrier(actor, amount) {
    actor.reflectBarrier = ifdefor(actor.reflectBarrier, 0) + amount;
    actor.maxReflectBarrier = Math.max(ifdefor(actor.maxReflectBarrier, 0), actor.reflectBarrier);
}

skillDefinitions.plunder = {
    isValid: function (actor, plunderSkill, target) {
        return ifdefor(target.prefixes, []).length + ifdefor(target.suffixes, []).length;
    },
    use: function (actor, plunderSkill, target) {
        stealAffixes(actor, target, plunderSkill);
    }
};
function stealAffixes(actor, target, skill) {
    if (!ifdefor(skill.count)) {
        return;
    }
    var allAffixes = target.prefixes.concat(target.suffixes);
    if (!allAffixes.length) return;
    var originalBonus = (allAffixes.length > 2) ? imbuedMonsterBonuses : enchantedMonsterBonuses;
    for (var i = 0; i < skill.count && allAffixes.length; i++) {
        var affix = Random.element(allAffixes);
        if (target.prefixes.indexOf(affix) >= 0) target.prefixes.splice(target.prefixes.indexOf(affix), 1);
        if (target.suffixes.indexOf(affix) >= 0) target.suffixes.splice(target.suffixes.indexOf(affix), 1);
        var effect = {
            'bonuses': affix.bonuses,
            'duration': skill.duration
        };
        addTimedEffect(actor, effect);
        allAffixes = target.prefixes.concat(target.suffixes);
        removeBonusSourceFromObject(target, affix);
    }
    if (allAffixes.length >= 2) {
        // Do nothing, monster is still imbued
    } else if (allAffixes.length > 0 && originalBonus !== enchantedMonsterBonuses) {
        removeBonusSourceFromObject(target, originalBonus);
        addBonusSourceToObject(target, enchantedMonsterBonuses);
    } else if (allAffixes.length === 0) {
        removeBonusSourceFromObject(target, originalBonus);
    }
    recomputeDirtyStats(target);
}

skillDefinitions.banish = {
    isValid: function (actor, banishSkill, target) {
        return !target.cloaked;
    },
    use: function (actor, banishSkill, target) {
        var attackStats = performAttack(actor, banishSkill, target);
        // The purify upgrade removes all enchantments from a target.
        if (banishSkill.purify && target.prefixes.length + target.suffixes.length > 0) {
            target.prefixes = [];
            target.suffixes = [];
            updateMonster(target);
        }
        actor.enemies.forEach(function (enemy) {
            if (enemy === target) {
                return;
            }
            var distance = getDistance(actor, enemy);
            if (distance < 32 * banishSkill.distance) {
                banishTarget(actor, enemy, banishSkill.distance, ifdefor(banishSkill.knockbackRotation, 30));
                // The shockwave upgrade applies the same damage to the targets hit by the shockwave.
                if (banishSkill.shockwave) {
                    enemy.pull.attackStats = attackStats;
                }
                if (ifdefor(banishSkill.otherDebuff)) {
                    addTimedEffect(enemy, banishSkill.otherDebuff);
                }
            }
        });
    }
};
function banishTarget(actor, target, range, rotation) {
    // Adding the delay here creates a shockwave effect where the enemies
    // all get pushed from a certain point at the same time, rather than
    // them all immediately moving towards the point initially.
    target.pull = {'x': actor.x + actor.direction * (64 + 32 * range), 'delay': target.time +  getDistance(actor, target) * .02 / 32, 'time': target.time + range * .02, 'damage': 0};
    target.rotation = actor.direction * rotation;
}

skillDefinitions.charm = {
    isValid: function (actor, charmSkill, target) {
        return !target.cloaked && !(target.uncontrollable || target.stationary);
    },
    use: function (actor, charmSkill, target) {
        target.allies = actor.allies;
        target.enemies = actor.enemies;
        addBonusSourceToObject(target, getMinionSpeedBonus(actor, target), true);
        actor.enemies.splice(actor.enemies.indexOf(target), 1);
        actor.allies.push(target);
        target.direction = actor.direction;
        actor.stunned = actor.time + 1;
    }
};
skillDefinitions.charge = {
    isValid: function (actor, chargeSkill, target) {
        return !target.cloaked;
    },
    use: function (actor, chargeSkill, target) {
        actor.chargeEffect = {
            'chargeSkill': chargeSkill,
            'distance': 0
        };
    }
};