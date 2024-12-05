// Uses the envvar ENDPOINT_TYPE to determine which set
// of names to return.
module.exports = () => {
    let nameSet;
    let servicePrefix;
    let spanTag;
    let accumulators;

        nameSet = [
            '/api/topics',
            '/api/topics/:topic/vote',
            '/api/topics/:topic/vote',
            '/api/topics/:topic/results',
        ];
        servicePrefix = 'votting';
        spanTag = 'vottingdb';
        accumulators = [
            1,
            23,
            13,
            32,
            153,
        ];

    return {
        nameSet,
        servicePrefix,
        spanTag,
        accumulators,
    };
};