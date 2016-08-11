function board(shapes) {
    return {'fixed': [shapes.shift()], 'spaces': shapes};
}
// 3 triangle boards
var triforceBoard = {
    'fixed' : [{"k":"triangle","p":[136,79],"t":0}], 'spaces' : [{"k":"triangle","p":[151,104.98076211353316],"t":-60},{"k":"triangle","p":[121,104.98076211353316],"t":-60},{"k":"triangle","p":[136,79],"t":-60}]
};
var halfHexBoard = {
    'fixed' : [{"k":"trapezoid","p":[383,172.96152422706632],"t":-180}], 'spaces': [{"k":"trapezoid","p":[353,121],"t":0}]
};
var spikeBoard = {
    'fixed': [{"k":"trapezoid","p":[295,236.96152422706632],"t":0}],
    'spaces': [{"k":"triangle","p":[295,236.96152422706632],"t":-60},{"k":"triangle","p":[280,262.9422863405995],"t":-120},{"k":"triangle","p":[340,262.9422863405995],"t":-120}]
};
// 4 triangle boards
var thirdHexBoard = {
    'fixed': [{"k":"diamond","p":[197.5048094716167,130.22114317029974],"t":-120}], 'spaces': [{"k":"diamond","p":[212.5048094716167,104.24038105676658],"t":-60},{"k":"diamond","p":[197.5048094716167,78.2596189432334],"t":0}]
}
var hourGlassBoard = {
    'fixed': [{"k":"diamond","p":[232.5,212.99038105676658],"t":-60}], 'spaces': [{"k":"triangle","p":[232.5,212.99038105676658],"t":60},{"k":"triangle","p":[262.5,212.99038105676658],"t":60},{"k":"triangle","p":[217.5,187.00961894323342],"t":0},{"k":"triangle","p":[247.5,187.00961894323342],"t":0}]
}
var fangBoard = {'fixed': [{"k":"triangle","p":[414.00000000000006,103.78729582162231],"t":-120}], 'spaces': [{"k":"diamond","p":[444.00000000000006,103.78729582162231],"t":-240},{"k":"diamond","p":[414.00000000000006,103.78729582162231],"t":-240}]};
var petalBoard = {'fixed': [{"k":"diamond","p":[270.5,77.99038105676658],"t":-60}], 'spaces': [{"k":"diamond","p":[255.5,103.97114317029974],"t":-120},{"k":"diamond","p":[315.5,103.97114317029974],"t":-180}]};
// 5 triangle board
var pieBoard = board([{"k":"triangle","p":[90,148.03847577293365],"t":60}, {"k":"triangle","p":[60,148.03847577293365],"t":0},{"k":"trapezoid","p":[90,200],"t":180},{"k":"triangle","p":[60,148.03847577293365],"t":60}]);
var helmBoard = board([{"k":"trapezoid","p":[151,87],"t":0},{"k":"diamond","p":[151,87],"t":-240},{"k":"diamond","p":[181,87],"t":-60},{"k":"triangle","p":[166,61.01923788646684],"t":60}]);
var crownBoard = board([{"k":"triangle","p":[443,326.1346123343714],"t":-60},{"k":"diamond","p":[488,352.11537444790457],"t":-540},{"k":"triangle","p":[458,352.11537444790457],"t":-120},{"k":"diamond","p":[428,352.11537444790457],"t":-120}]);

