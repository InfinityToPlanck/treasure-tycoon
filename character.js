var personFrames = 7;
var clothes = [1, 3];
var hair = [clothes[1] + 1, clothes[1] + 4];
var names = ['Chris', 'Leon', 'Hillary', 'Michelle', 'Rob', 'Reuben', 'Kingston', 'Silver'];
var walkLoop = [0, 1, 2, 3];
var fightLoop = [4, 5, 6];
var pointsTypes = ['coins', 'anima', 'fame'];
var allComputedStats = ['cloaking', 'dexterity', 'strength', 'intelligence', 'maxHealth', 'speed',
     'coins', 'xpValue', 'anima',
     'evasion', 'block', 'magicBlock', 'armor', 'magicResist', 'accuracy', 'range', 'attackSpeed',
     'minDamage', 'maxDamage', 'minMagicDamage', 'maxMagicDamage',
     'critChance', 'critDamage', 'critAccuracy',
     'damageOnMiss', 'slowOnHit', 'healthRegen', 'healthGainOnHit',
     'increasedDrops', 'increasedExperience'];
var allRoundedStats = ['dexterity', 'strength', 'intelligence', 'maxHealth', 'speed',
     'coins', 'xpValue', 'anima',
     'evasion', 'block', 'magicBlock', 'armor', 'accuracy',
     'minDamage', 'maxDamage', 'minMagicDamage', 'maxMagicDamage'];

