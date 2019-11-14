const express = require('express');
const app = express();

const port = process.env.PORT || 5000;

let schedules = [];

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('json spaces', 2);

app.get('/', (req, res) => {
    response.write('Use "/ + group name" to get json of schedule of the group.');
})

app.get('/:groupName', (request, response) => {
    const group = request.params.groupName.toUpperCase();
    let flag = false;
    console.log(group);

    // console.log(schedules);

    for (const schedule of schedules) {
        // console.log(schedule[0].groupsNames);

        if (schedule[0] === null) continue;

        const foundName = schedule[0].groupsNames.find(elem => elem.indexOf(group) !== -1);

        if (!foundName) continue;

        response.status(200).json(schedule[0][foundName]);

        // console.log(schedule[0][foundName]);
        flag = true;
        break;
    }

    if (!flag) {
        response.write(`Groupname ${group} hasn't been found.`);
        response.end();
    }
})

app.listen(port, 'localhost', () => {
    console.log(`Server is running on ${port}...`);

    console.log('Start scraping...');
    (async () => {
        schedules = await require('../scraper/scrape')();
        console.log(`Scraped ${schedules.length} tables.`);
        console.log('End of scraping...');
    })();
});

// app.on('listening', () => {
//     console.log('Start scraping...');
//     (async () => {
//         schedules = await require('../scraper/scrape')();
//         console.log('scrape', schedules.length);
//     })();
//     console.log('End of scraping...');
// })
