const rp       = require('request-promise'),
      parseXls = require('./parse');
      fs       = require('fs');

const url = 'https://www.mirea.ru/upload/medialibrary/56a/IK_3k_19_20_osen.xlsx';

const downloadSchedule = function(opts) {
    const options = {
        method: 'GET',
        encoding: 'binary',
        headers: {
            'Content-type': 'application/xlsx'
        },
        ...opts,
    }

    rp(options).then((body, data) => {

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

        if (options.saveToJson)
            fs.writeFile(options.jsonFilename || 'schedule.json', JSON.stringify(schedule), err => {
                if (err) console.error(err);
                console.log(`File ${options.jsonFilename || 'schedule.json'} was written successfully!`);
            });

        if (options.saveToXlsx)
            fs.writeFile(options.xlsxFilename || 'schedule.xlsx', binaryOfXlsx, { encoding: 'binary' }, err => {
                if (err) console.error(err);
                console.log(`File ${options.xlsxFilename || 'schedule.xlsx'} was written successfully!`);
            })

        console.log(`Schedule of ${options.xlsxFilename} is done!\n`)
    }).catch(err => {
        console.error(err);
    })
}

module.exports = downloadSchedule;