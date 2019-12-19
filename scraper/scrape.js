const rp = require('request-promise'),
      $ = require('cheerio');
      downloadSchedule = require('./download');

const url = 'https://www.mirea.ru/education/schedule-main/schedule/';

const scrape = (db, info) => {
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
            
            const getOptsForSchedule = function(url) {
                return opts = {
                    url: url,
                    saveToJson: false,
                    jsonFilename: `data/json/${url.split('/')[url.split('/').length - 1]}_schedule.json`,
                    saveToXlsx: false,
                    xlsxFilename: `data/xlsx/${url.split('/')[url.split('/').length - 1]}`,
                }
            }
            // 46-50, 50-54 (вечернее отделение), 54-58 (филиал), 67
            return Promise.all(linksToParse.slice(26, 28).map(url => downloadSchedule(getOptsForSchedule(url), db, info)));
        })
        .catch(err => {
            // handle error
            console.error(err);
            return null;
        })
    }

// parseInfo = { parsed: 0, error: 0, total: 0 };
// scrape(parseInfo);

// console.log('info', parseInfo);
module.exports = scrape;