var triangleBoard = {
    'fixed': [{"k":"triangle","p":[187,106],"t":0}],
    'spaces': [{"k":"hexagon","p":[217,106],"t":0},{"k":"hexagon","p":[157,106],"t":0},{"k":"hexagon","p":[187,54.03847577293368],"t":0}]
};
var diamondBoard = {
    'fixed': [{"k":"diamond","p":[206.5,107.99038105676658],"t":-60}],
    'spaces': [{"k":"hexagon","p":[236.5,107.99038105676658],"t":0},{"k":"trapezoid","p":[236.5,107.99038105676658],"t":-120},{"k":"trapezoid","p":[206.5,107.99038105676658],"t":60},{"k":"hexagon","p":[176.5,56.02885682970026],"t":0}]
};
var diamondBoard2 = {
    'fixed': [{"k":"diamond","p":[442.51923788646684,283.9519052838329],"t":-240}],
    'spaces': [{"k":"hexagon","p":[382.51923788646684,231.99038105676658],"t":0},{"k":"hexagon","p":[442.51923788646684,283.9519052838329],"t":0},{"k":"trapezoid","p":[472.51923788646684,283.9519052838329],"t":-180},{"k":"trapezoid","p":[382.51923788646684,283.9519052838329],"t":-360}]
};
var hexBoard = {
    'fixed': [{"k":"hexagon","p":[195,80],"t":0}],
    'spaces': [{"k":"trapezoid","p":[195,131.96152422706632],"t":0},{"k":"trapezoid","p":[225,80],"t":180},
               {"k":"trapezoid","p":[240,105.98076211353316],"t":240},{"k":"trapezoid","p":[225,131.96152422706632],"t":300},
               {"k":"trapezoid","p":[195,80],"t": 120},{"k":"trapezoid","p":[180,105.98076211353316],"t":60}]
};
var squareBoard = {
    'fixed': [{"k":"square","p":[89,76],"t":0}],
    'spaces': [{"k":"hexagon","p":[89,106],"t":0},{"k":"hexagon","p":[89,24.03847577293368],"t":0},
        {"k":"hexagon","p":[144.98076211353316,61],"t":30},{"k":"hexagon","p":[63.01923788646684,61],"t":30},
        {"k":"rhombus","p":[134,50.01923788646684],"t":-30},{"k":"rhombus","p":[63.019237886466826,121],"t":-30},
        {"k":"rhombus","p":[144.98076211353316,121],"t":60},{"k":"rhombus","p":[73.99999999999999,50.01923788646685],"t":60}]
};


