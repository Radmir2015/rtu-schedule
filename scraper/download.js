const rp       = require('request-promise'),
      parseXls = require('./parse');

const url = 'https://www.mirea.ru/upload/medialibrary/56a/IK_3k_19_20_osen.xlsx';

const downloadSchedule = function(url) {
    const options = {
        url: url,
        method: 'GET',
        encoding: 'binary',
        headers: {
            'Content-type': 'application/xlsx'
        },
        filenameToSave: url.split('/')[url.split('/').length - 1],
    }

    rp(options).then((body, data) => {

        return parseXls({
            'way': 'binary',
            'data': body,
            'saveToFile': true,
            'jsonFilename': `${options.filenameToSave}_schedule.json`
        })

        // const filename = url.split('/').pop();
        // let writeStream = fs.createWriteStream(filename);
        // writeStream.write(body, 'binary');
        // writeStream.on('finish', () => {
        //     console.log(`Finished to download ${filename}`)
        // });
        // writeStream.end();
    }).then(schedule => {
        console.log(`Schedule of ${options.filenameToSave} is here!`)
    }).catch(err => {
        console.error(err);
    })
}

module.exports = downloadSchedule;