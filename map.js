var editingMap = false;
$.each(map, function (levelKey, levelData) {
    levelData.levelKey = levelKey;
});

function exportMap() {
    var lines = [];
    Object.keys(map).sort().forEach(function (levelKey) {
        var levelData = map[levelKey];
        var levelLines = ["    '" + levelKey+"': {"];
        levelLines.push("        'name': " + JSON.stringify(levelData.name) + ",");
        levelLines.push("        'level': " + JSON.stringify(levelData.level) + ",");
        levelLines.push("        'x': " + JSON.stringify(levelData.x) + ", 'y': " + JSON.stringify(levelData.y) + ",");
        for (var key of ['background', 'unlocks', 'specialLoot', 'skill', 'board', 'enemySkills', 'monsters']) {
            levelLines.push("        '" + key + "': " + JSON.stringify(levelData[key]) + ",");
        }
        var eventLines = [];
        levelData.events.forEach(function (event) {
            eventLines.push("            " + JSON.stringify(event));
        })
        if (eventLines.length) {
            levelLines.push("        'events': [");
            levelLines.push(eventLines.join(",\n"));
            levelLines.push("        ]");
        } else {
            levelLines.push("        'events': []");
        }
        levelLines.push("    }");
        lines.push(levelLines.join("\n"));
    });
    return "var map = {\n" + lines.join(",\n") + "\n};\n";
}
function exportMapToTextArea() {
    if (!$('textarea').length) {
        $('body').append($tag('textarea').attr('rows', '5').attr('cols', 30));
    }
    $('textarea').val(exportMap());

}
function exportMapToClipboard() {
    var $textarea = $tag('textarea');
    $('body').append($textarea);
    $textarea.val(exportMap());
    $textarea[0].select();
    console.log('Attempting to export map to clipboard: ' + document.execCommand('copy'));
    $textarea.remove();
}

var mapCenteringTarget = null;
function updateMap() {
    if (draggedMap) {
        return;
    }
    var minX = minY = 1000000, maxX = maxY = -10000000;
    if (mapCenteringTarget) {
        minX = mapCenteringTarget.x * 40;
        maxX = minX + 40;
        minY = mapCenteringTarget.y * 40;
        maxY = minY + 40;
        // remove the mapTarget once we get close enough.
        if (mapCenteringTarget.left > mapWidth / 2 - 100
            && mapCenteringTarget.right < mapWidth / 2 + 100
            && mapCenteringTarget.top > mapHeight / 2 - 100
            && mapCenteringTarget.bottom < mapHeight / 2 + 100) {
            mapCenteringTarget = null;
        }
    } else {
        $.each(map, function (levelKey, levelData){
            if (!editingMap && !state.visibleLevels[levelKey]) {
                return;
            }
            minX = Math.min(levelData.x * 40, minX);
            minY = Math.min(levelData.y * 40, minY);
            maxX = Math.max(levelData.x * 40 + 40, maxX);
            maxY = Math.max(levelData.y * 40 + 40, maxY);
        });
    }
    if (mapLeft < minX - mapWidth / 2) {
        mapLeft = (mapLeft * 5 + minX - mapWidth / 2) / 6;
    }
    if (mapLeft > maxX - mapWidth / 2) {
        mapLeft = (mapLeft * 5 + maxX - mapWidth / 2) / 6;
    }
    if (mapTop < minY - mapHeight / 2) {
        mapTop = (mapTop * 5 + minY - mapHeight / 2) / 6;
    }
    if (mapTop > maxY - mapHeight / 2) {
        mapTop = (mapTop * 5 + maxY - mapHeight / 2) / 6;
    }
}
function centerMapOnLevel(levelData, instant) {
    if (ifdefor(instant)) {
        mapLeft = levelData.x * 40 + 20 - mapWidth / 2;
        mapTop = levelData.y * 40 + 20 - mapHeight / 2;
    } else {
        mapCenteringTarget = levelData;
    }
}

