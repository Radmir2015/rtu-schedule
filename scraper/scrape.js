const rp = require('request-promise');
const $ = require('cheerio');
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
    })
    .catch(err => {
        // handle error
        console.error(err);
    })