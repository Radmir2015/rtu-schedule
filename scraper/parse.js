const xlsx = require('js-xlsx');

const getValueOn = function (worksheet, columnN, rowN, merged = false) {
    try {
        return worksheet[xlsx.utils.encode_cell({c: columnN, r: rowN})].v;
    } catch {
        console.log(`Undefined value at [${columnN}, ${rowN}]`);

        if (merged) return '';

        let tempMerge = worksheet['!merges'].find(range =>
            range.s.c == columnN && range.e.r == rowN || range.s.c == columnN && range.s.r == rowN);
        
        if (!tempMerge) return '';

        return Array.from(Array(tempMerge.e.r - tempMerge.s.r + 1).keys()).map(item => item + tempMerge.s.r)
            .map(row => getValueOn(worksheet, columnN, row, true))
            .filter(item => item !== '')
            .join(' ');

        
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
    };

    const tableStart = (() => { for (let colN = 0; colN < 5; colN++) if (getValueOn(worksheet, colN, 1) == 'День недели') return colN; })() || 0;

    const oneDaySpan = worksheet['!merges'].find(range => range.s.c === tableStart && range.s.r == 3);
    // console.log(tableStart, oneDaySpan);
    const oneDayCellsNum = oneDaySpan.e.r - oneDaySpan.s.r + 1;

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

    for (let colN = oneDaySpan.s.c; colN < rowsLength; colN += groupsBlockOffset) {
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
            let groupName = getValueOn(worksheet, colN + shift, 1).replace('(', ' ').split(' ')[0];
            if (groupName !== '')
                schedule.groupsNames.push(groupName);
            else
                return;

            console.log(groupName);

            schedule[groupName] = { 'I': [], 'II': [] };

            for (let dayN = 0; dayN < 6; dayN++) {
                let scheduleClass = {};
                let scheduleOfDay = { 'I': [], 'II': [] };
                for (let classN = 0; classN < oneDayCellsNum; classN++) { // classDuration.length * 2
                    if (firstGroup.oneGroupWidth == 4) {
                        scheduleClass = {
                            'name': getValueOn(worksheet, colN + shift, 3 + classN + dayN * oneDayCellsNum),
                            'type': getValueOn(worksheet, colN + shift + 1, 3 + classN + dayN * oneDayCellsNum),
                            'teacher': getValueOn(worksheet, colN + shift + 2, 3 + classN + dayN * oneDayCellsNum),
                            'classRoom': getValueOn(worksheet, colN + shift + 3, 3 + classN + dayN * oneDayCellsNum),
                        }
                    } else if (firstGroup.oneGroupWidth == 3) {
                        scheduleClass = {
                            'name': getValueOn(worksheet, colN + shift, 3 + classN + dayN * oneDayCellsNum),
                            'type': getValueOn(worksheet, colN + shift + 1, 3 + classN + dayN * oneDayCellsNum),
                            'classRoom': getValueOn(worksheet, colN + shift + 2, 3 + classN + dayN * oneDayCellsNum),
                        }
                    }
                    scheduleOfDay[classN % 2 ? 'II' : 'I'].push(scheduleClass);
                }
                // schedule[groupName].push(scheduleOfDay);

                // schedule[groupName]['I'] = [...schedule[groupName]['I'], scheduleOfDay['I']];
                // schedule[groupName]['II'] = [...schedule[groupName]['II'], scheduleOfDay['II']];

                // schedule[groupName] = {
                //     'I': [...schedule[groupName]['I'], scheduleOfDay['I']],
                //     'II': [...schedule[groupName]['II'], scheduleOfDay['II']]
                // }

                schedule[groupName]['I'].push(scheduleOfDay['I']);
                schedule[groupName]['II'].push(scheduleOfDay['II']);
            }
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