var mapLeft = -400, mapTop = -120, mapWidth = 800, mapHeight = 270;
var visibleNodes = {};
var selectedMapNodes = [];
var clickedMapNode = null;
var currentMapTarget = null;
function getMapPopupTarget(x, y) {
    var newMapTarget = null;
    if (!draggedMap) {
        newMapTarget = getMapPopupTargetProper(x, y);
    }
    if (newMapTarget !== currentMapTarget) {
        var level = newMapTarget ? (newMapTarget.isShrine ? newMapTarget.level.level : newMapTarget.level) : undefined;
        updateDamageInfo(state.selectedCharacter, $('.js-characterColumn .js-stats'), level);
    }
    currentMapTarget = newMapTarget;
    $('.js-mainCanvas').toggleClass('clickable', !!currentMapTarget);
    return currentMapTarget;
}
function getMapPopupTargetProper(x, y) {
    if (editingLevel) {
        return null;
    }
    var newMapTarget = getMapTarget(x, y);
    if (!newMapTarget) {
        return null;
    }
    if (ifdefor(newMapTarget.isShrine)) {
        newMapTarget.helpMethod = getMapShrineHelpText;
    } else {
        newMapTarget.helpMethod = getMapLevelHelpText;
    }
    return newMapTarget;
}

function getMapLevelHelpText(level) {
    var helpText;
    if (!editingMap) {
        helpText = '<p style="font-weight: bold">Level ' + level.level + ' ' + level.name + '</p><br/>';
    } else {
        helpText = '<p style="font-weight: bold">Level ' + level.level + ' ' + level.name +'(' + level.background +  ')</p><br/>';
        helpText += '<p><span style="font-weight: bold">Enemies:</span> ' + level.monsters.map(function (monsterKey) { return monsters[monsterKey].name;}).join(', ') + '</p>';
        if (level.events) {
            helpText += '<p><span style="font-weight: bold"># Events: </span> ' + level.events.length + '</p>';
            helpText += '<p><span style="font-weight: bold">Boss Event: </span> ' + level.events[level.events.length - 1].map(function (monsterKey) { return monsters[monsterKey].name;}).join(', ') + '</p>';
        } else {
            helpText += '<p style="font-weight: bold; color: red;">No Events!</p>';
        }
        helpText += '<p><span style="font-weight: bold">Enemy Skills:</span> ' + ifdefor(level.enemySkills, []).map(function (skillKey) { return abilities[skillKey].name;}).join(', ') + '</p>';
        helpText += '<br/><p style="font-weight: bold">Teaches:</p>';
        var skill = abilities[level.skill];
        if (skill) {
            helpText += abilityHelpText(skill, state.selectedCharacter);
        } else {
            helpText += '<p>No Skill</p>';
        }
    }
    return helpText;
}
function getMapShrineHelpText(shrine) {
    var skill = abilities[shrine.level.skill];
    var totalCost = totalCostForNextLevel(state.selectedCharacter, shrine.level);
    var helpText = ''
    if (state.selectedCharacter.currentLevelKey !== shrine.level.levelKey || !state.selectedCharacter.levelCompleted) {
        helpText += '<p style="font-size: 12">An adventurer can only visit the shrine for the last adventure they completed.</p><br/>';
    }
    if (state.selectedCharacter.adventurer.abilities.indexOf(skill) < 0  && state.selectedCharacter.divinity < totalCost) {
        helpText += '<p style="font-size: 12">' + state.selectedCharacter.adventurer.name + ' does not have enough divinity to learn the skill from this shrine.</p><br/>';
    }
    if (state.selectedCharacter.adventurer.abilities.indexOf(skill) < 0) {
        helpText += '<p style="font-weight: bold">Spend ' + totalCost + ' divinity at this shrine to level up and learn:</p>' + abilityHelpText(skill, state.selectedCharacter);
    } else {
        helpText += '<p style="font-size: 12px">' + state.selectedCharacter.adventurer.name + ' has already learned:</p>' + abilityHelpText(skill, state.selectedCharacter);
    }
    return helpText;
}

function getMapTarget(x, y) {
    var target = null;
    $.each(visibleNodes, function (levelKey, levelData){
        if (isPointInRect(x, y, levelData.left, levelData.top, levelData.width, levelData.height)) {
            target = levelData;
            return false;
        }
        if (!editingMap && levelData.shrine && isPointInRect(x, y, levelData.shrine.left, levelData.shrine.top, levelData.shrine.width, levelData.shrine.height)) {
            target = levelData.shrine;
            return false;
        }
        return true;
    });
    return target;
}