function displayInfoMode(character) {
    character.adventurer.health = character.adventurer.maxHealth;
    character.adventurer.attackCooldown = 0;
    character.adventurer.target = null;
    character.adventurer.slow = 0;
    character.$panel.find('.js-adventureMode').hide();
    var $infoPanel = character.$panel.find('.js-infoMode');
    $infoPanel.show();
    var currentLevelIndex = character.currentLevelIndex;
    character.area = null;
    character.currentLevelIndex = null;
    refreshStatsPanel(character);
    character.$panel.find('.js-recall').prop('disabled', true);
    updateSkillButtons(character);
    if (character.replay) {
        startArea(character, currentLevelIndex);
    }
}
function refreshStatsPanel(character) {
    var adventurer = character.adventurer;
    var $statsPanel = character.$panel.find('.js-infoMode .js-stats');
    character.$panel.find('.js-name').text(adventurer.job.name + ' ' + adventurer.name);
    character.$panel.find('.js-level').text(adventurer.level);
    character.$panel.find('.js-infoMode .js-dexterity').text(adventurer.dexterity.format(0));
    character.$panel.find('.js-infoMode .js-strength').text(adventurer.strength.format(0));
    character.$panel.find('.js-infoMode .js-intelligence').text(adventurer.intelligence.format(0));
    $statsPanel.find('.js-toLevel').text(adventurer.xpToLevel - adventurer.xp);
    $statsPanel.find('.js-maxHealth').text(adventurer.maxHealth.format(0));
    $statsPanel.find('.js-range').text(adventurer.range.format(2));
    $statsPanel.find('.js-speed').text(adventurer.speed.format(1));
    $statsPanel.find('.js-healthRegen').text(adventurer.healthRegen.format(1));
    updateDamageInfo(character);
}
function newCharacter(job) {
    var personCanvas = createCanvas(personFrames * 32, 64);
    var personContext = personCanvas.getContext("2d");
    personContext.imageSmoothingEnabled = false;
    var $newPlayerPanel = $('.js-playerPanelTemplate').clone()
        .removeClass('js-playerPanelTemplate').addClass('js-playerPanel').show();
    // The player template will be between the adventure panels and the hire adventure controls.
    $('.js-playerColumn .js-playerPanelTemplate').before($newPlayerPanel);
    var character = {};
    character.adventurer = makeAdventurer(job, 1, ifdefor(job.startingEquipment, {}));
    character.adventurer.character = character;
    character.adventurer.direction = 1; // Character moves left to right.
    character.adventurer.isMainCharacter = true;
    character.$panel = $newPlayerPanel;
    character.canvas = $newPlayerPanel.find('.js-adventureMode .js-canvas')[0];
    character.context = character.canvas.getContext("2d");
    character.context.imageSmoothingEnabled = false;
    character.previewContext = $newPlayerPanel.find('.js-infoMode .js-canvas')[0].getContext("2d"),
    character.previewContext.imageSmoothingEnabled = false;
    character.jewelsCanvas = $newPlayerPanel.find('.js-skillCanvas')[0];
    character.jewelsContext = character.jewelsCanvas.getContext("2d");
    character.boardCanvas = createCanvas(character.jewelsCanvas.width, character.jewelsCanvas.height);
    character.boardContext = character.boardCanvas.getContext("2d");
    character.lastTime = character.time = now();
    character.gameSpeed = 1;
    character.replay = false;
    character.levelsCompleted = {};
    character.previewContext.imageSmoothingEnabled = false;
    state.characters.push(character);
    $newPlayerPanel.data('character', character);
    $newPlayerPanel.find('.js-map').append($levelDiv(ifdefor(job.areaKey, 'meadow')));
    displayInfoMode(character);
    var abilityKey = ifdefor(abilities[job.key]) ? job.key : 'heal';
    character.adventurer.abilities.push(abilities[abilityKey]);
    character.board = readBoardFromData(job.startingBoard, character, abilities[abilityKey], true);
    centerShapesInRectangle(character.board.fixed.map(jewelToShape).concat(character.board.spaces), rectangle(0, 0, character.boardCanvas.width, character.boardCanvas.height));
    drawBoardBackground(character.boardContext, character.board);
    updateAdventurer(character.adventurer);
    ifdefor(job.loot, [simpleJewelLoot, simpleJewelLoot, simpleJewelLoot]).forEach(function (loot) {
        loot.generateLootDrop().gainLoot(character);
    });
}
function convertShapeDataToShape(shapeData) {
    return makeShape(shapeData.p[0], shapeData.p[1], (shapeData.t % 360 + 360) % 360, shapeDefinitions[shapeData.k][0], 30);
}
function makeAdventurer(job, level, equipment) {
    var personCanvas = createCanvas(personFrames * 32, 64);
    var personContext = personCanvas.getContext("2d");
    personContext.imageSmoothingEnabled = false;
    var adventurer = {
        'x': 0,
        'equipment': {},
        'job': job,
        'base': {
            'maxHealth': 20,
            'armor': 0,
            'speed': 250,
            'evasion': 1,
            'block': 1,
        },
        'width': 64,
        'bonuses': [],
        'unlockedAbilities': {},
        'abilities': [], //abilities.hook, abilities.hookRange1, abilities.hookRange2, abilities.hookDrag1, abilities.hookDrag2, abilities.hookPower
        'name': Random.element(names),
        'hairOffset': Random.range(hair[0], hair[1]),
        'level': level,
        'xp': 0,
        'xpToLevel': xpToLevel(0),
        'personCanvas': personCanvas,
        'personContext': personContext,
        'attackCooldown': 0
    };
    equipmentSlots.forEach(function (type) {
        adventurer.equipment[type] = null;
    });
    $.each(equipment, function (key, item) {
        item.crafted = true;
        state.craftingContext.fillStyle = 'green';
        state.craftingContext.fillRect(item.craftingX, item.craftingY, craftingSlotSize, craftingSlotSize);
        equipItem(adventurer, makeItem(item, 1));
    });
    drawCraftingViewCanvas();
    return adventurer;
}
function readBoardFromData(boardData, character, ability, confirmed) {
    return {
        'fixed': boardData.fixed.map(convertShapeDataToShape)
            .map(function(fixedJewelData) {
                var fixedJewel = makeFixedJewel(fixedJewelData, character, ability);
                fixedJewel.confirmed = ifdefor(confirmed, false);
                return fixedJewel;
            }),
        'spaces': boardData.fixed.concat(boardData.spaces).map(convertShapeDataToShape),
        'jewels': []
    };
}

