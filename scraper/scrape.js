const rp = require('request-promise'),
      $ = require('cheerio');
      downloadSchedule = require('./download');

const url = 'https://www.mirea.ru/education/schedule-main/schedule/';

rp(url)
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
        
        const getOptsForSchedule = function(url) {
            return opts = {
                url: url,
                saveToJson: true,
                jsonFilename: `data/json/${url.split('/')[url.split('/').length - 1]}_schedule.json`,
                saveToXlsx: true,
                xlsxFilename: `data/xlsx/${url.split('/')[url.split('/').length - 1]}`,
            }
        }
        // 46-50, 50-54 (вечернее отделение), 54-58 (филиал)
        return Promise.all(linksToParse.slice(67, 68).map(url => downloadSchedule(getOptsForSchedule(url))));
    })
    .catch(err => {
        // handle error
        console.error(err);
    })