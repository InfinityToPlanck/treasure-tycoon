/**
 * Notes on targeting skills:
 * This system is very ad hoc and should probably be cleaned up as it becomes clearer what the actual needs of the system are.
 * Essentially every time a stat is calculated it looks for modifiers that potentially target its value. These can target the name of
 * the stat directly, or some set of filters in the case that the modifier is not intended to modify all values with the stat name.
 *
 * Modifying all values with the given key:
 * [operator][key] {'+range': 5} will add 5 to the base value of range for computed objects, including stats on actors, actions and buffs.
 *
 * Modifying values with the given key on skills objects that include the given tag:
 * [operator][tag]:[key] {'*buff:duration': 2} will double the value of duration on all computed objects that include the tag 'buff'.
 * Note that some tags are applied based on the actor, not on the explicit tags on the object being processed. For example:
 * '+throwing:range' will apply to all skills a player uses provided they are using a throwing weapon.
 * '+revive:power' will apply only to the revive skill. The name of a skill is automatically converted to a special tag for targeting.
 * This could cause trouble if the tag generated for a skill name conflicted with another tag. For instance if we had both a revive skill
 * and a revive tag, there is no way to target those individually.
 */
var abilities = {
    'basicAttack': {'name': 'Basic Attack', 'action': skills.basicAttack},
    'throwingPower': {'name': 'Throwing Power', 'bonuses': {'%throwing:physicalDamage': .3, '+throwing:range': 2}},
    'throwingDamage': {'name': 'Throwing Mastery', 'bonuses': {'%throwing:physicalDamage': .2, '%throwing:attackSpeed': .2}},
    'throwingCriticalChance': {'name': 'Throwing Precision', 'bonuses': {'%throwing:critChance': .3, '%throwing:cattackSpeed': .3}},
    'throwingParadigmShift': {'name': 'Melee Throwing', 'bonuses': {'*throwing:range': .2, '*throwing:damage': 1.3}}, // This should be throwing -> melee with range: 2 then 1.3xdamage and attack speed.

    'rangedAccuracy': {'name': 'Ranged Accuracy', 'bonuses': {'%ranged:accuracy': .3, '+ranged:range': 1}},
    'rangedDamage': {'name': 'Ranged Damage', 'bonuses': {'%ranged:damage': .2, '+ranged:range': 1}},
    'rangedAttackSpeed': {'name': 'Ranged Attack Speed', 'bonuses': {'%ranged:attackSpeed': .2, '+ranged:range': 1}},
    'rangedParadigmShift': {'name': 'Close Quarters', 'bonuses': {'*ranged:range': .5, '*ranged:damage': 1.3, '*ranged:accuracy': 1.3}},

    'bowRange': {'name': 'Bow Range', 'bonuses': {'+bow:range': 3, '+bow:critDamage': .5}},
    'bowPhysicalDamage': {'name': 'Physical Bow Damage', 'bonuses': {'*bow:physicalDamage': .3, '+bow:critDamage': .3}},
    'bowDamage': {'name': 'Bow Damage', 'bonuses': {'*bow:damage': .5, '*+bow:critDamage': .3}},
    //'bowParadigmShift': {'name': 'Bow Shield', 'bonuses': {'*bow:range': .5, '$bow:twoToOneHanded': 'Equipping a bow only uses one hand.'}}, // This doesn't work yet because setting twoToOneHanded needs to happen before we check to hide the offhand slot.

    'fistDamage': {'name': 'Fist Damage', 'bonuses': {'%fist:physicalDamage': .3, '+fist:critDamage': .3}},
    'fistCriticalChance': {'name': 'Fist Precision', 'bonuses': {'%fist:critChance': .3, '%fist:accuracy': .3}},
    'fistAttackSpeed': {'name': 'Fist Attack Speed', 'bonuses': {'%fist:attackSpeed': .2, '%fist:physicalDamage': .2}},
    //'fistParadigmShift': {'name': '', 'bonuses': {}},

    'swordPhysicalDamage': {'name': 'Sword Damage', 'bonuses': {'%sword:physicalDamage': .3, '%sword:critChance': .3}},
    'swordAccuracy': {'name': 'Sword Accuracy', 'bonuses': {'%sword:accuracy': .5, '*sword:critChance': .2}},
    'swordAttackSpeed': {'name': 'Sword Attack Speed', 'bonuses': {'%sword:attackSpeed': .2, '%sword:physicalDamage': .2}},
    'swordParadigmShift': {'name': 'Two Hands', 'bonuses': {'*noOffhand:damage': 1.5, '*noOffhand:attackSpeed': .75}}, // This should be noOffhand:sword

    'greatswordDamage': {'name': 'Greatsword Damage', 'bonuses': {'%greatsword:damage': .3, '%greatsword:critChance': .3}},
    'greatswordPhysicalDamage': {'name': 'Greatsword Physical Damage', 'bonuses': {'%greatsword:physicalDamage': .4, '%greatsword:accuracy': .2}},
    'greatswordAccuracy': {'name': 'Greatsword Accuracy', 'bonuses': {'%greatsword:accuracy': .5, '%greatsword:physicalDamage': .2}},
    'greatswordParadigmShift': {'name': 'Greatsword Wave', 'bonuses': {'*greatsword:range': 2, '*greatsword:attackSpeed': .5}},

    'wandRange': {'name': 'Wand Range', 'bonuses': {'+wand:range': 2, '%wand:magicDamage': .3}},
    'wandAttackSpeed': {'name': 'Wand Attack Speed', 'bonuses': {'%wand:attackSpeed': .2, '%wand:magicDamage': .2}},
    'wandCritChance': {'name': 'Want Critical Chance', 'bonuses': {'%wand:critChance': .3, '%wand:magicDamage': .3}},
    //'wandParadigmShift': {'name': '', 'bonuses': {'%:': .3, '%:': .3}},

    'staffDamage': {'name': 'Staff Damage', 'bonuses': {'%staff:damage': .5, '%staff:accuracy': .2}},
    'staffCritDamage': {'name': 'Staff Crit Damage', 'bonuses': {'+staff:critDamage': .3, '%staff:magicDamage': .3}},
    'staffAccuracy': {'name': 'Staff Accuracy', 'bonuses': {'%staff:accuracy': .3, '%staff:damage': .3}},
    //'staffParadigmShift': {'name': '', 'bonuses': {'%:': .3, '%:': .3}},

    'spellCDR': {'name': 'Spell Cooldown Reduction', 'bonuses': {'%spell:cooldown': -.1}},
    'spellPower': {'name': 'Spell Power', 'bonuses': {'%spell:damage': .4, '+spell:range': 2}},
    'spellPrecision': {'name': 'Spell Precision', 'bonuses': {'%spell:critChance': .3, '+spell:critDamage': .3}},
    //'spellParadigmShift': {'name': '', 'bonuses': {'%:': .3, '%:': .3}},

    'axePhysicalDamage': {'name': 'Axe Physical Damage', 'bonuses': {'%axe:physicalDamage': .4, '%axe:accuracy': .2}},
    'axeAttackSpeed': {'name': 'Axe Attack Speed', 'bonuses': {'%axe:speed': .4, '%axe:accuracy': .2}},
    'axeCritDamage': {'name': 'Axe Critical Damage', 'bonuses': {'+axe:critDamage': .3, '%axe:physicalDamage': .3}},
    //'axeParadigmShift': {'name': '', 'bonuses': {'%:': .3, '%:': .3}},

    'criticalDamage': {'name': 'Critical Damage', 'bonuses': {'+critDamage': .5}},
    'criticalStrikes': {'name': 'Critical Strikes', 'bonuses': {'%critChance': .2, '+critDamage': .3}},
    'criticalAccuracy': {'name': 'Critical Accuracy', 'bonuses': {'+critAccuracy': .5, '%critChance': .2}},
    //'criticalParadigmShift': {'name': '', 'bonuses': {'%:': .3, '%:': .3}},

    'oneHandedDamage': {'name': 'One Handed Damage', 'bonuses': {'%oneHanded:damage': .2, '%oneHanded:attackSpeed': .2}},
    'oneHandedCritChance': {'name': 'One Handed Critical Chance', 'bonuses': {'%oneHanded:critChance': .2, '%oneHanded:attackSpeed': .2}},
    'oneHandedCritDamage': {'name': 'One Handed Critical Damage', 'bonuses': {'%oneHanded:critDamage': .2, '%oneHanded:attackSpeed': .2}},
    'oneHandedParadigmShift': {'name': 'Dual Wield', 'bonuses': {'*noOffhand:attackSpeed': 1.5, '*noOffhand:damage': .75}},

    'shieldDexterity': {'name': 'Shield Agility', 'bonuses': {'%shield:attackSpeed': .3, '%shield:evasion': .3}},
    'shieldStrength': {'name': 'Shield Toughness', 'bonuses': {'%shield:damage': .3, '%shield:armor': .3}},
    'shieldIntelligence': {'name': 'Shield Tactics', 'bonuses': {'%shield:accuracy': .3, '%shield:block': .3, '%shield:magicBlock': .3}},
    //'shieldParadigmShift': {'name': '', 'bonuses': {'%:': .3, '%:': .3}}, // Dual wield shields, no basic attack

    'polearmRange': {'name': 'Polearm Range', 'bonuses': {'+polearm:range': 1, '%polearm:physicalDamage': .4}},
    'polearmAccuracy': {'name': 'Polearm Accuracy', 'bonuses': {'%polearm:accuracy': .3, '%polearm:damage': .3}},
    'polearmCritDamage': {'name': 'Polearm Critical Damage', 'bonuses': {'+polearm:critDamage': .3, '%polearm:physicalDamage': .3}},
    //'polearmParadigmShift': {'name': '', 'bonuses': {'%:': .3, '%:': .3}},

    'meleeDamage': {'name': 'Melee Damage', 'bonuses': {'%melee:damage': .2, '%melee:accuracy': .2}},
    'meleeAttackSpeed': {'name': 'Melee Attack Speed', 'bonuses': {'%melee:attackSpeed': .2, '%melee:accuracy': .2}},
    'meleeCritChance': {'name': 'Melee CriticalChance', 'bonuses': {'%melee:critChance': .2, '%melee:accuracy': .2}},
    //'meleeParadigmShift': {'name': '', 'bonuses': {'%:': .3, '%:': .3}},

    'movementCDR': {'name': 'Movement Cooldown Reduction', 'bonuses': {'%movement:cooldown': -.1, '%movement:range': .1}},
    'movementDamage': {'name': 'Movement Damage', 'bonuses': {'%movement:damage': .3, '%movement:critDamage': .3}},
    'movementPrecision': {'name': 'Movement Precision', 'bonuses': {'%movement:accuracy': .3, '%movement:critChance': .3}},
    //'movementParadigmShift': {'name': '', 'bonuses': {'%:': .3, '%:': .3}},

    'minionToughness': {'name': 'Ally Toughness', 'bonuses': {'%minion:maxHealth': .5, '%minion:armor': .3}},
    'minionDamage': {'name': 'Ally Damage', 'bonuses': {'%minion:damage': .3, '%minion:accuracy': .3}},
    'minionFerocity': {'name': 'Ally Ferocity', 'bonuses': {'%minion:attackSpeed': .5, '%minion:critChance': .3}},
    //'minionParadigmShift': {'name': '', 'bonuses': {'%:': .3, '%:': .3}},

    'magicMagicDamage': {'name': 'Magic Weapon Magic Damage', 'bonuses': {'%magic:magicDamage': .3, '%magic:accuracy': .3}},
    'magicAttackSpeed': {'name': 'Magic Weapon Attack Speed', 'bonuses': {'%magic:attackSpeed': .2, '%magic:critChance': .2}},
    'magicDamage': {'name': 'Magic Weapon Damage', 'bonuses': {'%magic:damage': .2, '%magic:critDamage': .3}},
    //'magicParadigmShift': {'name': '', 'bonuses': {'%:': .3, '%:': .3}},

    'daggerAttackSpeed': {'name': 'Dagger Attack Speed', 'bonuses': {'%dagger:attackSpeed': .2, '%dagger:critChance': .2}},
    'daggerCritChance': {'name': 'Dagger Critical Chance', 'bonuses': {'%dagger:critChance': .3, '%dagger:damage': .2}},
    'daggerDamage': {'name': 'Dagger Damage', 'bonuses': {'%dagger:damage': .2, '%dagger:attackSpeed': .2}},
    //'daggerParadigmShift': {'name': '', 'bonuses': {'%:': .3, '%:': .3}},
    'jugglerIndex': {'name': '---Juggler---'},
    // Tier 1 classes
    // Juggler
    // how to make chaining apply to basic attack but not double up *throwing:attackSpeed, etc.
    'juggler': {'name': 'Juggling', 'bonuses': {'$throwing:chaining': 'Projectiles ricochet between targets until they miss.'}},
    'minorDexterity': {'name': 'Minor Dexterity', 'bonuses': {'+dexterity': 10}},
    'evasion': {'name': 'Evasion', 'bonuses': {'%evasion': .5}},
    'sap': {'name': 'Sap', 'bonuses': {'+slowOnHit': .1, '+healthGainOnHit': 1}},
    'dodge': {'name': 'Dodge', 'bonuses': {'+evasion': 2}, 'reaction': skills.dodge},
    'acrobatics': {'name': 'Acrobatics', 'bonuses': {'+evasion': 2, '+dodge:cooldown': -2, '*dodge:distance': 2}},
    'bullseye': {'name': 'Bullseye', 'action': skills.bullseye},
    'bullseyeCritical': {'name': 'Dead On', 'bonuses': {'+bullseye:critChance': 1}, 'helpText': 'Bullseye always strikes critically.'},
    // Black Belt
    'blackbelt': {'name': 'Martial Arts',
        'bonuses': {'*unarmed:damage': 3, '*unarmed:attackSpeed': 1.5, '+unarmed:critChance': .15, '*unarmed:critDamage': 2, '*unarmed:critAccuracy': 2}},
    'minorStrength': {'name': 'Minor Strength', 'bonuses': {'+strength': 10}},
    'vitality': {'name': 'Vitality', 'bonuses': {'+healthRegen': ['{strength}', '/', 10], '+strength': 5}},
    'counterAttack': {'name': 'Counter Attack', 'bonuses': {'+strength': 5}, 'reaction': skills.counterAttack},
    'counterPower': {'name': 'Improved Counter', 'bonuses': {'+strength': 5, '+counterAttack:attackPower': .5, '*counterAttack:accuracy': 1.5}},
    'counterChance': {'name': 'Heightened Reflexes', 'bonuses': {'+dexterity': 5, '+counterAttack:chance': .1}},
    'dragonPunch': {'name': 'Dragon Punch', 'action': skills.dragonPunch},
    // Priest
    'priest': {'name': 'Divine Blessing', 'bonuses': {'*heal:power': 2, '*healthRegen': 2, '*healthGainOnHit': 2}},
    'minorIntelligence': {'name': 'Minor Intelligence', 'bonuses': {'+intelligence': 10}},
    'heal': {'name': 'Heal', 'bonuses': {'+intelligence': 5}, 'action': skills.heal},
    'reflect': {'name': 'Reflect', 'bonuses': {'+intelligence': 10}, 'action': skills.reflect},
    'revive': {'name': 'Revive', 'bonuses': {'+intelligence': 10}, 'reaction': skills.revive},
    'reviveInstantCooldown': {'name': 'Miracle', 'bonuses': {'$revive:instantCooldown': 'Reset cooldowns of other abilities'}},
    'reviveInvulnerability': {'name': 'Halo', 'bonuses': {'$revive:buff': buffEffect({}, {'+duration': 2, '$invulnerable': 'Invulnerability'})}},
    // Tier 2 classes
    // Corsair
    /*'corsair': {'name': 'Venom', 'bonuses': {'+poison': .2}, 'onHitEffect': {'debuff': {'tags': ['debuff'], 'bonuses': {'*damage': .9, 'area': 0}}},
                    'helpText': "Apply a stacking debuff with every hit that weakens enemies' attacks and deals damage over time."},
    'corsairKeyStone': {'name': 'Corsair Key Stone', 'bonuses': {}},
    'critChance': {'name': 'Critical Chance', 'bonuses': {'%critChance': .5}},
    'hook': {'name': 'Grappling Hook', 'action': {'type': 'attack',
                    'bonuses': {'cooldown': 10, 'range': 10, 'dragDamage': 0, 'dragStun': 0, 'rangeDamage': 0, 'alwaysHits': 'Never misses', '$pullsTarget': 'Pulls target'},
                    'helpText': 'Throw a hook to damage and pull enemies closer.'}},
    'hookRange': {'name': 'Long Shot', 'bonuses': {'+hook:range': 5, '+hook:cooldown': -3}},
    'hookDrag': {'name': 'Barbed Wire', 'bonuses': {'+hook:dragDamage': .1}},
    'hookStun': {'name': 'Tazer Wire', 'bonuses': {'+hook:dragStun': .1}},
    'hookPower': {'name': 'Power Shot', 'bonuses': {'+hook:rangeDamage': .1}},
    'deflect': {'name': 'Deflect', 'bonuses': {'+dexterity': 10, '+strength': 5}, 'reaction':
            {'type': 'deflect', 'bonuses': {'attackPower': [.5, '+', ['{strength}', '/', 100]], 'cooldown': ['20', '*', [100, '/', [100, '+', '{dexterity}']]], 'chance': 1}, 'helpText': 'Deflect ranged attacks back at enemies.'}},
    'plunder': {'name': 'Plunder', 'bonuses': {'+dexterity': 5, '+strength': 10}, 'action':
            {'type': 'plunder', 'bonuses': {'range': 2, 'count': 1, 'duration': ['{strength}', '/', 10], 'cooldown': ['40', '*', [100, '/', [100, '+', '{dexterity}']]]}, 'helpText': 'Steal an enemies enchantment for yourself.'}},
    'deepPockets': {'name': 'Deep Pockets', 'bonuses': {'+dexterity': 10, '+plunder:count': 1}, 'helpText': 'Steal an additional enchantment when you use plunder.'},
    'robBlind': {'name': 'Rob Blind', 'bonuses': {'+strength': 10, '+plunder:count': 2}, 'helpText': 'Steal two additional enchantments when you use plunder.'},
    // Paladin
    'paladin': {'name': 'Faith', 'bonuses': {'*buff:duration': 2}},
    'protect': {'name': 'Protect', 'bonuses': {'+intelligence': 5}, 'action':
            {'type': 'effect', 'tags': ['spell'], 'target': 'self', 'bonuses': {'cooldown': 30, 'buff':
            {'tags': ['buff'], 'bonuses': {'+armor': ['{intelligence}'], 'duration': 20, 'area': 0}}}, 'helpText': 'Create a magic barrier that grants: {buff}'}},
    'banishingStrike': {'name': 'Banishing Strike', 'bonuses': {'+intelligence': 5, '+strength': 5}, 'action':
            {'type': 'banish', 'restrictions': ['melee'], 'bonuses': {'cooldown': 30, 'attackPower': 2, 'distance': [6, '+', ['{strength}' , '/', 20]],
            'alwaysHits': 'Never misses', 'purify': 0, 'shockwave': 0,
            'debuff': {'tags': ['debuff'], 'bonuses': {'*damage': .5, '*magicDamage': .5, 'duration': ['{intelligence}', '/', 20], 'area': 0}},
            'otherDebuff': {'tags': ['debuff'], 'bonuses': {'*speed': .1, 'duration': ['{intelligence}', '/', 20]}}}, 'helpText': 'Perform a mighty strike that inflicts the enemy with: {debuff} And knocks all other enemies away, slowing them.'}},
    'purify': {'name': 'Purify', 'bonuses': {'+intelligence': 10, '+banishingStrike:purify': 4}, 'helpText': 'Remove all enchantments from enemies hit by banishing strike'},
    'shockwave': {'name': 'Shockwave', 'bonuses': {'+strength': 10, '+banishingStrike:shockwave': 1}, 'helpText': 'Banishing strike also damages knocked back enemies'},
    'aegis': {'name': 'Aegis', 'bonuses': {'+magicBlock': 5, '+block': 10}, 'reaction':
            {'type': 'criticalCounter', 'tags': ['spell'], 'bonuses': {'cooldown': 60, 'stopAttack': 1,
            'buff': {'tags': ['buff'], 'bonuses': {'maxBlock': 'Block checks are always perfect', 'maxMagicBlock': 'Magic Block checks are always perfect', 'duration': 5, 'area': 0}}},
            'helpText': 'If an attack would deal more than half of your remaining life, prevent it and cast an enchantment that grants you: {buff}'}},
    // Dancer
    'dancer': {'name': 'Dancing', 'bonuses': {'+evasion': 3}, 'reaction':
            {'type': 'evadeAndCounter', 'bonuses': {'alwaysHits': 'Never misses', 'range': 1}, 'helpText': 'Counter whenever you successfully evade an attack.'}},
    'distract': {'name': 'Distract', 'bonuses': {'+evasion': 3}, 'reaction':
            {'type': 'dodge', 'bonuses': {'globalDebuff': {'tags': ['debuff'], 'bonuses': {'*accuracy': .5, 'duration': 2, 'area': 0}}, 'cooldown': 10}, 'helpText': 'Dodge an attack with a distracting flourish that inflicts: {globalDebuff} on all enemies.'}},
    'charm': {'name': 'Charm', 'bonuses': {'+dexterity': 5, '+intelligence': 5}, 'action':
            {'type': 'charm', 'tags': ['minion'], 'bonuses': {'range': 1, 'cooldown': ['240', '*', [100, '/', [100, '+', '{intelligence}']]]}, 'helpText': 'Steal an enemies heart, turning them into an ally.'}},
    'dervish': {'name': 'Whirling Dervish', 'bonuses': {'+dexterity': 15}, 'onHitEffect': {'buff': {'tags': ['buff'], 'bonuses': {'%attackSpeed': .05, '%speed': .05, 'duration': 2, 'area': 0}}},
                'helpText': "Gain momentum with each hit you land granting increased attack speed and movement speed."},
    // Tier 3 classes
    // Ranger
    'ranger': {'name': 'Taming', 'bonuses': {'*minion:healthBonus': 2, '*minion:attackSpeedBonus': 1.5, '*minion:speedBonus': 1.5}},
    'finesse':  {'name': 'Finesse', 'bonuses': {'%attackSpeed': .2}},
    'pet': {'name': 'Pet', 'action':
            {'type': 'minion', 'target': 'none', 'tags': ['pet'], 'monsterKey': 'wolf', 'bonuses': {'limit': 1, 'cooldown': 30, 'healthBonus': 1, 'damageBonus': 1, 'attackSpeedBonus': 1, 'speedBonus': 1},
            'helpText': 'Call up to 1 pet to fight with you.'}},
    //'petFood': {'name': 'Pet Food', 'bonuses': {'+pet:cooldown': -3, '+pet:healthBonus': 1}, 'helpText': 'Pet has 50% more health and can be called more frequently.'},
    //'petTraining': {'name': 'Pet Training', 'next': ['whistle'], 'bonuses': {'+pet:cooldown': -3, '+pet:damageBonus': .5}, 'helpText': 'Pet deals 50% more damage and can be called more frequently.'},
    //'whistle': {'name': 'Whistle', 'bonuses': {'+pet:cooldown': -10}, 'helpText': 'Greatly reduces the cooldown for calling your pet.'},
    'net': {'name': 'Net Trap', 'action': {'type': 'effect',
                    'bonuses': {'cooldown': 10, 'range': 10, 'debuff': {'tags': ['debuff'], 'bonuses': {'*speed': 0, 'duration': 3, 'area': 0}}},
                    'helpText': 'Throw a net to ensnare a distant enemy.'}},
    'netArea': {'name': 'Wide Net', 'bonuses': {'+net:area': 5}},
    'sicem': {'name': 'Sic \'em', 'bonuses': {'+dexterity': 10}, 'action': {'type': 'effect',
                    'bonuses': {'cooldown': [60, '*', [100, '/', [100, '+', '{dexterity}']]], 'range': 10, 'allyBuff': {'bonuses': {'*speed': 2, '*attackSpeed': 2, '*damage': 2, 'duration': 2, 'area': 0}}},
                    'helpText': 'Incite your allies to fiercely attack the enemy granting them: {allyBuff}'}},
    'unleashe': {'name': 'unleashe', 'bonuses': {'+sicem:allyBuff:lifeSteal': .1, '+sicem:allyBuff:duration': 2},
                    'helpText': 'Not Implemented: sicem buff grants life steal and lasts an additional 2 seconds'},
    // Warrior
    'warrior': {'name': 'Cleave', 'bonuses': {'%melee:damage': .5, '+melee:cleave': .6, '+melee:cleaveRange': 3}},
    'ferocity': {'name': 'Ferocity', 'bonuses': {'%physicalDamage': .2}},
    'charge': {'name': 'Charge', 'bonuses': {'+strength': 5}, 'action':
        {'type': 'charge', 'bonuses': {'range': 15, 'attackPower': 2, 'cooldown': 30, 'speedBonus': 3, 'stun': .5, 'area': 0, 'rangeDamage': 0, 'alwaysHits': 'Never misses'}, 'helpText': 'Charge at enemies, damaging and stunning them on impact.'}},
    'batteringRam': {'name': 'Battering Ram', 'bonuses': {'+charge:rangeDamage': .1}, 'helpText': 'Charge deals more damage from further away.'},
    'impactRadius': {'name': 'Impact Radius', 'bonuses': {'+charge:area': 6}, 'helpText': 'Charge damage and stun applies to nearby enemies.'},
    'overpower': {'name': 'Overpower', 'bonuses': {'+strength': 10, '+melee:knockbackChance': .3, '+melee:knockbackDistance': 3}},
    'armorBreak': {'name': 'Armor Break', 'bonuses': {'+strength': 15}, 'action':
        {'type': 'attack', 'restrictions': ['melee'], 'bonuses': {'attackPower': 3, 'cooldown': 30, 'stun': .5, 'alwaysHits': 'Never misses',
        'debuff': {'tags': ['debuff'], 'bonuses': {'-armor': ['{strength}', '/', 2], '-block': ['{strength}', '/', 2], 'area': 0, 'duration': 0}}}, 'helpText': 'Deliver a might blow that destroys the targets armor causing: {debuff}'}},
    // Wizard
    'wizard': {'name': 'Arcane Prodigy', 'bonuses': {'*spell:area': 2, '*spell:power': 2}},
    'resonance': {'name': 'Resonance', 'bonuses': {'%magicDamage': .2}},
    'fireball': {'name': 'Fireball', 'bonuses': {'+intelligence': 5}, 'action':
        {'type': 'spell', 'tags': ['spell', 'ranged'], 'animation': 'fireball', 'size': 32, 'color': 'red', 'bonuses': {'power': ['{intelligence}'], 'range': 12, 'cooldown': 8, 'alwaysHits': 'Never misses', 'explode': 1, 'area': 3, 'areaCoefficient': .5},
        'helpText': 'Conjure an explosive fireball to hurl at enemies dealing {power} damage.'}},
    'chainReaction': {'name': 'Chain Reaction', 'bonuses': {'+fireball:explode': 1}, 'helpText': 'Fireball explosions will chain an extra time.'},
    'freeze': {'name': 'Freeze', 'bonuses': {'+intelligence': 10}, 'action':
        {'type': 'spell', 'tags': ['spell', 'nova'], 'height': 20, 'color': 'white', 'alpha': .7, 'bonuses': {'power': ['{intelligence}', '/', 2], 'area': [4, '+', ['{intelligence}', '/', '50']], 'areaCoefficient': 1, 'cooldown': 10,
        'alwaysHits': 'Never misses', 'slowOnHit': 1},
        'helpText': 'Emit a blast of icy air that deals {power} damage and slows enemies. The effect is less the further away the enemy is.'}},
    'absoluteZero': {'name': 'Absolute Zero', 'bonuses': {'*freeze:slowOnHit': 2}},
    'storm': {'name': 'Storm', 'bonuses': {'+intelligence': 15}, 'action':
        {'type': 'spell', 'tags': ['spell', 'field'], 'height': 40, 'color': 'yellow', 'alpha': .2, 'bonuses': {'hitsPerSecond': 2, 'duration': 5, 'power': ['{intelligence}', '/', 4], 'area': [5, '+', ['{intelligence}', '/', '50']], 'cooldown': 20,
        'alwaysHits': 'Never misses'},
        'helpText': 'Create a cloud of static electricity that randomly deals magic damage to nearby enemies.'}},
    'stormFrequency': {'name': 'Lightning Rod', 'bonuses': {'*storm:hitsPerSecond': 2}},
    'stormDuration': {'name': 'Storm Mastery', 'bonuses': {'*storm:duration': 2}},
    // Tier 4 classes
    // Assassin
    'assassin': {'name': 'First Strike', 'bonuses': {'$firstStrike': '100% critical strike chance against enemies with full health.'}},
    'blinkStrike': {'name': 'Blink Strike', 'bonuses': {'+dexterity': 5}, 'action':
        {'type': 'attack', 'restrictions': ['melee'], 'bonuses': {'attackPower': 1.5, 'cooldown': 6, 'alwaysHits': 'Never misses', 'teleport': 6}}, 'helpText': 'Instantly teleport to and attack a nearby enemy.'},
    'cull': {'name': 'Cull', 'bonuses': {'+strength': 10, '+cull': .1}},
    'cripple': {'name': 'Cripple', 'bonuses': {'+strength': 10, '+dexterity': 10}, 'onCritEffect': {'debuff': {'tags': ['debuff'], 'bonuses': {'*speed': .5, '*attackSpeed': .5, 'duration': 5, 'area': 0}}}},
    // Dark Knight
    'darkknight': {'name': 'Blood Lust', 'bonuses': {'+overHeal': .5, '+lifeSteal': .05}},
    'consume': {'name': 'Consume', 'bonuses': {'+intelligence': 5, 'duration': 0, 'count': 0}, 'action':
        {'type': 'consume', 'target': 'enemies', 'targetDeadUnits': true, 'consumeCorpse': true, 'bonuses': {'consumeRatio': .2, 'range': 5},
        'helpText': 'Consume the spirits of nearby defeated enemies to regenerate your health.'}},
    'soulStrike': {'name': 'Soul Strike', 'bonuses': {'+strength': 10}, 'action':
        {'type': 'attack', 'restrictions': ['melee'], 'bonuses': {'+range': 2, 'attackPower': 2, 'cooldown': 15, 'alwaysHits': 'Never misses', 'healthSacrifice': .2, 'cleave': 1}},
        'helpText': 'Sacrifice a portion of your current health to deal a cleaving attack that hits all enemies in an extended range.'},
    'reaper': {'name': 'Reaper', 'bonuses': {'+intelligence': 10, '+strength': 5, '+consume:count': 1, '+consume:duration': 10},
        'helpText': 'Gain the powers of consumed monsters for a short period.'},
    // Bard
    'bard': {'name': 'Charisma', 'bonuses': {'*minion:cooldown': .6, '+minion:limit': 1, '*song:duration': 1.5, '+buff:area': 8}},
    'attackSong': {'name': 'Furious Tocatta', 'bonuses': {'+dexterity': 10}, 'action':
        // The stats on this buff should be based on the caster, not the target.
        {'type': 'song', 'tags': ['song', 'field'], 'target': 'allies', 'color': 'orange', 'alpha': .2, 'bonuses': {'area': 8, 'cooldown': 30, 'duration': 10,
        'buff': {'tags': ['buff'], 'bonuses': {'%attackSpeed': [.2, '+', ['{dexterity}', '/', 1000]], '%accuracy': [.2, '+', ['{intelligence}', '/', 1000]], '%damage': [.2, '+', ['{strength}', '/', 1000]]}}
        }, 'helpText': 'Play a tune that inspires you and your allies to attack more fiercely, granting all allies in range: {buff}'}},
    'defenseSong': {'name': 'Rondo of Hope', 'bonuses': {'+intelligence': 10}, 'action':
        // The stats on this buff should be based on the caster, not the target.
        {'type': 'song', 'tags': ['song', 'field'], 'target': 'allies', 'color': 'purple', 'alpha': .2, 'bonuses': {'area': 10, 'cooldown': 45, 'duration': 20,
        'buff': {'tags': ['buff'], 'bonuses': {'%evasion': [.2, '+', ['{dexterity}', '/', 1000]], '%block': [.2, '+', ['{intelligence}', '/', 1000]], '%maxHealth': [.2, '+', ['{strength}', '/', 1000]]}}
        }, 'helpText': 'Play an uplifting rondo that steels you and your allies defenses for battle, granting all allies in range: {buff}'}},
    'heroSong': {'name': 'Hero\'s Ballade', 'bonuses': {'+intelligence': 10, '+dexterity': 10}, 'action':
        // The stats on this buff should be based on the caster, not the target.
        {'type': 'heroSong', 'tags': ['song', 'field'], 'target': 'allies', 'color': 'gold', 'alpha': .2, 'bonuses': {'area': 8, 'cooldown':  ['300', '*', [100, '/', [100, '+', '{intelligence}']]], 'duration': [2, '+', ['{dexterity}' , '/', '200']],
        'buff': {'tags': ['buff'], 'bonuses': {'invulnerable': 'Invulnerability', '+healthRegen': ['{intelligence}', '/', 10], '%critChance': ['{dexterity}', '/', 500]}}
        }, 'helpText': 'Play a ballade to inspire heroic feats granting all allies in range: {buff}'}},
    // Tier 5 classes
    // Sniper
    'sniper': {'name': 'Sharp Shooter', 'bonuses': {'*bow:critChance': 1.5, '*bow:critDamage': 1.5, '$bow:criticalPiercing': 'Critical strikes hit multiple enemies.'}},
    'majorDexterity': {'name': 'Major Dexterity', 'bonuses': {'+dexterity': 30}},
    'powerShot': {'name': 'Power Shot', 'bonuses': {'+dexterity': 5},
        'action': {'type': 'attack', 'restrictions': ['ranged'],
                    'bonuses': {'+range': 5, '+critChance': 1, 'attackPower': 1.5, 'cooldown': 10, 'alwaysHits': 'Never misses'},
                    'helpText': 'Perform a powerful long ranged attack that always strikes critically.'}},
    'aiming': {'name': 'Aiming', 'bonuses': {'*ranged:accuracy': 1.5, '+ranged:critChance': .1, '+ranged:critDamage': .3}},
    'snipe': {'name': 'Snipe', 'bonuses': {'+dexterity': 15},
        'action': {'type': 'attack', 'restrictions': ['ranged'],
                    'bonuses': {'+range': 10, 'attackPower': 2, 'cooldown': 30, 'ignoreArmor': 'Ignore armor and block',
                    'ignoreResistance': 'Ignore magic resistance and magic block', 'alwaysHits': 'Never misses'},
                    'helpText': 'Precisely target an enemies weak spot from any distance ignoring all armor and resistances.'}},

    // Samurai
    'samurai': {'name': 'Great Warrior', 'bonuses': {'*twoHanded:damage': 2}},
    'majorStrength': {'name': 'Major Strength', 'bonuses': {'+strength': 30}},
    'sideStep': {'name': 'Side Step', 'bonuses': {'+evasion': 2}, 'reaction':
             {'type': 'dodge', 'rangedOnly': true, 'bonuses': {'cooldown': 10, 'moveDuration': .05, 'distance': 64, 'buff': {'bonuses': {'+critChance': .2, 'duration': 2, 'area': 0}}},
        'helpText': 'Side step a ranged attack and advance toward enemis gaining: {buff}'}},
    'dragonSlayer': {'name': 'Dragon Slayer', 'bonuses': {'+strength': 10},
        'action': {'type': 'attack', 'restrictions': ['melee'],
                   'bonuses': {'+critDamage': .5, '*critChance': 2, '*damage': 3, '+cooldown': 20, '$alwaysHits': 'Never misses'},
        'helpText': 'Strike with unparalleled ferocity.'}},
    'armorPenetration': {'name': 'Penetrating Strikes', 'bonuses': {'+strength': 15, '+melee:armorPenetration': .3}},
    // Sorcerer
    'majorIntelligence': {'name': 'Major Intelligence', 'bonuses': {'+intelligence': 30}},
    'raiseDead': {'name': 'Raise Dead', 'bonuses': {'+intelligence': 5}, 'action':
            {'type': 'minion', 'target': 'enemies', 'targetDeadUnits': true, 'consumeCorpse': true, 'tags': ['spell'], 'bonuses': {'limit': 10, 'chance': .4, 'cooldown': .5, 'healthBonus': 1, 'damageBonus': 1, 'attackSpeedBonus': 1, 'speedBonus': 1},
            'helpText': 'Sometimes raise defeated enemies to fight for you.'}},
    'drainLife': {'name': 'Drain Life', 'bonuses': {'+intelligence': 10},
        'action': {'type': 'spell', 'tags': ['spell', 'blast'], 'height': 20, 'color': 'green', 'alpha': .5,
                   'bonuses': {'*power': .5, 'range': 10, '+power': ['{intelligence}', '/', 2], 'area': [8, '+', ['{intelligence}', '/', '100']], 'areaCoefficient': 1, 'cooldown': 10, 'lifeSteal': 1,
        'alwaysHits': 'Never misses'},
        'helpText': 'Drain life from all enemies in a large area.'}},
    'plague': {'name': 'Plague', 'bonuses': {'+intelligence': 15},
        'action': {'type': 'spell', 'tags': ['spell', 'blast'], 'height': 20, 'color': 'yellow', 'alpha': .4,
                   'bonuses': {'*power': .1, 'range': 10, 'power': ['{intelligence}'], 'area': [8, '+', ['{intelligence}', '/', '100']], 'areaCoefficient': 1, 'cooldown': 20, 'alwaysHits': 'Never misses',
                             'debuff': {'tags': ['debuff'], 'bonuses': {'+damageOverTime': ['{this.power}'], 'duration': 0}}},
        'helpText': 'Apply a permanent debuff that deals damage over time to effected enemies.'}},
    // Tier 6 classes
    // Ninja
    'ninja': {'name': 'Ninjutsu', 'bonuses':{'$cloaking': 'Invisible while moving', '$oneHanded:doubleStrike': 'Attacks hit twice'}},
    'smokeBomb': {'name': 'Smoke Bomb', 'bonuses': {'+dexterity': 10},
        'reaction': {'type': 'criticalCounter', 'bonuses': {'dodgeAttack': 1, 'globalDebuff': {'tags': ['debuff'], 'bonuses': {'*accuracy': 0, 'duration': 5, 'area': 0}}, 'cooldown': 100},
            'helpText': 'If an attack would deal more than half of your remaining life, dodge it and throw a smoke bomb causing: {globalDebuff} to all enemies.'}},
    'throwWeapon': {'name': 'Throw Weapon', 'bonuses': {'+strength': 10},
        'action': {'type': 'attack', 'restrictions': ['melee'], 'tags': ['ranged'],
                    'bonuses': {'range': 12, 'attackPower': 1.5, 'cooldown': 10, 'alwaysHits': 'Never misses'},
                    'helpText': 'Throw a copy of your weapon at a distant enemy.'}},
    'shadowClone': {'name': 'Shadow Clone', 'bonuses': {'+strength': 10, '+dexterity': 10},
        'reaction': {'type': 'clone',  'tags': ['minion'], 'bonuses': {'limit': 10, 'chance': .1, 'healthBonus': .1, 'damageBonus': .1, 'speedBonus': 1.2},
            'helpText': 'Chance to summon a weak clone of yourself on taking damage'}},
    // Enhancer
    'enhanceWeapon': {'name': 'Enhance Weapon', 'bonuses': {'+strength': 10, '+intelligence': 5}, 'action':
            {'type': 'effect', 'tags': ['spell'], 'target': 'self', 'bonuses': {'cooldown': 20,
                'buff': {'tags': ['buff'], 'bonuses': {'+damage': ['{strength}', '/', 10], '+magicDamage': ['{intelligence}', '/', 10], '+critDamage': ['{dexterity}', '/', 500], 'duration': 5, 'area': 0}}},
                'helpText': 'Enhance the strength of your weapon granting: {buff}'}},
    'enhanceArmor': {'name': 'Enhance Armor', 'bonuses': {'+strength': 5, '+intelligence': 10}, 'action':
            {'type': 'effect', 'tags': ['spell'], 'target': 'self', 'bonuses': {'cooldown': 30,
                'buff': {'tags': ['buff'], 'bonuses': {'+armor': ['{strength}', '/', 10], '+magicBlock': ['{intelligence}', '/', 20], '+block': ['{intelligence}', '/', 10], '+evasion': ['{dexterity}', '/', 10], 'duration': 15, 'area': 0}}},
                'helpText': 'Enhance the strength of your armor granting: {buff}'}},
    'enhanceAbility': {'name': 'Enhance Ability', 'bonuses': {'+strength': 10, '+intelligence': 10}, 'action':
            {'type': 'effect', 'tags': ['spell'], 'target': 'self', 'bonuses': {'cooldown': 30,
                'buff': {'tags': ['buff'], 'bonuses': {'+cooldownReduction': .2, '*power': 1.2, '*attackPower': 1.2, '*range': 1.2, 'duration': 10, 'area': 0}}},
                'helpText': 'Enhance your own abilities granting: {buff}'}},
    // Sage
    'stopTime': {'name': 'Stop Time', 'bonuses': {'+intelligence': 10}, 'reaction':
            {'type': 'stop', 'tags': ['spell'], 'bonuses': {'duration': ['{intelligence}' , '/', '50'], 'cooldown': 120},
            'helpText': 'If an attack would deal more than half of your remaining life, negate it and cast a spell that stops time for everyone else.'}},
    'dispell': {'name': 'Dispell', 'bonuses': {'+intelligence': 15},
        'action': {'type': 'spell', 'tags': ['spell', 'blast'], 'height': 20, 'color': 'grey', 'alpha': .4,
                   'bonuses': {'*power': 0, 'range': 10, 'power': 0, 'area': [8, '+', ['{intelligence}', '/', '100']], 'cooldown': 15, 'alwaysHits': 'Never misses',
                    'debuff': {'tags': ['debuff'], 'bonuses': {'*magicResist': .5, '*magicBlock': .5, 'duration': 0}}},
        'helpText': 'Premanently reduce the magic resistances of all enemies in a large area.'}},
    'meteor': {'name': 'Meteor', 'bonuses': {'+intelligence': 20},
        'action': {'type': 'spell', 'tags': ['spell', 'rain'], 'height': 20, 'color': 'grey', 'alpha': .4, 'size': 20,
                   'bonuses': {'count': [1, '+', ['{intelligence}', '/', '100']], 'explode': 1, 'power': ['{intelligence}', '/', 2], 'area': [2, '+', ['{intelligence}', '/', '100']], 'cooldown': 15, 'alwaysHits': 'Never misses'},
        'helpText': 'Rain {count} meteors down on your enemies each dealing {power} damage.'}},
    'meteorShower': {'name': 'Meteor Shower', 'bonuses': {'+intelligence': 10, '+meteor:count': ['{intelligence}', '/', '50'], '-meteor:area': ['{intelligence}', '/', '200'], '-meteor:power': ['{intelligence}', '/', '4']},
        'helpText': 'Summon many more, but less powerful meteors.'},
    'meteorPower': {'name': 'Meteor Power', 'bonuses': {'+intelligence': 10, '-meteor:count': ['{intelligence}', '/', '200'], '+meteor:area': ['{intelligence}', '/', '50'], '+meteor:power': ['{intelligence}']},
        'helpText': 'Summon fewer, but much more powerful meteors.'},
    // Tier 7 classes
    // Master
    'equipmentMastery': {'name': 'Equipment Mastery', 'bonuses': {'+strength': 5, '+dexterity': 5, '+intelligence': 5, '$equipmentMastery': 'Equip gear beyond your level for a 5% penalty per level.'}},
    'abilityMastery': {'name': 'Ability Mastery', 'bonuses': {'+strength': 10, '+dexterity': 10, '+intelligence': 10, '+instantCooldownChance': .1}},
    // Fool
    'tomFoolery': {'name': 'Tom Foolery', 'bonuses': {'+evasion': 5}, 'reaction':
             {'type': 'dodge', 'bonuses': {'cooldown': 30, 'buff': {'tags': ['buff'], 'bonuses': {'*accuracy': 0, 'maxEvasion': 'Evasion checks are always perfect', 'duration': 5, 'area': 0}}}, 'helpText': 'Dodge an attack and gain: {buff}'}},
    'mimic': {'name': 'Mimic', 'reaction':
             {'type': 'mimic', 'bonuses': {}, 'helpText': 'Counter an enemy ability with a copy of that ability.'}},
    'decoy': {'name': 'Decoy', 'reaction':
            {'type': 'decoy',  'tags': ['minion'], 'bonuses': {'cooldown': 60, 'healthBonus': .4, 'damageBonus': .4, 'speedBonus': 1.2},
            'helpText': 'Dodge an attack and leave behind a decoy that explodes on death damaging all enemies.'}},
    'explode': {'name': 'Decoy Burst', 'reaction':
             {'type': 'explode', 'tags': ['ranged'], 'bonuses': {'power': '{maxHealth}', 'alwaysHits': 'Shrapnel cannot be evaded'}, 'helpText': 'Explode into shrapnel on death.'}},
    */
    // Monster abilities
    'summoner': {'name': 'Summoner', 'bonuses': {'*minion:limit': 2, '*minion:cooldown': .5, '*minion:healthBonus': 2, '*minion:damageBonus': 2}},
    'summonSkeleton': {'name': 'Summon Skeleton', 'bonuses': {'+intelligence': 5}, 'action':
            {'type': 'minion', 'target': 'none', 'monsterKey': 'skeleton', 'tags': ['spell'], 'bonuses': {'limit': 2, 'cooldown': 15, 'healthBonus': .5, 'damageBonus': 1, 'attackSpeedBonus': 1, 'speedBonus': 1}}},
    'summonCaterpillar': {'name': 'Spawn', 'action':
            {'type': 'minion', 'target': 'none', 'tags': ['pet'], 'monsterKey': 'caterpillar', 'bonuses': {'limit': 3, 'cooldown': 20, 'healthBonus': 1, 'damageBonus': 1, 'attackSpeedBonus': 1, 'speedBonus': 1}}},
    'rangeAndAttackSpeed': {'name': 'Range And Attack Speed', 'bonuses': {'+range': 2, '+attackSpeed': .5}}
};
var testJob;// = 'blackbelt';
var testAbilities = [];
//var testAbilities = [abilities.fireball, abilities.chainReaction, abilities.wizard];
//var testAbilities = [abilities.freeze, abilities.absoluteZero, abilities.wizard];
//var testAbilities = [abilities.storm, abilities.stormDuration, abilities.stormFrequency, abilities.wizard];
//var testAbilities = [abilities.fireball, abilities.chainReaction, abilities.wizard, abilities.freeze, abilities.absoluteZero, abilities.storm, abilities.stormDuration, abilities.stormFrequency];
//var testAbilities = [abilities.blinkStrike];
//var testAbilities = [abilities.soulStrike];
//var testAbilities = [abilities.pet, abilities.attackSong];
//var testAbilities = [abilities.pet, abilities.defenseSong];
//var testAbilities = [abilities.pet, abilities.heroSong];
//var testAbilities = [abilities.pet, abilities.attackSong, abilities.defenseSong, abilities.heroSong];
//var testAbilities = [abilities.sniper, abilities.snipe];
//var testAbilities = [abilities.majorStrength, abilities.dragonSlayer];
//var testAbilities = [abilities.raiseDead, abilities.plague];
//var testAbilities = [abilities.throwWeapon];
//var testAbilities = [abilities.enhanceWeapon, abilities.enhanceArmor, abilities.enhanceAbility];
//var testAbilities = [abilities.dispell, abilities.meteor];
//var testAbilities = [abilities.majorIntelligence, abilities.majorIntelligence, abilities.meteor, abilities.meteorRain, abilities.meteorPower];
//var testAbilities = [abilities.majorIntelligence, abilities.majorIntelligence, abilities.meteor, abilities.meteorPower];
//var testAbilities = [abilities.protect, abilities.enhanceWeapon];
//var testAbilities = [abilities.overpower];
//var testAbilities = [abilities.cull, abilities.cripple];
//var testAbilities = [abilities.vitality, abilities.consume];
//var testAbilities = [abilities.pet, abilities.attackSong, abilities.protect, abilities.raiseDead];
//var testAbilities = [abilities.aiming, abilities.snipe];
//var testAbilities = [abilities.armorPenetration];
//var testAbilities = [abilities.armorPenetration, abilities.abilityMastery, abilities.fireball];
$.each(abilities, function (key, ability) {
    ability.key = key;
    if (ability.action) {
        ability.action.name = ability.name;
        ability.action.key = key;
    }
    if (ability.reaction) {
        ability.reaction.name = ability.name;
        ability.reaction.key = key;
    }
});