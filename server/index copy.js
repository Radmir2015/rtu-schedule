const cors = require('cors');
const path = require('path');
const express = require('express');
const app = express();

const port = process.env.PORT || 5000;

let schedules = [];
let flattenedSchedule = [];
let parseInfo = { parsed: 0, error: 0, total: 0, startedTime: new Date(), finishedTime: new Date(), finished: false, elapsed: 0, groups: 0 };

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/static", express.static('./server/static/'));
app.use(cors());
app.set('json spaces', 2);

// console.log = function() {}

app.get('/', (req, res) => {
    res.render('index');
})

app.get('/search', (req, res) => {
    res.render('search');
})

app.get('/api/info', (req, res) => {
    // res.end('Use "/ + group name" to get json of schedule of the group.');
    res.json(parseInfo);
})

app.get('/api/fullFlattenedSchedule', (req, res) => {
    res.json(flattenedSchedule);
})

app.get('/api/fullSchedule', (req, res) => {
    res.json(schedules);
})

app.get('/api/allGroups', (req, res) => {
    let groupNames = [].concat(...flattenedSchedule.map(aSchedule => aSchedule.groupsNames));
    res.json({
        success: groupNames.length !== 0,
        groupnames: groupNames
    });
})

app.get('/api/allTeachers', (req, res) => {

    const teachers = new Set();
    const rawTeachers = new Set();

    flattenedSchedule.forEach(aSchedule => {
        if (aSchedule === null || aSchedule === undefined) return false;
        aSchedule.groupsNames.forEach(groupName => {
            Object.keys(aSchedule[groupName]).slice(0, -1).forEach(evenness => {
                Object.keys(aSchedule[groupName][evenness] || {}).forEach(day => {
                    Object.keys(aSchedule[groupName][evenness][day] || {}).forEach(classN => {
                        if (!aSchedule[groupName][evenness][day][classN]) return false;
                        if (!aSchedule[groupName][evenness][day][classN].teacher) return false;
                        aSchedule[groupName][evenness][day][classN].teacher.split(/,\s*|\r\n/g).forEach(teacher => {
                            if (teacher.trim()) {
                                if (!rawTeachers.has(teacher.replace(/[ \.]+/g, '').toLowerCase())) {
                                    rawTeachers.add(teacher.replace(/[ \.]+/g, '').toLowerCase());
                                    teachers.add(teacher.trim());
                                }
                            }
                        });
                        // teachers.add(aSchedule[groupName][evenness][day][classN].teacher);
                    })
                })
            })
        })
    })

    if (teachers.size !== 0) {
        res.json({
            success: true,
            teachers: [...teachers]
        });
    } else {
        res.json({
            success: false,
            error: 'No teachers has been found.'
        });
    }
})