function updateMapKey(oldKey, newKey) {
    if (!map[oldKey]) return;
    $.each(map, function (key, level) {
        level.unlocks.forEach(function (value, index) {
            if (value === oldKey) {
                level.unlocks[index] = newKey;
            }
        })
    });
    var level = map[oldKey];
    level.levelKey = newKey;
    delete map[oldKey];
    map[newKey] = level;
}
function updateLevelKey(level) {
    if (!level) return;
    updateMapKey(level.levelKey, level.x + '_' + level.y);
}

function createNewLevel(x, y) {
    var tx = Math.floor((x + mapLeft) / 40);
    var ty = Math.floor((y + mapTop) / 40);
    var key = tx + '_' + ty;
    newMapTarget = {'x': tx, 'y': ty, 'levelKey': key, 'name': key, 'unlocks': [], 'level': 1, 'background': 'field', 'specialLoot': [], 'skill': null, 'board': null, 'enemySkills': [], 'monsters': ['skeleton'], 'events': [['dragon']]};
    // If there already happens to be a level with this key, update it.
    updateLevelKey(map[key]);
    map[key] = newMapTarget;
    selectedMapNodes = [newMapTarget];
}
function toggleLevelLink(levelA, levelB) {
    var index = levelA.unlocks.indexOf(levelB.levelKey);
    if (index >= 0) {
        levelA.unlocks.splice(index, 1);
    } else {
        levelA.unlocks.push(levelB.levelKey);
    }
}

var mapDragX = mapDragY = null, draggedMap = false;
var selectionStartPoint = null;
var originalSelectedNodes = [];
$('.js-mouseContainer').on('mousedown', '.js-mainCanvas', function (event) {
    var x = event.pageX - $(this).offset().left;
    var y = event.pageY - $(this).offset().top;
    draggedMap = false;
    if (editingMap) {
        var newMapTarget = getMapTarget(x, y);
        if (event.which === 3) {
            if (!newMapTarget) {
                createNewLevel(x, y)
            } else {
                clickedMapNode = newMapTarget;
                selectedMapNodes = [newMapTarget];
            }
        } else if (!event.shiftKey) {
            if (newMapTarget) {
                clickedMapNode = newMapTarget;
                if (selectedMapNodes.indexOf(newMapTarget) < 0) {
                    selectedMapNodes = [newMapTarget];
                }
            }
        } else {
            originalSelectedNodes = selectedMapNodes;
            selectionStartPoint = {'x': x, 'y': y};
        }
    }
    mapDragX = x;
    mapDragY = y;
});
$('.js-mouseContainer').on('dblclick', '.js-mainCanvas', function (event) {
    var x = event.pageX - $(this).offset().left;
    var y = event.pageY - $(this).offset().top;
    if (editingMap) {
        startEditingLevel(getMapTarget(x, y));
    }
});
/*$('.js-mouseContainer').on('click', '.js-mainCanvas', function (event) {
    console.log('click');
});*/
$(document).on('mouseup',function (event) {
    var x = event.pageX - $('.js-mainCanvas').offset().left;
    var y = event.pageY - $('.js-mainCanvas').offset().top;
    mapDragX = mouseDragY = null;
    arrowTargetX = arrowTargetY = null;
    if (editingMap) {
        if (event.which === 3 && clickedMapNode && draggedMap) {
            var unlockedLevel = getMapTarget(x, y);
            if (unlockedLevel) {
                toggleLevelLink(clickedMapNode, unlockedLevel);
            }
        }
        selectionStartPoint = null;
        clickedMapNode = null;
    }
    if (draggedMap) {
        draggedMap = false;
        return;
    }
    if (!editingMap) return;
    var x = event.pageX - $('.js-mainCanvas').offset().left;
    var y = event.pageY - $('.js-mainCanvas').offset().top;
    var newMapTarget = getMapTarget(x, y);
    if (newMapTarget) {
        if (event.shiftKey) {
            var index = selectedMapNodes.indexOf(newMapTarget);
            if (index >= 0) {
                selectedMapNodes.splice(index, 1);
            } else {
                selectedMapNodes.push(newMapTarget);
            }
        } else {
            selectedMapNodes = [newMapTarget];
        }
    } else {
        if (!event.shiftKey) {
            selectedMapNodes = [];
        }
    }
});
var arrowTargetX, arrowTargetY;
$('.js-mouseContainer').on('mousemove', '.js-mainCanvas', function (event) {
    if (!mouseDown) return;
    draggedMap = true;
    var x = event.pageX - $(this).offset().left;
    var y = event.pageY - $(this).offset().top;
    var tx = Math.floor((x + mapLeft) / 40);
    var ty = Math.floor((y + mapTop) / 40);
    if (editingMap) {
        if (selectionStartPoint) {
            var endPoint = {'x': x, 'y': y};
            var selectedRectangle = (rectangleFromPoints(selectionStartPoint, endPoint));
            selectedMapNodes = originalSelectedNodes.slice();
            $.each(visibleNodes, function (levelKey, levelData) {
                if (selectedMapNodes.indexOf(levelData) < 0 && rectanglesOverlap(selectedRectangle, levelData)) {
                    selectedMapNodes.push(levelData);
                }
            });
            drawRunningAnts(mainContext, selectedRectangle);
        } else if (event.which === 3 && clickedMapNode) {
            arrowTargetX = tx;
            arrowTargetY = ty;
        } else if (mapDragX !== null && mapDragY !== null) {
            if (clickedMapNode) {
                var dx = tx - clickedMapNode.x;
                var dy = ty - clickedMapNode.y;
                selectedMapNodes.forEach(function (mapNode) {
                    mapNode.x += dx;
                    mapNode.y += dy;
                    $.extend(mapNode, rectangle(mapNode.x * 40 - mapLeft, mapNode.y * 40 - mapTop, 40, 40));
                })
            } else {
                mapLeft += (mapDragX - x);
                mapTop += (mapDragY - y);
                mapDragX = x;
                mapDragY = y;
            }
        }
    } else if (mapDragX !== null && mapDragY !== null) {
        mapLeft += (mapDragX - x);
        mapTop += (mapDragY - y);
        mapDragX = x;
        mapDragY = y;
    }
});