function xpToLevel(level) {
    return (level + 1) * (level + 2) * 5;
}
function gain(pointsType, amount) {
    state[pointsType] += amount;
    changedPoints(pointsType);
}
function spend(pointsType, amount) {
    if (amount > state[pointsType]) {
        return false;
    }
    state[pointsType] -= amount;
    changedPoints(pointsType);
    return true;
}
function changedPoints(pointsType) {
    if (pointsType == 'fame') updateHireButton();
    else updateCraftButton();
    $('.js-' + pointsType).text(state[pointsType]);
}
function addBonusesAndAttacks(actor, source) {
    if (ifdefor(source.bonuses)) {
        actor.bonuses.push(source.bonuses);
    }
    if (ifdefor(source.attacks)) {
        source.attacks.forEach(function (baseAttack) {
            actor.attacks.push({'base': createAttack(baseAttack)});
        });
    }
}
var inheritedAttackStats = ['range', 'minDamage', 'maxDamage', 'minMagicDamage', 'maxMagicDamage',
    'accuracy', 'attackSpeed', 'critChance', 'critDamage', 'critAccuracy', 'damageOnMiss', 'slowOnHit', 'healthGainOnHit'];
function createAttack(data) {
    var stats = ifdefor(data.stats, {});
    var attack =  {'type': 'basic', 'tags': [], 'helpText': 'A basic attack.', 'stats': {'cooldown': 0}};
    $.each(data, function (key, value) {
        attack[key] = copy(value);
    });
    // Inherit stats from the base character stats by default.
    inheritedAttackStats.forEach(function (stat) {
        attack.stats[stat] = ['{' + stat + '}'];
    });
    $.each(stats, function (stat, value) {
        attack.stats[stat] = value;
    });
    return attack;
}
function updateAdventurer(adventurer) {
    // Clear the character's bonuses and graphics.
    adventurer.bonuses = [];
    adventurer.attacks = [];
    adventurer.tags = [];
    if (!adventurer.equipment.weapon) {
        // Fighting unarmed is considered using a fist weapon.
        adventurer.tags = ['fist', 'melee'];

        // You gain the unarmed tag if both hands are free.
        if (!adventurer.equipment.offhand) {
            adventurer.tags.push('unarmed');
        }
    } else {
        adventurer.tags.push(adventurer.equipment.weapon.base.type);
        adventurer.tags = adventurer.tags.concat(ifdefor(adventurer.equipment.weapon.base.tags, []));
    }

    var sectionWidth = personFrames * 32;
    var hat = adventurer.equipment.head;
    var hideHair = hat ? ifdefor(hat.base.hideHair, false) : false;
    adventurer.personContext.clearRect(0, 0, sectionWidth, 64);
    for (var i = 0; i < personFrames; i++) {
        adventurer.personContext.drawImage(images['gfx/person.png'], i * 32, 0 , 32, 64, i * 32, 0, 32, 64);
        if (!hideHair) {
            adventurer.personContext.drawImage(images['gfx/person.png'], i * 32 + adventurer.hairOffset * sectionWidth, 0 , 32, 64, i * 32, 0, 32, 64);
        }
    }
    adventurer.abilities.forEach(function (ability) {
        addBonusesAndAttacks(adventurer, ability);
    });
    if (adventurer.character) {
        adventurer.character.board.jewels.forEach(function (jewel) {
            adventurer.bonuses.push(jewel.bonuses);
            adventurer.bonuses.push(jewel.adjacencyBonuses);
        });
        // Don't show the offhand slot if equipped with a two handed weapon.
        adventurer.character.$panel.find('.js-offhand').toggle(!isTwoHandedWeapon(adventurer.equipment.weapon));
    }
    // Add the adventurer's current equipment to bonuses and graphics
    equipmentSlots.forEach(function (type) {
        var equipment = adventurer.equipment[type];
        if (!equipment) {
            return;
        }
        addBonusesAndAttacks(adventurer, equipment.base);
        equipment.prefixes.forEach(function (affix) {
            addBonusesAndAttacks(adventurer, affix);
        })
        equipment.suffixes.forEach(function (affix) {
            addBonusesAndAttacks(adventurer, affix);
        })
        if (equipment.base.offset) {
            for (var i = 0; i < personFrames; i++) {
                adventurer.personContext.drawImage(images['gfx/person.png'], i * 32 + equipment.base.offset * sectionWidth, 0 , 32, 64, i * 32, 0, 32, 64);
            }
        }
        if (ifdefor(adventurer.isMainCharacter)) {
            adventurer.character.$panel.find('.js-infoMode .js-equipment .js-' + type).append(equipment.$item);
        }
    });
    adventurer.attacks.push({'base': createAttack({'tags': adventurer.tags})});
    updateAdventurerStats(adventurer);
}
function updateAdventurerStats(adventurer) {
    adventurer.base.maxHealth = 10 * (adventurer.level + adventurer.job.dexterityBonus + adventurer.job.strengthBonus + adventurer.job.intelligenceBonus);
    adventurer.base.accuracy = 2 * adventurer.level;
    adventurer.base.evasion = adventurer.level;
    adventurer.base.block = adventurer.level;
    adventurer.base.magicBlock = adventurer.level / 2;
    adventurer.base.dexterity = adventurer.level * adventurer.job.dexterityBonus;
    adventurer.base.strength = adventurer.level * adventurer.job.strengthBonus;
    adventurer.base.intelligence = adventurer.level * adventurer.job.intelligenceBonus;
    adventurer.base.minDamage = 0;
    adventurer.base.maxDamage = 0;
    adventurer.base.range = 0;
    adventurer.base.attackSpeed = 0;
    adventurer.base.critChance = 0;
    adventurer.base.critDamage = .5;
    adventurer.base.critAccuracy = .5;
    if (!adventurer.equipment.weapon) {
        adventurer.base.minDamage = adventurer.level;
        adventurer.base.maxDamage = adventurer.level;
        adventurer.base.range = .5;
        adventurer.base.attackSpeed = 1;
        adventurer.base.critChance = .01;
    }
    allComputedStats.forEach(function (stat) {
        adventurer[stat] = getStat(adventurer, stat);
    });
    allRoundedStats.forEach(function (stat) {
        adventurer[stat] = Math.round(adventurer[stat]);
    });
    adventurer.attacks.forEach(function (attack) {
        $.each(attack.base.stats, function (stat) {
            attack[stat] = getStatForAttack(adventurer, attack.base, stat);
        });
        $.each(specialTraits, function (stat) {
            attack[stat] = getStatForAttack(adventurer, attack.base, stat);
        });
    });
    if (ifdefor(adventurer.isMainCharacter)) {
        refreshStatsPanel(adventurer.character);
    }
}
function getStat(actor, stat) {
    var base = ifdefor(actor.base[stat], 0), plus = 0, percent = 1, multiplier = 1;
    var baseKeys = [stat];
    if (stat === 'evasion' || stat === 'attackSpeed') {
        percent += .002 * actor.dexterity;
    }
    if (stat === 'maxHealth') {
        percent += .002 * actor.strength;
    }
    if (stat === 'block' || stat === 'magicBlock' || stat === 'accuracy') {
        percent += .002 * actor.intelligence;
    }
    if (stat === 'minDamage' || stat === 'maxDamage') {
        baseKeys.push('damage');
        percent += .002 * actor.strength;
        if (actor.tags.indexOf('ranged') >= 0) {
            plus += actor.dexterity / 10;
        } else {
            plus += actor.strength / 10;
        }
    }
    if (stat === 'healthRegen') {
        plus += .01 * actor.maxHealth;
    }
    if ((stat === 'minMagicDamage' || stat === 'maxMagicDamage')) {
        baseKeys.push('magicDamage');
        // Int boost to magic damage, but only for weapons/monsters tagged 'magic'.
        if (actor.tags.indexOf('magic') >= 0) {
            plus += actor.intelligence / 10;
        }
    }
    // For example, when calculating min magic damage for a wand user, we check for all the following:
    // minMagicDamage, magicDamage, wand:minMagicDamage, wand:magicDamage, ranged:minMagicDamage, ranged:magicDamage, etc
    var keys = baseKeys.slice();
    ifdefor(actor.tags, []).forEach(function (tagPrefix) {
        baseKeys.forEach(function(baseKey) {
            keys.push(tagPrefix + ':' + baseKey);
        });
    });
    actor.bonuses.concat(ifdefor(actor.timedEffects, [])).forEach(function (bonus) {
        keys.forEach(function (key) {
            plus += evaluateValue(actor, ifdefor(bonus['+' + key], 0));
            percent += evaluateValue(actor, ifdefor(bonus['%' + key], 0));
            multiplier *= evaluateValue(actor, ifdefor(bonus['*' + key], 1));
        });
    });
    //console.log(stat +": " + ['(',base, '+', plus,') *', percent, '*', multiplier]);
    return (base + plus) * percent * multiplier;
}
function getStatForAttack(actor, dataObject, stat) {
    var base = evaluateValue(actor, ifdefor(dataObject.stats[stat], 0)), plus = 0, percent = 1, multiplier = 1, found = false;
    if (typeof base === 'object' && base.constructor != Array) {
        var subObject = {};
        $.each(base.stats, function (key, value) {
            subObject[key] = getStatForAttack(actor, base, key);
        });
        return subObject;
    }
    // stats from skills are prefixed with 'skill:' always so they won't be effected
    // by bonuses to global characters stats. For instance, skill.attackSpeed: ['attackSpeed']
    // inherits the attackSpeed value from the skill user, so we don't want to apply
    // '*attackSpeed': 2 to it as this has already been applied to the base attackSpeed.
    var keys = ['skill:' + stat];
    ifdefor(dataObject.tags, []).concat([dataObject.type]).forEach(function (prefix) {
        keys.push(prefix + ':' + stat);
    });
    actor.bonuses.forEach(function (bonus) {
        keys.forEach(function (key) {
            plus += evaluateValue(actor, ifdefor(bonus['+' + key], 0));
            percent += evaluateValue(actor, ifdefor(bonus['%' + key], 0));
            multiplier *= evaluateValue(actor, ifdefor(bonus['*' + key], 1));
            if (ifdefor(bonus['$' + key])) {
                found = true;
            }
        });
    });
    if (found) {
        return true;
    }
    return (base + plus) * percent * multiplier;
}
function evaluateValue(actor, value) {
    if (typeof value === 'number') {
        return value;
    }
    if (typeof value === 'string' && value.charAt(0) === '{') {
        return actor[value.substring(1, value.length - 1)];
    }
    // If this is an object, just return it for further processing.
    if (value.constructor !== Array) {
        return value;
    }
    var formula = value;
    if (!formula || !formula.length) {
        throw new Error('Expected "formula" to be an array, but value is: ' + formula);
    }
    formula = formula.slice();
    value = evaluateValue(actor, formula.shift());
    while (formula.length > 1) {
        var operator = formula.shift();
        var operand = evaluateValue(actor, formula.shift());
        if (operator == '+') {
            value += operand;
        } else if (operator == '-') {
            value -= operand;
        } else if (operator == '*') {
            value *= operand;
        } else if (operator == '/') {
            value /= operand;
        }
    }
    return value;
}
function gainXP(adventurer, amount) {
    amount *= (1 + adventurer.increasedExperience);
    adventurer.xp = Math.min(adventurer.xp + amount, adventurer.xpToLevel);
}
function gainLevel(adventurer) {
    adventurer.level++;
    gain('fame', adventurer.level);
    adventurer.maxHealth += 5;
    adventurer.health = adventurer.maxHealth;
    adventurer.xp = 0;
    adventurer.xpToLevel = xpToLevel(adventurer.level);
    updateAdventurerStats(adventurer);
}
function addCharacterClass(name, dexterityBonus, strengthBonus, intelligenceBonus, startingEquipment, loot, areaKey) {
    var key = name.replace(/\s*/g, '').toLowerCase();
    characterClasses[key] = {
        'key': key,
        'name': name,
        'dexterityBonus': dexterityBonus,
        'strengthBonus': strengthBonus,
        'intelligenceBonus': intelligenceBonus,
        'startingEquipment': ifdefor(startingEquipment, {'weapon': itemsByKey.rock}),
        'startingBoard': ifdefor(classBoards[key], squareBoard),
        'loot': loot,
        'areaKey': ifdefor(areaKey, 'meadow')
    };
}


