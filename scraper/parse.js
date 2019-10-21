const xlsx = require('js-xlsx');

const weekDays = {
    'понедельник': 0, 'вторник': 1, 'среда': 2, 'четверг': 3, 'пятница': 4, 'суббота': 5, 'воскресенье': 6
}

const getValueOn = function (worksheet, columnN, rowN, merged = false) {
    try {
        return worksheet[xlsx.utils.encode_cell({c: columnN, r: rowN})].v;
    } catch {
        // console.log(`Undefined value at [${columnN}, ${rowN}]`);

        if (merged) return '';

        let tempMerge = worksheet['!merges'].find(range =>
            range.s.c == columnN && range.e.r == rowN || range.s.c == columnN && range.s.r == rowN);
        
        if (!tempMerge) return '';

        return Array.from(Array(tempMerge.e.r - tempMerge.s.r + 1).keys()).map(item => item + tempMerge.s.r)
            .map(row => getValueOn(worksheet, columnN, row, true))
            .filter(item => item !== '')
            .join('\r\n');

        
        if (tempMerge = worksheet['!merges'].find(range => range.s.c == columnN && range.e.r == rowN))
            return getValueOn(worksheet, columnN, rowN - 1, true); // tempMerge.s.r);

        else if (tempMerge = worksheet['!merges'].find(range => range.s.c == columnN && range.s.r == rowN))
            // if (tempMerge.e.r == rowN)
            //     return '';
            // else
            return getValueOn(worksheet, columnN, rowN + 1, true); // tempMerge.e.r);

        else return '';
    }
}