app.get('/api/teacher/:teacherName?', (req, res) => {

    let teacher = req.params.teacherName || req.query.teacherName;
    let softMerging = req.query.softMerge || req.query.softMerging || req.query.merge || req.query.merging || true;

    if (typeof(softMerging) == 'string')
        softMerging = softMerging.trim().toLowerCase() === 'true';
    
    if (teacher === undefined) {
        res.json({
            success: false,
            error: 'No teacher\'s name specified.',
        });
        return;
    }

    teacher = teacher.toLowerCase();
    console.log(teacher);

    teacherSchedule = {
        teacherName: teacher,
        timeOfClass: [],
        'I': {},
        'II': {},
    }

    const mergeCondition = (gottenElem, appendingElem, softMerge = true, propArray = ['name', 'type', 'classRoom']) => {
        // propArray.forEach(prop => console.log(prop, gottenElem[prop]));
        if (softMerge)
            return propArray.every(prop => String(gottenElem[prop]).indexOf(String(appendingElem[prop])) !== -1);
        else
            return propArray.every(prop => String(gottenElem[prop]) === String(appendingElem[prop]));
    }

    flattenedSchedule.forEach(aSchedule => {
        if (aSchedule === null || aSchedule === undefined) return false;
        aSchedule.groupsNames.forEach(groupName => {
            Object.keys(aSchedule[groupName]).slice(0, -1).forEach(evenness => {
                Object.keys(aSchedule[groupName][evenness] || {}).forEach(day => {
                    Object.keys(aSchedule[groupName][evenness][day] || {}).forEach(classN => {
                        if (!aSchedule[groupName][evenness][day][classN]) return false;
                        if (!aSchedule[groupName][evenness][day][classN].teacher) return false;
                        if (aSchedule[groupName][evenness][day][classN].teacher.toLowerCase().replace(/[ \.]+/g, '').indexOf(teacher.replace(/[ \.]+/g, '')) !== -1) {
                            if (!teacherSchedule[evenness])
                                teacherSchedule[evenness] = {};
                            if (!teacherSchedule[evenness][day])
                                teacherSchedule[evenness][day] = {};
                            if (!teacherSchedule[evenness][day][classN])
                                teacherSchedule[evenness][day][classN] = [];
                            let classWithGroup = { groupName, ...aSchedule[groupName][evenness][day][classN] };
                            if (!teacherSchedule[evenness][day][classN].some(teacherClass => {
                                // if (['name', 'type', 'classRoom'].every(prop => classWithGroup[prop].indexOf(teacherClass[prop]) !== -1)) {
                                // console.log(classWithGroup);
                                if (mergeCondition(classWithGroup, teacherClass, softMerge = softMerging)) {
                                // if (teacherClass.name === classWithGroup.name &&
                                //     teacherClass.type === classWithGroup.type &&
                                //     teacherClass.classRoom === classWithGroup.classRoom) {
                                        // console.log(teacherClass.groupName, evenness, day, classN, groupName);
                                        // teacherSchedule[evenness][day][classN][groupName] += '\r\n' + classWithGroup[groupName];
                                        teacherClass.groupName += '\r\n' + classWithGroup.groupName;
                                        // console.log(teacherClass.groupName, evenness, day, classN, groupName);
                                        return true;
                                    }
                            })) {
                                teacherSchedule[evenness][day][classN].push(classWithGroup);
                            }
                            if (teacherSchedule.timeOfClass.length < aSchedule.timeOfClass.length)
                                teacherSchedule.timeOfClass = aSchedule.timeOfClass;
                        }
                    })
                })
            })
        })
    })

    if (Object.keys(teacherSchedule['I']).length === 0 && Object.keys(teacherSchedule['II']).length === 0) {
        res.json({
            success: false,
            error: 'Teacher name hasn\'t been found.'
        })
    }
    else {
        res.json({
            success: true,
            ...teacherSchedule
        });
    }

})

app.get('/api/:groupName?', (request, response) => {
    let flag = false;
    let group = request.params.groupName || request.query.groupName;
    
    if (group === undefined) {
        response.json({
            success: false,
            error: 'No groupname specified.',
        });
        return;
    }

    group = group.toUpperCase();
    console.log(group);

    // console.log(schedules);

    let foundArray = flattenedSchedule.map(sc => {
        return {
            sc,
            found: sc.groupsNames.filter(elem => elem.toUpperCase().indexOf(group) !== -1),
        }
    }).filter(item => item.found.length > 0);

    // let foundArrayLength = foundArray.map(s => s.found.length).reduce( ( p, c ) => p + c, 0 );

    const foundFlattenedGroupNames = foundArray.map(item => item.found).flat();

    const foundFlattenedGroupsByOne = foundArray.map(obj => obj.found.map(gr => { return { sc: obj.sc, gr } })).flat()

    if (new Set(foundFlattenedGroupNames).size == 1) {
        if (request.query.groupSelect === undefined) {
            response.status(200).json({
                success: true,
                timeOfClass: foundFlattenedGroupsByOne[0].sc.timeOfClass,
                ...foundFlattenedGroupsByOne[0].sc[foundFlattenedGroupsByOne[0].gr],
            });
            return foundFlattenedGroupsByOne[0].sc;
        } else {
            if (+request.query.groupSelect >= 0 && +request.query.groupSelect < foundFlattenedGroupNames.length) {
                response.status(200).json({
                    success: true,
                    timeOfClass: foundFlattenedGroupsByOne[+request.query.groupSelect].sc.timeOfClass,
                    ...foundFlattenedGroupsByOne[+request.query.groupSelect].sc[foundFlattenedGroupsByOne[0].gr],
                });
                return foundFlattenedGroupsByOne[+request.query.groupSelect].sc;
            } else {
                response.status(200).json({
                    success: false,
                    error: `Only ${foundFlattenedGroupNames.length} groups satisfy for the query, but requested for [${+request.query.groupSelect}].`
                });
                return null;
            }
        }
    } else if (new Set(foundFlattenedGroupNames).size < 1) {
        response.json({
            success: false,
            error: `Groupname ${group} hasn't been found.`,
        });
        return null;
    }
    else { // (new Set(foundFlattenedGroupNames).size > 1) {
        response.status(200).json({
            success: false,
            severalGroups: true,
            groups: foundFlattenedGroupNames,
            error: 'Ambiguous groupname.'
        });
        return foundFlattenedGroupNames;
    }

    for (const schedule of flattenedSchedule) {
        // console.log(schedule.groupsNames);

        if (schedule === null) continue;

        const foundName = schedule.groupsNames.filter(elem => elem.toUpperCase().indexOf(group) !== -1);

        if (foundName.length === 0) continue;

        if (foundName.length > 1) {
            response.status(200).json({
                success: false,
                severalGroups: true,
                groups: foundName,
                error: 'Ambiguous groupname.'
            });
            break;
        }

        response.status(200).json({
            success: true,
            timeOfClass: schedule.timeOfClass,
            ...schedule[foundName],
            });

        // console.log(schedule[foundName]);
        flag = true;
        break;
    }

    if (!flag) {
        // response.write(`Groupname ${group} hasn't been found.`);
        // response.end();
        response.json({
            success: false,
            error: `Groupname ${group} hasn't been found.`,
        })
    }
})