var classBoards = {
    'juggler': board([{"k":"triangle","p":[274,113],"t":60},{"k":"diamond","p":[274,113],"t":-60},{"k":"diamond","p":[244,113],"t":0},{"k":"diamond","p":[289,138.98076211353316],"t":60}]),
    'ranger': board([{"k":"triangle","p":[274,113],"t":60},{"k":"diamond","p":[244,164.96152422706632],"t":-60},{"k":"diamond","p":[304,113],"t":0},{"k":"diamond","p":[274,113],"t":-60},
                     {"k":"diamond","p":[289,138.98076211353316],"t":60},{"k":"diamond","p":[259,87.01923788646684],"t":60},{"k":"diamond","p":[244,113],"t":0}]),
    'sniper': triangleBoard,
    'corsair': board([{"k":"square","p":[422,80],"t":0},{"k":"diamond","p":[437,54.01923788646684],"t":0},{"k":"diamond","p":[422,110],"t":0},
                      {"k":"diamond","p":[396.01923788646684,95],"t":-90},{"k":"diamond","p":[452,110],"t":-90}]),
    'assassin': board([{"k":"square","p":[422,80],"t":0},{"k":"diamond","p":[437,54.01923788646684],"t":0},{"k":"diamond","p":[452,110],"t":-90},
                       {"k":"diamond","p":[396.01923788646684,95],"t":-90},{"k":"diamond","p":[477.98076211353316,65],"t":30},{"k":"diamond","p":[396.01923788646684,95],"t":30},
                       {"k":"diamond","p":[422,110],"t":0},{"k":"diamond","p":[437,135.98076211353316],"t":-60},{"k":"diamond","p":[407,54.01923788646684],"t":-60}]),
    'ninja': board([{"k":"square","p":[422,80],"t":0},{"k":"hexagon","p":[422,110],"t":0},{"k":"hexagon","p":[422,28.03847577293368],"t":0},
                    {"k":"hexagon","p":[477.98076211353316,65],"t":30},{"k":"hexagon","p":[396.01923788646684,65],"t":30}]),
    'blackbelt': board([{"k":"diamond","p":[466,326.9615242270663],"t":-60},{"k":"diamond","p":[481,352.9422863405995],"t":-60},{"k":"triangle","p":[481,300.98076211353316],"t":0},
                        {"k":"diamond","p":[451,300.98076211353316],"t":-60},{"k":"triangle","p":[466,326.9615242270663],"t":60}]),
    'warrior': board([{"k":"diamond","p":[206,264.9615242270663],"t":-60},{"k":"trapezoid","p":[266,264.9615242270663],"t":-180},{"k":"trapezoid","p":[176,264.9615242270663],"t":0},
                      {"k":"trapezoid","p":[236,316.92304845413264],"t":-120},{"k":"trapezoid","p":[206,213],"t":60}]),
    'samurai': diamondBoard2,
    'paladin': board([{"k":"trapezoid","p":[121,100.96152422706632],"t":0},{"k":"diamond","p":[181,100.96152422706632],"t":60},{"k":"diamond","p":[91,100.96152422706632],"t":0},
                      {"k":"trapezoid","p":[151,152.92304845413264],"t":-180},{"k":"triangle","p":[136,74.98076211353316],"t":60}]),
    'darkknight': board([{"k":"trapezoid","p":[151,100.96152422706632],"t":-180},{"k":"trapezoid","p":[166,126.94228634059948],"t":-120},{"k":"trapezoid","p":[181,152.92304845413264],"t":-180},
                         {"k":"triangle","p":[136,126.94228634059948],"t":60},{"k":"trapezoid","p":[121,152.92304845413264],"t":-180},{"k":"trapezoid","p":[121,100.96152422706632],"t":0},
                         {"k":"trapezoid","p":[121,100.96152422706632],"t":-240}]),
    'enhancer': board([{"k":"trapezoid","p":[259.01923788646684,159.01923788646684],"t":0},{"k":"trapezoid","p":[244.01923788646684,133.03847577293368],"t":60},
                       {"k":"trapezoid","p":[229.01923788646684,210.98076211353316],"t":-120},{"k":"trapezoid","p":[289.01923788646684,210.98076211353316],"t":-180},
                       {"k":"trapezoid","p":[334.01923788646684,185],"t":-240},{"k":"trapezoid","p":[319.01923788646684,159.01923788646684],"t":-60},
                       {"k":"trapezoid","p":[289.01923788646684,159.01923788646684],"t":-60},{"k":"trapezoid","p":[289.01923788646684,159.01923788646684],"t":-180},
                       {"k":"trapezoid","p":[214.0192378864668,133.03847577293368],"t":60}]),
    'priest': board([{"k":"hexagon","p":[105,174.01923788646684],"t":0},{"k":"triangle","p":[105,225.98076211353316],"t":0},{"k":"triangle","p":[135,174.01923788646684],"t":0},{"k":"triangle","p":[150,200],"t":60},
                    {"k":"triangle","p":[120,148.03847577293368],"t":60},{"k":"triangle","p":[90,200],"t":60},{"k":"triangle","p":[75,174.01923788646684],"t":0}]),
    'wizard': board([{"k":"hexagon","p":[84,207.01923788646684],"t":0},{"k":"diamond","p":[99,181.03847577293368],"t":0},{"k":"diamond","p":[114,258.98076211353316],"t":-60},
                     {"k":"diamond","p":[114,207.01923788646684],"t":-60},{"k":"diamond","p":[69,233],"t":60},{"k":"diamond","p":[114,258.98076211353316],"t":60},
                     {"k":"diamond","p":[54,207.01923788646684],"t":0}]),
    'sorcerer': hexBoard,
    'dancer': board([{"k":"rhombus","p":[327,143],"t":-60},{"k":"diamond","p":[301.01923788646684,158],"t":-30},{"k":"diamond","p":[342,117.01923788646684],"t":-30},
                     {"k":"diamond","p":[327,173],"t":-60},{"k":"diamond","p":[312,117.01923788646684],"t":-60}]),
    'bard': board([{"k":"rhombus","p":[327,143],"t":-60},{"k":"diamond","p":[342,117.01923788646684],"t":-30},{"k":"diamond","p":[327,173],"t":-60},{"k":"diamond","p":[312,117.01923788646684],"t":-60},
                   {"k":"square","p":[342,147.01923788646684],"t":-30},{"k":"square","p":[327,91.03847577293368],"t":-30},{"k":"square","p":[286.01923788646684,132.01923788646684],"t":-30},
                   {"k":"square","p":[301.01923788646684,188],"t":-30},{"k":"diamond","p":[301.01923788646684,158],"t":-30}]),
    'sage': board([{"k":"rhombus","p":[132,129],"t":-60},{"k":"diamond","p":[147.00000000000006,103.01923788646684],"t":-30},{"k":"square","p":[91.01923788646684,118.01923788646684],"t":-30},
                   {"k":"diamond","p":[117.00000000000006,103.01923788646684],"t":-60},{"k":"triangle","p":[132.00000000000006,47.03847577293368],"t":30},
                   {"k":"triangle","p":[91.0192378864669,88.01923788646684],"t":30},{"k":"triangle","p":[91.01923788646684,118.01923788646684],"t":60},
                   {"k":"diamond","p":[106.01923788646684,144],"t":-30},{"k":"square","p":[132.00000000000006,77.03847577293368],"t":-30},
                   {"k":"triangle","p":[157.98076211353322,62.03847577293368],"t":0},{"k":"triangle","p":[172.98076211353316,118.01923788646684],"t":0},
                   {"k":"square","p":[147,133.01923788646684],"t":-30},{"k":"diamond","p":[132,159],"t":-60},{"k":"square","p":[106.01923788646684,174],"t":-30},
                   {"k":"triangle","p":[106.01923788646684,174],"t":60},{"k":"triangle","p":[147,184.98076211353316],"t":90},{"k":"triangle","p":[187.98076211353316,144],"t":90}]),
    'master': {
        'fixed': [{"k":"diamond","p":[375,174.01923788646684],"t":120},{"k":"diamond","p":[375,225.98076211353316],"t":120},{"k":"diamond","p":[390,200],"t":180},
                  {"k":"diamond","p":[375,225.98076211353316],"t":240},{"k":"diamond","p":[330,200],"t":240},{"k":"diamond","p":[345,225.98076211353316],"t":180}],
        'spaces': [{"k":"hexagon","p":[315,225.98076211353316],"t":0},{"k":"hexagon","p":[375,225.98076211353316],"t":0},{"k":"hexagon","p":[405,174.01923788646684],"t":0},
                   {"k":"hexagon","p":[375,122.05771365940052],"t":0},{"k":"hexagon","p":[315,122.05771365940052],"t":0},{"k":"hexagon","p":[285,174.01923788646684],"t":0}]
    }
};

