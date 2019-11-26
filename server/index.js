const cors = require('cors');
const express = require('express');
const app = express();

const port = process.env.PORT || 5000;

let schedules = [];
let flattenedSchedule = [];
let parseInfo = { parsed: 0, error: 0, total: 0, startedTime: new Date(), finishedTime: new Date(), finished: false, elapsed: 0, groups: 0 };

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.set('json spaces', 2);

console.log = function() {}

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

app.get('/startParse', (req, res) => {
    parseInfo = { parsed: 0, error: 0, total: 0, startedTime: new Date(), finishedTime: new Date(), finished: false, elapsed: 0, groups: 0 };
    res.json(parseInfo);
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
})

app.listen(port, () => {
    console.log(`Server is running on ${port}...`);

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
