const rp = require('request-promise'),
      $ = require('cheerio');
      downloadSchedule = require('./download');

const url = 'https://www.mirea.ru/education/schedule-main/schedule/';

const scrape = () => {
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
            return Promise.all(linksToParse.slice(16, 20).map(url => downloadSchedule(getOptsForSchedule(url))));
        })
        .catch(err => {
            // handle error
            console.error(err);
            return null;
        })
    }

module.exports = scrape;