var boards = {
    'tripleTriangles': { 'fixed' : [{"k":"triangle","p":[105,68],"t":60}],'spaces' : [{"k":"triangle","p":[75,68],"t":0},{"k":"triangle","p":[120,93.98076211353316],"t":120}] },
    'smallFangBoard': {'fixed' : [{"k":"diamond","p":[134.75,120.47595264191645],"t":-120}],'spaces' : [{"k":"triangle","p":[104.75,120.47595264191645],"t":-60},{"k":"triangle","p":[134.75,120.47595264191645],"t":0}]},
    'doubleDiamonds': {'fixed' : [{"k":"diamond","p":[161,75],"t":0}],'spaces' : [{"k":"diamond","p":[131,75],"t":-60}]},
    'triforceBoard': triforceBoard,
    'halfHexBoard': halfHexBoard,
    'spikeBoard': spikeBoard,
    'thirdHexBoard': thirdHexBoard,
    'hourGlassBoard': hourGlassBoard,
    'fangBoard': fangBoard,
    'petalBoard': petalBoard,
    'pieBoard': pieBoard,
    'helmBoard': helmBoard,
    'crownBoard': crownBoard,
    'triangleBoard': triangleBoard,
    'diamondBoard': diamondBoard,
    'diamondBoard2': diamondBoard2,
    'hexBoard': hexBoard,
    'squareBoard': squareBoard,
    'juggler': classBoards.juggler,
    'ranger': classBoards.ranger,
    'sniper': classBoards.sniper,
    'corsair': classBoards.corsair,
    'assassin': classBoards.assassin,
    'ninja': classBoards.ninja,
    'blackbelt': classBoards.blackbelt,
    'warrior': classBoards.warrior,
    'samurai': classBoards.samurai,
    'paladin': classBoards.paladin,
    'darkknight': classBoards.darkknight,
    'enhancer': classBoards.enhancer,
    'priest': classBoards.priest,
    'wizard': classBoards.wizard,
    'sorcerer': classBoards.sorcerer,
    'dancer': classBoards.dancer,
    'bard': classBoards.bard,
    'sage': classBoards.sage,
    'master': classBoards.master
};
