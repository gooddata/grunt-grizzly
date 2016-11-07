module.exports = function (app) {
    app.use('/stubtest/:arg?', function (req, res) {
        res.status(200).send('Hello World, your arg: ' + req.params.arg);
    });

    return app;
};