const parseXls = function (options) {
    // console.log(options);
    console.log(`${options.jsonFilename} has started to build!`);
    const wbook = (() => {
        if (options.way == 'file')
            return xlsx.readFile(options.xlsxFilename);
        else if (options.way == 'binary')
            return xlsx.read(options.data, { type: 'binary' });
        else
            throw 'No type of data specified';
    })();

    const worksheet = wbook.Sheets[wbook.SheetNames[0]];

    const rowsLength = xlsx.utils.decode_range(worksheet['!ref']).e.c + 1;
    console.log(`Length of the table is ${rowsLength}.`);

    const schedule = {
        timeOfClass: [],
        groupsNames: [],
        fullGroupNames: [],
    };

    const tableStart = (() => { for (let colN = 0; colN < 5; colN++) if (getValueOn(worksheet, colN, 1) == 'День недели') return colN; })() || 0;

    const getOneDaySpan = function(startColumn, startRow) {
        return worksheet['!merges'].find(range => range.s.c === startColumn && range.s.r == startRow);
    }
    const getOneDayCellsNum = oneDaySpan => oneDaySpan.e.r - oneDaySpan.s.r + 1;

    let oneDaySpan = getOneDaySpan(tableStart, 3);
    // console.log(tableStart, oneDaySpan);
    let oneDayCellsNum = getOneDayCellsNum(oneDaySpan);

    for (let rowN = oneDaySpan.s.r; rowN < oneDaySpan.e.r; rowN += 2) {
        schedule.timeOfClass.push([
            getValueOn(worksheet, oneDaySpan.s.c + 2, rowN),
            getValueOn(worksheet, oneDaySpan.s.c + 3, rowN),
        ]);
    }

    // let groupColArray = [5, 9, 13];
    // let oneGroupWidth = 4;
    
    const getFirstGroup = function(shift) {
        if (getValueOn(worksheet, shift + 4, 2).trim() == 'Предмет') {
            if (getValueOn(worksheet, shift + 7, 2).trim() == 'Предмет') {
                return { oneGroupWidth: 3, groupColArray: [4, 7, 10] }
            } else if (getValueOn(worksheet, shift + 8, 2).trim() == 'Предмет') {
                return { oneGroupWidth: 4, groupColArray: [4, 8, 12] }
            }
        }
        else if (getValueOn(worksheet, shift + 5, 2).trim() == 'Предмет') {
            if (getValueOn(worksheet, shift + 8, 2).trim() == 'Предмет') {
                return { oneGroupWidth: 3, groupColArray: [5, 8, 11] }
            } else if (getValueOn(worksheet, shift + 9, 2).trim() == 'Предмет') {
                return { oneGroupWidth: 4, groupColArray: [5, 9, 13] }
            }
        }
        else {
            console.log('Wtf');
            return { oneGroupWidth: 4, groupColArray: [5, 9, 13] }
        }
    }

    // let groupsBlockOffset = ((groupColArr) => groupColArr[groupColArr.length - 1] + (groupColArr[1] - groupColArr[0]))(groupColArray);
    let firstGroup = getFirstGroup(0);
    let groupsBlockOffset = firstGroup.groupColArray[firstGroup.groupColArray.length - 1] + firstGroup.oneGroupWidth;

    let rowStart = 3;
    let dayN = 0;

    let rowStartArray = [];

    while (oneDayCellsNum != 1) {

        let weekDay = weekDays[getValueOn(worksheet, tableStart, rowStart, true).trim().toLowerCase()];

        rowStartArray.push({
            rowStart, oneDayCellsNum, weekDay, oneDaySpan
        });

        rowStart += oneDayCellsNum;
        dayN++;

        oneDaySpan = getOneDaySpan(tableStart, oneDaySpan.e.r + 1);
        oneDayCellsNum = oneDaySpan === undefined ? 1 : getOneDayCellsNum(oneDaySpan);

    }

    for (let colN = rowStartArray[0].oneDaySpan.s.c; colN < rowsLength; colN += groupsBlockOffset) {
        // if (!(getValueOn(worksheet, colN, 1) == 'День недели')) {
        //     colN -= 16;
        //     continue;
        // }
        if (getValueOn(worksheet, colN, 1) != 'Группа') {
            colN -= groupsBlockOffset - 1;
            continue;
        }
        colN -= 1;
        
        firstGroup = getFirstGroup(colN);
        groupsBlockOffset = firstGroup.groupColArray[firstGroup.groupColArray.length - 1] + firstGroup.oneGroupWidth;

        firstGroup.groupColArray.forEach(shift => {
            // console.log(123, getValueOn(worksheet, colN + shift, 1));
            const fullGroupName = getValueOn(worksheet, colN + shift, 1).trim();
            const groupNamesArray = fullGroupName.split(',').map(item => item.trim().replace('(', ' ').split(' ')[0]);
            const groupName = groupNamesArray[0];
            if (groupName !== '') {
                schedule.groupsNames.push(groupName);
                schedule.fullGroupNames.push(fullGroupName);
            }
            else
                return;

            console.log(groupName);

            schedule[groupName] = { 'I': {}, 'II': {}, fullGroupName };

            groupNamesArray.slice(1).forEach(group => {
                schedule[group] = { 'I': {}, 'II': {}, fullGroupName };
            });

            // for (let dayN = 0; dayN < 6; dayN++) {
            // while (oneDayCellsNum != 1) {
            rowStartArray.forEach(({ rowStart, oneDayCellsNum, weekDay }) => {
                let scheduleClass = {};
                let scheduleOfDay = { 'I': {}, 'II': {} };

                for (let classN = 0; classN < oneDayCellsNum; classN++) { // classDuration.length * 2
                    if (firstGroup.oneGroupWidth == 4) {
                        scheduleClass = {
                            'name': getValueOn(worksheet, colN + shift, rowStart + classN),
                            'type': getValueOn(worksheet, colN + shift + 1, rowStart + classN),
                            'teacher': getValueOn(worksheet, colN + shift + 2, rowStart + classN),
                            'classRoom': getValueOn(worksheet, colN + shift + 3, rowStart + classN),
                        }
                    } else if (firstGroup.oneGroupWidth == 3) {
                        scheduleClass = {
                            'name': getValueOn(worksheet, colN + shift, rowStart + classN),
                            'type': getValueOn(worksheet, colN + shift + 1, rowStart + classN),
                            'classRoom': getValueOn(worksheet, colN + shift + 2, rowStart + classN),
                        }
                    }
                    
                    if (Object.keys(scheduleClass).some(key => scheduleClass[key] !== ''))
                        scheduleOfDay[classN % 2 ? 'II' : 'I'][Math.floor(classN / 2)] = scheduleClass;
                }

                // schedule[groupName].push(scheduleOfDay);

                // schedule[groupName]['I'] = [...schedule[groupName]['I'], scheduleOfDay['I']];
                // schedule[groupName]['II'] = [...schedule[groupName]['II'], scheduleOfDay['II']];

                // schedule[groupName] = {
                //     'I': [...schedule[groupName]['I'], scheduleOfDay['I']],
                //     'II': [...schedule[groupName]['II'], scheduleOfDay['II']]
                // }

                
                if (Object.keys(scheduleOfDay['I']).length !== 0) {
                    if (schedule[groupName]['I'][weekDay] && Object.keys(schedule[groupName]['I'][weekDay]).length !== 0)
                        Object.keys(scheduleOfDay['I']).forEach(key => {
                            if (key in schedule[groupName]['I'][weekDay])
                                Object.keys(schedule[groupName]['I'][weekDay][key]).forEach(prop => {
                                    schedule[groupName]['I'][weekDay][key][prop] += '\r\n' + scheduleOfDay['I'][key][prop];
                                });
                            else
                                schedule[groupName]['I'][weekDay][key] = scheduleOfDay['I'][key];
                        });
                    else
                        schedule[groupName]['I'][weekDay] = scheduleOfDay['I'];
                }

                if (Object.keys(scheduleOfDay['II']).length !== 0) {
                    if (schedule[groupName]['II'][weekDay] && Object.keys(schedule[groupName]['II'][weekDay]).length !== 0)
                        Object.keys(scheduleOfDay['II']).forEach(key => {
                            if (key in schedule[groupName]['II'][weekDay])
                                Object.keys(schedule[groupName]['II'][weekDay][key]).forEach(prop => {
                                    schedule[groupName]['II'][weekDay][key][prop] += '\r\n' + scheduleOfDay['II'][key][prop];
                                });
                            else
                                schedule[groupName]['II'][weekDay][key] = scheduleOfDay['II'][key];
                        });
                    else
                        schedule[groupName]['II'][weekDay] = scheduleOfDay['II'];
                }

                if (groupNamesArray.length > 1) {
                    groupNamesArray.slice(1).forEach(group => {
                        schedule[group]['I'][weekDay] = schedule[groupName]['I'][weekDay]
                        schedule[group]['II'][weekDay] = schedule[groupName]['II'][weekDay]
                    });
                }

                // if (Object.keys(scheduleOfDay['II']).length !== 0)
                //     schedule[groupName]['II'][weekDay] = scheduleOfDay['II'];
            });
        })
    }

    // console.log(groupsNames);
    // console.log(schedule);

    return schedule;
}

// parseXls({
//     'way': 'file',
//     'xlsxFilename': 'IK_3k_19_20_osen.xlsx',
//     'saveToFile': true,
//     'jsonFilename': 'schedule.json'
// });

module.exports = parseXls;