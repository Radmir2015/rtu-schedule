const rp   = require('request-promise'),
      fs   = require('fs');

const url = 'https://www.mirea.ru/upload/medialibrary/56a/IK_3k_19_20_osen.xlsx';

const options = {
    url: url,
    method: 'GET',
    encoding: 'binary',
    headers: {
        'Content-type': 'application/xlsx'
    }
}

rp(options).then((body, data) => {
    

    // const filename = url.split('/').pop();
    // let writeStream = fs.createWriteStream(filename);
    // writeStream.write(body, 'binary');
    // writeStream.on('finish', () => {
    //     console.log(`Finished to download ${filename}`)
    // });
    // writeStream.end();
})