var characterClasses = {};
addCharacterClass('Fool', 0, 0, 0);

addCharacterClass('Juggler', 2, 1, 0, {'weapon': itemsByKey.ball, 'body': itemsByKey.woolshirt},
    [jewelLoot(['triangle'], [1, 1], [[10,15], [90, 100], [5, 10]], false), smallJewelLoot, smallJewelLoot], 'grove');
addCharacterClass('Black Belt', 0, 2, 1, {'body': itemsByKey.woolshirt},
    [jewelLoot(['triangle'], [1, 1], [[90, 100], [10,15], [5, 10]], false), smallJewelLoot, smallJewelLoot], 'meadow');
addCharacterClass('Priest', 1, 0, 2, {'weapon': itemsByKey.stick, 'body': itemsByKey.woolshirt},
    [jewelLoot(['triangle'], [1, 1], [[10,15], [5, 10], [90, 100]], false), smallJewelLoot, smallJewelLoot], 'cave');

addCharacterClass('Corsair', 2, 2, 1);
addCharacterClass('Paladin', 1, 2, 2);
addCharacterClass('Dancer', 2, 1, 2);

addCharacterClass('Ranger', 3, 1, 1);
addCharacterClass('Warrior', 1, 3, 1);
addCharacterClass('Wizard', 1, 1, 3);

