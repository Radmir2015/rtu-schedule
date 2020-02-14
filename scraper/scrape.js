const rp = require('request-promise'),
      $ = require('cheerio'),
      downloadSchedule = require('./download'),
      path = require('path'),
      fs = require('fs');

const url = 'https://www.mirea.ru/education/schedule-main/schedule/';

const getOptsForSchedule = function(url, xlsxCurrentFilename = '') {
    let opts = {
        url: url,
        openXlsx: true,
        openingXlsxFolder: path.join(__dirname, `data/xlsxExam/`),
        xlsxCurrentFilename: xlsxCurrentFilename,
        saveToJson: false,
        jsonFilename: `data/json/${path.win32.basename(url)}_schedule.json`,
        saveToXlsx: false,
        xlsxFilename: `data/xlsx/${path.win32.basename(url)}`,
    }
    opts.jsonFilename = `data/json/${opts.openXlsx ? path.win32.basename(xlsxCurrentFilename) : path.win32.basename(url)}_schedule.json`;
    opts.xlsxFilename = `data/xlsx/${opts.openXlsx ? path.win32.basename(xlsxCurrentFilename) : path.win32.basename(url)}`;
    return opts;
}

const scrape = (info) => {
    let baseOptions = getOptsForSchedule('');

    if (baseOptions.openXlsx) {
        return new Promise((resolve) => {
            fs.readdir(baseOptions.openingXlsxFolder, (err, files) => {
                if (err) console.error(err);
                console.log('files', files);
                resolve(files);
            })
        }).then(files => {
            if (info)
                info.total = files.length;

            return Promise.all(files.map(file => downloadSchedule(getOptsForSchedule(url, baseOptions.openingXlsxFolder + file), info)));
        })
    } else
    return rp(url)
        .then(html => {
            // success
            // console.log($('.xls', html).map(item => item.attribs.href));
            const linksToParse = [];
            let links = $('.xls', html);
            for (let i = 0; i < links.length; i++) {
                let link = links[i].attribs.href;
                if (!link.endsWith('pdf'))
                    linksToParse.push(link);
            }
            console.log(linksToParse.map((item, ind) => `[${ind}] = ${item}`));

            if (info)
                info.total = linksToParse.length;
            
            // 46-50, 50-54 (вечернее отделение), 54-58 (филиал), 67
            return Promise.all(linksToParse.map(url => downloadSchedule(getOptsForSchedule(url), info)));
        })
        .catch(err => {
            // handle error
            console.error(err);
            return null;
        })
    }

// parseInfo = { parsed: 0, error: 0, total: 0 };

// let parseInfo;
// scrape(parseInfo)//.then(data => console.dir(data, { depth: null }));

// console.log('info', parseInfo);
module.exports = scrape;