function clickMapHandler(x, y) {
    if (editingMap) return;
    if (draggedMap) return;
    if (!currentMapTarget) return;
    if (currentMapTarget.isShrine && state.selectedCharacter.currentLevelKey === currentMapTarget.level.levelKey && state.selectedCharacter.board.boardPreview) {
        showContext('jewel');
    } else if (!currentMapTarget.isShrine && currentMapTarget.levelKey) {
        startArea(state.selectedCharacter, currentMapTarget.levelKey);
        currentMapTarget = null;
        $('.js-mainCanvas').toggleClass('clickable', false);
    }
}

function completeLevel(character) {
    // If the character beat the last adventure open to them, unlock the next one
    var level = map[character.currentLevelKey];
    increaseAgeOfApplications();
    var oldDivinityScore = ifdefor(character.divinityScores[character.currentLevelKey], 0);
    if (oldDivinityScore === 0) {
        character.fame += level.level;
        gain('fame', level.level);
        // Unlock the next areas.
        var levelData = map[character.currentLevelKey];
        levelData.unlocks.forEach(function (levelKey) {
            unlockMapLevel(levelKey);
        });
    }
    var numberOfWaves = Math.max(level.events.length,  Math.floor(5 * Math.sqrt(level.level))) + 1; // Count the chest as a wave.
    var timeBonus = (character.completionTime <= numberOfWaves * (5 + level.level / 2)) ? 1.2 : (character.completionTime <= numberOfWaves * (10 + level.level / 2)) ? 1 : .8;
    var newDivinityScore = Math.round(timeBonus * baseDivinity(level.level));
    character.divinity += Math.max(0, newDivinityScore - oldDivinityScore);
    character.divinityScores[character.currentLevelKey] = Math.max(oldDivinityScore, newDivinityScore);
    character.levelCompleted = true;

    // This code will be used when they activate a shrine
    if (level.board && character.adventurer.abilities.indexOf(level.skill) < 0 && character.divinity >= totalCostForNextLevel(character, level)) {
        if (!boards[level.board]) {
            throw new Error("Could not find board: " + level.board);
        }
        if (!abilities[level.skill]) {
            throw new Error("Could not find ability: " + level.skill);
        }
        var boardPreview = readBoardFromData(boards[level.board], character, abilities[level.skill]);
        centerShapesInRectangle(boardPreview.fixed.map(jewelToShape).concat(boardPreview.spaces), rectangle(0, 0, character.boardCanvas.width, character.boardCanvas.height));
        snapBoardToBoard(boardPreview, character.board);
        character.board.boardPreview = boardPreview;
        // This will show the confirm skill button if this character is selected.
        updateConfirmSkillButton();
    }
    unlockItemLevel(level.level + 1);
    saveGame();
}
$('body').on('click', '.js-confirmSkill', function (event) {
    var character = state.selectedCharacter;
    var level = map[character.currentLevelKey];
    var skill = character.board.boardPreview.fixed[0].ability;
    character.divinity -= totalCostForNextLevel(character, level);
    character.adventurer.abilities.push(skill);
    character.board.spaces = character.board.spaces.concat(character.board.boardPreview.spaces);
    character.board.boardPreview.fixed.forEach(function (jewel) {
        jewel.confirmed = true;
    });
    character.board.fixed = character.board.fixed.concat(character.board.boardPreview.fixed);
    character.board.boardPreview = null;
    drawBoardBackground(character.boardContext, character.board);
    gainLevel(character.adventurer);
    updateAdventurer(character.adventurer);
    updateConfirmSkillButton();
    saveGame();
});
function unlockMapLevel(levelKey) {
    state.visibleLevels[levelKey] = true;
}

