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
        console.log(linksToParse);
        return Promise.all(linksToParse.slice(1, 3).map(url => downloadSchedule(url)));
    })
    .catch(err => {
        // handle error
        console.error(err);
    })