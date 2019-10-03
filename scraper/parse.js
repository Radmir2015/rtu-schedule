const xlsx = require('js-xlsx'),
      fs   = require('fs');

const getValueOn = function (worksheet, columnN, rowN) {
    return worksheet[xlsx.utils.encode_cell({c: columnN, r: rowN})].v;
}

const parseXls = function (data) {
    const wbook = xlsx.readFile('IK_3k_19_20_osen.xlsx');
    // const wbook = xlsx.read(data, { type: 'binary' });
    // console.log(wbook.SheetNames);
    const worksheet = wbook.Sheets[wbook.SheetNames[0]];

    const rowsLength = xlsx.utils.decode_range(worksheet['!ref']).e.r;
    const groupsNames = [];
    const classDuration = [];
    const schedule = {};

    console.log(worksheet[xlsx.utils.encode_cell({c: 2, r: 3})].v)
    console.log(worksheet[xlsx.utils.encode_cell({c: 0, r: 3})].v)
    // console.log(xlsx.utils.decode_range(worksheet[xlsx.utils.encode_cell({c: 0, r: 6})]));

    const oneDaySpan = worksheet['!merges'].find(range => range.s.c === 0 && range.s.r == 3 );
    const oneDayCellsNum = oneDaySpan.e.r - oneDaySpan.s.r;

    for (let rowN = oneDaySpan.s.r; rowN < oneDaySpan.e.r; rowN += 2) {
        classDuration.push([
            getValueOn(worksheet, oneDaySpan.s.c + 2, rowN),
            getValueOn(worksheet, oneDaySpan.s.c + 3, rowN),
        ]);
    }

    schedule.timeOfClass = classDuration;

    console.log(classDuration);

    for (let colN = 0; colN < rowsLength; colN += 17) {
        [5, 9, 13].forEach(shift => {
            // let address = xlsx.utils.encode_cell({c: colN + shift, r: 1})
            // groupName = worksheet[address].v;
            let groupName = getValueOn(worksheet, colN + shift, 1)
            if (groupName !== '')
                groupsNames.push(groupName);

            schedule[groupName] = [];

            for (let dayN = 0; dayN < 7; dayN++) {
                let scheduleClass = {};
                let scheduleOfDay = { 'I': [], 'II': [] };
                for (let classN = 0; classN < oneDayCellsNum; classN++) { // classDuration.length * 2
                    scheduleClass = {
                        'name': getValueOn(worksheet, colN + shift, 3 + classN),
                        'type': getValueOn(worksheet, colN + shift + 1, 3 + classN),
                        'teacher': getValueOn(worksheet, colN + shift + 2, 3 + classN),
                        'classRoom': getValueOn(worksheet, colN + shift + 3, 3 + classN),
                    }
                    scheduleOfDay[classN % 2 ? 'II' : 'I'].push(scheduleClass);
                }
                schedule[groupName].push(scheduleOfDay);
            }
        })
    }

    schedule.groupsNames = groupsNames;

    console.log(groupsNames);
    console.log(schedule);

    fs.writeFile('schedule.json', JSON.stringify(schedule), err => {
        if (err) console.error(err);
        console.log('File schedule.json was written successfully!');
    });
}

parseXls();