function deleteLevel(level) {
    $.each(map, function (levelKey, otherLevel) {
        var index = otherLevel.unlocks.indexOf(level.levelKey);
        if (index >= 0) {
            otherLevel.unlocks.splice(index, 1);
        }
    });
    delete map[level.levelKey];
}
function stopMapEditing() {
    editingMap = false;
    updateEditingState();
}
function startMapEditing() {
    editingMap = true;
    updateEditingState();
}
function updateEditingState() {
    var isEditing = editingLevel || editingMap;
    mapHeight = (isEditing && !editingLevel) ? 600 : 270;
    $('.js-pointsBar').toggle(!isEditing);
    $('.js-mainCanvasContainer').css('height', (isEditing ? 600 : 270) +'px');
    $('.js-mainCanvas').attr('height', mapHeight);
    // Image smoothing seems to get enabled again after changing the canvas size, so disable it again.
    $('.js-mainCanvas')[0].getContext('2d').imageSmoothingEnabled = false;
}

$(document).on('keydown', function(event) {
    if (event.which === 8) { // delete key
        if (editingMap) {
            event.preventDefault();
            selectedMapNodes.forEach(function (level) {
                deleteLevel(level);
            });
            selectedMapNodes = [];
        }
    }
    if (event.which === 27) { // escape key
        event.preventDefault();
        if (editingMap) {
            stopMapEditing();
        }
    }
    if (editingMap && event.which === 67) { // 'c'
        event.preventDefault();
        exportMapToClipboard();
    }
    if (event.which === 69) { // 'e'
        if (currentContext !== 'adventure' || state.selectedCharacter.area) {
            return;
        }
        if (currentMapTarget) {
            startEditingLevel(currentMapTarget);
            return;
        }
        if (!editingLevel) {
            editingMap = !editingMap;
            updateEditingState();
        }
    }
    if (event.which === 76) { // 'l'
        if (currentMapTarget && currentMapTarget.levelKey) {
            state.selectedCharacter.currentLevelKey = currentMapTarget.levelKey;
            if (!state.selectedCharacter.completionTime) {
                state.selectedCharacter.completionTime = 100;
            } else {
                state.selectedCharacter.completionTime -= 10;
            }
            completeLevel(state.selectedCharacter);
        }
        updateAdventurer(state.selectedCharacter.adventurer);
    }
});