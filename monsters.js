
var enchantedMonsterBonuses = {'bonuses': {'*maxHealth': 1.5, '*damage': 1.5, '*xpValue': 3, '*coins': 2, '*anima': 3, '$tint': '#af0', '$color': '#af0'}};
var imbuedMonsterBonuses = {'bonuses': {'*maxHealth': 2, '*damage': 2, '*xpValue': 10, '*coins': 6, '*anima': 10, '$tint': '#c6f', '$color': '#c6f'}};
// To make bosses intimidating, give them lots of health and damage, but to keep them from being overwhelming,
// scale down their health regen, attack speed and critical multiplier.
var bossMonsterBonuses = {'bonuses': {'*maxHealth': [2.5, '+', ['{level}', '/', 2]], '*damage': 2, '*attackSpeed': .75, '*critDamage': .5, '*critChance': .5, '*evasion': .5,
                            '*healthRegen': .3, '*xpValue': 4, '+coins': 2, '*coins': 4, '+anima': 1, '*anima': 4,
                            '$uncontrollable': 'Cannot be controlled.', '$tint': 'red'}};
var monsterPrefixes = [
    [
        {'name': 'Hawkeye', 'bonuses': {'+accuracy': [5, 10]}},
        {'name': 'Giant', 'bonuses': {'*maxHealth': 2, '*scale': 1.3}}
    ],
    [
        {'name': 'Eldritch', 'bonuses': {'+magicDamage': [1, 2], '*magicDamage': [2, 3]}}
    ],
    [
        {'name': 'Telekenetic', 'bonuses': {'+range': [3, 5]}}
    ],
    [
        {'name': 'Frenzied', 'bonuses': {'*speed': [15, 20, 10], '*attackSpeed': [15, 20, 10]}}
    ],
    [
        {'name': 'Lethal', 'bonuses': {'+critChance': [10, 20, 100], '+critDamage': [20, 50, 100], '+critAccuracy': [20, 50, 100]}}
    ]
];
var monsterSuffixes = [
    [
        {'name': 'Frost', 'bonuses': {'+slowOnHit': [1, 2, 10]}},
        {'name': 'Confusion', 'bonuses': {'+damageOnMiss': [2, 3]}}
    ],
    [
        {'name': 'Healing', 'bonuses': {'+healthRegen': [1, 2]}}
    ],
    [
        {'name': 'Shadows', 'bonuses': {'+evasion': [3, 5]}}
    ],
    [
        {'name': 'Stealth', 'bonuses': {'$cloaking': true}}
    ]
];

