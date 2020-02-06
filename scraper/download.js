const rp       = require('request-promise'),
      parseXls = require('./parse');
      fs       = require('fs');

const url = 'https://www.mirea.ru/upload/medialibrary/56a/IK_3k_19_20_osen.xlsx';

const downloadSchedule = function(opts, info) {
    const options = {
        method: 'GET',
        encoding: 'binary',
        headers: {
            'Content-type': 'application/xlsx'
        },
        ...opts,
    }

    return (() => {
        return new Promise((resolve) => {
            if (options.openXlsx && options.openingXlsxFolder) {
                fs.readFile(options.xlsxCurrentFilename, { encoding: 'binary' }, (err, data) => {
                    if (!err) {
                        resolve(data);
                    } else {
                        console.error(err);
                    }
                })
            } else resolve(rp(options));
        })
    })().then((body, data) => {
    // return rp(options).then((body, data) => {

        if (options.saveToXlsx)
            fs.writeFile(options.xlsxFilename || 'schedule.xlsx', body, { encoding: 'binary' }, err => { // body is binary of xlsx
                if (err) console.error(err);
                console.log(`File ${options.xlsxFilename || 'schedule.xlsx'} was written successfully!`);
            });

        return [
            parseXls({
                way: 'binary',
                data: body,
                ...options
            }),
            body
        ]

        // const filename = url.split('/').pop();
        // let writeStream = fs.createWriteStream(filename);
        // writeStream.write(body, 'binary');
        // writeStream.on('finish', () => {
        //     console.log(`Finished to download ${filename}`)
        // });
        // writeStream.end();
    }).then(([ schedule, binaryOfXlsx ]) => {

        // readySchedule = schedule;

        if (options.saveToJson)
            fs.writeFile(options.jsonFilename || 'schedule.json', JSON.stringify(schedule), err => {
                if (err) console.error(err);
                console.log(`File ${options.jsonFilename || 'schedule.json'} was written successfully!`);
            });

        console.log(`Schedule of ${options.xlsxFilename} is done!\n`);

        if (info) {
            info.parsed++;
            info.finishedTime = new Date();
            info.groups += schedule.map(aSchedule => aSchedule.groupsNames.length).reduce((a, b) => a + b, 0);
            info.elapsed = (info.finishedTime.getTime() - info.startedTime.getTime()) / 1000;
            console.log('info', info);
        }

        return schedule;
    }).catch(err => {
        if (info) {
            info.error++;
            info.finishedTime = new Date();
            info.elapsed = (info.finishedTime.getTime() - info.startedTime.getTime()) / 1000;
        }

        console.error(err);
        console.log(options);
    })
}

module.exports = downloadSchedule;