addCharacterClass('Assassin', 3, 2, 1);
addCharacterClass('Dark Knight', 1, 3, 2);
addCharacterClass('Bard', 2, 1, 3);

addCharacterClass('Sniper', 4, 1, 2);
addCharacterClass('Samurai', 2, 4, 1);
addCharacterClass('Sorcerer', 1, 2, 4);

addCharacterClass('Ninja', 4, 4, 2);
addCharacterClass('Enhancer', 2, 4, 4);
addCharacterClass('Sage', 4, 2, 4);

addCharacterClass('Master', 4, 4, 4);

var ranks = [
    ['juggler', 'blackbelt', 'priest'],
    ['corsair', 'paladin', 'dancer'],
    ['ranger', 'warrior', 'wizard'],
    ['assassin', 'darkknight', 'bard'],
    ['sniper', 'samurai', 'sorcerer'],
    ['ninja', 'enhancer', 'sage'],
    ['master', 'fool']
];
function initializeJobs() {
    var $jobSelect = $('.js-jobSelect');
    var cost = 10;
    ranks.forEach(function (rankJobs, index) {
        $jobSelect.append($tag('option', '', 'Rank ' + (index + 1) + ' Adventurer').data('jobs', rankJobs).data('cost', cost));
        rankJobs.forEach(function (jobKey) {
            var jobData = characterClasses[jobKey];
            jobData.cost = cost;
            $jobSelect.append($tag('option', '', jobData.name).data('jobs', [jobKey]).data('cost', cost * rankJobs.length));
        });
        cost *= 10;
    });
    updateHireButton();
}
$('.js-jobSelect').on('change', updateHireButton);
function updateHireButton() {
    var $jobOption = $('.js-jobSelect').find(':selected');
    var cost = $jobOption.data('cost');
    $('.js-hire').text('Hire for ' + $jobOption.data('cost') + ' Fame!');
    $('.js-hire').toggleClass('disabled', (cost > state.fame));
}
$('.js-hire').on('click', function () {
    var $jobOption = $('.js-jobSelect').find(':selected');
    var cost = $jobOption.data('cost');
    if (!spend('fame', cost)) {
        return;
    }
    var jobKey = Random.element($jobOption.data('jobs'));
    newCharacter(characterClasses[jobKey]);
    updateRetireButtons();
});