function makeMonster(monsterData, level, extraSkills, noRarity) {
    var monster = {
        'level': level,
        'slow': 0,
        'equipment': {},
        'attackCooldown': 0,
        'prefixes': [],
        'suffixes': [],
        'extraSkills': ifdefor(extraSkills, []),
        'percentHealth': 1,
        'helpMethod': actorHelpText
    };
    var baseMonster;
    if (typeof(monsterData) == 'string') {
        baseMonster = monsters[monsterData];
        if (!baseMonster) {
            throw new Error('Invalid monster key ' + monsterData);
        }
    } else if (typeof(monsterData) == 'object') {
        baseMonster = monsters[monsterData.key];
        if (monsterData.bonuses) {
            monster.extraSkills.push({'bonuses': monsterData.bonuses});
        }
    }
    if (!baseMonster) {
        console.log(baseMonster);
        console.log(monsterData);
        throw new Error('could not determine base monster type');
    }
    monster.base = baseMonster;
    monster.stationary = ifdefor(baseMonster.stationary);
    /* $.each(baseMonster, function (key, value) {
        monster[key] = value;
    }); */

    if (!ifdefor(noRarity)) {
        var rarity = (Math.random() < .25) ? (Math.random() * level * .6) : 0;
        if (rarity < 1) {

        } else if (rarity < 3) {
            if (Math.random() > .5) addMonsterPrefix(monster);
            else addMonsterSuffix(monster);
        } else if (rarity < 10) {
            addMonsterPrefix(monster);
            addMonsterSuffix(monster);
        } else if (rarity < 20) {
            addMonsterPrefix(monster);
            addMonsterSuffix(monster);
            if (Math.random() > .5) addMonsterPrefix(monster);
            else addMonsterSuffix(monster);
        } else {
            addMonsterPrefix(monster);
            addMonsterSuffix(monster);
            addMonsterPrefix(monster);
            addMonsterSuffix(monster);
        }
    }
    monster.allEffects = [];
    monster.minionBonusSources = [];
    updateMonster(monster);
    return monster;
}
function addMonsterPrefix(monster) {
    var alreadyUsed = [];
    monster.prefixes.forEach(function (affix) {alreadyUsed.push(affix.base);});
    monster.prefixes.push(makeAffix(Random.element(matchingMonsterAffixes(monsterPrefixes, monster, alreadyUsed))));
}
function addMonsterSuffix(monster) {
    var alreadyUsed = [];
    monster.suffixes.forEach(function (affix) {alreadyUsed.push(affix.base);});
    monster.suffixes.push(makeAffix(Random.element(matchingMonsterAffixes(monsterSuffixes, monster, alreadyUsed))));
}
function matchingMonsterAffixes(list, monster, alreadyUsed) {
    var choices = [];
    for (var level = 0; level < monster.level && level < list.length; level++) {
        list[level].forEach(function (affix) {
            if (alreadyUsed.indexOf(affix) < 0) {
                choices.push(affix);
            }
        });
    }
    return choices;
}
function updateMonster(monster) {
    // Clear the character's bonuses and graphics.
    initializeVariableObject(monster, monster.base, monster);
    addBonusSourceToObject(monster, {'bonuses': monster.base.implicitBonuses});
    addBonusSourceToObject(monster, {'bonuses': getMonsterBonuses(monster)});
    addBonusSourceToObject(monster, coreStatBonusSource);
    monster.actions = [];
    monster.reactions = [];
    monster.onHitEffects = [];
    monster.onCritEffects = [];
    monster.tags = recomputActorTags(monster);
    var enchantments = monster.prefixes.length + monster.suffixes.length;
    monster.image = monster.base.source.image.normal;
    if (enchantments > 2) {
        addBonusSourceToObject(monster, imbuedMonsterBonuses);
    } else if (enchantments) {
        addBonusSourceToObject(monster, enchantedMonsterBonuses);
    }
    ifdefor(monster.extraSkills, []).concat(ifdefor(monster.base.abilities, [])).forEach(function (ability) {
        addBonusSourceToObject(monster, ability);
        addActions(monster, ability);
    });
    var name =  monster.base.name;
    var prefixNames = [];
    monster.prefixes.forEach(function (affix) {
        prefixNames.push(affix.base.name);
        addBonusSourceToObject(monster, affix);
        addActions(monster, affix);
    });
    if (prefixNames.length) {
        name = prefixNames.join(', ') + ' ' + name;
    }
    var suffixNames = []
    monster.suffixes.forEach(function (affix) {
        suffixNames.push(affix.base.name);
        addBonusSourceToObject(monster, affix);
        addActions(monster, affix);
    });
    if (suffixNames.length) {
        name = name + ' of ' + suffixNames.join(' and ');
    }
    monster.name = name;
    // Add the character's current equipment to bonuses and graphics
    equipmentSlots.forEach(function (type) {
        var equipment = ifdefor(monster.equipment[type]);
        if (!equipment) {
            return;
        }
        addBonusSourceToObject(monster, equipment.base);
        addActions(monster, equipment.base);
        equipment.prefixes.forEach(function (affix) {
            addBonusSourceToObject(monster, affix);
            addActions(monster, affix);
        })
        equipment.suffixes.forEach(function (affix) {
            addBonusSourceToObject(monster, affix);
            addActions(monster, affix);
        })
    });
    addActions(monster, abilities.basicAttack);
    recomputeDirtyStats(monster);
    //console.log(monster);
}
var monsters = {};
function addMonster(key, data) {
    data.key = key;
    data.variableObjectType = 'actor';
    monsters[key] = data;
}
function enemySheet(key) {
    return {
        'normal': images[key],
        //'enchanted': images[key + '-enchanted'],
        //'imbued': images[key + '-imbued'],
    }
}
function getMonsterBonuses(monster) {
    var growth = monster.level - 1;
    return {
        // Health scales linearly to level 10, then 10% a level.
        '+maxHealth': (growth <= 10) ? (10 + 20 * growth) : 200 * Math.pow(1.1, growth - 10),
        '+range': 1,
        '+minPhysicalDamage': Math.round(.9 * (5 + 6 * growth)),
        '+maxPhysicalDamage': Math.round(1.1 * (5 + 6 * growth)),
        '+minMagicDamage': Math.round(.9 * (1 + 1.5 * growth)),
        '+maxMagicDamage': Math.round(1.1 * (1 + 1.5 * growth)),
        '+critChance': .05,
        '+critDamage': .5,
        '+critAccuracy': 1,
        '+attackSpeed': 1 + .05 * growth,
        '+speed': 100,
        '+accuracy': 4 + 5 * growth,
        '+evasion': 1 + growth,
        '+block': 2 * growth,
        '+magicBlock': growth,
        '+armor': 2 * growth,
        '+magicResist': .001 * growth,
        '+strength': 5 * growth,
        '+intelligence': 5 * growth,
        '+dexterity': 5 * growth,
        '+coins': Random.range(1, Math.floor(Math.pow(1.25, growth + 1) * 4)),
        '+anima': Random.range(1, Math.floor(Math.pow(1.25, growth + 1))),
        '$color': 'red',
        '+scale': 1
    };
}
function initalizeMonsters() {
    var caterpillarSource = {'image': enemySheet('gfx/caterpillar.png'), 'offset': 0, 'width': 48, 'flipped': true, frames: 4};
    var gnomeSource = {'image': enemySheet('gfx/gnome.png'), 'offset': 0, 'width': 32, 'flipped': false, frames: 4};
    var skeletonSource = {'image': enemySheet('gfx/skeletonSmall.png'), 'offset': 0, 'width': 48, 'flipped': true, frames: 7};
    var butterflySource = {'image': enemySheet('gfx/caterpillar.png'), 'offset': 4 * 48, 'width': 48, 'flipped': true, frames: 4};
    var skeletonGiantSource = {'image': enemySheet('gfx/skeletonGiant.png'), 'offset': 0, 'width': 48, 'flipped': true, frames: 7};
    var dragonSource = {'image': enemySheet('gfx/dragonEastern.png'), 'offset': 0, 'width': 48, 'flipped': false, frames: 5};
    var batSource = {'image': enemySheet('gfx/bat.png'), 'offset': 0, 'width': 32, 'height': 32, 'flipped': false, frames: 5, 'y': 20};
    var spiderSource = {'image': enemySheet('gfx/spider.png'), 'offset': 0, 'width': 48, 'height': 48, 'flipped': true, 'y': -10,
            framesPerRow: 10, walkFrames: [4, 5, 6, 7, 8, 9], attackFrames: [2, 3, 0, 1], deathFrames: [10, 11, 12, 13]};
    var wolfSource = {'image': enemySheet('gfx/wolf.png'), 'offset': 0, 'width': 64, 'height': 32, 'flipped': true,
            framesPerRow: 7, walkFrames: [0, 1, 2, 3], attackFrames: [6, 4, 5, 0], deathFrames: [0, 7, 8, 9]};
    addMonster('dummy', {
        'name': 'Dummy', 'source': caterpillarSource,
        'implicitBonuses': {'+magicDamage': 2}
    });
    addMonster('spider', {
        'name': 'Spider', 'source': spiderSource,
        'implicitBonuses': {'*evasion': 1.2, '*accuracy': .8, '*damage': 1.2, '+range': .5, '*speed': 1.3, '*scale': .75},
        'abilities': [abilities.poison]
    });
    addMonster('jumpingSpider', {
        'name': 'Jumping Spider', 'source': spiderSource,
        'implicitBonuses': {'*evasion': 1.2, '*accuracy': .8, '*damage': 1.4, '*speed': 1.5, '*scale': .75},
        'abilities': [abilities.blinkStrike]
    });
    addMonster('wolf', {
        'name': 'Wolf', 'source': wolfSource,
        'implicitBonuses': {'*maxHealth': 1.5, '*magicDamage': 0, '*accuracy': 1.5, '+critChance': .1, '*speed': 2, '*scale': .75}
    });
    addMonster('giantSpider', {
        'name': 'Giant Spider', 'source': spiderSource,
        'implicitBonuses': {'+weaponRange': 12, '*evasion': .8, '*accuracy': .8, '*damage': 1.4, '+critChance': .25, '*scale': 1.15},
        'tags': ['ranged'],
        'abilities': [abilities.net, abilities.dodge, abilities.acrobatics, abilities.reflect, abilities.dodgeNetReflect, abilities.poison]
    });
    addMonster('bat', {
        'name': 'Bat', 'source': batSource,
        'implicitBonuses': {'*evasion': 1.2, '*accuracy': 1.2, '*damage': .6, '*speed': 2.5}
    });
    addMonster('vampireBat', {
        'name': 'Vampire Bat', 'source': batSource,
        'implicitBonuses': {'*evasion': 1.2, '*accuracy': 1.2, '*damage': .8, '*speed': 2.5, '*scale': 1.25},
        'abilities': [abilities.darkknight, abilities.distract, abilities.drainLife]
    });
    addMonster('caterpillar', {
        'name': 'Caterpillar', 'source': caterpillarSource,
        'implicitBonuses': {'*magicDamage': 0, '+damage': 1,
                            '*block': .5, '+magicBlock': 6, '*magicBlock': 2, '+magicResist': .66,
                            '*speed': .5}
    });
    addMonster('spongeyCateripllar', {
        'name': 'Armorpede', 'source': caterpillarSource,
        'implicitBonuses': {'*magicDamage': 0, '*damage': 0.5, '*maxHealth': 3,
                            '*armor': 1.5, '+magicBlock': 6, '*magicBlock': 2, '+magicResist': 0.75,
                            '*speed': 0.5},
        'abilities': [abilities.vitality, abilities.majorStrength]
    });
    addMonster('stealthyCateripllar', {
        'name': 'The Very Stealth Caterpillar', 'source': caterpillarSource,
        'implicitBonuses': {'*magicDamage': 0, '*scale': .1, '+scale': ['{maxHealth}', '/', ['{level}', '*', '10']],
                            '*block': .5, '+magicBlock': 4, '*magicBlock': 2, '+magicResist': .5,
                            '*speed': .2},
        'abilities': [abilities.stealth, abilities.darkknight, abilities.vitality, abilities.vitality, abilities.majorStrength]
    });
    // Gnomes are vulnerable to magic damage, strong against physical damage, and deal ranged magic damage.
    // Designed to favor mage classes.
    addMonster('gnome', {'name': 'Gnome', 'source': gnomeSource, 'fpsMultiplier': 1.5,
        'implicitBonuses': {'+weaponRange': 4, '*attackSpeed': 1.5, '+magicDamage': 4, '*magicDamage': 1.5,
                            '+block': 3, '+armor': 4, '*armor': 2, '*block': 2, '*magicBlock': 0, '*magicResist': 0,
                            '*speed': .4}, 'tags': ['ranged']
    });
    addMonster('gnomecromancer', {'name': 'Gnomecromancer', 'source': gnomeSource, 'fpsMultiplier': 1.5,
        'implicitBonuses': {'+weaponRange': 2, '*attackSpeed': 1.5, '+magicDamage': 4, '*magicDamage': 1.5,
                            '+block': 4, '+armor': 4, '*armor': 2, '*block': 2, '*magicBlock': 0, '*magicResist': 0,
                            '*speed': .4},
        'abilities': [abilities.summonSkeleton, abilities.summoner], 'tags': ['ranged']
    });
    addMonster('gnomeCleric', {'name': 'Gnome Cleric', 'source': gnomeSource, 'fpsMultiplier': 1.5,
        'implicitBonuses': {'+weaponRange': 2, '*attackSpeed': 1.5, '+magicDamage': 4, '*magicDamage': 1.5,
                            '*intelligence': 2,
                            '+block': 4, '+armor': 4, '*armor': 2, '*block': 2, '*magicBlock': 0, '*magicResist': 0,
                            '*speed': .4},
        'abilities': [abilities.spellAOE, abilities.protect, abilities.heal, abilities.minorIntelligence], 'tags': ['ranged']
    });
    addMonster('gnomeWizard', {'name': 'Gnome Wizard', 'source': gnomeSource, 'fpsMultiplier': 1.5,
        'implicitBonuses': {'+weaponRange': 2, '*attackSpeed': 1.5, '+magicDamage': 4, '*magicDamage': 1.5,
                            '+block': 4, '+armor': 4, '*armor': 2, '*block': 2, '*magicBlock': 0, '*magicResist': 0,
                            '*speed': .4},
        'abilities': [abilities.fireball, abilities.freeze, abilities.wizard], 'tags': ['ranged']
    });
    addMonster('skeleton', {'name': 'Skeleton', 'source': skeletonSource,
        // Fast to counter ranged heroes, low range+damage + fast attacks to be weak to armored heroes.
        'implicitBonuses': {'+weaponRange': -.5, '+accuracy': 2, '*attackSpeed': 2, '*magicDamage': 0,
                            '*evasion': 1.5, '*magicBlock': 0, '*magicResist': 0,
                            '*speed': 2},
        'abilities': [abilities.sideStep]
    });
    addMonster('skeletalBuccaneer', {'name': 'Skeletal Buccaneer', 'source': skeletonSource,
        // Deflect to counter ranged champions.
        'implicitBonuses': {'+weaponRange': -.5, '*minPhysicalDamage': .4, '*maxPhysicalDamage': .4, '+accuracy': 2, '*attackSpeed': 2, '*magicDamage': 0,
                            '*block': 0, '+armor': 2, '*magicBlock': 0, '*magicResist': 0,
                            '*speed': 1, 'scale': 1.5},
        'abilities': [abilities.deflect, abilities.deflectDamage, abilities.sage, abilities.majorDexterity]
    });
    addMonster('undeadPaladin', {'name': 'Undead Paladin', 'source': skeletonSource,
        // Deflect to counter ranged champions.
        'implicitBonuses': {'*minPhysicalDamage': .4, '*maxPhysicalDamage': .4, '+accuracy': 2, '*attackSpeed': 2,
                            '*block': 1.5, '+armor': 2, '*magicBlock': 1.5, '*magicResist': 0,
                            '*speed': 1, '*scale': 1.5},
        'abilities': [abilities.reflect, abilities.majorIntelligence, abilities.aegis, abilities.heal]
    });
    addMonster('undeadWarrior', {'name': 'Undead Warrior', 'source': skeletonSource,
        // Fast to counter ranged heroes, low range+damage + fast attacks to be weak to armored heroes.
        'implicitBonuses': {'+weaponRange': -.5, '*minPhysicalDamage': .4, '*maxPhysicalDamage': .4, '+accuracy': 2, '*attackSpeed': 2, '*magicDamage': 0,
                            '*block': 0, '+armor': 2, '*magicBlock': 0, '*magicResist': 0,
                            '*speed': 2},
        'abilities': [abilities.blinkStrike, abilities.soulStrike, abilities.majorStrength, abilities.vitality]
    });
    //console.log(JSON.stringify(makeMonster('skeleton', 1)));
    addMonster('butterfly', {'name': 'Butterfly', 'source': butterflySource,
        'implicitBonuses': {'*maxHealth': 1.5, '+weaponRange': 4, '+critChance': .05, '+critDamage': .1, '+critAccuracy': .5, '*accuracy': 2,
                            '*magicDamage': .4, '*damage': .8,
                            '*block': 0, '*armor': .5, '*magicBlock': 1.5, '*magicResist': 0,
                            '*speed': .6}, 'tags': ['ranged']
    });
    addMonster('battlefly', {'name': 'Battlefly', 'source': butterflySource,
        'implicitBonuses': {'*maxHealth': 2, '+weaponRange': 5, '+critChance': .05, '+critDamage': .1, '+critAccuracy': .5, '*accuracy': 2,
                            '*magicDamage': 0,
                            '*block': 0, '*armor': .5, '*magicBlock': 1.5, '*magicResist': 0,
                            '*speed': .6}, 'tags': ['ranged'],
        'abilities': [abilities.powerShot, abilities.powerShotKnockback]
    });
    addMonster('motherfly', {'name': 'Motherfly', 'source': butterflySource,
        'implicitBonuses': {'+maxHealth': 20, '*maxHealth': 3, '+weaponRange': 5, '+critChance': .05, '+critDamage': .1, '+critAccuracy': .5, '*accuracy': 2,
                            '*minPhysicalDamage': .8, '*maxPhysicalDamage': .8, '*attackSpeed': .5, '*magicDamage': .5,
                            '*block': 0, '*armor': .5, '*magicBlock': 1.5, '*magicResist': 0,
                            '*speed': .6}, 'tags': ['ranged'],
        'abilities': [abilities.summonCaterpillar, abilities.summoner]
    });
    addMonster('lightningBug', {'name': 'Lightning Bug', 'source': butterflySource,
        'implicitBonuses': {'*maxHealth': 1.5, '+weaponRange': 4, '+critChance': .05, '+critDamage': .1, '+critAccuracy': .5, '*accuracy': 2,
                            '*minPhysicalDamage': .8, '*maxPhysicalDamage': .8, '*attackSpeed': .5, '*magicDamage': .5,
                            '*block': 0, '*armor': .5, '*magicBlock': 1.5, '*magicResist': 0,
                            '*speed': .6}, 'tags': ['ranged'],
        'abilities': [abilities.storm]
    });
    addMonster('giantSkeleton', {'name': 'Skelegiant', 'source': skeletonGiantSource,
        'implicitBonuses': {'*maxHealth': 2, '+critDamage': .5, '*magicDamage': 0, '*accuracy': 2,
                            '*evasion': .5, '*block': 0, '*armor': .5, '*magicBlock': 0, '*magicResist': 0}
    });
    addMonster('skeletonOgre', {'name': 'Skeleton Ogre', 'source': skeletonGiantSource,
        'implicitBonuses': {'*maxHealth': 3, '+critDamage': .5, '*magicDamage': 0, '*accuracy': 2,
                            '*evasion': .5, '*block': 0, '*armor': .5, '*magicBlock': 0, '*magicResist': 0},
        'abilities': [abilities.hook, abilities.hookRange, abilities.hookStun, abilities.dodge, abilities.acrobatics, abilities.acrobatics, abilities.dodgeHook, abilities.deflect]
    });
    addMonster('butcher', {'name': 'Butcher', 'source': skeletonGiantSource,
        'implicitBonuses': {'*maxHealth': 3, '+critDamage': .5, '*magicDamage': 0, '*accuracy': 2,
                            '*evasion': .5, '*block': 0, '*armor': .5, '*magicBlock': 0, '*magicResist': 0},
        'abilities': [abilities.hook]
    });
    addMonster('frostGiant', {'name': 'Frost Giant', 'source': skeletonGiantSource,
        'implicitBonuses': {'*maxHealth': 2, '+critDamage': .5, '*magicDamage': 0, '*accuracy': 2,
                            '*evasion': .5, '*block': 0, '*armor': .5, '*magicBlock': 0, '*magicResist': 0},
        'abilities': [abilities.freeze]
    });
    addMonster('dragon', {'name': 'Dragon', 'source': dragonSource, 'stationary': true, // speed still effects animation
        'implicitBonuses': {'*maxHealth': 1.6, '+weaponRange': 8, '+critChance': .15, '*accuracy': 2,
                            '*evasion': .5, '*block': 0, '*armor': .5, '*magicBlock': 2, '+magicResist': .5,
                            '*speed': 2}, 'tags': ['ranged'],
        'abilities': [abilities.fireball, abilities.sideStep]
    });
}