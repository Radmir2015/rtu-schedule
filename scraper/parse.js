const xlsx = require('js-xlsx'),
      fs   = require('fs');

const getValueOn = function (worksheet, columnN, rowN) {
    try {
        return worksheet[xlsx.utils.encode_cell({c: columnN, r: rowN})].v;
    } catch {
        console.log(`Undefined value at [${columnN}, ${rowN}]`);
        return '';
    }
}

const parseXls = function (options) {
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
    console.log(rowsLength);
    const schedule = {
        timeOfClass: [],
        groupsNames: [],
    };

    const oneDaySpan = worksheet['!merges'].find(range => range.s.c === 0 && range.s.r == 3 );
    const oneDayCellsNum = oneDaySpan.e.r - oneDaySpan.s.r + 1;

    for (let rowN = oneDaySpan.s.r; rowN < oneDaySpan.e.r; rowN += 2) {
        schedule.timeOfClass.push([
            getValueOn(worksheet, oneDaySpan.s.c + 2, rowN),
            getValueOn(worksheet, oneDaySpan.s.c + 3, rowN),
        ]);
    }

    for (let colN = 0; colN < rowsLength; colN += 17) {
        if (!(getValueOn(worksheet, colN, 1) == 'День недели')) {
            colN -= 16;
            continue;
        }
        [5, 9, 13].forEach(shift => {
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
                    scheduleClass = {
                        'name': getValueOn(worksheet, colN + shift, 3 + classN + dayN * oneDayCellsNum),
                        'type': getValueOn(worksheet, colN + shift + 1, 3 + classN + dayN * oneDayCellsNum),
                        'teacher': getValueOn(worksheet, colN + shift + 2, 3 + classN + dayN * oneDayCellsNum),
                        'classRoom': getValueOn(worksheet, colN + shift + 3, 3 + classN + dayN * oneDayCellsNum),
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

    if (options.saveToFile)
        fs.writeFile(options.jsonFilename || 'schedule.json', JSON.stringify(schedule), err => {
            if (err) console.error(err);
            console.log(`File ${options.jsonFilename || 'schedule.json'} was written successfully!`);
        });

    return schedule;
}

// parseXls({
//     'way': 'file',
//     'xlsxFilename': 'IK_3k_19_20_osen.xlsx',
//     'saveToFile': true,
//     'jsonFilename': 'schedule.json'
// });

module.exports = parseXls;