const startParsing = (info) => new Promise((resolve, reject) => resolve(require('../scraper/scrape')(info)));

const parsing = () => {
    parseInfo = { parsed: 0, error: 0, total: 0, startedTime: new Date(), finishedTime: new Date(), finished: false, elapsed: 0, groups: 0 };
    // res.json(parseInfo);
    console.log('Start scraping...');
    startParsing(parseInfo).then((sched) => {
        schedules = sched;
        parseInfo.finished = true; parseInfo.finishedTime = new Date(); parseInfo.elapsed = (parseInfo.finishedTime.getTime() - parseInfo.startedTime.getTime()) / 1000;
        console.log(`Scraped ${schedules.length} tables.`);
        console.log('End of scraping...');
        flattenedSchedule = [];
        schedules.forEach(aSchedule => {
            if (aSchedule !== undefined)
                flattenedSchedule = [...flattenedSchedule, ...aSchedule];
        });
    })
} 

// const Worker = require("tiny-worker");
// const worker = new Worker(function () {
//     self.onmessage = function (ev) {
//         startParsing(ev.data).then((sched) => {
//             schedules = sched;
//             parseInfo.finished = true; parseInfo.finishedTime = new Date(); parseInfo.elapsed = (parseInfo.finishedTime.getTime() - parseInfo.startedTime.getTime()) / 1000;
//             console.log(`Scraped ${schedules.length} tables.`);
//             console.log('End of scraping...');
//             flattenedSchedule = [];
//             schedules.forEach(aSchedule => {
//                 if (aSchedule !== undefined)
//                 flattenedSchedule = [...flattenedSchedule, ...aSchedule];
//             });
//             postMessage(sched);
//         });
//     };
// });

// worker.onmessage = function (ev) {
//     console.log(ev.data);
//     console.log('DONE!');
//     worker.terminate();
// };

app.get('/startParse', (req, res) => {
    parseInfo = { parsed: 0, error: 0, total: 0, startedTime: new Date(), finishedTime: new Date(), finished: false, elapsed: 0, groups: 0 };
    res.json(parseInfo);
    // console.log('Start scraping...');

    parsing();
    
    // worker.postMessage(parseInfo);
    
})

app.listen(port, () => {
    console.log(`Server is running on ${port}...`);

    parsing();

    // console.log('Start scraping...');
    // (async (info) => {
    //     schedules = await require('../scraper/scrape')(info);
    //     info.finished = true; info.finishedTime = new Date(); info.elapsed = (info.finishedTime.getTime() - info.startedTime.getTime()) / 1000;
    //     console.log(`Scraped ${schedules.length} tables.`);
    //     console.log('End of scraping...');
    // })(parseInfo);

    // startParsing(parseInfo).then((sched) => {
    //     schedules = sched;
    //     parseInfo.finished = true; parseInfo.finishedTime = new Date(); parseInfo.elapsed = (parseInfo.finishedTime.getTime() - parseInfo.startedTime.getTime()) / 1000;
    //     console.log(`Scraped ${schedules.length} tables.`);
    //     console.log('End of scraping...');
    //     flattenedSchedule = [];
    //     schedules.forEach(aSchedule => {
    //         if (aSchedule !== undefined)
    //             flattenedSchedule = [...flattenedSchedule, ...aSchedule];
    //     });
    // })
});

// app.on('listening', () => {
//     console.log('Start scraping...');
//     (async () => {
//         schedules = await require('../scraper/scrape')();
//         console.log('scrape', schedules.length);
//     })();
//     console.log('End of scraping...');
// })
