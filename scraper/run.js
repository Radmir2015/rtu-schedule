(async () => {
    let schedule = await require('./scrape')();
    console.log('scrape', schedule.length, schedule);
})();