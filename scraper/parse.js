const xlsx = require('js-xlsx');

const zip = function() {
    var args = [].slice.call(arguments);
    var shortest = args.length == 0 ? [] : args.reduce((a, b) => a.length < b.length ? a : b);

    return shortest.map((_, i) => args.map(array => array[i]));
}

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

const parseXls = function (options, db) {
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

    // const worksheet = wbook.Sheets[wbook.SheetNames[0]];
    // console.log('sss', wbook.SheetNames);
    const scheduleTotal = [];

    for (const worksheetName of wbook.SheetNames) {

        console.log('Sheetname:', worksheetName);
        let worksheet = wbook.Sheets[worksheetName];

        // console.log(worksheet);
        if (Object.keys(worksheet).length === 0 || worksheet['!merges'] === undefined) continue;

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

    // for (let rowN = oneDaySpan.s.r; rowN < oneDaySpan.e.r; rowN += 2) {
    //     schedule.timeOfClass.push([
    //         getValueOn(worksheet, oneDaySpan.s.c + 2, rowN),
    //         getValueOn(worksheet, oneDaySpan.s.c + 3, rowN),
    //     ]);
    // }

    // let groupColArray = [5, 9, 13];
    // let oneGroupWidth = 4;
    
    // const getFirstGroup = function(shift, value = 'Предмет') {
    //     let groupShift, groupColTempArr;
    //     if (getValueOn(worksheet, shift + 4, 2).trim() == value) {
    //         if (getValueOn(worksheet, shift + 7, 2).trim() == value) {
    //             // return { oneGroupWidth: 3, groupColArray: [4, 7, 10] }
    //             groupShift = 10;
    //             groupColTempArr = [4, 7];
    //             while (getValueOn(worksheet, shift + groupShift, 2).trim() == value) {
    //                 groupColTempArr.push(groupShift);
    //                 groupShift += 3;
    //             }
    //             return { oneGroupWidth: 3, groupColArray: groupColTempArr }
    //         } else if (getValueOn(worksheet, shift + 8, 2).trim() == value) {
    //             // return { oneGroupWidth: 4, groupColArray: [4, 8, 12] }
    //             groupShift = 12;
    //             groupColTempArr = [4, 8];
    //             while (getValueOn(worksheet, shift + groupShift, 2).trim() == value) {
    //                 groupColTempArr.push(groupShift);
    //                 groupShift += 4;
    //             }
    //             return { oneGroupWidth: 4, groupColArray: groupColTempArr }
    //         }
    //     }
    //     else if (getValueOn(worksheet, shift + 5, 2).trim() == value) {
    //         if (getValueOn(worksheet, shift + 8, 2).trim() == value) {
    //             // return { oneGroupWidth: 3, groupColArray: [5, 8, 11] }
    //             groupShift = 11;
    //             groupColTempArr = [5, 8];
    //             while (getValueOn(worksheet, shift + groupShift, 2).trim() == value) {
    //                 groupColTempArr.push(groupShift);
    //                 groupShift += 3;
    //             }
    //             return { oneGroupWidth: 3, groupColArray: groupColTempArr }
    //         } else if (getValueOn(worksheet, shift + 9, 2).trim() == value) {
    //             // return { oneGroupWidth: 4, groupColArray: [5, 9, 13] }
    //             groupShift = 13;
    //             groupColTempArr = [5, 9];
    //             while (getValueOn(worksheet, shift + groupShift, 2).trim() == value) {
    //                 groupColTempArr.push(groupShift);
    //                 groupShift += 4;
    //             }
    //             return { oneGroupWidth: 4, groupColArray: groupColTempArr }
    //         }
    //     }
    //     else {
    //         console.log('Wtf');
    //         return null;
    //         return { oneGroupWidth: 4, groupColArray: [5, 9, 13] }
    //     }
    // }

    const getFirstGroup = function(shift, value = 'Предмет') {
        let groupShift, groupColTempArr, groupColsSuccess = [];
        let groupCols = [ [4, 7], [4, 8], [5, 8], [5, 9] ];
        groupCols.forEach(cols => {
            groupColTempArr = [];
            groupShift = cols[0]; // cols[1] + (cols[1] - cols[0]);
            while (getValueOn(worksheet, shift + groupShift, 2).trim() == value) {
                groupColTempArr.push(groupShift);
                groupShift += cols[1] - cols[0];
            }
            if (groupColTempArr.length !== 0)
                groupColsSuccess.push(groupColTempArr);
        });
        if (groupColsSuccess.length === 0) {
            console.log('Wtf');
            return null;
        }
        let tempReturn = groupColsSuccess[groupColsSuccess.map(item => item.length).indexOf(Math.max(...groupColsSuccess.map(item => item.length)))];
        if (Math.max(...groupColsSuccess.map(item => item.length)) == 1) {
            return { oneGroupWidth: 4, groupColArray: tempReturn }
        } else {
            return { oneGroupWidth: tempReturn[1] - tempReturn[0], groupColArray: tempReturn }
        }
    }

    // let groupsBlockOffset = ((groupColArr) => groupColArr[groupColArr.length - 1] + (groupColArr[1] - groupColArr[0]))(groupColArray);
    let firstGroup = getFirstGroup(tableStart) || getFirstGroup(tableStart, 'Дисциплина') || { oneGroupWidth: 4, groupColArray: [5, 9, 13] };
    let groupsBlockOffset = firstGroup.groupColArray[firstGroup.groupColArray.length - 1] + firstGroup.oneGroupWidth;

    let rowStart = 3;
    let dayN = 0;

    let rowStartArray = [];

    console.log(firstGroup);

    const getAllMergedRowsByCol = function(colStart = tableStart, rowStart = 3, rowEnd = Infinity, rowEndPriority = false, returnNonMerged = false) {
        // defaults are for the weekdays
        let rowStartArray = [];
        rowStart = rowStart || 3;
        let oneDaySpan;
        let oneDayCellsNum;
        do {
            oneDaySpan = getOneDaySpan(colStart, rowStart);
            oneDayCellsNum = oneDaySpan === undefined ? 1 : getOneDayCellsNum(oneDaySpan);

            if (!returnNonMerged)
                if (!rowEndPriority && oneDayCellsNum == 1 || rowStart >= rowEnd)
                    return rowStartArray;

            // console.log(colStart, rowStart, getValueOn(worksheet, colStart, rowStart));

            let value = getValueOn(worksheet, colStart, rowStart, true);
            
            if (typeof value === 'string' || value instanceof String)
                value = value.trim().toLowerCase();
    
            rowStartArray.push({
                rowStart, oneDayCellsNum, value, oneDaySpan
            });
    
            rowStart += oneDayCellsNum;

        } while ((rowEndPriority || oneDayCellsNum != 1) && rowStart < rowEnd);

        return rowStartArray;
    }

    const weekDayClassN = [];

    rowStartArray = getAllMergedRowsByCol().map(({ value, ...rest }) => ({ value: weekDays[value], ...rest }));

    rowStartArray.forEach(weekDay => {
        // weekDayClassN[weekDay.value] = [];
        weekDayClassN.push([]);
        getAllMergedRowsByCol(tableStart + 1, weekDay.oneDaySpan.s.r, weekDay.oneDaySpan.e.r + 1).forEach(classN => {
            // weekDayClassN[weekDay.value][+classN.value - 1] = {};
            // weekDayClassN[weekDayClassN.length - 1][+classN.value - 1] =  {};
            weekDayClassN[weekDayClassN.length - 1].push({});
            weekDayClassN[weekDayClassN.length - 1][weekDayClassN[weekDayClassN.length - 1].length - 1]['evenness'] = {};
            // console.log(classN);
            // console.log(getValueOn(worksheet, tableStart + 4, classN.oneDaySpan.s.r));
            getAllMergedRowsByCol(tableStart + 4, classN.oneDaySpan.s.r, classN.oneDaySpan.e.r + 1, true, true).some(evenness => { // to be able to break
                // weekDayClassN[weekDay.value][+classN.value - 1][evenness.value] = evenness.oneDayCellsNum;
                // weekDayClassN[weekDayClassN.length - 1][+classN.value - 1][evenness.value] = evenness.oneDayCellsNum;
                if (evenness.value != 'i' && evenness.value != 'ii') {
                    weekDayClassN[weekDayClassN.length - 1][weekDayClassN[weekDayClassN.length - 1].length - 1]['evenness'] = {
                        'i': 1, 'ii': 1
                    }
                    return true; // break
                }
                weekDayClassN[weekDayClassN.length - 1][weekDayClassN[weekDayClassN.length - 1].length - 1]['evenness'][evenness.value] = evenness.oneDayCellsNum;
                return false;
                // console.log(evenness.value);
            });

            // console.log(123123, weekDayClassN[weekDayClassN.length - 1][weekDayClassN[weekDayClassN.length - 1].length - 1]['evenness']);

            weekDayClassN[weekDayClassN.length - 1][weekDayClassN[weekDayClassN.length - 1].length - 1]['time'] = [
                getValueOn(worksheet, classN.oneDaySpan.s.c + 1, classN.rowStart),
                getValueOn(worksheet, classN.oneDaySpan.s.c + 2, classN.rowStart),
            ];

            weekDayClassN[weekDayClassN.length - 1][weekDayClassN[weekDayClassN.length - 1].length - 1]['classNumber'] = classN.value;
        });
    });

    // console.log(weekDayClassN);
    // weekDayClassN.forEach(i => console.log(i.evenness));

    // index of the day with the max amount of classes
    const maxClasses = weekDayClassN.map(item => item.length).indexOf(Math.max(...weekDayClassN.map(item => item.length)));

    weekDayClassN[maxClasses].forEach(classN => schedule.timeOfClass.push({ time: classN.time, classNumber: classN.classNumber }));
    // console.log(maxClasses);
    // console.log(schedule.timeOfClass);
    // weekDayClassN.forEach(item => item.forEach(item1 => console.log(item1.time)));

    // while (oneDayCellsNum != 1) {

    //     let weekDay = weekDays[getValueOn(worksheet, tableStart, rowStart, true).trim().toLowerCase()];

    //     rowStartArray.push({
    //         rowStart, oneDayCellsNum, weekDay, oneDaySpan
    //     });

    //     rowStart += oneDayCellsNum;
    //     dayN++;

    //     oneDaySpan = getOneDaySpan(tableStart, oneDaySpan.e.r + 1);
    //     oneDayCellsNum = oneDaySpan === undefined ? 1 : getOneDayCellsNum(oneDaySpan);

    // }

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
        
        let tempFirstGroup = getFirstGroup(colN) || getFirstGroup(colN, 'Дисциплина');
        if (tempFirstGroup)
            firstGroup = tempFirstGroup;
        // firstGroup = getFirstGroup(colN) || getFirstGroup(colN, 'Дисциплина');
        // console.log('firstGroup', firstGroup)
        groupsBlockOffset = firstGroup.groupColArray[firstGroup.groupColArray.length - 1] + firstGroup.oneGroupWidth;

        firstGroup.groupColArray.forEach(shift => {
            // console.log(123, getValueOn(worksheet, colN + shift, 1));
            const fullGroupName = getValueOn(worksheet, colN + shift, 1).trim();
            const groupNamesArray = fullGroupName.split(',').map(item => item.trim().replace('(', ' ').split(' ')[0].replace(/(\r\n|\n|\r)/gm, ""));
            const groupName = groupNamesArray[0];
            if (groupName !== '') {
                schedule.groupsNames.push(groupName);
                schedule.fullGroupNames.push(fullGroupName);
            }
            else
                return;

            console.log(groupName);

            const getScheduleClass = (colN, rowN) => {
                const getScheduleClassFromTable = (args) =>
                        // args.map( (propName, inx) => ({[propName]: getValueOn(worksheet, colN + shift + inx, rowN)}) );
                        Object.assign({}, ...Array.from(args, (propName, inx) => ({[propName]: getValueOn(worksheet, colN + shift + inx, rowN, false)}))); // was true
                        
                if (firstGroup.oneGroupWidth == 4) {
                    return getScheduleClassFromTable(['name', 'type', 'teacher', 'classRoom']);
                } else if (firstGroup.oneGroupWidth == 3) {
                    return getScheduleClassFromTable(['name', 'type', 'classRoom']);
                }
            }

            const appendClass = function(schedule, daySchedule, key) { // schedule = schedule[groupName]['I'][weekDay]
                if (key in schedule) // IMPORTANT: key => number of class in order (0, 1, 2, ...)
                    Object.keys(schedule[key]).forEach(prop => {
                        schedule[key][prop] += '\r\n' + daySchedule[prop];
                    });
                else
                    schedule[key] = daySchedule;
                return schedule;
            } 

            const appendClasses = function(schedule, daySchedule, even, key) { // schedule = schedule[groupName]['I'][weekDay]
                if (key in schedule) // IMPORTANT: key => number of class in order (0, 1, 2, ...)
                    Object.keys(schedule[key]).forEach(prop => {
                        schedule[key][prop] += '\r\n' + daySchedule[even][key][prop];
                    });
                else
                    schedule[key] = daySchedule[even][key];
                return schedule;
            }

            const appendDayClasses = function(schedule, daySchedule, even) { // schedule = schedule[groupName]['I'][weekDay]
                // schedule = { ...schedule }; daySchedule = { ...daySchedule };
                if (Object.keys(daySchedule[even]).length !== 0) {
                    if (schedule && Object.keys(schedule).length !== 0)
                        Object.keys(daySchedule[even]).forEach(key => {
                            schedule = appendClasses(schedule, daySchedule, even, key);
                            // if (key in schedule)
                            //     Object.keys(schedule[key]).forEach(prop => {
                            //         schedule[key][prop] += '\r\n' + daySchedule[even][key][prop];
                            //     });
                            // else
                            //     schedule[key] = daySchedule[even][key];
                        });
                    else
                        schedule = daySchedule[even];
                }
                return schedule;
            }

            const getEmptyDictFromKeys = function(obj, defaultValue = {}, func = str => str.toUpperCase()) {
                return Object.assign({}, ...Array.from(Object.keys(obj), key => ({[func(key)]: defaultValue})));
            }

            // console.log('weekday', weekDayClassN[maxClasses]);

            const getEvennessDefaultDict = () => JSON.parse(JSON.stringify(getEmptyDictFromKeys(weekDayClassN[maxClasses][0]['evenness'])));

            schedule[groupName] = { ...getEvennessDefaultDict(), fullGroupName, groupName };

            // console.log('schedule', schedule[groupName]);

            groupNamesArray.slice(1).forEach(group => {
                schedule.groupsNames.push(group);
                schedule[group] = { ...getEvennessDefaultDict(), fullGroupName, groupName: group };
            });

            // for (let dayN = 0; dayN < 6; dayN++) {
            // while (oneDayCellsNum != 1) {
            zip(rowStartArray, weekDayClassN).forEach(( [{ rowStart, oneDayCellsNum, value: weekDay }, arrayOfEvenness] ) => {
                let scheduleClass = {};
                let scheduleOfDay = { ...getEvennessDefaultDict() };

                let rowN = rowStart;

                arrayOfEvenness.forEach((classNObj, classN) => {

                    Object.entries(classNObj.evenness).forEach( ([evenOdd, oneClassSpan]) => { // notice: evenOdd = 'i' || 'ii'
                        
                        for (let i = 0; i < oneClassSpan; i++) {
                            scheduleClass = getScheduleClass(colN, rowN);

                            rowN++;

                            if (Object.keys(scheduleClass).some(key => scheduleClass[key] !== ''))
                                // scheduleOfDay[classN % 2 ? 'II' : 'I'][Math.floor(classN / 2)] = scheduleClass;
                                scheduleOfDay[evenOdd.toUpperCase()] = appendClass(scheduleOfDay[evenOdd.toUpperCase()], scheduleClass, classN);

                        }

                    });

                });

                schedule[groupName]['I'][weekDay] = appendDayClasses(schedule[groupName]['I'][weekDay], scheduleOfDay, 'I');
                schedule[groupName]['II'][weekDay] = appendDayClasses(schedule[groupName]['II'][weekDay], scheduleOfDay, 'II');

                // for (let classN = 0; classN < oneDayCellsNum; classN++) { // classDuration.length * 2
                //     if (firstGroup.oneGroupWidth == 4) {
                //         scheduleClass = {
                //             'name': getValueOn(worksheet, colN + shift, rowStart + classN),
                //             'type': getValueOn(worksheet, colN + shift + 1, rowStart + classN),
                //             'teacher': getValueOn(worksheet, colN + shift + 2, rowStart + classN),
                //             'classRoom': getValueOn(worksheet, colN + shift + 3, rowStart + classN),
                //         }
                //     } else if (firstGroup.oneGroupWidth == 3) {
                //         scheduleClass = {
                //             'name': getValueOn(worksheet, colN + shift, rowStart + classN),
                //             'type': getValueOn(worksheet, colN + shift + 1, rowStart + classN),
                //             'classRoom': getValueOn(worksheet, colN + shift + 2, rowStart + classN),
                //         }
                //     }
                    
                //     if (Object.keys(scheduleClass).some(key => scheduleClass[key] !== ''))
                //         scheduleOfDay[classN % 2 ? 'II' : 'I'][Math.floor(classN / 2)] = scheduleClass;
                // }

                // schedule[groupName].push(scheduleOfDay);

                // schedule[groupName]['I'] = [...schedule[groupName]['I'], scheduleOfDay['I']];
                // schedule[groupName]['II'] = [...schedule[groupName]['II'], scheduleOfDay['II']];

                // schedule[groupName] = {
                //     'I': [...schedule[groupName]['I'], scheduleOfDay['I']],
                //     'II': [...schedule[groupName]['II'], scheduleOfDay['II']]
                // }
                
                // if (Object.keys(scheduleOfDay['I']).length !== 0) {
                //     if (schedule[groupName]['I'][weekDay] && Object.keys(schedule[groupName]['I'][weekDay]).length !== 0)
                //         Object.keys(scheduleOfDay['I']).forEach(key => {
                //             if (key in schedule[groupName]['I'][weekDay])
                //                 Object.keys(schedule[groupName]['I'][weekDay][key]).forEach(prop => {
                //                     schedule[groupName]['I'][weekDay][key][prop] += '\r\n' + scheduleOfDay['I'][key][prop];
                //                 });
                //             else
                //                 schedule[groupName]['I'][weekDay][key] = scheduleOfDay['I'][key];
                //         });
                //     else
                //         schedule[groupName]['I'][weekDay] = scheduleOfDay['I'];
                // }

                // if (Object.keys(scheduleOfDay['II']).length !== 0) {
                //     if (schedule[groupName]['II'][weekDay] && Object.keys(schedule[groupName]['II'][weekDay]).length !== 0)
                //         Object.keys(scheduleOfDay['II']).forEach(key => {
                //             // console.log('12312312312', schedule[groupName]['II'][weekDay]);
                //             if (key in schedule[groupName]['II'][weekDay])
                //                 Object.keys(schedule[groupName]['II'][weekDay][key]).forEach(prop => {
                //                     schedule[groupName]['II'][weekDay][key][prop] += '\r\n' + scheduleOfDay['II'][key][prop];
                //                 });
                //             else
                //                 schedule[groupName]['II'][weekDay][key] = scheduleOfDay['II'][key];
                //         });
                //     else
                //         schedule[groupName]['II'][weekDay] = scheduleOfDay['II'];
                // }

                if (groupNamesArray.length > 1) {
                    groupNamesArray.slice(1).forEach(group => {
                        schedule[group]['I'][weekDay] = schedule[groupName]['I'][weekDay]
                        schedule[group]['II'][weekDay] = schedule[groupName]['II'][weekDay]
                    });
                }
            });

                // if (Object.keys(scheduleOfDay['II']).length !== 0)
                //     schedule[groupName]['II'][weekDay] = scheduleOfDay['II'];
            // });
        })
    }

    // console.log(groupsNames);
    // console.log(schedule);

    // return schedule;
    scheduleTotal.push(schedule);

    db.models.Time.findOrCreate({
        where: {
            timeOfClass: JSON.stringify(schedule.timeOfClass)
        }
    }).spread((time, created) => {
        zip(schedule.groupsNames, schedule.fullGroupNames).forEach(([gr, fgr]) => {
            db.models.Group.create({
                groupName: gr,
                fullGroupName: fgr,
            }).then(grObj => {
                Object.keys(schedule[gr]).forEach(even => {
                    if (even == 'I' || even == 'II') {
                        Object.keys(schedule[gr][even]).forEach(weekD => {
                            // console.log(schedule[gr][even][weekD], schedule[gr][even], weekD, Object.keys(weekD));
                            if (schedule[gr][even][weekD])
                            Object.keys(schedule[gr][even][weekD]).forEach(classN => {
                                const classObj = schedule[gr][even][weekD][classN];

                                // console.log(classObj);

                                db.models.Class.findOrCreate({
                                    where: {
                                        name: classObj.name,
                                        teacher: classObj.teacher,
                                        type: classObj.type,
                                        classRoom: classObj.classRoom,

                                        evenness: even,
                                        weekDay: weekD,
                                        classNumber: classN,
                                    }
                                }).spread((clObj, cr) => {
                                    grObj.addClasses([clObj]);
                                })
                            })
                        })
                    }
                })
                time.addGroups([grObj]);
            }).catch(e => console.error(e));
        })
    })
    
    }

    return scheduleTotal;
}

// parseXls({
//     'way': 'file',
//     'xlsxFilename': 'IK_3k_19_20_osen.xlsx',
//     'saveToFile': true,
//     'jsonFilename': 'schedule.json'
// });

module.exports = parseXls;